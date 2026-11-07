import os
import sys
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def main():
    """
    Delegates to vffl_weekly_pipeline.py (Tier 3 Weekly Cutover Pipeline),
    which unifies league rollover (vffl.leagues, vffl.managers, vffl.teams,
    vffl.players, vffl.sos) with completed-week finalization (vffl.player_stats,
    vffl.matchups, vffl.division_power_rankings, vffl.overall_power_rankings).
    """
    command = [sys.executable, "vffl_weekly_pipeline.py"] + sys.argv[1:]
    try:
        subprocess.run(command, cwd=SCRIPT_DIR, check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
