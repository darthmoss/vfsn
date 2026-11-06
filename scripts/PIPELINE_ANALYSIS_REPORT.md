# VFSN Python Data Pipelines — Analysis Report

This report analyzes the five Python orchestration pipelines in [`scripts/`](./) (as well as standalone/un-orchestrated extractors), evaluated against the data engineering directives in [`.agents/agents/data-engineer/agent.md`](../.agents/agents/data-engineer/agent.md).

---

## Global Dependencies (Shared Across All Pipelines)

* **External Packages:** `espn-api`, `psycopg2-binary`, `python-dotenv`, `requests` (plus Python standard library modules `os`, `sys`, `subprocess`, `datetime`, `uuid`, `statistics`).
* **Environment Variables (`../.env.local`):** `DATABASE_URL`, `ESPN_LEAGUE_ID_RED`, `ESPN_LEAGUE_ID_BLACK`, `ESPN_S2`, `ESPN_SWID`.
* **Core Database Schema (`vffl`):**
  * **Reference / Identity Tables:** `vffl.nfl`, `vffl.leagues`, `vffl.managers`, `vffl.teams`, `vffl.players`, `vffl.stats`
  * **Transactional / Weekly Tables:** `vffl.draft`, `vffl.predraft`, `vffl.baseline_standings`, `vffl.matchups`, `vffl.matchup_rosters`, `vffl.matchup_player_stats`, `vffl.player_stats`, `vffl.weekly_player_status`, `vffl.transactions`, `vffl.sos`, `vffl.division_power_rankings`, `vffl.overall_power_rankings`

---

## 1. Week 0 Initialization Pipeline (`vffl_week_0_pipeline.py`)

### 1. General Intent
Bootstraps a new fantasy season in Neon PostgreSQL after the league draft completes. It establishes league settings, manager/team identities, the NFL team reference index, the initial player universe, draft picks, draft-day projected standings (`vffl.baseline_standings`), the full regular-season unplayed matchup schedule grid, and baseline Week 0 Strength of Schedule (`vffl.sos`).

### 2. When It Should Be Run
**Once per season**, immediately **after the draft concludes** and before Week 1 games kick off (or when backfilling a historical season from scratch).

### 3. Dependencies
* **Sub-scripts Executed (in strict FK order):**
  1. `vffl_leagues_extractor.py [year]` -> writes `vffl.leagues`
  2. `vffl_managers_extractor.py [year]` -> writes `vffl.managers`, `vffl.teams`
  3. `vffl_nfl_extractor.py` -> writes `vffl.nfl`
  4. `vffl_players_extractor.py [year]` -> reads `vffl.nfl`; writes `vffl.players`
  5. `vffl_draft_extractor.py [year]` -> reads `vffl.teams`, `vffl.players`; writes `vffl.baseline_standings`, `vffl.draft`
  6. `vffl_schedule_extractor.py [year] 0` -> reads `vffl.teams`; writes `vffl.matchups`, `vffl.sos`

### 4. Weaknesses & Gaps
* **Orphaned Pre-Draft Extractor:** `vffl_predraft_extractor.py` is never called in `vffl_week_0_pipeline.py` (or any other pipeline), and only extracts pre-draft ADP/projections for the Red Division (`ESPN_LEAGUE_ID_RED`).
* **Hardcoded `"python"` Binary & Working Directory Fragility:** Uses `["python", ...]` without `sys.executable` or `cwd=SCRIPT_DIR` (lines 14–27), and several child scripts use relative `load_dotenv(dotenv_path="../.env.local")`. Running this pipeline from the repo root instead of `scripts/` will fail to find child scripts, `.env.local`, or the `.venv` interpreter.
* **Interactive `input()` Blocking Automation:** Falls back to `input()` if `year` is omitted (line 8), which hangs headless CI/cron jobs if arguments are missing.
* **Incomplete Player Universe Across Divisions:** `vffl_players_extractor.py` (line 26) only connects to `ESPN_LEAGUE_ID_RED` (rosters + draft + top 1,000 free agents). If a deep sleeper outside the top 1,000 free agents is drafted or rostered in `ESPN_LEAGUE_ID_BLACK` (e.g., in historical years where free agency returns an API error), `vffl_draft_extractor.py` (line 94) will fail with a foreign key violation on `vffl.players(id)`.
* **Missing Initial Stat Dictionary Sync:** Does not run `vffl_stats_extractor.py` to ensure `vffl.stats` is populated before the season starts.

---

