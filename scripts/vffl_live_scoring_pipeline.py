import os
import sys
import subprocess
import psycopg2
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))


def resolve_target_year_week():
    if len(sys.argv) > 2:
        try:
            return str(int(sys.argv[1])), str(int(sys.argv[2]))
        except ValueError:
            print("Error: CLI arguments [year] [week] must be valid integers.")
            sys.exit(1)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL not found in .env.local.")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    if len(sys.argv) == 2:
        try:
            target_year = int(sys.argv[1])
        except ValueError:
            print("Error: CLI argument [year] must be a valid integer.")
            sys.exit(1)
        cursor.execute("""
            SELECT season_year, current_week
            FROM vffl.leagues
            WHERE season_year = %s
            ORDER BY current_week DESC
            LIMIT 1;
        """, (target_year,))
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

    if not row:
        print("Error: Could not resolve (season_year, current_week) from vffl.leagues.")
        sys.exit(1)

    return str(row[0]), str(row[1])


def main():
    year, week = resolve_target_year_week()

    pipeline_scripts = [
        [sys.executable, "vffl_box_scores_extractor.py", year, week],
        [sys.executable, "vffl_power_rankings_extractor.py", year, week],
    ]

    print(f"--- Starting VFSN Live Game-Time Scoring Pipeline for {year} Week {week} ---")

    for command in pipeline_scripts:
        script_name = command[1]
        print(f"\n>> Executing {script_name} ({year} Week {week})...")
        try:
            subprocess.run(command, cwd=SCRIPT_DIR, check=True)
            print(f"SUCCESS: {script_name} completed.")
        except subprocess.CalledProcessError as e:
            print(f"ERROR: {script_name} failed with exit code {e.returncode}.")
            print("Halting live scoring pipeline to prevent cascading database calculation errors.")
            sys.exit(1)

    print(f"\n--- Live Game-Time Scoring Pipeline for {year} Week {week} Completed Successfully ---")


if __name__ == "__main__":
    main()
