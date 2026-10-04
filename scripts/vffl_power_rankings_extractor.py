import os
import sys
import math
import psycopg2
from dotenv import load_dotenv

# --- Helper Functions ---
def calc_z_score(val, population):
    if not population: return 0.0
    mean = sum(population) / len(population)
    variance = sum((x - mean) ** 2 for x in population) / len(population)
    std_dev = math.sqrt(variance)
    return (val - mean) / std_dev if std_dev > 0 else 0.0

def calculate_optimal_lineup(roster):
    """
    Calculates the maximum possible starting lineup score under VFFL roster settings:
    1 QB, 1 RB, 1 WR, 1 TE, 4 FLEX (RB/WR/TE), 1 D/ST, 1 K
    """
    sorted_roster = sorted(roster, key=lambda x: x['pts'], reverse=True)
    
    limits = {'QB': 1, 'RB': 1, 'WR': 1, 'TE': 1, 'FLEX': 4, 'D/ST': 1, 'K': 1}
    filled = {'QB': 0, 'RB': 0, 'WR': 0, 'TE': 0, 'FLEX': 0, 'D/ST': 0, 'K': 0}
    optimal_fpts = 0.0
    
    for player in sorted_roster:
        pts = player['pts']
        if pts <= 0:
            continue
            
        pos = player['pos'].upper()
        if pos == 'DST':
            pos = 'D/ST'
        if pos == 'FB':
            pos = 'RB'
            
        # 1. Fill primary positional slot first
        if pos in limits and filled[pos] < limits[pos]:
            filled[pos] += 1
            optimal_fpts += pts
        # 2. Spill excess RB, WR, or TE into the 4 available FLEX slots
        elif pos in ['RB', 'WR', 'TE'] and filled['FLEX'] < limits['FLEX']:
            filled['FLEX'] += 1
            optimal_fpts += pts
            
    return optimal_fpts