## 2. Pre-Game & In-Game Wire/Injury Pipeline (`vffl_wire_injury_pipeline.py`)

### 1. General Intent
Refreshes the active player universe, syncs current-week player injury designations (`vffl.weekly_player_status`), and captures waiver wire / free-agent add/drop/trade activity (`vffl.transactions`).

### 2. When It Should Be Run
**Frequently throughout the week**, especially:
* Wednesday/Thursday mornings after waiver wire processing
* Leading up to game kickoffs (Thursday night, Sunday morning/afternoon, Monday night) when NFL injury designations and last-minute roster moves occur.

### 3. Dependencies
* **Database State:** Reads `(season_year, current_week)` from `vffl.leagues` if CLI args are omitted. Requires `vffl.nfl` and `vffl.teams` to be populated.
* **Sub-scripts Executed:**
  1. `vffl_injuries_extractor.py [year] [week]` -> reads `vffl.nfl`; upserts `vffl.players`; wipes & inserts `vffl.weekly_player_status` for `(year, week)`
  2. `vffl_transactions_extractor.py [year]` -> reads `vffl.nfl`, `vffl.teams`; upserts missing `vffl.players`; inserts `vffl.transactions`

### 4. Weaknesses & Gaps
* **Brittle Hardcoded Season Start Dates in Transactions:** `get_nfl_week()` in `vffl_transactions_extractor.py` (lines 10–27) hardcodes `season_start` only for `2025` and `2026` and falls back to `September 1` for all other years, which miscalculates transaction week numbers in other seasons.
* **Timezone & Idempotency Fragility on Transactions:** `vffl_transactions_extractor.py` (line 83) uses `datetime.datetime.fromtimestamp(activity.date / 1000.0)` (local machine timezone) and deduplicates via `SELECT ... WHERE date = %s` (lines 112–116). If run across machines in different timezones (e.g., local Windows vs. UTC GitHub Actions runner), duplicate transaction rows with new `group_id` UUIDs will be inserted.
* **Relative Path Mismatch:** While `vffl_wire_injury_pipeline.py` sets `cwd=SCRIPT_DIR`, if `vffl_injuries_extractor.py` is paired with other scripts that use `../.env.local`, behavior is inconsistent across direct CLI invocations.

---

## 3. Live Game-Time Scoring Pipeline (`vffl_live_scoring_pipeline.py`)

### 1. General Intent
Polls live matchup scores, active lineups, and granular player box-score stats during NFL game windows, then immediately recalculates live divisional and overall Power Rankings matrices (`vffl.division_power_rankings` and `vffl.overall_power_rankings`).

### 2. When It Should Be Run
**On a recurring schedule (e.g., every 5–15 minutes) during live NFL game windows** (Thursday Night, Sunday early/late/night slates, Monday Night, and late-season Saturday games).

### 3. Dependencies
* **Database State:** Reads `(season_year, current_week)` from `vffl.leagues` if CLI args are omitted. Requires `vffl.nfl`, `vffl.teams`, `vffl.players`, and prior week rankings (`week - 1`) in `vffl.division_power_rankings` and `vffl.overall_power_rankings`.
* **Sub-scripts Executed:**
  1. `vffl_box_scores_extractor.py [year] [week]` -> reads `vffl.nfl`, `vffl.teams`, `vffl.matchups` (prior week for playoff labels), `vffl.player_stats` (fallback); writes `vffl.matchups`, `vffl.players` (safeguard upsert), `vffl.matchup_rosters`, `vffl.matchup_player_stats`
  2. `vffl_power_rankings_extractor.py [year] [week]` -> reads `vffl.matchups`, `vffl.matchup_rosters`, `vffl.players`, prior week power rankings; writes `vffl.division_power_rankings`, `vffl.overall_power_rankings`

