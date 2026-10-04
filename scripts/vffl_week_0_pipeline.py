import sys
import subprocess

# 1. Capture the Target Year
if len(sys.argv) > 1:
    year = sys.argv[1]
else:
    year = input("Enter season year for Week 0 initialization (e.g., 2026): ").strip()

# 2. Define the Execution Sequence
# The order strictly respects your database's foreign key dependencies.
pipeline_scripts = [
    # Phase 1: Foundational Mappings & Identities
    ["python", "vffl_leagues_extractor.py", year],
    ["python", "vffl_managers_extractor.py", year],
    
    # Phase 2: Professional Universe
    ["python", "vffl_nfl_extractor.py"], 
    ["python", "vffl_players_extractor.py", year],
    
    # Phase 3: The Draft Board
    # (Requires players, nfl, and managers to be fully updated first)
    ["python", "vffl_draft_extractor.py", year],
    
    # Phase 4: Week 0 Baseline Generation
    # (Passing '0' as the week parameter to set the starting matrix)
    ["python", "vffl_schedule_extractor.py", year, "0"]
]

print(f"--- Starting VFSN Week 0 Pipeline for {year} ---")

# 3. Execute the Pipeline
for command in pipeline_scripts:
    script_name = command[1]
    print(f"\n>> Executing {script_name}...")
    
    try:
        # check=True ensures that if a script crashes, it raises an exception
        subprocess.run(command, check=True)
        print(f"SUCCESS: {script_name} completed.")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: {script_name} failed with exit code {e.returncode}.")
        print("Halting the pipeline to prevent cascading database errors.")
        sys.exit(1)

print(f"\n--- Week 0 Pipeline for {year} Completed Successfully ---")