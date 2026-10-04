import os
import sys
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# Define the season year dynamically at runtime
if len(sys.argv) > 1:
    try:
        year = int(sys.argv[1])
    except ValueError:
        print("Error: The year provided must be a valid number.")
        sys.exit(1)
else:
    user_input = input("Enter the season year to extract (e.g., 2026): ").strip()
    try:
        year = int(user_input)
    except ValueError:
        print("Error: Please enter a valid 4-digit year.")
        sys.exit(1)

# Load credentials from the root Next.js environment file
load_dotenv(dotenv_path="../.env.local")

league_ids = [
    int(os.getenv("ESPN_LEAGUE_ID_RED")),
    int(os.getenv("ESPN_LEAGUE_ID_BLACK"))
]

espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")
db_url = os.getenv("DATABASE_URL")

print(f"Connecting to Neon Postgres for the {year} season...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

for league_id in league_ids:
    print(f"\nConnecting to ESPN League {league_id} for {year}...")
    try:
        league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    except Exception as e:
        print(f"Data not available for {year} in league {league_id}: {e}. Skipping...")
        continue
    
    for team in league.teams:
        # Extract the detailed owner JSON object
        if team.owners:
            owner = team.owners[0]
            if isinstance(owner, dict):
                espn_owner_id = owner.get('id', f"UNKNOWN_{team.team_id}")
                first_name = owner.get('firstName', team.team_name)
                last_name = owner.get('lastName', '')
                display_name = owner.get('displayName', '')
                primary_owner = owner.get('primaryOwner', True)
            else:
                espn_owner_id = owner
                first_name = team.team_name
                last_name = ''
                display_name = ''
                primary_owner = True
        else:
            espn_owner_id = f"UNKNOWN_{team.team_id}"
            first_name = team.team_name
            last_name = ''
            display_name = ''
            primary_owner = True
            
        # 1. Handle the Permanent Manager (vffl.managers)
        cursor.execute("SELECT id FROM vffl.managers WHERE espn_owner_id = %s;", (espn_owner_id,))
        manager_result = cursor.fetchone()
        
        if manager_result:
            manager_id = manager_result[0]
            cursor.execute("""
                UPDATE vffl.managers 
                SET first_name = %s, last_name = %s, display_name = %s, primary_owner = %s 
                WHERE id = %s;
            """, (first_name, last_name, display_name, primary_owner, manager_id))
        else:
            # Insert new manager with active defaulting to true
            cursor.execute("""
                INSERT INTO vffl.managers (
                    espn_owner_id, first_name, last_name, display_name, primary_owner, active
                ) VALUES (%s, %s, %s, %s, %s, true) RETURNING id;
            """, (espn_owner_id, first_name, last_name, display_name, primary_owner))
            manager_id = cursor.fetchone()[0]
            
        # 2. Handle the Seasonal Team Snapshot (vffl.teams)
        cursor.execute("""
            SELECT id FROM vffl.teams 
            WHERE season_year = %s AND league_id = %s AND espn_team_id = %s;
        """, (year, league_id, team.team_id))
        team_result = cursor.fetchone()
        
        if team_result:
            cursor.execute("""
                UPDATE vffl.teams 
                SET team_name = %s, team_abbrev = %s, logo_url = %s 
                WHERE id = %s;
            """, (team.team_name, team.team_abbrev, team.logo_url, team_result[0]))
        else:
            cursor.execute("""
                INSERT INTO vffl.teams (
                    season_year, league_id, espn_team_id, manager_id, 
                    team_name, team_abbrev, logo_url
                ) VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (year, league_id, team.team_id, manager_id, team.team_name, team.team_abbrev, team.logo_url))
            
    print(f"Processed managers and teams for {league.settings.name} ({year}).")

conn.commit()
cursor.close()
conn.close()
print(f"\nManager and team data for {year} successfully saved to Neon!")