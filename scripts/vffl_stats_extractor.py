import os
import psycopg2
from dotenv import load_dotenv
from espn_api.football.constant import PLAYER_STATS_MAP

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")

print("Connecting to Neon Postgres...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# 1. Fetch all existing stat_ids currently in the database
cursor.execute("SELECT stat_id FROM vffl.stats;")
existing_stats = {row[0] for row in cursor.fetchall()}

new_stats_found = 0

# 2. Scan ESPN's 84 numeric stats from the API wrapper
print("Scanning ESPN's API dictionary for missing numeric stats...")
for stat_id, raw_desc in PLAYER_STATS_MAP.items():
    str_id = str(stat_id)
    if str_id not in existing_stats:
        cursor.execute("""
            INSERT INTO vffl.stats (stat_id, description, abbrev, catg) 
            VALUES (%s, %s, %s, %s);
        """, (str_id, f"ACTION REQUIRED: {raw_desc}", str_id, "ACTION REQUIRED"))
        existing_stats.add(str_id)
        new_stats_found += 1

# 3. Scan your live database for undocumented string IDs generated during matchups
print("Scanning vffl.matchup_player_stats for undocumented IDs...")
cursor.execute("""
    SELECT DISTINCT stat_id 
    FROM vffl.matchup_player_stats 
    WHERE stat_id NOT IN (SELECT stat_id FROM vffl.stats);
""")
undocumented_stats = cursor.fetchall()

for row in undocumented_stats:
    new_stat_id = row[0]
    if new_stat_id not in existing_stats:
        cursor.execute("""
            INSERT INTO vffl.stats (stat_id, description, abbrev, catg) 
            VALUES (%s, %s, %s, %s);
        """, (new_stat_id, f"ACTION REQUIRED: {new_stat_id}", new_stat_id[:20], "ACTION REQUIRED"))
        existing_stats.add(new_stat_id)
        new_stats_found += 1

conn.commit()

# 4. Terminal Alert Output
if new_stats_found > 0:
    print(f"\nALERT: Identified and inserted {new_stats_found} new stat_ids.")
    print("Log into your Neon SQL Editor and update their 'description', 'abbrev', and 'catg' to remove the ACTION REQUIRED tags.")
else:
    print("\nDatabase is fully mapped. No new stat_ids found.")

cursor.close()
conn.close()