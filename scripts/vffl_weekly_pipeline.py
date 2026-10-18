import sys
import subprocess

# 1. Capture the Target Year and Completed Week
if len(sys.argv) > 2:
    year = sys.argv[1]
    week = sys.argv[2]
else:
    year = input("Enter season year (e.g., 2026): ").strip()
    week = input("Enter completed week (e.g., 1): ").strip()

# 2. Define the Execution Sequence
pipeline_scripts = [
    # Phase 1: Identity Sync & Transactions
    # Runs the manager and player sync first to catch any mid-season team or roster universe changes.
    ["python", "vffl_managers_extractor.py", year],
    ["python", "vffl_players_extractor.py", year],
    ["python", "vffl_transactions_extractor.py", year],
    
    # Phase 2: Raw Data & Global Stats
    ["python", "vffl_global_stats_extractor.py", year, week],
    ["python", "vffl_box_scores_extractor.py", year, week],
    
    # Phase 3: Stat Mapping & Future Predictions
    # The stats scanner runs after box scores to capture any newly generated stat_IDs
    ["python", "vffl_stats_extractor.py"],
    ["python", "vffl_schedule_extractor.py", year, week],
    
    # Phase 4: Matrix Calculations & Awards
    ["python", "vffl_power_rankings_extractor.py", year, week],
    ["python", "vffl_awards_extractor.py", year, week]
]

print(f"--- Starting VFSN Tuesday Pipeline for {year} Week {week} ---")

# 3. Execute the Pipeline
for command in pipeline_scripts:
    script_name = command[1]
    print(f"\n>> Executing {script_name}...")
    
    try:
        subprocess.run(command, check=True)
        print(f"SUCCESS: {script_name} completed.")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {script_name} failed with exit code {e.returncode}.")
        print("Halting the pipeline to prevent cascading database calculation errors.")
        sys.exit(1)

print(f"\n--- Week {week} Pipeline for {year} Completed Successfully ---")