### 4. Weaknesses & Gaps
* **Foreign Key Risk on Undocumented `stat_id`s During Live Games:** `vffl_box_scores_extractor.py` (lines 248–251) inserts directly into `vffl.matchup_player_stats` before `vffl_stats_extractor.py` runs. If `vffl.matchup_player_stats(stat_id)` has a foreign key to `vffl.stats(stat_id)` and ESPN introduces a new stat ID mid-game, the insert will fail; even without a strict FK, `vffl_live_scoring_pipeline.py` never runs `vffl_stats_extractor.py`.
* **Violation of `agent.md` "Global Sourcing" Directive:** `agent.md` (line 23) states: *"Do not extract duplicate nested player stats directly from box scores. Rely on the global `vffl.player_stats` pool as the single source of truth..."* However, `vffl_box_scores_extractor.py` (lines 225–252) extracts nested `breakdown` stats directly from `BoxPlayer` and only uses `vffl.player_stats` as a fallback (lines 253–273)—and during live scoring, `vffl.player_stats` hasn't been populated yet for the active week because `vffl_global_stats_extractor.py` only runs in the Tuesday weekly pipeline.
* **Broken Week 1 `rank_diff` Baseline in Power Rankings:** In `vffl_power_rankings_extractor.py` (lines 58–65), comment line 58 says `# Restored week > 0 check to pull Draft Day Baseline for Week 1`, but `get_prior_ranks()` queries `vffl.division_power_rankings` / `vffl.overall_power_rankings` for `week = 0` instead of `vffl.baseline_standings`. Since no script ever populates `division_power_rankings` or `overall_power_rankings` for `week = 0`, `prior_ranks` is always empty in Week 1, forcing `wk_diff` and `std_diff` to `0` for all managers in Week 1 (lines 200–202).
* **Volatility Distortion During Early Live Slates:** Running `vffl_power_rankings_extractor.py` on Thursday night treats teams with 0 points played so far as having a `0.0` score for the current week, skewing live Z-scores, all-play records, and standard deviation (`mgr_perf_var`) until Monday night concludes.

---

## 4. Tuesday Weekly Finalization Pipeline (`vffl_weekly_pipeline.py`)

### 1. General Intent
Performs the comprehensive end-of-week data extraction and analytics calculation for a just-completed NFL week: syncs mid-season team/manager changes and player universe, records transactions, extracts the global player stats pool (rostered + 2,000 free agents) and injury statuses, finalizes matchup box scores, discovers any new ESPN stat IDs, updates remaining Strength of Schedule (`vffl.sos`), and computes official weekly and season-to-date Power Rankings.

### 2. When It Should Be Run
**Once per week on Tuesday mornings** (after Monday Night Football concludes and ESPN finalizes official stat corrections/week scoring). Must be run **chronologically** (Week 1, Week 2, ..., Week `N`) due to sequential `rank_diff` and cumulative season-to-date calculations.

### 3. Dependencies
* **Sequential/Historical State:** Requires Weeks `1 .. (W-1)` to already exist in `vffl.matchups`, `vffl.matchup_rosters`, `vffl.division_power_rankings`, and `vffl.overall_power_rankings`.
* **Sub-scripts Executed:**
  1. `vffl_managers_extractor.py [year]`
  2. `vffl_players_extractor.py [year]`
  3. `vffl_transactions_extractor.py [year]`
  4. `vffl_global_stats_extractor.py [year] [week]`
  5. `vffl_box_scores_extractor.py [year] [week]`
  6. `vffl_stats_extractor.py`
  7. `vffl_schedule_extractor.py [year] [week]`
  8. `vffl_power_rankings_extractor.py [year] [week]`

### 4. Weaknesses & Gaps
* **Foreign Key Vulnerability in `vffl_global_stats_extractor.py`:**
  * `vffl_players_extractor.py` (line 64) only fetches `free_agents(size=1000)` (for the current week, not historical `week`), whereas `vffl_global_stats_extractor.py` (line 66) fetches `free_agents(week=week, size=2000)` and does **not** upsert into `vffl.players` before inserting into `vffl.weekly_player_status` and `vffl.player_stats`. Any free agent ranked 1,001–2,000 (or a player in Black Division box scores not in Red Division) can trigger a foreign key violation on `vffl.players(id)`.
  * Additionally, `vffl_global_stats_extractor.py` (line 18) only pulls `box_scores(week)` from `ESPN_LEAGUE_ID_RED`, meaning rostered players in `ESPN_LEAGUE_ID_BLACK` who are not in the Red Division box scores or top 2,000 free agents are omitted from `vffl.player_stats`.
* **Stat Dictionary Ordering & Missing Coverage:** `vffl_stats_extractor.py` runs **after** `vffl_global_stats_extractor.py` and `vffl_box_scores_extractor.py`, and only scans `vffl.matchup_player_stats` (line 35), ignoring undocumented `stat_id`s in `vffl.player_stats`.
* **Lack of Auto-Resolution for `(year, week)`:** Unlike `vffl_rollover_pipeline.py` or `vffl_live_scoring_pipeline.py`, `vffl_weekly_pipeline.py` (lines 5–10) requires CLI arguments or blocks on interactive `input()`, and uses `"python"` instead of `sys.executable` without `cwd=SCRIPT_DIR`.

---

