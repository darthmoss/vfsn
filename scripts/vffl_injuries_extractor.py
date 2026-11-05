import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# 1. Capture Runtime Parameters (Year and Week)
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

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))

db_url = os.getenv("DATABASE_URL")
league_ids = [
    int(os.getenv("ESPN_LEAGUE_ID_RED")),
    int(os.getenv("ESPN_LEAGUE_ID_BLACK"))
]
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")

print(f"Connecting to Neon Postgres for {year} Week {week} injury sync...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# 2. Fetch NFL Abbreviation to ID Map
print("Fetching NFL team mappings...")
cursor.execute("SELECT abbrev, id FROM vffl.nfl;")
nfl_map = {row[0]: row[1] for row in cursor.fetchall()}

# 3. Gather Active Week's Player Pool Across Red & Black Divisions + Free Agents
print(f"Gathering active player pool for {year} Week {week}...")
players = {}
free_agents_fetched = False

for league_id in league_ids:
    print(f"Connecting to ESPN League {league_id} for {year}...")
    try:
        league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    except Exception as e:
        print(f"Failed to connect to league {league_id} for {year}: {e}. Skipping...")
        continue

    # A. Rostered players on current team rosters
    for team in league.teams:
        for player in team.roster:
            players[player.playerId] = player

    # B. Rostered players in active week box scores
    try:
        box_scores = league.box_scores(week)
        for matchup in box_scores:
            lineups = []
            if matchup.home_lineup:
                lineups.extend(matchup.home_lineup)
            if matchup.away_lineup:
                lineups.extend(matchup.away_lineup)
            for player in lineups:
                players[player.playerId] = player
    except Exception as e:
        print(f"Note: Could not fetch box scores for League {league_id} Week {week}: {e}")

    # C. Free Agents for the active week (only need to pull global pool once)
    if not free_agents_fetched:
        try:
            free_agents = league.free_agents(week=week, size=2000)
            for player in free_agents:
                if player.playerId not in players:
                    players[player.playerId] = player
            free_agents_fetched = True
        except Exception as e:
            print(f"Note: Could not fetch free agents for {year} Week {week}: {e}")

# 4. Upsert all gathered players into vffl.players to guarantee foreign key integrity
print(f"Upserting {len(players)} players into vffl.players...")
player_upsert_query = """
    INSERT INTO vffl.players (id, name, position, nfl_id)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        position = EXCLUDED.position,
        nfl_id = EXCLUDED.nfl_id;
"""

for player_id, player in players.items():
    nfl_id = nfl_map.get(getattr(player, 'proTeam', None))
    cursor.execute(player_upsert_query, (
        player_id,
        getattr(player, 'name', 'Unknown'),
        getattr(player, 'position', None),
        nfl_id
    ))

# 5. Idempotently refresh vffl.weekly_player_status for (year, week)
print(f"Wiping existing injury statuses for {year} Week {week}...")
cursor.execute("DELETE FROM vffl.weekly_player_status WHERE season_year = %s AND week = %s;", (year, week))

print(f"Inserting Week {week} injury reports for {len(players)} players...")
injury_insert_query = """
    INSERT INTO vffl.weekly_player_status (season_year, week, player_id, injury_status, is_injured)
    VALUES (%s, %s, %s, %s, %s);
"""

injury_count = 0
for player_id, player in players.items():
    status = getattr(player, 'injuryStatus', 'ACTIVE')
    is_injured = getattr(player, 'injured', False)
    cursor.execute(injury_insert_query, (
        year,
        week,
        player_id,
        status,
        is_injured
    ))
    injury_count += 1

conn.commit()
cursor.close()
conn.close()
print(f"Successfully synced {len(players)} players and {injury_count} injury status records for {year} Week {week}!")
