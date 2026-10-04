import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# 1. Capture the Runtime Parameter (RTP) for the year
if len(sys.argv) > 1:
    try:
        year = int(sys.argv[1])
    except ValueError:
        print("Error: The year provided must be a valid number.")
        sys.exit(1)
else:
    user_input = input("Enter the season year to extract players for (e.g., 2025): ").strip()
    try:
        year = int(user_input)
    except ValueError:
        print("Error: Please enter a valid 4-digit year.")
        sys.exit(1)

# Load credentials from the root Next.js environment file
load_dotenv(dotenv_path="../.env.local")

# We only need one league ID to access the global ESPN player universe
league_id = int(os.getenv("ESPN_LEAGUE_ID_RED"))
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")
db_url = os.getenv("DATABASE_URL")

print(f"Connecting to Neon Postgres for the {year} season...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Build a dictionary mapping NFL abbreviations to their Neon database IDs
print("Fetching NFL team mappings...")
cursor.execute("SELECT abbrev, id FROM vffl.nfl;")
nfl_map = {row[0]: row[1] for row in cursor.fetchall()}

print(f"Connecting to ESPN League {league_id} for {year}...")
try:
    league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
except Exception as e:
    print(f"Failed to connect to league for {year}: {e}")
    sys.exit(1)

print(f"Gathering player universe for {year} (Rosters + Draft + Free Agents)...")
players = {}

# 2. Extract all end-of-season rostered players
for team in league.teams:
    for player in team.roster:
        players[player.playerId] = player

# 3. Extract all drafted players (Guarantees we catch players dropped mid-season)
for pick in league.draft:
    # We use player_info to get the full Player object instead of just the draft Pick object
    player = league.player_info(playerId=pick.playerId)
    if player:
        players[player.playerId] = player

# 4. Extract the top 1000 free agents
try:
    free_agents = league.free_agents(size=1000)
    for player in free_agents:
        players[player.playerId] = player
except Exception as e:
    print(f"Note: Could not fetch free agents for {year} (ESPN API limits past free agency data). Moving on...")

print(f"Extracting and inserting {len(players)} players to vffl.players...")

for player_id, player in players.items():
    # Safely get the NFL ID, passing None (NULL) if the player is a Free Agent ('FA')
    nfl_id = nfl_map.get(player.proTeam)
    
    cursor.execute("""
        INSERT INTO vffl.players (id, name, position, nfl_id) 
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name,
            position = EXCLUDED.position,
            nfl_id = EXCLUDED.nfl_id;
    """, (player.playerId, player.name, player.position, nfl_id))

conn.commit()
cursor.close()
conn.close()
print(f"Player universe for {year} successfully saved to Neon!")