def process_pool(pool_keys, stats, prev_ranks, week):
    matrix = {}
    for team_key in pool_keys:
        wk_act = stats[team_key][week]['act']
        wk_opt = stats[team_key][week]['opt']
        wk_ap_w = wk_ap_l = wk_ap_t = 0
        
        for opp_key in pool_keys:
            if team_key == opp_key: continue
            opp_act = stats[opp_key][week]['act']
            if wk_act > opp_act: wk_ap_w += 1
            elif wk_act < opp_act: wk_ap_l += 1
            else: wk_ap_t += 1
                
        wk_ap_pct = (wk_ap_w + (wk_ap_t * 0.5)) / (len(pool_keys) - 1) if len(pool_keys) > 1 else 0
        
        std_act = sum(stats[team_key][w]['act'] for w in range(1, week + 1))
        std_opt = sum(stats[team_key][w]['opt'] for w in range(1, week + 1))
        std_ap_w = std_ap_l = std_ap_t = 0
        
        for w in range(1, week + 1):
            w_act = stats[team_key][w]['act']
            for opp_key in pool_keys:
                if team_key == opp_key: continue
                opp_act = stats[opp_key][w]['act']
                if w_act > opp_act: std_ap_w += 1
                elif w_act < opp_act: std_ap_l += 1
                else: std_ap_t += 1
        
        std_total_gms = (len(pool_keys) - 1) * week
        std_ap_pct = (std_ap_w + (std_ap_t * 0.5)) / std_total_gms if std_total_gms else 0
        
        matrix[team_key] = {
            'wk_ap_w': wk_ap_w, 'wk_ap_l': wk_ap_l, 'wk_ap_t': wk_ap_t, 'wk_ap_pct': wk_ap_pct,
            'wk_act': wk_act, 'wk_opt': wk_opt, 'wk_opt_pct': (wk_act / wk_opt) if wk_opt else 0,
            'std_ap_w': std_ap_w, 'std_ap_l': std_ap_l, 'std_ap_t': std_ap_t, 'std_ap_pct': std_ap_pct,
            'std_act': std_act, 'std_opt': std_opt, 'std_opt_pct': (std_act / std_opt) if std_opt else 0
        }

    wk_ap_pcts = [d['wk_ap_pct'] for d in matrix.values()]
    wk_opts = [d['wk_opt'] for d in matrix.values()]
    wk_acts = [d['wk_act'] for d in matrix.values()]
    std_ap_pcts = [d['std_ap_pct'] for d in matrix.values()]
    std_opts = [d['std_opt'] for d in matrix.values()]
    std_acts = [d['std_act'] for d in matrix.values()]

    for team_key, d in matrix.items():
        d['wk_ap_z'] = calc_z_score(d['wk_ap_pct'], wk_ap_pcts)
        d['wk_opt_z'] = calc_z_score(d['wk_opt'], wk_opts)
        d['wk_act_z'] = calc_z_score(d['wk_act'], wk_acts)
        
        d['std_ap_z'] = calc_z_score(d['std_ap_pct'], std_ap_pcts)
        d['std_opt_z'] = calc_z_score(d['std_opt'], std_opts)
        d['std_act_z'] = calc_z_score(d['std_act'], std_acts)
        
        d['wk_gross_dom'] = (d['wk_ap_z'] * 0.6) + (d['wk_opt_z'] * 0.4)
        d['wk_net_dom'] = (d['wk_ap_z'] * 0.6) + (d['wk_act_z'] * 0.4)
        d['std_gross_dom'] = (d['std_ap_z'] * 0.6) + (d['std_opt_z'] * 0.4)
        d['std_net_dom'] = (d['std_ap_z'] * 0.6) + (d['std_act_z'] * 0.4)

    wk_gross_ranks = {k: r for r, k in enumerate(sorted(matrix.keys(), key=lambda k: matrix[k]['wk_gross_dom'], reverse=True), start=1)}
    wk_net_ranks = {k: r for r, k in enumerate(sorted(matrix.keys(), key=lambda k: matrix[k]['wk_net_dom'], reverse=True), start=1)}
    std_gross_ranks = {k: r for r, k in enumerate(sorted(matrix.keys(), key=lambda k: matrix[k]['std_gross_dom'], reverse=True), start=1)}
    std_net_ranks = {k: r for r, k in enumerate(sorted(matrix.keys(), key=lambda k: matrix[k]['std_net_dom'], reverse=True), start=1)}

    for team_key, d in matrix.items():
        pr = prev_ranks.get(team_key, {})
        d['wk_gross_rank'] = wk_gross_ranks[team_key]
        d['wk_net_rank'] = wk_net_ranks[team_key]
        d['std_gross_rank'] = std_gross_ranks[team_key]
        d['std_net_rank'] = std_net_ranks[team_key]
        
        d['wk_gross_diff'] = pr.get('wk_gross', wk_gross_ranks[team_key]) - wk_gross_ranks[team_key]
        d['wk_net_diff'] = pr.get('wk_net', wk_net_ranks[team_key]) - wk_net_ranks[team_key]
        d['std_gross_diff'] = pr.get('std_gross', std_gross_ranks[team_key]) - std_gross_ranks[team_key]
        d['std_net_diff'] = pr.get('std_net', std_net_ranks[team_key]) - std_net_ranks[team_key]
        
    return matrix

# --- Main Runtime ---
if len(sys.argv) > 2:
    year, week = int(sys.argv[1]), int(sys.argv[2])
else:
    user_input = input("Enter season year and week (e.g., 2026 1): ").strip().split()
    year, week = int(user_input[0]), int(user_input[1])

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")
league_ids = [int(os.getenv("ESPN_LEAGUE_ID_RED")), int(os.getenv("ESPN_LEAGUE_ID_BLACK"))]

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print(f"\nProcessing Power Rankings for Year {year}, Week {week} across Network...")

# 1. Fetch raw box score data
cursor.execute("""
    SELECT m.league_id, m.week, mr.manager_id, p.position, mr.slot_position, mr.actual_fpts
    FROM vffl.matchups m
    JOIN vffl.matchup_rosters mr ON m.id = mr.matchup_id
    JOIN vffl.players p ON mr.player_id = p.id
    WHERE m.season_year = %s AND m.league_id = ANY(%s) AND m.week <= %s
""", (year, league_ids, week))

rows = cursor.fetchall()
if not rows:
    print("No box score data found. Run vffl_box_scores_extractor.py first.")
    sys.exit(1)

# Keyed by (league_id, manager_id) composite tuple
stats = {}
for row in rows:
    lid, w, mgr_id, pos, slot, pts = row
    key = (lid, mgr_id)
    if key not in stats:
        stats[key] = {i: {'act': 0.0, 'roster': []} for i in range(1, week + 1)}
    
    if slot not in ['BE', 'IR']:
        stats[key][w]['act'] += float(pts)
    stats[key][w]['roster'].append({'pos': pos, 'pts': float(pts)})