## 5. Weekly Rollover & League Metadata Pipeline (`vffl_rollover_pipeline.py`)

### 1. General Intent
Advances the database's active week pointer (`vffl.leagues.current_week`) when ESPN rolls over to the new NFL week, syncs any team name/logo/manager changes, updates the player pool, and recalculates the remaining Strength of Schedule (`vffl.sos`) for `completed_week = current_week - 1`.

### 2. When It Should Be Run
**Once per week on Tuesday/Wednesday morning** after ESPN increments `league.current_week` to the upcoming week and **after** `vffl_weekly_pipeline.py` has finalized the previous week's stats.

### 3. Dependencies
* **Database State:** Reads `vffl.leagues` to resolve `season_year` (if not passed via CLI), then updates `vffl.leagues.current_week` from ESPN and derives `completed_week = max(0, current_week - 1)`.
* **Sub-scripts Executed:**
  1. `vffl_leagues_extractor.py [year]` -> updates `vffl.leagues.current_week`
  2. `vffl_managers_extractor.py [year]` -> updates `vffl.managers`, `vffl.teams`
  3. `vffl_players_extractor.py [year]` -> updates `vffl.players`
  4. `vffl_schedule_extractor.py [year] [completed_week]` -> updates `vffl.matchups`, `vffl.sos`

### 4. Weaknesses & Gaps
* **Race Condition / Ordering Hazard with `vffl_weekly_pipeline.py`:** Both `vffl_live_scoring_pipeline.py` and `vffl_wire_injury_pipeline.py` rely on `vffl.leagues.current_week` to know which week is active. If `vffl_rollover_pipeline.py` runs *before* final Monday night scores are processed, `current_week` advances prematurely; conversely, `vffl_weekly_pipeline.py` and `vffl_rollover_pipeline.py` duplicate steps (`vffl_managers_extractor.py`, `vffl_players_extractor.py`, and `vffl_schedule_extractor.py`) rather than being unified into a single Tuesday rollover + finalization workflow.
* **`vffl_leagues_extractor.py` Partial Update:** When a `(league_id, season_year)` row already exists in `vffl.leagues`, `vffl_leagues_extractor.py` (lines 58–62) *only* updates `current_week` and ignores changes to league name, `team_count`, `reg_season_count`, or `scoring_type`.

---

## Summary Matrix of Cross-Pipeline Architectural Weaknesses

| Category | Affected Scripts | Issue Description |
| :--- | :--- | :--- |
| **Working Directory & Env Loading** | `vffl_week_0_pipeline.py`, `vffl_weekly_pipeline.py`, `vffl_draft_extractor.py`, `vffl_global_stats_extractor.py`, `vffl_nfl_extractor.py`, `vffl_players_extractor.py`, `vffl_power_rankings_extractor.py`, `vffl_predraft_extractor.py`, `vffl_schedule_extractor.py`, `vffl_stats_extractor.py` | Mixes `load_dotenv("../.env.local")` (relative to CWD) with `os.path.join(SCRIPT_DIR, "..", ".env.local")`, and mixes `"python"` with `sys.executable`. Fails if invoked outside `scripts/`. |
| **Red vs. Black Division Blind Spot** | `vffl_players_extractor.py`, `vffl_global_stats_extractor.py`, `vffl_predraft_extractor.py` | Connects only to `ESPN_LEAGUE_ID_RED` to build the "global" player/stat pool. Rostered/drafted players unique to `ESPN_LEAGUE_ID_BLACK` outside the free-agent fetch limit are missed. |
| **Row-by-Row SQL Execution (N+1 Latency)** | `vffl_global_stats_extractor.py`, `vffl_injuries_extractor.py`, `vffl_players_extractor.py`, `vffl_box_scores_extractor.py` | Executes thousands of individual `cursor.execute("INSERT ...")` round-trips over the network to Neon PostgreSQL instead of batching with `psycopg2.extras.execute_values` or `executemany`. |
| **Historical Season Backfill Failure** | `vffl_schedule_extractor.py` | Uses live `opponent.wins`, `opponent.losses`, and `opponent.points_for` from the ESPN `Team` object (lines 124–131) rather than computing standings as of `completed_week` from `vffl.matchups`. Re-running for a past week uses end-of-season records. |
| **Week 1 Power Rank Diff Bug** | `vffl_power_rankings_extractor.py` | Queries `vffl.division_power_rankings` at `week = 0` instead of `vffl.baseline_standings`, causing Week 1 `wk_rank_diff` and `std_rank_diff` to always equal `0`. |

