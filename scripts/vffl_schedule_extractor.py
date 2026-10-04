import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# Capture Runtime Parameters (RTP) for Year and the Completed Week
if len(sys.argv) > 2:
    try:
        year = int(sys.argv[1])
        completed_week = int(sys.argv[2])
    except ValueError:
        print("Error: The year and week provided must be valid numbers.")
        sys.exit(1)
else:
    user_input = input("Enter the season year and the COMPLETED week (e.g., 2026 1, or 2026 0 for draft day): ").strip().split()
    if len(user_input) != 2:
        print("Error: Please enter a valid 4-digit year and week number.")
        sys.exit(1)
    try:
        year = int(user_input[0])
        completed_week = int(user_input[1])
    except ValueError:
        print("Error: Please enter valid numbers.")
        sys.exit(1)

load_dotenv(dotenv_path="../.env.local")
league_ids = [
    int(os.getenv("ESPN_LEAGUE_ID_RED")),
    int(os.getenv("ESPN_LEAGUE_ID_BLACK"))
]
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")
db_url = os.getenv("DATABASE_URL")

print(f"Connecting to Neon Postgres for the {year} schedule...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

for league_id in league_ids:
    print(f"\nProcessing League {league_id} for {year}...")
    try:
        league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    except Exception as e:
        print(f"Failed to fetch league {league_id}: {e}")
        continue

    # Sync managers
    cursor.execute("""
        SELECT espn_team_id, manager_id FROM vffl.teams 
        WHERE season_year = %s AND league_id = %s;
    """, (year, league_id))
    team_to_manager = {row[0]: row[1] for row in cursor.fetchall()}
    
    reg_season_count = league.settings.reg_season_count
    
    # 1. Pre-populate the unplayed matchup grid
    print("Pre-populating the regular season matchup grid...")
    for team in league.teams:
        home_manager_id = team_to_manager.get(team.team_id)
        if not home_manager_id:
            continue
            
        for w_idx, opponent in enumerate(team.schedule):
            week = w_idx + 1
            if week > reg_season_count:
                continue # Ignore playoff fixtures in the schedule array
                
            away_manager_id = team_to_manager.get(opponent.team_id) if opponent else None
            
            # Prevent duplicating matchups in the loop (A vs B and B vs A)
            if away_manager_id and home_manager_id > away_manager_id:
                continue
                
            # Check if this exact matchup already exists (Orientation Agnostic)
            cursor.execute("""
                SELECT id FROM vffl.matchups 
                WHERE season_year = %s AND league_id = %s AND week = %s 
                AND (
                    (home_manager_id IS NOT DISTINCT FROM %s AND away_manager_id IS NOT DISTINCT FROM %s)
                    OR
                    (home_manager_id IS NOT DISTINCT FROM %s AND away_manager_id IS NOT DISTINCT FROM %s)
                );
            """, (year, league_id, week, home_manager_id, away_manager_id, away_manager_id, home_manager_id))
            
            if not cursor.fetchone():
                matchup_type = "Regular Season"
                cursor.execute("""
                    INSERT INTO vffl.matchups (
                        season_year, league_id, week, matchup_type, 
                        home_manager_id, away_manager_id
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (year, league_id, week, matchup_type, home_manager_id, away_manager_id))

    # 2. Calculate Remaining Strength of Schedule (SOS)
    print(f"Calculating Remaining SOS for games following Week {completed_week}...")
    sos_matrix = []
    
    for team in league.teams:
        manager_id = team_to_manager.get(team.team_id)
        if not manager_id:
            continue
            
        # If week is 0 (Draft Day Baseline), force baseline metrics to 0.0
        if completed_week == 0:
            sos_matrix.append({
                'manager_id': manager_id,
                'remaining_games': reg_season_count,
                'opp_avg_win_pct': 0.0,
                'opp_avg_pf': 0.0
            })
            continue
            
        remaining_games = 0
        opp_wins, opp_losses, opp_ties = 0, 0, 0
        opp_ppg_sum = 0.0
        
        # Slice the schedule array starting at the completed_week index
        for w_idx in range(completed_week, reg_season_count):
            if w_idx < len(team.schedule):
                opponent = team.schedule[w_idx]
                if opponent:
                    remaining_games += 1
                    opp_wins += opponent.wins
                    opp_losses += opponent.losses
                    opp_ties += opponent.ties
                    
                    # Calculate the opponent's true Points Per Game (PPG) to prevent cumulative inflation
                    opp_games_played = opponent.wins + opponent.losses + opponent.ties
                    if opp_games_played > 0:
                        opp_ppg = opponent.points_for / opp_games_played
                    else:
                        opp_ppg = 0.0
                        
                    opp_ppg_sum += opp_ppg
                    
        if remaining_games > 0:
            total_opp_games = opp_wins + opp_losses + opp_ties
            opp_avg_win_pct = (opp_wins + (opp_ties * 0.5)) / total_opp_games if total_opp_games > 0 else 0.0
            opp_avg_pf = opp_ppg_sum / remaining_games
        else:
            opp_avg_win_pct = 0.0
            opp_avg_pf = 0.0
            
        sos_matrix.append({
            'manager_id': manager_id,
            'remaining_games': remaining_games,
            'opp_avg_win_pct': opp_avg_win_pct,
            'opp_avg_pf': opp_avg_pf
        })
        
    # Sort the matrix to rank the hardest schedules (Highest Win% first, then PF tiebreaker)
    sos_matrix.sort(key=lambda x: (x['opp_avg_win_pct'], x['opp_avg_pf']), reverse=True)
    
    # 3. Store SOS in Neon
    # Wipe the existing SOS calculation for this specific snapshot to prevent duplicates on re-runs
    cursor.execute("""
        DELETE FROM vffl.sos 
        WHERE season_year = %s AND league_id = %s AND week = %s
    """, (year, league_id, completed_week))
    
    for rank, data in enumerate(sos_matrix, start=1):
        cursor.execute("""
            INSERT INTO vffl.sos (
                season_year, league_id, week, manager_id, remaining_games, 
                opp_avg_win_pct, opp_avg_pf, sos_rank
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            year, league_id, completed_week, data['manager_id'], data['remaining_games'],
            round(data['opp_avg_win_pct'], 4), round(data['opp_avg_pf'], 2), rank
        ))

conn.commit()
cursor.close()
conn.close()
print("\nSchedule grid and SOS metrics successfully mapped to Neon!")