import os
import requests
import psycopg2
from dotenv import load_dotenv

# Load credentials from the root Next.js environment file
load_dotenv(dotenv_path="../.env.local")

db_url = os.getenv("DATABASE_URL")

print("Fetching dynamic NFL team data from ESPN...")
# ESPN's live endpoint for NFL teams
url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams"
response = requests.get(url)
data = response.json()

print("Connecting to Neon Postgres...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Populating vffl.nfl reference table...")

# Drill down into the JSON structure to access the teams array
teams = data['sports'][0]['leagues'][0]['teams']

for team_data in teams:
    team = team_data['team']
    team_id = int(team['id'])
    abbrev = team['abbreviation']
    location = team['location']
    name = team.get('name', '')
    
    cursor.execute("""
        INSERT INTO vffl.nfl (id, abbrev, location, name) 
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE 
        SET abbrev = EXCLUDED.abbrev,
            location = EXCLUDED.location,
            name = EXCLUDED.name;
    """, (team_id, abbrev, location, name))

conn.commit()
cursor.close()
conn.close()
print("NFL teams successfully saved to Neon!")