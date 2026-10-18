import os
import sys
import psycopg2
import statistics
from dotenv import load_dotenv

# 1. Parameter Setup
if len(sys.argv) > 2:
    year = int(sys.argv[1])
    week = int(sys.argv[2])
else:
    user_input = input("Enter season year and week (e.g., 2026 1): ").strip().split()
    year = int(user_input[0])
    week = int(user_input[1])

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")
red_league_id = int(os.getenv("ESPN_LEAGUE_ID_RED"))
black_league_id = int(os.getenv("ESPN_LEAGUE_ID_BLACK"))

print(f"Executing Power Rankings Matrix for {year} Week {week}...")
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Wipe existing week data to ensure idempotency
cursor.execute("DELETE FROM vffl.division_power_rankings WHERE season_year = %s AND week = %s;", (year, week))
cursor.execute("DELETE FROM vffl.overall_power_rankings WHERE season_year = %s AND week = %s;", (year, week))

def get_z_score(val, population):
    if len(population) < 2: return 0.0
    mean = statistics.mean(population)
    stdev = statistics.stdev(population)
    return (val - mean) / stdev if stdev > 0 else 0.0

def calculate_power_score(ap_z, act_z, eff_z, perf_z, opt_z):
    return (ap_z * 0.45) + (act_z * 0.30) + (eff_z * 0.10) + (perf_z * 0.10) + (opt_z * 0.05)

def calculate_optimal_lineup(roster):
    sorted_roster = sorted(roster, key=lambda x: x['pts'], reverse=True)
    limits = {'QB': 1, 'RB': 1, 'WR': 1, 'TE': 1, 'FLEX': 4, 'D/ST': 1, 'K': 1}
    filled = {'QB': 0, 'RB': 0, 'WR': 0, 'TE': 0, 'FLEX': 0, 'D/ST': 0, 'K': 0}
    optimal_fpts = 0.0
    
    for player in sorted_roster:
        pts = player['pts']
        if pts <= 0: continue
            
        pos = player['pos']
        if pos in limits and filled[pos] < limits[pos]:
            filled[pos] += 1
            optimal_fpts += pts
        elif pos in ['RB', 'WR', 'TE'] and filled['FLEX'] < limits['FLEX']:
            filled['FLEX'] += 1
            optimal_fpts += pts
            
    return optimal_fpts

# Restored week > 0 check to pull Draft Day Baseline for Week 1
def get_prior_ranks(table_name):
    prior = {}
    if week > 0:
        cursor.execute(f"SELECT league_id, manager_id, wk_power_rank, std_power_rank FROM vffl.{table_name} WHERE season_year = %s AND week = %s;", (year, week - 1))
        for row in cursor.fetchall():
            prior[(row[0], row[1])] = {'wk': row[2], 'std': row[3]}
    return prior

prior_div = get_prior_ranks('division_power_rankings')
prior_ovr = get_prior_ranks('overall_power_rankings')

print("Aggregating base box scores and performance volatility...")

# Performance Volatility (Standard Deviation of Actual Weekly Scores) using composite keys
cursor.execute("""
    SELECT league_id, home_manager_id, week, home_score 
    FROM vffl.matchups WHERE season_year = %s AND week <= %s AND home_score IS NOT NULL
    UNION ALL
    SELECT league_id, away_manager_id, week, away_score 
    FROM vffl.matchups WHERE season_year = %s AND week <= %s AND away_score IS NOT NULL;
""", (year, week, year, week))

mgr_perf_var = {}
temp_scores = {}
for l_id, m_id, w, score in cursor.fetchall():
    comp_key = (l_id, m_id)
    if comp_key not in temp_scores: temp_scores[comp_key] = {}
    temp_scores[comp_key][w] = score

for comp_key, data in temp_scores.items():
    scores_list = list(data.values())
    mgr_perf_var[comp_key] = statistics.stdev(scores_list) if len(scores_list) > 1 else 0.0

# Raw Roster Extraction using composite keys
cursor.execute("""
    SELECT m.league_id, mr.manager_id, m.week, p.position, mr.slot_position, mr.actual_fpts 
    FROM vffl.matchup_rosters mr
    JOIN vffl.matchups m ON mr.matchup_id = m.id
    JOIN vffl.players p ON mr.player_id = p.id
    WHERE m.season_year = %s AND m.week <= %s;
""", (year, week))

