import sys
import json
from espn_api.football.constant import PLAYER_STATS_MAP

# 1. Capture the Runtime Parameter (RTP)
if len(sys.argv) > 1:
    target_id = sys.argv[1].strip()
else:
    target_id = input("Enter the stat_id to look up (e.g., 24 or proRating): ").strip()

# 2. Build the complete internal dictionary
espn_raw_stats = {}

# Map the 84 numeric IDs
for stat_id, raw_desc in PLAYER_STATS_MAP.items():
    espn_raw_stats[str(stat_id)] = raw_desc

# Append known advanced string IDs
string_stat_ids = [
    "proRating", "applTotalCeiling", "rating", "projectedPoints", 
    "projectedAveragePoints", "projectedTotalPoints", "appliedStatTotal"
]
for string_id in string_stat_ids:
    if string_id not in espn_raw_stats:
        espn_raw_stats[string_id] = f"Raw API String: {string_id}"

# 3. Look up and format the result
if target_id in espn_raw_stats:
    output = {
        target_id: espn_raw_stats[target_id]
    }
else:
    output = {
        "error": f"stat_id '{target_id}' is currently undocumented in the ESPN API wrapper."
    }

# 4. Print cleanly to the terminal
print(json.dumps(output, indent=4))