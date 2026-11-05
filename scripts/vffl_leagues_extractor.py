import os
import sys
import datetime
import psycopg2
from espn_api.football import League
from dotenv import load_dotenv

# Load credentials from the root Next.js environment file
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))

# Load both league IDs
league_ids = [
    int(os.getenv("ESPN_LEAGUE_ID_RED")),
    int(os.getenv("ESPN_LEAGUE_ID_BLACK"))
]
espn_s2 = os.getenv("ESPN_S2")
swid = os.getenv("ESPN_SWID")
db_url = os.getenv("DATABASE_URL")

print("Connecting to Neon Postgres...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Resolve target season year dynamically via CLI argument, database fallback, or current year
if len(sys.argv) > 1:
    try:
        year = int(sys.argv[1])
    except ValueError:
        print("Error: The year provided must be a valid number.")
        sys.exit(1)
else:
    cursor.execute("""
        SELECT season_year
        FROM vffl.leagues
        ORDER BY season_year DESC, current_week DESC
        LIMIT 1;
    """)
    row = cursor.fetchone()
    year = int(row[0]) if row else datetime.datetime.now().year

print(f"Syncing VFFL league settings for the {year} season...")

# Loop through both leagues
for league_id in league_ids:
    print(f"\nConnecting to ESPN League {league_id}...")
    league = League(league_id=league_id, year=year, espn_s2=espn_s2, swid=swid)
    
    # Check if the league year already exists
    cursor.execute(
        "SELECT id FROM vffl.leagues WHERE league_id = %s AND season_year = %s;", 
        (league_id, year)
    )
    result = cursor.fetchone()

    if result:
        print(f"League {league.settings.name} exists. Updating current week to {league.current_week}...")
        cursor.execute("""
            UPDATE vffl.leagues 
            SET current_week = %s 
            WHERE id = %s
        """, (league.current_week, result[0]))
    else:
        print(f"Extracting and inserting new league settings for {league.settings.name}...")
        cursor.execute("""
            INSERT INTO vffl.leagues (
                league_id, season_year, name, team_count, 
                current_week, reg_season_count, scoring_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            league_id,
            year,
            league.settings.name,
            league.settings.team_count,
            league.current_week,
            league.settings.reg_season_count,
            league.settings.scoring_type
        ))

conn.commit()
cursor.close()
conn.close()
print("\nBoth VFFL league settings successfully saved to Neon!")
