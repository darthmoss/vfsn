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
    print(f"\n>> Executing {script_name} {' '.join(command[2:])}...")
    try:
        subprocess.run(command, cwd=SCRIPT_DIR, check=True)
        print(f"SUCCESS: {script_name} completed.")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {script_name} failed with exit code {e.returncode}.")
        print("Halting rollover pipeline to prevent cascading database errors.")
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
            print("Error: CLI argument [week] must be a valid integer.")
            sys.exit(1)

    # Resolve target year before step 1 if not provided via CLI
    if cli_year is not None:
        year = cli_year
    else:
        row = query_latest_league_state()
        year = str(row[0]) if row else str(datetime.datetime.now().year)

    print(f"--- Starting VFSN Weekly Rollover & League Metadata Pipeline for {year} ---")

    # 1. Sync league settings first so vffl.leagues.current_week is updated from ESPN
    run_step([sys.executable, "vffl_leagues_extractor.py", year])

    # 2. Resolve completed_week from newly updated vffl.leagues.current_week if not explicitly passed
    if cli_week is not None:
        completed_week = cli_week
    else:
        row = query_latest_league_state(target_year=year)
        if not row:
            print(f"Error: Could not resolve current_week for {year} from vffl.leagues.")
            sys.exit(1)
        current_week = int(row[1])
        completed_week = str(max(0, current_week - 1))
        print(f"Resolved ESPN current_week={current_week} -> completed_week={completed_week} for SOS & schedule sync.")

    # 3. Sync manager & team metadata, full player universe, and schedule/SOS
    remaining_steps = [
        [sys.executable, "vffl_managers_extractor.py", year],
        [sys.executable, "vffl_players_extractor.py", year],
        [sys.executable, "vffl_schedule_extractor.py", year, completed_week],
    ]

    for command in remaining_steps:
        run_step(command)

    print(f"\n--- Weekly Rollover Pipeline for {year} (Completed Week {completed_week}) Completed Successfully ---")


if __name__ == "__main__":
    main()
