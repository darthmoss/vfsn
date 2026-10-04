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
    user_input = input("Enter the season year for predraft data (e.g., 2026): ").strip()
    try:
        year = int(user_input)
    except ValueError:
        print("Error: Please enter a valid 4-digit year.")
        sys.exit(1)

load_dotenv(dotenv_path="../.env.local")

# Only target the Red Division
league_id = int(os.getenv("ESPN_LEAGUE_ID_RED"))
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")
db_url = os.getenv("DATABASE_URL")

print(f"Connecting to Neon Postgres for the {year} season...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print(f"Clearing existing {year} predraft records from vffl.predraft...")
cursor.execute("DELETE FROM vffl.predraft WHERE season_year = %s;", (year,))

# Pre-fetch valid player IDs to prevent foreign key constraint crashes
cursor.execute("SELECT id FROM vffl.players;")
valid_player_ids = {row[0] for row in cursor.fetchall()}

print(f"\nConnecting to ESPN League {league_id} for {year}...")
try:
    league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    
    print(f"Gathering predraft projections and rankings for {league.settings.name}...")
    players = {}
    
    try:
        # Pull 1000 free agents to capture the draftable universe
        free_agents = league.free_agents(size=1000)
        for player in free_agents:
            players[player.playerId] = player
    except Exception as e:
        print(f"Note: Could not fetch free agents for {year}. Moving on...")
    
    # Include rostered players (if the draft has already partially run or keepers are set)
    for team in league.teams:
        for player in team.roster:
            players[player.playerId] = player

    print(f"Extracting and inserting metrics for {len(players)} players to vffl.predraft...")
    for player_id, player in players.items():
        if player_id not in valid_player_ids:
            continue
            
        # Safely retrieve ESPN API attributes, defaulting to None/0.0 if not exposed
        proj_fpts = getattr(player, 'projected_total_points', 0.0)
        overall_rank = getattr(player, 'defaultRank', None)
        pos_rank = getattr(player, 'positionRank', None)
        adp = getattr(player, 'averageDraftPosition', getattr(player, 'adp', None))

        cursor.execute("""
            INSERT INTO vffl.predraft (
                season_year, player_id, 
                overall_rank, pos_rank, adp, proj_fpts
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            year, 
            player_id, 
            overall_rank, 
            pos_rank, 
            adp, 
            proj_fpts
        ))
        
except Exception as e:
    print(f"Data not available for {year} in league {league_id}: {e}.")

conn.commit()
cursor.close()
conn.close()
print(f"\nPredraft analytics for {year} successfully saved to Neon!")