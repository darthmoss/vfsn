import os
import sys
import datetime
import subprocess
import psycopg2
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))


def resolve_target_year():
    if len(sys.argv) > 1:
        try:
            return str(int(sys.argv[1]))
        except ValueError:
            print("Error: CLI argument [year] must be a valid integer.")
            sys.exit(1)

    db_url = os.getenv("DATABASE_URL")
    if db_url:
        try:
            conn = psycopg2.connect(db_url)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT season_year
                FROM vffl.leagues
                ORDER BY season_year DESC, current_week DESC
                LIMIT 1;
            """)
            row = cursor.fetchone()
            cursor.close()
            conn.close()
            if row:
                return str(row[0])
        except Exception as e:
            print(f"Note: Could not query vffl.leagues for fallback year ({e}).")

    return str(datetime.datetime.now().year)


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
        print("Halting Tier 0 Week 0 pipeline to prevent cascading database errors.")
        sys.exit(1)


def main():
    year = resolve_target_year()

    # Execution sequence strictly respects foreign key dependencies
    pipeline_scripts = [
        # Phase 1: Foundational League & Franchise Mappings
        [sys.executable, "vffl_leagues_extractor.py", year],
        [sys.executable, "vffl_managers_extractor.py", year],

        # Phase 2: Professional NFL & Player Universe
        [sys.executable, "vffl_nfl_extractor.py"],
        [sys.executable, "vffl_players_extractor.py", year],

        # Phase 3: Pre-Draft Projections, Draft Board & Baseline Standings
        [sys.executable, "vffl_predraft_extractor.py", year],
        [sys.executable, "vffl_draft_extractor.py", year],

        # Phase 4: Stat Dictionary Sync & Week 0 Schedule/SOS Matrix
        [sys.executable, "vffl_stats_extractor.py"],
        [sys.executable, "vffl_schedule_extractor.py", year, "0"],

        # Phase 5: Initialize Week 1 Matchup Lineups & Projected Scores
        [sys.executable, "vffl_box_scores_extractor.py", year, "1"],
    ]

    print(f"--- Starting VFSN Tier 0 (Week 0 Season Initialization) Pipeline for {year} ---")

    for command in pipeline_scripts:
        run_step(command)

    print(f"\n--- Tier 0 (Week 0) Pipeline for {year} Completed Successfully ---")


if __name__ == "__main__":
    main()
