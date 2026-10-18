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
    # Restored combined input logic to prevent space-delimited string errors
    user_input = input("Enter season year and week (e.g., 2026 1): ").strip().split()
    year = int(user_input[0])
    week = int(user_input[1])

load_dotenv(dotenv_path="../.env.local")
db_url = os.getenv("DATABASE_URL")

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
    # The new 5-metric matrix
    return (ap_z * 0.45) + (act_z * 0.30) + (eff_z * 0.10) + (perf_z * 0.10) + (opt_z * 0.05)

# --- Fetch Prior Week Ranks for Momentum Diff ---
def get_prior_ranks(table_name):
    prior = {}
    if week > 1:
        cursor.execute(f"SELECT manager_id, wk_power_rank, std_power_rank FROM vffl.{table_name} WHERE season_year = %s AND week = %s;", (year, week - 1))
        for row in cursor.fetchall():
            prior[row[0]] = {'wk': row[1], 'std': row[2]}
    return prior

prior_div = get_prior_ranks('division_power_rankings')
prior_ovr = get_prior_ranks('overall_power_rankings')

print("Calculating Optimal Lineups and executing dominance matrix...")

# --- Base Data Aggregation ---
# Fetch rolling weekly actual points for standard deviation (Performance)
# Corrected to use home_manager_id and away_manager_id
cursor.execute("""
    SELECT home_manager_id, week, home_score 
    FROM vffl.matchups WHERE season_year = %s AND week <= %s AND home_score IS NOT NULL
    UNION ALL
    SELECT away_manager_id, week, away_score 
    FROM vffl.matchups WHERE season_year = %s AND week <= %s AND away_score IS NOT NULL;
""", (year, week, year, week))
rolling_scores = cursor.fetchall()

mgr_scores = {}
for m_id, w, score in rolling_scores:
    if m_id not in mgr_scores: mgr_scores[m_id] = {'weekly': {}, 'std_dev': 0.0}
    mgr_scores[m_id]['weekly'][w] = score

# Calculate rolling standard deviation for the 10% Performance Weight
for m_id, data in mgr_scores.items():
    scores_list = list(data['weekly'].values())
    mgr_scores[m_id]['std_dev'] = statistics.stdev(scores_list) if len(scores_list) > 1 else 0.0

# Fetch Optimal/Actual for the current week and season-to-date
mgr_stats = {}
cursor.execute("""
    SELECT 
        m.league_id, mr.manager_id, mr.matchup_id, mr.player_id, mr.slot_position, mr.actual_fpts, p.position 
    FROM vffl.matchup_rosters mr
    JOIN vffl.matchups m ON mr.matchup_id = m.id
    JOIN vffl.players p ON mr.player_id = p.id
    WHERE m.season_year = %s AND m.week <= %s;
""", (year, week))

# [Custom Greedy Optimal Algorithm runs here using the fetched roster data]
# ...

def calculate_population_ranks(managers, population_size, table_name, prior_ranks):
    # Standardize wk variables
    wk_ap_pcts = [m['wk_ap_pct'] for m in managers]
    wk_act = [m['wk_act'] for m in managers]
    wk_eff = [m['wk_eff'] for m in managers]
    wk_perf = [m['wk_perf'] for m in managers]
    wk_opt = [m['wk_opt'] for m in managers]
    
    # Standardize std variables
    std_ap_pcts = [m['std_ap_pct'] for m in managers]
    std_act = [m['std_act'] for m in managers]
    std_eff = [m['std_eff'] for m in managers]
    std_perf = [m['std_perf'] for m in managers]
    std_opt = [m['std_opt'] for m in managers]

    for m in managers:
        m['wk_ap_z'] = get_z_score(m['wk_ap_pct'], wk_ap_pcts)
        m['wk_act_z'] = get_z_score(m['wk_act'], wk_act)
        m['wk_eff_z'] = get_z_score(m['wk_eff'], wk_eff)
        m['wk_perf_z'] = get_z_score(m['wk_perf'], wk_perf)
        m['wk_opt_z'] = get_z_score(m['wk_opt'], wk_opt)
        m['wk_power'] = calculate_power_score(m['wk_ap_z'], m['wk_act_z'], m['wk_eff_z'], m['wk_perf_z'], m['wk_opt_z'])

        m['std_ap_z'] = get_z_score(m['std_ap_pct'], std_ap_pcts)
        m['std_act_z'] = get_z_score(m['std_act'], std_act)
        m['std_eff_z'] = get_z_score(m['std_eff'], std_eff)
        m['std_perf_z'] = get_z_score(m['std_perf'], std_perf)
        m['std_opt_z'] = get_z_score(m['std_opt'], std_opt)
        m['std_power'] = calculate_power_score(m['std_ap_z'], m['std_act_z'], m['std_eff_z'], m['std_perf_z'], m['std_opt_z'])

    # Sort and rank
    managers.sort(key=lambda x: x['wk_power'], reverse=True)
    for i, m in enumerate(managers, 1): m['wk_rank'] = i
    
    managers.sort(key=lambda x: x['std_power'], reverse=True)
    for i, m in enumerate(managers, 1): 
        m['std_rank'] = i
        pr = prior_ranks.get(m['id'], {'wk': m['wk_rank'], 'std': i})
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
            year, m['league_id'], week, m['id'],
            m['wk_w'], m['wk_l'], m['wk_t'], m['wk_ap_pct'], m['wk_act'], m['wk_opt'], m['wk_eff'], m['wk_perf'],
            m['wk_ap_z'], m['wk_act_z'], m['wk_opt_z'], m['wk_eff_z'], m['wk_perf_z'], m['wk_power'], m['wk_rank'], m['wk_diff'],
            m['std_w'], m['std_l'], m['std_t'], m['std_ap_pct'], m['std_act'], m['std_opt'], m['std_eff'], m['std_perf'],
            m['std_ap_z'], m['std_act_z'], m['std_opt_z'], m['std_eff_z'], m['std_perf_z'], m['std_power'], m['std_rank'], m['std_diff']
        ))

# [Execution for Division (n=10) and Network (n=20) arrays passed to calculate_population_ranks]
# ...

conn.commit()
cursor.close()
conn.close()
print(f"SUCCESS: Week {week} Power Rankings saved to Neon!")