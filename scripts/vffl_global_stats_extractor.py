import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# 1. Capture Runtime Parameters (Year and Week)
if len(sys.argv) > 2:
    year = int(sys.argv[1])
    week = int(sys.argv[2])
else:
    year = int(input("Enter season year (e.g., 2026): ").strip())
    week = int(input("Enter week (e.g., 1): ").strip())

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")
# Only one league connection is needed to capture the global player universe
league_id = int(os.getenv("ESPN_LEAGUE_ID_RED"))
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")

print(f"Connecting to ESPN League {league_id} for {year}...")
league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)

print("Connecting to Neon Postgres...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# 2. Idempotency Protocol
print(f"Wiping existing global player stats for {year} Week {week}...")
cursor.execute("DELETE FROM vffl.player_stats WHERE season_year = %s AND week = %s;", (year, week))

print(f"Wiping existing injury statuses for {year} Week {week}...")
cursor.execute("DELETE FROM vffl.weekly_player_status WHERE season_year = %s AND week = %s;", (year, week))

# 3. Build NFL Abbreviation to ID Map from the Database
print("Fetching NFL team mappings...")
cursor.execute("SELECT abbrev, id FROM vffl.nfl;")
nfl_db_map = {row[0].upper(): row[1] for row in cursor.fetchall()}

# 4. Gather the Historically Accurate NFL Universe & Map Opponents
print(f"Gathering global player pool for Week {week} (Rostered + Free Agents)...")
players = {}
nfl_schedule_map = {}

# A. Extract Rostered Players (Must come from Box Scores to contain historical week stats)
box_scores = league.box_scores(week)
for matchup in box_scores:
    lineups = []
    if matchup.home_lineup:
        lineups.extend(matchup.home_lineup)
    if matchup.away_lineup:
        lineups.extend(matchup.away_lineup)
        
    for player in lineups:
        players[player.playerId] = player
        
        # Map the NFL schedule using string abbreviations instead of API integers
        pro_team = getattr(player, 'proTeam', None)
        pro_opp = getattr(player, 'proOpponent', getattr(player, 'pro_opponent', None))
        
        if pro_team and pro_team != 'FA' and pro_opp and pro_opp != 'FA':
            nfl_schedule_map[pro_team.upper()] = pro_opp.upper()

# B. Extract Free Agents (Must explicitly pass the 'week' parameter)
free_agents = league.free_agents(week=week, size=2000)
for player in free_agents:
    if player.playerId not in players:
        players[player.playerId] = player

# --- NEW BLOCK: Extract and Insert Weekly Injury Data ---
print(f"Extracting Week {week} injury reports for {len(players)} players...")
injury_insert_query = """
    INSERT INTO vffl.weekly_player_status (season_year, week, player_id, injury_status, is_injured)
    VALUES (%s, %s, %s, %s, %s)
"""

injury_count = 0
for player_id, player in players.items():
    # Safely pull the status and boolean, defaulting to ACTIVE/False if missing
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

print(f"Successfully inserted {injury_count} injury status records!")
# --------------------------------------------------------

print(f"Extracting Week {week} stat breakdowns for {len(players)} players...")

# 5. Extract Nested Breakdown, Opponent, and Points Data
insert_query = """
    INSERT INTO vffl.player_stats (season_year, week, player_id, opponent_id, stat_id, stat_value, stat_points)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

stats_count = 0
stat_key = f"00{year}{week}"

for player_id, player in players.items():
    week_stats = None
    
    # The box_scores endpoint parses stats into an integer key
    if week in player.stats:
        week_stats = player.stats[week]
    # The free_agents endpoint retains the raw ESPN string key
    elif stat_key in player.stats:
        week_stats = player.stats[stat_key]
        
    if week_stats:
        # 1. Look for the opponent string abbreviation directly on the player
        pro_opp_str = getattr(player, 'proOpponent', getattr(player, 'pro_opponent', None))
        
        # 2. Fallback: Determine their opponent using our live schedule map
        if not pro_opp_str:
            pro_team = getattr(player, 'proTeam', 'FA')
            pro_opp_str = nfl_schedule_map.get(pro_team.upper(), None)
            
        # 3. Resolve the string abbreviation into the vffl.nfl integer ID
        pro_opponent_id = None
        if pro_opp_str and pro_opp_str != 'FA':
            pro_opponent_id = nfl_db_map.get(pro_opp_str.upper(), None)

        breakdown = week_stats.get('breakdown', {})
        
        # Safely handle the points mapping to prevent Float errors
        raw_points = week_stats.get('points')
        
        if isinstance(raw_points, dict):
            points_breakdown = raw_points
        else:
            points_breakdown = week_stats.get('points_breakdown', {})
            if not isinstance(points_breakdown, dict):
                points_breakdown = {}

        for stat_id, stat_value in breakdown.items():
            stat_points = points_breakdown.get(stat_id, 0.0)
            
            cursor.execute(insert_query, (
                year, 
                week, 
                player_id, 
                pro_opponent_id,
                str(stat_id), 
                stat_value, 
                stat_points
            ))
            stats_count += 1

conn.commit()
cursor.close()
conn.close()
print(f"Successfully inserted {stats_count} granular stat records into the VFSN database!")