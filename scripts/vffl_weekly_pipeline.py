import os
import sys
import datetime
import subprocess
import psycopg2
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))


def query_latest_league_state(target_year=None):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env.local.")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    if target_year is not None:
        cursor.execute("""
            SELECT season_year, current_week
            FROM vffl.leagues
            WHERE season_year = %s
            ORDER BY current_week DESC
            LIMIT 1;
        """, (int(target_year),))
    else:
        cursor.execute("""
            SELECT season_year, current_week
            FROM vffl.leagues
            ORDER BY season_year DESC, current_week DESC
            LIMIT 1;
        """)

    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row


def run_step(command):
    script_name = command[1]
    args_str = " ".join(command[2:])
    label = f"{script_name} {args_str}".strip()
    print(f"\n>> Executing {label}...")
    try:
        subprocess.run(command, cwd=SCRIPT_DIR, check=True)
        print(f"SUCCESS: {script_name} completed.")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {script_name} failed with exit code {e.returncode}.")
        print("Halting Tier 3 weekly cutover pipeline to prevent cascading database calculation errors.")
        sys.exit(1)


def main():
    cli_year = None
    cli_week = None

    if len(sys.argv) > 1:
        try:
            cli_year = str(int(sys.argv[1]))
        except ValueError:
            print("Error: CLI argument [year] must be a valid integer.")
            sys.exit(1)

    if len(sys.argv) > 2:
        try:
            cli_week = str(int(sys.argv[2]))
        except ValueError:
            print("Error: CLI argument [completed_week] must be a valid integer.")
            sys.exit(1)

    # 1. Resolve target season year
    if cli_year is not None:
        year = cli_year
    else:
        row = query_latest_league_state()
        year = str(row[0]) if row else str(datetime.datetime.now().year)

    print(f"--- Starting VFSN Tier 3 (Tuesday 5:00 AM Weekly Cutover) Pipeline for {year} ---")

    # 2. Phase 1: Sync League Settings first so vffl.leagues.current_week reflects ESPN's Tuesday cutover
    run_step([sys.executable, "vffl_leagues_extractor.py", year])

    # 3. Resolve completed_week and active current_week from vffl.leagues
    row = query_latest_league_state(target_year=year)
    if not row:
        print(f"Error: Could not resolve current_week for {year} from vffl.leagues.")
        sys.exit(1)

    current_week = int(row[1])

    if cli_week is not None:
        completed_week = cli_week
        print(f"Using explicit CLI completed_week={completed_week} (ESPN current_week={current_week}).")
    else:
        completed_week = str(max(1, current_week - 1))
        print(f"Resolved ESPN current_week={current_week} -> completed_week={completed_week} for finalization.")

    # 4. Execute Tier 3 Cutover Sequence
    pipeline_scripts = [
        # Phase 2: Identity & Player Universe Sync
        # (Updates vffl.managers, vffl.teams, and vffl.players prior to stat/ranking inserts)
        [sys.executable, "vffl_managers_extractor.py", year],
        [sys.executable, "vffl_players_extractor.py", year],

        # Phase 3: Finalize Completed Week Global Stats & Box Scores
        # (Captures final MNF stats, overnight stat corrections, and global free-agent pool)
        [sys.executable, "vffl_global_stats_extractor.py", year, completed_week],
        [sys.executable, "vffl_box_scores_extractor.py", year, completed_week],

        # Phase 4: Stat Dictionary Sync
        # (Registers any newly generated ESPN stat_ids in vffl.stats)
        [sys.executable, "vffl_stats_extractor.py"],

        # Phase 5: Remaining Strength of Schedule & Power Rankings Matrices
        # (Updates vffl.sos, vffl.division_power_rankings, and vffl.overall_power_rankings)
        [sys.executable, "vffl_schedule_extractor.py", year, completed_week],
        [sys.executable, "vffl_power_rankings_extractor.py", year, completed_week],
    ]

    # Phase 6: Initialize Upcoming Week Matchups, Playoff Brackets & Projected Lineups
    # When cutting over to a new active week, pre-populate the new current_week box scores
    # so upcoming matchups, projections, and playoff brackets are live immediately on Tuesday morning.
    if cli_week is None and current_week > int(completed_week):
        pipeline_scripts.append(
            [sys.executable, "vffl_box_scores_extractor.py", year, str(current_week)]
        )

    for command in pipeline_scripts:
        run_step(command)

    print(
        f"\n--- Tier 3 Weekly Cutover Pipeline for {year} "
        f"(Finalized Week {completed_week}, Active Week {current_week}) Completed Successfully ---"
    )


if __name__ == "__main__":
    main()