for key, w_data in stats.items():
    for w in range(1, week + 1):
        stats[key][w]['opt'] = calculate_optimal_lineup(w_data[w]['roster'])

# 2. Previous Ranks
def fetch_prev_ranks(table_name):
    prev_ranks = {}
    if week > 1:
        cursor.execute(f"""
            SELECT league_id, manager_id, wk_gross_power_rank, wk_net_power_rank, std_gross_power_rank, std_net_power_rank 
            FROM vffl.{table_name} 
            WHERE season_year = %s AND week = %s
        """, (year, week - 1))
        for row in cursor.fetchall():
            prev_ranks[(row[0], row[1])] = {
                'wk_gross': row[2], 
                'wk_net': row[3], 
                'std_gross': row[4], 
                'std_net': row[5]
            }
    return prev_ranks

prev_div_ranks = fetch_prev_ranks('division_power_rankings')
prev_ovr_ranks = fetch_prev_ranks('overall_power_rankings')

# 3. Calculate Matrices
all_team_keys = list(stats.keys())
print(f"Total Teams detected across both divisions: {len(all_team_keys)}")

overall_matrix = process_pool(all_team_keys, stats, prev_ovr_ranks, week)

division_matrices = {}
for lid in league_ids:
    div_team_keys = [k for k in all_team_keys if k[0] == lid]
    print(f"League {lid} has {len(div_team_keys)} teams.")
    division_matrices[lid] = process_pool(div_team_keys, stats, prev_div_ranks, week)

# 4. Insert into Neon
def insert_rankings(table_name, matrix_data, league_id=None):
    if league_id:
        cursor.execute(f"""
            DELETE FROM vffl.{table_name} 
            WHERE season_year = %s AND week = %s AND league_id = %s
        """, (year, week, league_id))
    else:
        cursor.execute(f"""
            DELETE FROM vffl.{table_name} 
            WHERE season_year = %s AND week = %s
        """, (year, week))
    
    for (mgr_lid, mgr_id), d in matrix_data.items():
        cursor.execute(f"""
            INSERT INTO vffl.{table_name} (
                season_year, league_id, week, manager_id,
                wk_ap_wins, wk_ap_losses, wk_ap_ties, wk_ap_win_pct,
                wk_opt_fpts, wk_act_fpts, wk_opt_pct,
                wk_ap_z, wk_opt_z, wk_act_z, wk_gross_dom_score, wk_net_dom_score,
                wk_gross_power_rank, wk_net_power_rank, wk_gross_rank_diff, wk_net_rank_diff,
                
                std_ap_wins, std_ap_losses, std_ap_ties, std_ap_win_pct,
                std_opt_fpts, std_act_fpts, std_opt_pct,
                std_ap_z, std_opt_z, std_act_z, std_gross_dom_score, std_net_dom_score,
                std_gross_power_rank, std_net_power_rank, std_gross_rank_diff, std_net_rank_diff
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            year, mgr_lid, week, mgr_id,
            d['wk_ap_w'], d['wk_ap_l'], d['wk_ap_t'], round(d['wk_ap_pct'], 4),
            round(d['wk_opt'], 2), round(d['wk_act'], 2), round(d['wk_opt_pct'], 4),
            round(d['wk_ap_z'], 4), round(d['wk_opt_z'], 4), round(d['wk_act_z'], 4), round(d['wk_gross_dom'], 4), round(d['wk_net_dom'], 4),
            d['wk_gross_rank'], d['wk_net_rank'], d['wk_gross_diff'], d['wk_net_diff'],
            
            d['std_ap_w'], d['std_ap_l'], d['std_ap_t'], round(d['std_ap_pct'], 4),
            round(d['std_opt'], 2), round(d['std_act'], 2), round(d['std_opt_pct'], 4),
            round(d['std_ap_z'], 4), round(d['std_opt_z'], 4), round(d['std_act_z'], 4), round(d['std_gross_dom'], 4), round(d['std_net_dom'], 4),
            d['std_gross_rank'], d['std_net_rank'], d['std_gross_diff'], d['std_net_diff']
        ))

# Insert 1-20 Network Ranks
insert_rankings('overall_power_rankings', overall_matrix)

# Insert 1-10 Division Ranks
for lid, div_matrix in division_matrices.items():
    insert_rankings('division_power_rankings', div_matrix, league_id=lid)

conn.commit()
cursor.close()
conn.close()
print(f"Week {week} Division (20 rows total) and Overall (20 rows) Power Rankings saved to Neon!")