import os
import sys
import datetime
import uuid
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# Helper function to map a timestamp to an NFL week
def get_nfl_week(dt, season_year):
    # NFL Week 1 generally starts the first Thursday of September.
    # We set a baseline Tuesday (when waivers lock) to calculate the week gap.
    if season_year == 2026:
        season_start = datetime.datetime(2026, 9, 8)
    elif season_year == 2025:
        season_start = datetime.datetime(2025, 9, 2)
    else:
        # Fallback approximation for other years
        season_start = datetime.datetime(season_year, 9, 1) 
        
    days_diff = (dt - season_start).days
    if days_diff < 0:
        return 0 # Pre-season / Draft trades
    
    # integer division by 7 days gives the week number
    week = (days_diff // 7) + 1
    return min(week, 18) # Cap at Week 18

if len(sys.argv) > 1:
    try:
        year = int(sys.argv[1])
    except ValueError:
        print("Error: The year provided must be a valid number.")
        sys.exit(1)
else:
    user_input = input("Enter season year (e.g., 2026): ").strip()
    try:
        year = int(user_input)
    except ValueError:
        print("Error: Please enter a valid 4-digit year.")
        sys.exit(1)

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")
league_ids = [int(os.getenv("ESPN_LEAGUE_ID_RED")), int(os.getenv("ESPN_LEAGUE_ID_BLACK"))]
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")

print("Connecting to Neon Postgres...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

for lid in league_ids:
    print(f"\nExtracting transactions for League {lid}...")
    
    try:
        league = League(league_id=lid, year=year, espn_s2=espn_s2, swid=swid)
    except Exception as e:
        print(f"Failed to connect to league for {year}: {e}. Skipping...")
        continue
        
    # Isolate team mapping by league_id to prevent collisions across divisions
    cursor.execute("""
        SELECT espn_team_id, manager_id FROM vffl.teams 
        WHERE season_year = %s AND league_id = %s
    """, (year, lid))
    team_to_manager = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Try/Except block to catch ESPN returning a 404 for historical transaction logs
    try:
        activities = league.recent_activity(size=1000)
        print(f"Found {len(activities)} transaction events.")
    except Exception as e:
        print(f"Transaction data is not available for {year}. ESPN only retains activity logs for the active season.")
        continue
    
    for activity in activities:
        dt = datetime.datetime.fromtimestamp(activity.date / 1000.0)
        week = get_nfl_week(dt, year)
        
        # Generate one unique ID for the entire transaction event (ties Adds & Drops together)
        group_id = str(uuid.uuid4())
        
        for action_tuple in activity.actions:
            team = action_tuple[0]
            action_type = action_tuple[1]
            player = action_tuple[2]
            bid_amount = action_tuple[3] if len(action_tuple) > 3 else 0
            
            manager_id = team_to_manager.get(team.team_id)
            if not manager_id:
                continue
            
            cursor.execute("""
                SELECT id FROM vffl.transactions 
                WHERE season_year = %s AND league_id = %s AND manager_id = %s 
                AND action_type = %s AND player_id = %s AND date = %s
            """, (year, lid, manager_id, action_type, player.playerId, dt))
            
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO vffl.transactions (
                        group_id, season_year, league_id, week, date, manager_id, action_type, player_id, bid_amount
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (group_id, year, lid, week, dt, manager_id, action_type, player.playerId, bid_amount))

conn.commit()
cursor.close()
conn.close()
print("\nTransactions successfully stored in Neon!")