stats = {}
for l_id, m_id, w, pos, slot, pts in cursor.fetchall():
    comp_key = (l_id, m_id)
    if comp_key not in stats:
        stats[comp_key] = {'league_id': int(l_id), 'weeks': {i: {'act': 0.0, 'roster': []} for i in range(1, week + 1)}}
    
    if w in stats[comp_key]['weeks']:
        if slot not in ['BE', 'IR', 'Bench', 20, 21, '20', '21']:
            stats[comp_key]['weeks'][w]['act'] += float(pts or 0.0)
        stats[comp_key]['weeks'][w]['roster'].append({'pos': pos, 'pts': float(pts or 0.0)})

print(f"Extracted roster data for {len(stats)} distinct franchises...")

# Calculate Optimal Lineups
for comp_key, data in stats.items():
    for w in range(1, week + 1):
        stats[comp_key]['weeks'][w]['opt'] = calculate_optimal_lineup(data['weeks'][w]['roster'])

print("Calculating matrices and executing database inserts...")

def compile_matrix(target_managers):
    matrix_data = []
    for mgr in target_managers:
        wk_act = stats[mgr]['weeks'].get(week, {}).get('act', 0.0)
        wk_opt = stats[mgr]['weeks'].get(week, {}).get('opt', 0.0)
        wk_ap_w = wk_ap_l = wk_ap_t = 0
        
        for opp in target_managers:
            if mgr == opp: continue
            opp_act = stats[opp]['weeks'].get(week, {}).get('act', 0.0)
            if wk_act > opp_act: wk_ap_w += 1
            elif wk_act < opp_act: wk_ap_l += 1
            else: wk_ap_t += 1
                
        wk_ap_pct = (wk_ap_w + (wk_ap_t * 0.5)) / (len(target_managers) - 1) if len(target_managers) > 1 else 0
        
        std_act = sum(stats[mgr]['weeks'][w]['act'] for w in range(1, week + 1))
        std_opt = sum(stats[mgr]['weeks'][w]['opt'] for w in range(1, week + 1))
        std_ap_w = std_ap_l = std_ap_t = 0
        
        for w in range(1, week + 1):
            w_act = stats[mgr]['weeks'][w]['act']
            for opp in target_managers:
                if mgr == opp: continue
                opp_act = stats[opp]['weeks'][w]['act']
                if w_act > opp_act: std_ap_w += 1
                elif w_act < opp_act: std_ap_l += 1
                else: std_ap_t += 1
                
        std_total_gms = (len(target_managers) - 1) * week
        std_ap_pct = (std_ap_w + (std_ap_t * 0.5)) / std_total_gms if std_total_gms else 0

        matrix_data.append({
            'comp_key': mgr, 'league_id': stats[mgr]['league_id'], 'manager_id': mgr[1],
            'wk_w': wk_ap_w, 'wk_l': wk_ap_l, 'wk_t': wk_ap_t, 'wk_ap_pct': wk_ap_pct,
            'wk_act': wk_act, 'wk_opt': wk_opt, 'wk_eff': (wk_act / wk_opt) if wk_opt else 0,
            'wk_perf': mgr_perf_var.get(mgr, 0.0),
            'std_w': std_ap_w, 'std_l': std_ap_l, 'std_t': std_ap_t, 'std_ap_pct': std_ap_pct,
            'std_act': std_act, 'std_opt': std_opt, 'std_eff': (std_act / std_opt) if std_opt else 0,
            'std_perf': mgr_perf_var.get(mgr, 0.0)
        })
    return matrix_data

