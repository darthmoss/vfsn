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

    # Tier 2: Nightly at 1:00 AM
    # Populates vffl.weekly_player_status and vffl.transactions (with vffl.players FK safeguards)
    pipeline_scripts = [
        [sys.executable, "vffl_injuries_extractor.py", year, week],
        [sys.executable, "vffl_transactions_extractor.py", year],
    ]

    print(f"--- Starting VFSN Tier 2 (Nightly Wire & Injury) Pipeline for {year} Week {week} ---")

    for command in pipeline_scripts:
        script_name = command[1]
        args_str = " ".join(command[2:])
        print(f"\n>> Executing {script_name} {args_str}...")
        try:
            subprocess.run(command, cwd=SCRIPT_DIR, check=True)
            print(f"SUCCESS: {script_name} completed.")
        except subprocess.CalledProcessError as e:
            print(f"ERROR: {script_name} failed with exit code {e.returncode}.")
            print("Halting Tier 2 wire/injury pipeline to prevent cascading database errors.")
            sys.exit(1)

    print(f"\n--- Tier 2 (Nightly Wire & Injury) Pipeline for {year} Week {week} Completed Successfully ---")


if __name__ == "__main__":
    main()
