import os
import sys
import psycopg2
from dotenv import load_dotenv

if len(sys.argv) < 3:
    print("Usage: python vffl_awards_extractor.py <year> <week>")
    sys.exit(1)

year = int(sys.argv[1])
week = int(sys.argv[2])

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")

print(f"Connecting to Neon Postgres to calculate Week {week} awards...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Idempotency: Wipe existing awards for this specific week to prevent duplicates on re-runs
cursor.execute("DELETE FROM vffl.awards WHERE season_year = %s AND week = %s;", (year, week))

# 1. Fetch all completed matchups for the week across both leagues
cursor.execute("""
    SELECT home_manager_id, home_score, home_projected,
           away_manager_id, away_score, away_projected, league_id
    FROM vffl.matchups
    WHERE season_year = %s AND week = %s AND home_score IS NOT NULL AND away_score IS NOT NULL;
""", (year, week))
matchups = cursor.fetchall()

teams = []
for m in matchups:
    h_mgr, h_act, h_proj, a_mgr, a_act, a_proj, lid = m
    # Map Home Team
    teams.append({
        'manager_id': h_mgr, 'act': h_act, 'proj': h_proj, 
        'opp_act': a_act, 'won': h_act > a_act, 'margin': abs(h_act - a_act), 'league_id': lid
    })
    # Map Away Team
    teams.append({
        'manager_id': a_mgr, 'act': a_act, 'proj': a_proj, 
        'opp_act': h_act, 'won': a_act > h_act, 'margin': abs(h_act - a_act), 'league_id': lid
    })

leagues = {t['league_id'] for t in teams}
awards_inserted = 0

for lid in leagues:
    league_teams = [t for t in teams if t['league_id'] == lid]
    winners = [t for t in league_teams if t['won']]
    losers = [t for t in league_teams if not t['won']]
    league_awards = []

    # 1. Head of the Table
    hot = max(league_teams, key=lambda x: x['act'])
    league_awards.append((lid, year, week, "Head of the Table", "Highest Scoring Team", hot['manager_id'], None, hot['act'], str(hot['proj'])))

    # 2. Overachiever
    oa = max(league_teams, key=lambda x: x['act'] - x['proj'])
    oa_val = round(oa['act'] - oa['proj'], 2)
    league_awards.append((lid, year, week, "Overachiever", "Highest Margin to Projection", oa['manager_id'], None, oa_val, f"{oa['act']} - {oa['proj']}"))

    # 3. Body Bag
    if winners:
        bb = max(winners, key=lambda x: x['margin'])
        league_awards.append((lid, year, week, "Body Bag", "Highest Margin of Victory", bb['manager_id'], None, round(bb['margin'], 2), f"{bb['act']} - {bb['opp_act']}"))

    # 4. Tough Luck
    if losers:
        tl = max(losers, key=lambda x: x['act'])
        league_awards.append((lid, year, week, "Tough Luck", "Highest Score for a Losing Team", tl['manager_id'], None, tl['act'], str(tl['proj'])))

    # 5. Heartbreak Kid
    if winners:
        hk = min(winners, key=lambda x: x['margin'])
        league_awards.append((lid, year, week, "Heartbreak Kid", "Lowest Margin of Victory", hk['manager_id'], None, round(hk['margin'], 2), f"{hk['act']} - {hk['opp_act']}"))

    # 6. Any Given Sunday
    if winners:
        ags = min(winners, key=lambda x: x['act'])
        league_awards.append((lid, year, week, "Any Given Sunday", "Lowest Score for a Winning Team", ags['manager_id'], None, ags['act'], str(ags['proj'])))

    # 7. Armchair Architect
    cursor.execute("""
        SELECT manager_id, wk_act_fpts, wk_opt_fpts
        FROM vffl.division_power_rankings
        WHERE season_year = %s AND week = %s AND league_id = %s;
    """, (year, week, lid))
    pr_data = cursor.fetchall()
    
    if pr_data:
        eff_list = []
        for row in pr_data:
            mgr, act, opt = row
            eff = act / opt if opt and opt > 0 else 0
            eff_list.append({'manager_id': mgr, 'act': act, 'opt': opt, 'eff': eff})
        
        aa = max(eff_list, key=lambda x: x['eff'])
        league_awards.append((lid, year, week, "Armchair Architect", "Most Efficient Lineup", aa['manager_id'], None, round(aa['eff'], 4), f"{aa['act']} / {aa['opt']}"))

    # 8. The GOAT
    cursor.execute("""
        SELECT mr.manager_id, mr.player_id, mr.actual_fpts, mr.proj_fpts
        FROM vffl.matchup_rosters mr
        JOIN vffl.matchups m ON mr.matchup_id = m.id
        WHERE m.season_year = %s AND m.week = %s AND m.league_id = %s
        ORDER BY mr.actual_fpts DESC LIMIT 1;
    """, (year, week, lid))
    goat = cursor.fetchone()
    if goat:
        league_awards.append((lid, year, week, "The GOAT", "Highest Scoring Player", goat[0], goat[1], goat[2], str(goat[3])))

    # 9. You Shall Not Pass
    cursor.execute("""
        SELECT mr.manager_id, mr.player_id, mr.actual_fpts, mr.proj_fpts
        FROM vffl.matchup_rosters mr
        JOIN vffl.matchups m ON mr.matchup_id = m.id
        WHERE m.season_year = %s AND m.week = %s AND m.league_id = %s AND mr.slot_position = 'D/ST'
        ORDER BY mr.actual_fpts DESC LIMIT 1;
    """, (year, week, lid))
    defense = cursor.fetchone()
    if defense:
        league_awards.append((lid, year, week, "You Shall Not Pass", "Highest Scoring Defense", defense[0], defense[1], defense[2], str(defense[3])))

    # Insert into database
    for award in league_awards:
        cursor.execute("""
            INSERT INTO vffl.awards (
                league_id, season_year, week, award, definition, 
                manager_id, player_id, value, supplemental
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, award)
        awards_inserted += 1

conn.commit()
cursor.close()
conn.close()

print(f"Successfully calculated and inserted {awards_inserted} awards into Neon!")