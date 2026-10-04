import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# Runtime Parameter (RTP) logic
if len(sys.argv) > 1:
    try:
        year = int(sys.argv[1])
    except ValueError:
        print("Error: The year provided must be a valid number.")
        sys.exit(1)
else:
    user_input = input("Enter the season year to extract the draft for (e.g., 2026): ").strip()
    try:
        year = int(user_input)
    except ValueError:
        print("Error: Please enter a valid 4-digit year.")
        sys.exit(1)

load_dotenv(dotenv_path="../.env.local")

league_ids = [
    int(os.getenv("ESPN_LEAGUE_ID_RED")),
    int(os.getenv("ESPN_LEAGUE_ID_BLACK"))
]
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")
db_url = os.getenv("DATABASE_URL")

print(f"Connecting to Neon Postgres for the {year} draft...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Clean up any previous runs for this year before inserting
print(f"Clearing existing {year} draft records from vffl.draft...")
cursor.execute("DELETE FROM vffl.draft WHERE season_year = %s;", (year,))

# Pre-fetch NFL IDs from the players table to map accurately
cursor.execute("SELECT id, nfl_id FROM vffl.players;")
player_nfl_map = {row[0]: row[1] for row in cursor.fetchall()}

for league_id in league_ids:
    print(f"\nConnecting to ESPN League {league_id} for {year}...")
    try:
        league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    except Exception as e:
        print(f"Data not available for {year} in league {league_id}: {e}. Skipping...")
        continue

    # Sync managers using the seasonal teams snapshot
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
            print(f"Warning: Manager not found for team {team.team_name}. Run managers extractor first.")

    # --- Week 0 Draft Baseline ---
    print(f"Extracting Draft Day Standings Baseline for {league.settings.name}...")
    cursor.execute("""
        DELETE FROM vffl.baseline_standings 
        WHERE season_year = %s AND league_id = %s;
    """, (year, league_id))

    for team in league.teams:
        manager_id = team_to_manager_id.get(team.team_id)
        if not manager_id:
            continue
            
        draft_proj = getattr(team, 'draft_projected_rank', 0)
        
        cursor.execute("""
            INSERT INTO vffl.baseline_standings (season_year, league_id, manager_id, standing) 
            VALUES (%s, %s, %s, %s);
        """, (year, league_id, manager_id, draft_proj))
    # ------------------------------------------

    print(f"Extracting draft board for {league.settings.name}...")
    for i, pick in enumerate(league.draft, start=1):
        manager_id = team_to_manager_id.get(pick.team.team_id)
        
        player = league.player_info(playerId=pick.playerId)
        pos = player.position if player else "UNK"
        nfl_id = player_nfl_map.get(pick.playerId)

        cursor.execute("""
            INSERT INTO vffl.draft (
                season_year, league_id, overall_pick, 
                round_num, round_pick, manager_id, nfl_id, player_id, pos
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            year, 
            league_id, 
            i, 
            pick.round_num, 
            pick.round_pick, 
            manager_id, 
            nfl_id,
            pick.playerId, 
            pos
        ))

conn.commit()
cursor.close()
conn.close()
print(f"\nDraft data and Week 0 baseline standings for {year} successfully saved to Neon!")