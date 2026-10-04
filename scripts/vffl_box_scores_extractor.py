import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# --- Translation Function ---
def get_descriptive_matchup_type(raw_type, week, reg_season_count, away_manager_id, prev_home_label, prev_away_label):
    if raw_type == 'NONE':
        return 'Regular Season'
        
    playoff_week_num = week - reg_season_count
    
    if raw_type in ['WINNERS_BRACKET', 'WINNERS_LADDER']:
        if playoff_week_num == 1:
            if away_manager_id is None:
                return 'Bye Week'
            else:
                return 'Wild Card'
        elif playoff_week_num == 2:
            return 'Semifinals'
        elif playoff_week_num == 3:
            return 'Championship'
            
    # Handle specific bracket strings and generic API fallbacks
    if raw_type in ['WINNERS_CONSOLATION_BRACKET', 'WINNERS_CONSOLATION_LADDER', 'CONSOLATION']:
        if playoff_week_num == 3 and (prev_home_label == 'Semifinals' or prev_away_label == 'Semifinals'):
            return 'Money Game'
        return 'Consolation'
        
    if raw_type in ['LOSERS_CONSOLATION_BRACKET', 'LOSERS_CONSOLATION_LADDER']:
        if playoff_week_num == 1:
            return '1st Round Robin'
        elif playoff_week_num == 2:
            return '2nd Round Robin'
        elif playoff_week_num == 3:
            return '3rd Round Robin'
            
    return raw_type

# --- 1. Capture Runtime Parameters (Year and Week) ---
if len(sys.argv) > 2:
    try:
        year = int(sys.argv[1])
        week = int(sys.argv[2])
    except ValueError:
        print("Error: The year and week provided must be valid numbers.")
        sys.exit(1)
else:
    user_input = input("Enter the season year and week separated by space (e.g., 2026 1): ").strip().split()
    if len(user_input) != 2:
        print("Error: Please enter a valid 4-digit year and week number.")
        sys.exit(1)
    try:
        year = int(user_input[0])
        week = int(user_input[1])
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