def calculate_population_ranks(managers, table_name, prior_ranks):
    if not managers: return
    
    wk_ap_pcts = [m['wk_ap_pct'] for m in managers]
    wk_acts = [m['wk_act'] for m in managers]
    wk_effs = [m['wk_eff'] for m in managers]
    wk_perfs = [m['wk_perf'] for m in managers]
    wk_opts = [m['wk_opt'] for m in managers]
    
    std_ap_pcts = [m['std_ap_pct'] for m in managers]
    std_acts = [m['std_act'] for m in managers]
    std_effs = [m['std_eff'] for m in managers]
    std_perfs = [m['std_perf'] for m in managers]
    std_opts = [m['std_opt'] for m in managers]

    for m in managers:
        m['wk_ap_z'] = get_z_score(m['wk_ap_pct'], wk_ap_pcts)
        m['wk_act_z'] = get_z_score(m['wk_act'], wk_acts)
        m['wk_eff_z'] = get_z_score(m['wk_eff'], wk_effs)
        m['wk_perf_z'] = get_z_score(m['wk_perf'], wk_perfs)
        m['wk_opt_z'] = get_z_score(m['wk_opt'], wk_opts)
        m['wk_power'] = calculate_power_score(m['wk_ap_z'], m['wk_act_z'], m['wk_eff_z'], m['wk_perf_z'], m['wk_opt_z'])

        m['std_ap_z'] = get_z_score(m['std_ap_pct'], std_ap_pcts)
        m['std_act_z'] = get_z_score(m['std_act'], std_acts)
        m['std_eff_z'] = get_z_score(m['std_eff'], std_effs)
        m['std_perf_z'] = get_z_score(m['std_perf'], std_perfs)
        m['std_opt_z'] = get_z_score(m['std_opt'], std_opts)
        m['std_power'] = calculate_power_score(m['std_ap_z'], m['std_act_z'], m['std_eff_z'], m['std_perf_z'], m['std_opt_z'])

    managers.sort(key=lambda x: x['wk_power'], reverse=True)
    for i, m in enumerate(managers, 1): m['wk_rank'] = i
    
    managers.sort(key=lambda x: x['std_power'], reverse=True)
    for i, m in enumerate(managers, 1): 
        m['std_rank'] = i
        pr = prior_ranks.get(m['comp_key'], {'wk': m['wk_rank'], 'std': i})
        m['wk_diff'] = pr['wk'] - m['wk_rank']
        m['std_diff'] = pr['std'] - i

        cursor.execute(f"""
            INSERT INTO vffl.{table_name} (
                season_year, league_id, week, manager_id,
                wk_ap_wins, wk_ap_losses, wk_ap_ties, wk_ap_win_pct, wk_act_fpts, wk_opt_fpts, wk_eff_pct, wk_perf_var,
                wk_ap_z, wk_act_z, wk_opt_z, wk_eff_z, wk_perf_z, wk_power_score, wk_power_rank, wk_rank_diff,
                std_ap_wins, std_ap_losses, std_ap_ties, std_ap_win_pct, std_act_fpts, std_opt_fpts, std_eff_pct, std_perf_var,
                std_ap_z, std_act_z, std_opt_z, std_eff_z, std_perf_z, std_power_score, std_power_rank, std_rank_diff
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            year, m['league_id'], week, m['manager_id'],
            m['wk_w'], m['wk_l'], m['wk_t'], round(m['wk_ap_pct'], 4), round(m['wk_act'], 2), round(m['wk_opt'], 2), round(m['wk_eff'], 4), round(m['wk_perf'], 4),
            round(m['wk_ap_z'], 4), round(m['wk_act_z'], 4), round(m['wk_opt_z'], 4), round(m['wk_eff_z'], 4), round(m['wk_perf_z'], 4), round(m['wk_power'], 4), m['wk_rank'], m['wk_diff'],
            m['std_w'], m['std_l'], m['std_t'], round(m['std_ap_pct'], 4), round(m['std_act'], 2), round(m['std_opt'], 2), round(m['std_eff'], 4), round(m['std_perf'], 4),
            round(m['std_ap_z'], 4), round(m['std_act_z'], 4), round(m['std_opt_z'], 4), round(m['std_eff_z'], 4), round(m['std_perf_z'], 4), round(m['std_power'], 4), m['std_rank'], m['std_diff']
        ))

# Group Managers
all_managers = list(stats.keys())
red_managers = [k for k in all_managers if k[0] == red_league_id]
black_managers = [k for k in all_managers if k[0] == black_league_id]

print(f"Compiling Divisonal Matrix for {len(red_managers)} Red managers...")
if red_managers: calculate_population_ranks(compile_matrix(red_managers), 'division_power_rankings', prior_div)

print(f"Compiling Divisonal Matrix for {len(black_managers)} Black managers...")
if black_managers: calculate_population_ranks(compile_matrix(black_managers), 'division_power_rankings', prior_div)

print(f"Compiling Overall Matrix for {len(all_managers)} VFFL managers...")
if all_managers: calculate_population_ranks(compile_matrix(all_managers), 'overall_power_rankings', prior_ovr)

conn.commit()
cursor.close()
conn.close()
print(f"SUCCESS: Week {week} Power Rankings saved to Neon!")