print(f"Connecting to Neon Postgres for the {year} season, Week {week}...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

for league_id in league_ids:
    print(f"\nConnecting to ESPN League {league_id} for {year}...")
    try:
        league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    except Exception as e:
        print(f"Data not available for {year} in league {league_id}: {e}. Skipping...")
        continue

    # Sync managers
    team_to_manager_id = {}
    for team in league.teams:
        cursor.execute("""
            SELECT manager_id FROM vffl.teams 
            WHERE season_year = %s AND league_id = %s AND espn_team_id = %s;
        """, (year, league_id, team.team_id))
        result = cursor.fetchone()
        if result:
            team_to_manager_id[team.team_id] = result[0]
        else:
            print(f"Warning: Manager not found for team {team.team_name}.")

    print(f"Extracting box scores and player lineups for {league.settings.name}...")
    try:
        box_scores = league.box_scores(week)
    except Exception as e:
        print(f"Failed to fetch box scores for Week {week}: {e}")
        continue

    for matchup in box_scores:
        home_team = matchup.home_team
        away_team = matchup.away_team

        # Safely map manager IDs (handles BYE weeks)
        home_manager_id = team_to_manager_id.get(home_team.team_id) if home_team else None
        away_manager_id = team_to_manager_id.get(away_team.team_id) if away_team else None
        
        raw_matchup_type = getattr(matchup, 'matchup_type', 'NONE')
        home_proj = getattr(matchup, 'home_projected', 0.0)
        away_proj = getattr(matchup, 'away_projected', 0.0)

        # Backward-looking Semifinals check for the 3rd place "Money Game"
        prev_home_label = None
        prev_away_label = None
        if week > league.settings.reg_season_count and week > 1:
            if home_manager_id:
                cursor.execute("""
                    SELECT matchup_type FROM vffl.matchups 
                    WHERE season_year = %s AND league_id = %s AND week = %s 
                    AND (home_manager_id = %s OR away_manager_id = %s)
                    LIMIT 1;
                """, (year, league_id, week - 1, home_manager_id, home_manager_id))
                res = cursor.fetchone()
                if res: prev_home_label = res[0]
                
            if away_manager_id:
                cursor.execute("""
                    SELECT matchup_type FROM vffl.matchups 
                    WHERE season_year = %s AND league_id = %s AND week = %s 
                    AND (home_manager_id = %s OR away_manager_id = %s)
                    LIMIT 1;
                """, (year, league_id, week - 1, away_manager_id, away_manager_id))
                res = cursor.fetchone()
                if res: prev_away_label = res[0]

        matchup_type = get_descriptive_matchup_type(
            raw_matchup_type, 
            week, 
            league.settings.reg_season_count, 
            away_manager_id,
            prev_home_label,
            prev_away_label
        )

        # Level 1: Matchup Upsert Logic (Orientation Agnostic)
        cursor.execute("""
            SELECT id FROM vffl.matchups 
            WHERE season_year = %s AND league_id = %s AND week = %s 
            AND (
                (home_manager_id IS NOT DISTINCT FROM %s AND away_manager_id IS NOT DISTINCT FROM %s)
                OR
                (home_manager_id IS NOT DISTINCT FROM %s AND away_manager_id IS NOT DISTINCT FROM %s)
            );
        """, (year, league_id, week, home_manager_id, away_manager_id, away_manager_id, home_manager_id))
        
        existing_matchup = cursor.fetchone()
        
        if existing_matchup:
            matchup_id = existing_matchup[0]
            cursor.execute("""
                UPDATE vffl.matchups 
                SET matchup_type = %s, 
                    home_manager_id = %s, away_manager_id = %s,
                    home_score = %s, away_score = %s, 
                    home_projected = %s, away_projected = %s
                WHERE id = %s;
            """, (matchup_type, home_manager_id, away_manager_id, matchup.home_score, matchup.away_score, home_proj, away_proj, matchup_id))
        else:
            cursor.execute("""
                INSERT INTO vffl.matchups (
                    season_year, league_id, week, matchup_type, 
                    home_manager_id, away_manager_id, 
                    home_score, away_score, home_projected, away_projected
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
            """, (year, league_id, week, matchup_type, home_manager_id, away_manager_id, 
                  matchup.home_score, matchup.away_score, home_proj, away_proj))
            matchup_id = cursor.fetchone()[0]

        # Level 1.5: Idempotency for Child Tables
        cursor.execute("DELETE FROM vffl.matchup_rosters WHERE matchup_id = %s;", (matchup_id,))

        lineups_to_process = []
        if home_team and hasattr(matchup, 'home_lineup'):
            lineups_to_process.append((home_manager_id, matchup.home_lineup))
        if away_team and hasattr(matchup, 'away_lineup'):
            lineups_to_process.append((away_manager_id, matchup.away_lineup))

        for manager_id, lineup in lineups_to_process:
            if not manager_id:
                continue
                
            for player in lineup:
                # Level 2: Insert Player Lineups (vffl.matchup_rosters)
                cursor.execute("""
                    INSERT INTO vffl.matchup_rosters (
                        matchup_id, manager_id, player_id, slot_position, proj_fpts, actual_fpts
                    ) VALUES (%s, %s, %s, %s, %s, %s);
                """, (
                    matchup_id, manager_id, player.playerId, player.slot_position,
                    player.projected_points, player.points
                ))

# Level 3: Internal Stat Population
print("\nPopulating matchup player stats internally from the global pool...")
cursor.execute("""
    INSERT INTO vffl.matchup_player_stats (roster_id, stat_id, stat_value, stat_points)
    SELECT 
        r.id, 
        ps.stat_id, 
        ps.stat_value, 
        ps.stat_points
    FROM vffl.matchup_rosters r
    JOIN vffl.matchups m ON r.matchup_id = m.id
    JOIN vffl.player_stats ps 
        ON r.player_id = ps.player_id 
        AND m.season_year = ps.season_year 
        AND m.week = ps.week
    WHERE m.season_year = %s AND m.week = %s;
""", (year, week))

conn.commit()
cursor.close()
conn.close()
print(f"Week {week} Box Scores for {year} successfully saved to Neon!")