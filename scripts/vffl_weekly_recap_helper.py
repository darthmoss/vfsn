import os
import sys
import json
import time
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(SCRIPT_DIR, "..", ".env.local"))

BENCH_SLOTS = {"BE", "IR", "Bench", "20", "21"}
STARTER_SLOT_ORDER = {
    "QB": 1,
    "RB": 2,
    "WR": 3,
    "TE": 4,
    "RB/WR/TE": 5,
    "FLEX": 5,
    "D/ST": 6,
    "K": 7,
}


def fmt_num(val, decimals=2):
    if val is None:
        return 0.0
    rounded = round(float(val), decimals)
    if decimals == 0 or rounded == int(rounded):
        return int(rounded) if decimals == 0 else round(float(val), decimals)
    return rounded


def fmt_fpts_str(val):
    """Format FPTS cleanly for 'Player Name (FPTS)' citations (e.g., 24.5, 18.25, 10, 0)."""
    if val is None:
        return "0"
    v = round(float(val), 2)
    if v == int(v):
        return f"{int(v)}"
    if round(v * 10) == v * 10:
        return f"{v:.1f}"
    return f"{v:.2f}"


def format_stat_line(row):
    pos = row.get("position") or ""
    if pos == "QB":
        return (
            f"CMP/ATT: {row.get('pass_pct', '0 / 0')}, "
            f"PY: {fmt_num(row.get('pass_yds'), 0)}, "
            f"PTD: {fmt_num(row.get('pass_tds'), 0)}, "
            f"RY: {fmt_num(row.get('rush_yds'), 0)}, "
            f"RTD: {fmt_num(row.get('rush_tds'), 0)}"
        )
    elif pos == "RB":
        return (
            f"RY: {fmt_num(row.get('rush_yds'), 0)}, "
            f"RTD: {fmt_num(row.get('rush_tds'), 0)}, "
            f"REC/TAR: {row.get('rec_pct', '0 / 0')}, "
            f"RECY: {fmt_num(row.get('rec_yds'), 0)}, "
            f"RECTD: {fmt_num(row.get('rec_tds'), 0)}"
        )
    elif pos in ("WR", "TE"):
        return (
            f"REC/TAR: {row.get('rec_pct', '0 / 0')}, "
            f"RECY: {fmt_num(row.get('rec_yds'), 0)}, "
            f"RECTD: {fmt_num(row.get('rec_tds'), 0)}, "
            f"RY: {fmt_num(row.get('rush_yds'), 0)}, "
            f"RTD: {fmt_num(row.get('rush_tds'), 0)}"
        )
    elif pos == "D/ST":
        return (
            f"PA: {fmt_num(row.get('pa'), 0)}, "
            f"YA: {fmt_num(row.get('ya'), 0)}, "
            f"DS: {fmt_num(row.get('sacks'), 0)}, "
            f"DIN: {fmt_num(row.get('ints'), 0)}"
        )
    elif pos == "K":
        return (
            f"FGM/FGA: {row.get('fg', '0 / 0')}, "
            f"FGY: {fmt_num(row.get('fg_yd'), 0)}, "
            f"PAT: {fmt_num(row.get('pat'), 0)}"
        )
    return ""


def find_bench_blunders(starters, bench_players):
    """Identify bench players (excluding IR) who outscored eligible starters."""
    blunders = []
    active_bench = [b for b in bench_players if b["slot"] not in ("IR", "21")]
    for b in active_bench:
        b_pos = b["position"]
        b_pts = b["actualFpts"]
        eligible_starters = []
        for s in starters:
            s_slot = s["slot"]
            s_pos = s["position"]
            if s_pos == b_pos or (
                b_pos in ("RB", "WR", "TE") and s_slot in ("RB/WR/TE", "FLEX", "23")
            ):
                if b_pts > s["actualFpts"]:
                    eligible_starters.append(
                        {
                            "starterName": s["playerName"],
                            "starterSlot": s_slot,
                            "starterFpts": s["actualFpts"],
                            "pointsLost": round(b_pts - s["actualFpts"], 2),
                        }
                    )
        if eligible_starters:
            eligible_starters.sort(key=lambda x: x["pointsLost"], reverse=True)
            blunders.append(
                {
                    "benchPlayer": b["playerName"],
                    "position": b_pos,
                    "benchFpts": b_pts,
                    "statLine": b["statLine"],
                    "couldHaveReplaced": eligible_starters[0],
                }
            )
    blunders.sort(key=lambda x: x["couldHaveReplaced"]["pointsLost"], reverse=True)
    return blunders


def ensure_table_exists(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS vffl.weekly_recaps (
                id SERIAL PRIMARY KEY,
                season_year INTEGER NOT NULL,
                week INTEGER NOT NULL,
                recap_json JSONB NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                UNIQUE (season_year, week)
            );
            """
        )
    conn.commit()


def extract_context(year, week, output_path):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL is not set in .env.local")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    ensure_table_exists(conn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # 1. Fetch Power Rankings (includes wk_act_fpts, wk_opt_fpts, wk_eff_pct, std metrics)
    cur.execute(
        """
        SELECT *
        FROM vffl.vw_div_power_rankings
        WHERE season_year = %s AND week = %s
        ORDER BY league_name, std_power_rank ASC;
        """,
        (year, week),
    )
    power_rows = cur.fetchall()
    power_by_mgr = {
        (r["league_name"], r["manager_id"]): r for r in power_rows
    }

    # 2. Fetch Standings + Preseason Baseline Rank
    cur.execute(
        """
        SELECT
            s.*,
            bs.standing AS preseason_proj_rank
        FROM vffl.vw_standings s
        LEFT JOIN vffl.baseline_standings bs
            ON s.season_year = bs.season_year
            AND s.league_id = bs.league_id
            AND s.manager_id = bs.manager_id
        WHERE s.season_year = %s AND s.week = %s
        ORDER BY s.league_name, s.standing ASC;
        """,
        (year, week),
    )
    standings_rows = cur.fetchall()

    # 3. Fetch Weekly Props
    cur.execute(
        """
        SELECT *
        FROM vffl.vw_weekly_props
        WHERE season_year = %s AND week = %s;
        """,
        (year, week),
    )
    props_rows = cur.fetchall()

    # 4. Fetch Matchups joined with raw matchups for manager_ids and league_id
    cur.execute(
        """
        SELECT
            vm.*,
            m.league_id,
            m.home_manager_id,
            m.away_manager_id
        FROM vffl.vw_matchups vm
        JOIN vffl.matchups m ON vm.matchup_id = m.id
        WHERE vm.season_year = %s AND vm.week = %s
        ORDER BY vm.league_name, COALESCE(vm.matchup_rank, 99) ASC, vm.matchup_id ASC;
        """,
        (year, week),
    )
    matchups_rows = cur.fetchall()

    # 5. Fetch Matchup Rosters for this week's matchups
    matchup_ids = [m["matchup_id"] for m in matchups_rows]
    roster_by_matchup_mgr = {}
    if matchup_ids:
        cur.execute(
            """
            SELECT *
            FROM vffl.vw_matchup_rosters
            WHERE matchup_id = ANY(%s);
            """,
            (matchup_ids,),
        )
        for r in cur.fetchall():
            key = (r["matchup_id"], r["manager_id"])
            roster_by_matchup_mgr.setdefault(key, []).append(r)

    def build_team_matchup_detail(matchup_id, league_name, mgr_id, mgr_name, team_name, score, proj, standing):
        raw_roster = roster_by_matchup_mgr.get((matchup_id, mgr_id), [])
        starters = []
        bench = []
        for p in raw_roster:
            act_pts = round(float(p.get("actual_fpts") or 0.0), 2)
            proj_pts = round(float(p.get("proj_fpts") or 0.0), 2)
            player_obj = {
                "slot": p.get("slot"),
                "playerName": p.get("player_name"),
                "nflTeam": p.get("nfl_team"),
                "position": p.get("position"),
                "actualFpts": act_pts,
                "projFpts": proj_pts,
                "diffVsProj": round(float(p.get("diff", act_pts - proj_pts) or 0.0), 2),
                "depth": p.get("depth"),
                "requiredCitation": f"{p.get('player_name')} ({fmt_fpts_str(act_pts)})",
                "statLine": format_stat_line(p),
            }
            if p.get("slot") in BENCH_SLOTS:
                bench.append(player_obj)
            else:
                starters.append(player_obj)

        starters.sort(
            key=lambda x: (STARTER_SLOT_ORDER.get(x["slot"], 99), -x["actualFpts"])
        )
        bench.sort(key=lambda x: -x["actualFpts"])

        pr = power_by_mgr.get((league_name, mgr_id), {})
        opt_fpts = round(float(pr.get("wk_opt_fpts") or score or 0.0), 2)
        eff_pct = round(float(pr.get("wk_eff_pct") or 0.0) * 100.0, 1)

        return {
            "managerId": mgr_id,
            "managerName": mgr_name,
            "teamName": team_name,
            "enteringStanding": standing,
            "actualScore": round(float(score or 0.0), 2),
            "projectedScore": round(float(proj or 0.0), 2),
            "scoreVsProjDiff": round(float(score or 0.0) - float(proj or 0.0), 2),
            "optimalScore": opt_fpts,
            "pointsLeftOnBench": round(max(0.0, opt_fpts - float(score or 0.0)), 2),
            "managerialEfficiencyPct": eff_pct,
            "starters": starters,
            "benchAndIr": bench,
            "benchBlunders": find_bench_blunders(starters, bench),
        }

    # Resolve exact league_name strings from retrieved rows (e.g., "Victra - Red Division" vs "Victra - Red")
    all_league_names = set()
    for rows in (matchups_rows, standings_rows, power_rows, props_rows):
        for r in rows:
            if r.get("league_name"):
                all_league_names.add(r["league_name"])

    red_league_name = next((ln for ln in all_league_names if "red" in ln.lower()), "Victra - Red Division")
    black_league_name = next((ln for ln in all_league_names if "black" in ln.lower()), "Victra - Black Division")

    divisions = {}
    for div_key, league_name in [("redDivision", red_league_name), ("blackDivision", black_league_name)]:
        div_matchups = []
        for m in [r for r in matchups_rows if r["league_name"] == league_name]:
            home_score = float(m["home_score"] or 0.0)
            away_score = float(m["away_score"] or 0.0)
            home_detail = build_team_matchup_detail(
                m["matchup_id"],
                league_name,
                m["home_manager_id"],
                m["home_mgr"],
                m["home_team"],
                m["home_score"],
                m["home_projected"],
                m["home_standing"],
            )
            away_detail = build_team_matchup_detail(
                m["matchup_id"],
                league_name,
                m["away_manager_id"],
                m["away_mgr"],
                m["away_team"],
                m["away_score"],
                m["away_projected"],
                m["away_standing"],
            )
            if home_score >= away_score:
                winner, loser = home_detail, away_detail
            else:
                winner, loser = away_detail, home_detail

            margin = round(abs(home_score - away_score), 2)
            could_loser_have_won_with_optimal = loser["optimalScore"] > winner["actualScore"]

            div_matchups.append(
                {
                    "matchupId": m.get("matchup_id"),
                    "matchupRank": m.get("matchup_rank"),
                    "matchupTitle": m.get("matchup_title"),
                    "matchupType": m.get("matchup_type"),
                    "marginOfVictory": margin,
                    "couldLoserHaveWonWithOptimalLineup": could_loser_have_won_with_optimal,
                    "winner": winner,
                    "loser": loser,
                }
            )

        div_props = [
            {
                "award": p.get("award"),
                "definition": p.get("definition"),
                "teamName": p.get("team_name"),
                "managerName": p.get("manager_name"),
                "playerName": p.get("player_name"),
                "value": round(float(p["value"]), 2) if p.get("value") is not None else None,
                "supplemental": p.get("supplemental"),
            }
            for p in props_rows
            if p.get("league_name") == league_name
        ]

        div_standings = [
            {
                "standing": s.get("standing"),
                "standingDiffFromPriorWeek": s.get("standing_diff"),
                "preseasonDraftProjRank": s.get("preseason_proj_rank"),
                "vsPreseasonProjDiff": (
                    (s["preseason_proj_rank"] - s["standing"])
                    if s.get("preseason_proj_rank") is not None and s.get("standing") is not None
                    else None
                ),
                "teamName": s.get("team_name"),
                "managerName": s.get("manager_name"),
                "record": f"{s.get('wins', 0)}-{s.get('losses', 0)}-{s.get('ties', 0)}",
                "winPct": round(float(s.get("win_pct") or 0.0), 3),
                "pointsFor": round(float(s.get("points_for") or 0.0), 2),
                "pointsAgainst": round(float(s.get("points_against") or 0.0), 2),
                "diff": round(float(s.get("diff") or 0.0), 2),
                "avgDiff": round(float(s.get("avg_diff") or 0.0), 2),
            }
            for s in standings_rows
            if s.get("league_name") == league_name
        ]

        div_power = [
            {
                "stdPowerRank": p.get("std_power_rank"),
                "stdRankDiffFromPriorWeek": p.get("std_rank_diff"),
                "teamName": p.get("team_name"),
                "managerName": p.get("manager_name"),
                "h2hStanding": p.get("standing"),
                "stdPowerScore": round(float(p.get("std_power_score") or 0.0), 2),
                "stdAllPlayRecord": f"{p.get('std_ap_wins', 0)}-{p.get('std_ap_losses', 0)}-{p.get('std_ap_ties', 0)}",
                "stdAllPlayWinPct": round(float(p.get("std_ap_win_pct") or 0.0) * 100.0, 1),
                "stdActualFpts": round(float(p.get("std_act_fpts") or 0.0), 2),
                "stdOptimalFpts": round(float(p.get("std_opt_fpts") or 0.0), 2),
                "stdEfficiencyPct": round(float(p.get("std_eff_pct") or 0.0) * 100.0, 1),
                "stdPerfVolatility": round(float(p.get("std_perf_var") or 0.0), 2),
                "wkPowerRank": p.get("wk_power_rank"),
                "wkPowerScore": round(float(p.get("wk_power_score") or 0.0), 2),
                "wkAllPlayRecord": f"{p.get('wk_ap_wins', 0)}-{p.get('wk_ap_losses', 0)}-{p.get('wk_ap_ties', 0)}",
                "wkEfficiencyPct": round(float(p.get("wk_eff_pct") or 0.0) * 100.0, 1),
            }
            for p in power_rows
            if p.get("league_name") == league_name
        ]

        divisions[div_key] = {
            "leagueName": league_name,
            "matchups": div_matchups,
            "weeklyProps": div_props,
            "standings": div_standings,
            "powerRankings": div_power,
        }

    payload = {
        "seasonYear": year,
        "week": week,
        "redDivision": divisions["redDivision"],
        "blackDivision": divisions["blackDivision"],
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    cur.close()
    conn.close()
    print(f"Extracted Week {week} ({year}) recap context to {output_path}")


def get_starters_by_matchup_team(cur, year, week):
    cur.execute(
        """
        SELECT
            mr.matchup_id,
            mr.slot,
            mr.player_name,
            mr.actual_fpts,
            t.team_name
        FROM vffl.vw_matchup_rosters mr
        JOIN vffl.matchups m ON mr.matchup_id = m.id
        JOIN vffl.teams t
            ON mr.manager_id = t.manager_id
            AND m.league_id = t.league_id
            AND m.season_year = t.season_year
        WHERE m.season_year = %s AND m.week = %s;
        """,
        (year, week),
    )
    starters_by_matchup_team = {}
    for r in cur.fetchall():
        if r["slot"] not in BENCH_SLOTS:
            act_pts = round(float(r.get("actual_fpts") or 0.0), 2)
            starters_by_matchup_team.setdefault(
                (r["matchup_id"], r["team_name"]), []
            ).append(
                {
                    "playerName": r["player_name"],
                    "requiredCitation": f"{r['player_name']} ({fmt_fpts_str(act_pts)})",
                }
            )
    return starters_by_matchup_team


def collect_validation_errors(year, week, data, starters_by_matchup_team):
    structural_errors = []
    missing_starters = []

    required_top_keys = ["seasonYear", "week", "intro", "redDivision", "blackDivision", "outro"]
    for k in required_top_keys:
        if k not in data or data[k] is None or data[k] == "":
            structural_errors.append(f"Missing or empty top-level key '{k}'")

    if structural_errors:
        return structural_errors, missing_starters

    if int(data["seasonYear"]) != year or int(data["week"]) != week:
        structural_errors.append(
            f"JSON seasonYear/week ({data['seasonYear']}/{data['week']}) does not match target ({year}/{week})."
        )

    for div_key in ("redDivision", "blackDivision"):
        div = data.get(div_key) or {}
        for req_div_k in (
            "leagueName",
            "matchups",
            "weeklyPropsCommentary",
            "standingsCommentary",
            "powerRankingsCommentary",
        ):
            if req_div_k not in div or not div[req_div_k]:
                structural_errors.append(f"Missing or empty '{div_key}.{req_div_k}'")
        for m in div.get("matchups") or []:
            for req_m_k in (
                "matchupId",
                "winningTeam",
                "winningScore",
                "losingTeam",
                "losingScore",
                "introParagraph",
                "winnerParagraph",
                "loserParagraph",
            ):
                if req_m_k not in m or m[req_m_k] is None or m[req_m_k] == "":
                    structural_errors.append(
                        f"Missing or empty '{req_m_k}' in {div_key} matchup {m.get('matchupId')}"
                    )

    if structural_errors:
        return structural_errors, missing_starters

    for div_key in ("redDivision", "blackDivision"):
        for m in data[div_key]["matchups"]:
            mid = int(m["matchupId"])
            w_team = m["winningTeam"]
            l_team = m["losingTeam"]
            w_text = m["winnerParagraph"]
            l_text = m["loserParagraph"]

            for s_info in starters_by_matchup_team.get((mid, w_team), []):
                if s_info["playerName"] not in w_text:
                    missing_starters.append(
                        f"{div_key} Matchup {mid} Winner ({w_team}) winnerParagraph is missing starter '{s_info['requiredCitation']}'"
                    )
            for s_info in starters_by_matchup_team.get((mid, l_team), []):
                if s_info["playerName"] not in l_text:
                    missing_starters.append(
                        f"{div_key} Matchup {mid} Loser ({l_team}) loserParagraph is missing starter '{s_info['requiredCitation']}'"
                    )

    return structural_errors, missing_starters


def upsert_recap_data(conn, cur, year, week, data):
    cur.execute(
        """
        INSERT INTO vffl.weekly_recaps (season_year, week, recap_json, updated_at)
        VALUES (%s, %s, %s::jsonb, NOW())
        ON CONFLICT (season_year, week)
        DO UPDATE SET
            recap_json = EXCLUDED.recap_json,
            updated_at = NOW()
        RETURNING id;
        """,
        (year, week, json.dumps(data, ensure_ascii=False)),
    )
    recap_id = cur.fetchone()["id"]
    conn.commit()
    print(f"Successfully validated and upserted Week {week} ({year}) H2H Recap into vffl.weekly_recaps (id={recap_id})!")
    return recap_id


def validate_and_load_recap(year, week, json_path):
    if not os.path.exists(json_path):
        print(f"Error: JSON file not found at {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL is not set in .env.local")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    ensure_table_exists(conn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    starters_by_matchup_team = get_starters_by_matchup_team(cur, year, week)
    structural_errors, missing_starters = collect_validation_errors(
        year, week, data, starters_by_matchup_team
    )

    if structural_errors:
        for err in structural_errors:
            print(f"Validation Error: {err}")
        cur.close()
        conn.close()
        sys.exit(1)

    if missing_starters:
        print("Validation Warning - Some starting players were not found in their paragraph:")
        for msg in missing_starters:
            print(f"  - {msg}")
        print("Error: All starting players MUST be mentioned in winnerParagraph / loserParagraph. Aborting load.")
        cur.close()
        conn.close()
        sys.exit(1)

    upsert_recap_data(conn, cur, year, week, data)
    cur.close()
    conn.close()


MATCHUP_ITEM_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "matchupId": {"type": "INTEGER"},
        "matchupRank": {"type": "INTEGER", "nullable": True},
        "matchupTitle": {"type": "STRING", "nullable": True},
        "winningTeam": {"type": "STRING"},
        "winningManager": {"type": "STRING"},
        "winningScore": {"type": "NUMBER"},
        "losingTeam": {"type": "STRING"},
        "losingManager": {"type": "STRING"},
        "losingScore": {"type": "NUMBER"},
        "margin": {"type": "NUMBER"},
        "introParagraph": {"type": "STRING"},
        "winnerParagraph": {"type": "STRING"},
        "loserParagraph": {"type": "STRING"},
    },
    "required": [
        "matchupId",
        "winningTeam",
        "winningManager",
        "winningScore",
        "losingTeam",
        "losingManager",
        "losingScore",
        "margin",
        "introParagraph",
        "winnerParagraph",
        "loserParagraph",
    ],
}

DIVISION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "leagueName": {"type": "STRING"},
        "matchups": {"type": "ARRAY", "items": MATCHUP_ITEM_SCHEMA},
        "weeklyPropsCommentary": {"type": "STRING"},
        "standingsCommentary": {"type": "STRING"},
        "powerRankingsCommentary": {"type": "STRING"},
    },
    "required": [
        "leagueName",
        "matchups",
        "weeklyPropsCommentary",
        "standingsCommentary",
        "powerRankingsCommentary",
    ],
}

RECAP_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "seasonYear": {"type": "INTEGER"},
        "week": {"type": "INTEGER"},
        "intro": {"type": "ARRAY", "items": {"type": "STRING"}},
        "redDivision": DIVISION_SCHEMA,
        "blackDivision": DIVISION_SCHEMA,
        "outro": {"type": "STRING"},
    },
    "required": ["seasonYear", "week", "intro", "redDivision", "blackDivision", "outro"],
}

RECAP_SYSTEM_PROMPT = """You are an award-winning senior fantasy football columnist and lead analyst at ESPN (channeling the combined voices of Stephen A. Smith, Pat McAfee, Scott Van Pelt, Mina Kimes, Dan Orlovsky, Dick Vitale, Matthew Berry, Field Yates, and Bill Simmons).
Your voice is punchy, witty, analytical, and slightly irreverent. You celebrate genius roster moves, ruthlessly roast bench management blunders, and break down the box score using real NFL context and advanced fantasy analytics.

You must generate the VFFL Weekly Head-to-Head (H2H) Recap JSON for both the Red Division and Black Division based strictly on the provided Neon database context payload.

### MANDATORY RULES FOR ALL 10 SECTIONS:
1. **intro** (Array of 2-3 strings):
   - A punchy, creative 2-3 paragraph opening monologue setting the tone for the week across both the Red and Black divisions. Highlight overarching themes, crazy parity, blowouts, and heartbreak.
2. **redDivision.matchups** & **blackDivision.matchups** (5 matchups per division, 10 total):
   - Keep matchups in the exact order provided in the context JSON (`matchupRank` 1 to 5).
   - Copy `matchupId`, `matchupRank`, `matchupTitle`, `winningTeam`, `winningManager`, `winningScore`, `losingTeam`, `losingManager`, `losingScore`, and `margin` (`marginOfVictory`) directly from the context payload.
   - Each matchup MUST have 3 cohesive, natural-language ESPN SportsCenter-style paragraphs (NO bullet points):
     - **introParagraph** (Exactly 3 sentences):
       - Sentence 1: Who beat whom, final score, and margin of victory.
       - Sentence 2: How optimal the winner was (`managerialEfficiencyPct`%, `optimalScore` optimal points, `pointsLeftOnBench` left on bench) and how they performed against projection (`projectedScore`, `scoreVsProjDiff`).
       - Sentence 3: How optimal the loser was (`managerialEfficiencyPct`%, `optimalScore` optimal points, `pointsLeftOnBench` left on bench) and how they performed against projection (`projectedScore`, `scoreVsProjDiff`), explicitly noting if `couldLoserHaveWonWithOptimalLineup` is true.
     - **winnerParagraph** (1 rich paragraph):
       - Focus heavily on the winning team's player performances.
       - **MANDATORY**: You MUST mention EVERY SINGLE ONE of the winner's 10 starting players (`starters` array) using their exact `requiredCitation` format `Player Name (FPTS)` (e.g., `Josh Allen (28.5)`). Do NOT skip a single starter, including K and D/ST!
       - Weave in granular NFL stat lines from `statLine` (PY, PTD, RY, RTD, REC/TAR, RECY, RECTD, DS, DIN, PA, FGM/FGA) for key studs and duds. Mention notable bench performances if relevant.
     - **loserParagraph** (1 rich paragraph):
       - Focus heavily on the losing team's player performances, ruthlessly roasting duds and benching blunders (`benchBlunders`).
       - **MANDATORY**: You MUST mention EVERY SINGLE ONE of the loser's 10 starting players (`starters` array) using their exact `requiredCitation` format `Player Name (FPTS)` (e.g., `CeeDee Lamb (4.2)`). Do NOT skip a single starter, including K and D/ST!
       - Weave in granular NFL stat lines from `statLine` and explicitly roast bench players from `benchBlunders` (citing their `benchFpts` and `statLine`) who outscored starters.
3. **weeklyPropsCommentary** (1 rich paragraph per division):
   - Spotlight the division's 9 weekly awards from `weeklyProps` (Head of the Table, Overachiever, Body Bag, Tough Luck, Heartbreak Kid, Any Given Sunday, Armchair Architect, The GOAT, You Shall Not Pass). Call out the winning managers, teams, players, and exact numbers.
4. **standingsCommentary** (1 rich paragraph per division):
   - Break down the division's H2H standings (`standings`), playoff seed tiers (Seeds 1-2 Automatic Qualifier, Seeds 3-6 Wildcard Hunt, Seeds 7-10 Outside Looking In), week-over-week movement (`standingDiffFromPriorWeek`), PF vs PA differentials (`diff`), and biggest overachievers/underachievers relative to `preseasonDraftProjRank` (`vsPreseasonProjDiff`).
5. **powerRankingsCommentary** (1 rich paragraph per division):
   - Analyze the division's Season-to-Date Power Rankings (`powerRankings`), highlighting `stdPowerScore`, `stdRankDiffFromPriorWeek`, All-Play record (`stdAllPlayRecord`, `stdAllPlayWinPct`), managerial efficiency (`stdEfficiencyPct`), and discrepancies between true Power Rank (`stdPowerRank`) and H2H seed (`h2hStanding`).
6. **outro** (1-2 paragraphs as a single string):
   - A high-energy sign-off wrapping up the week and looking ahead to next week's slate across both divisions."""


def call_gemini_json(api_key, models_to_try, user_prompt):
    last_err = None
    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "systemInstruction": {
                "parts": [{"text": RECAP_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "responseMimeType": "application/json",
                "responseSchema": RECAP_RESPONSE_SCHEMA,
            },
        }
        for attempt in range(1, 3):
            try:
                print(f"Calling Gemini API ({model_name}, attempt {attempt})...")
                resp = requests.post(url, json=payload, timeout=240)
                if resp.status_code == 200:
                    resp_json = resp.json()
                    candidates = resp_json.get("candidates") or []
                    if not candidates:
                        raise RuntimeError(f"Empty candidates in Gemini response: {resp_json}")
                    parts = candidates[0].get("content", {}).get("parts") or []
                    text_out = "".join(p.get("text", "") for p in parts).strip()
                    return json.loads(text_out)
                elif resp.status_code in (429, 500, 502, 503, 504):
                    last_err = f"HTTP {resp.status_code}: {resp.text[:300]}"
                    print(f"Transient error from {model_name} ({last_err}). Retrying after backoff...")
                    time.sleep(5 * attempt)
                else:
                    last_err = f"HTTP {resp.status_code}: {resp.text[:300]}"
                    print(f"Error from {model_name}: {last_err}")
                    break
            except Exception as e:
                last_err = str(e)
                print(f"Exception calling {model_name}: {last_err}")
                time.sleep(5 * attempt)
    raise RuntimeError(f"All Gemini API attempts failed. Last error: {last_err}")


def generate_and_load_recap(year, week):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in .env.local or environment variables.")
        sys.exit(1)

    primary_model = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")
    models_to_try = [primary_model]
    if "gemini-3.8-flash" not in models_to_try:
        models_to_try.append("gemini-3.8-flash")

    temp_context_path = os.path.join(SCRIPT_DIR, f"recap_context_{year}_wk{week}.json")
    extract_context(year, week, temp_context_path)

    with open(temp_context_path, "r", encoding="utf-8") as f:
        context_data = json.load(f)

    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    ensure_table_exists(conn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    starters_by_matchup_team = get_starters_by_matchup_team(cur, year, week)

    base_prompt = (
        f"Generate the complete 10-section VFFL Weekly H2H Recap JSON for Season {year}, Week {week}.\n"
        f"CRITICAL REMINDER: Every single starter in every matchup (all 10 starters for the winner in `winnerParagraph` "
        f"and all 10 starters for the loser in `loserParagraph`) MUST be cited verbatim using their `requiredCitation` "
        f"string `Player Name (FPTS)`.\n\n"
        f"WEEK {week} ({year}) DATABASE CONTEXT PAYLOAD:\n"
        f"{json.dumps(context_data, ensure_ascii=False)}"
    )

    recap_data = None
    max_validation_attempts = 3
    current_prompt = base_prompt

    for val_attempt in range(1, max_validation_attempts + 1):
        recap_data = call_gemini_json(api_key, models_to_try, current_prompt)
        structural_errors, missing_starters = collect_validation_errors(
            year, week, recap_data, starters_by_matchup_team
        )

        if not structural_errors and not missing_starters:
            print(f"Validation passed on attempt {val_attempt} (all 10 sections and all starters verified)!")
            break

        print(f"Validation issue on attempt {val_attempt}/{max_validation_attempts}:")
        for err in structural_errors:
            print(f"  [Structural] {err}")
        for msg in missing_starters:
            print(f"  [Missing Starter] {msg}")

        if val_attempt == max_validation_attempts:
            cur.close()
            conn.close()
            if os.path.exists(temp_context_path):
                os.remove(temp_context_path)
            print("Error: Exceeded maximum validation repair attempts. Aborting load.")
            sys.exit(1)

        # Build self-healing repair prompt with the previous JSON and exact missing starter citations
        issues_list = "\n".join(f"- {e}" for e in (structural_errors + missing_starters))
        current_prompt = (
            f"Your previous JSON output for Season {year}, Week {week} had the following validation errors:\n"
            f"{issues_list}\n\n"
            f"Please fix ONLY the affected paragraphs in your JSON so that every missing starter listed above is "
            f"explicitly woven into the narrative using their exact `Player Name (FPTS)` citation, while keeping all "
            f"other valid sections intact.\n\n"
            f"YOUR PREVIOUS JSON OUTPUT:\n{json.dumps(recap_data, ensure_ascii=False)}"
        )

    upsert_recap_data(conn, cur, year, week, recap_data)
    cur.close()
    conn.close()

    if os.path.exists(temp_context_path):
        os.remove(temp_context_path)


def render_markdown_from_neon(year, week, md_path):
    """Query vffl.weekly_recaps (plus the live views for tables) from Neon and render a 10-section Markdown file."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL is not set in .env.local")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        """
        SELECT recap_json
        FROM vffl.weekly_recaps
        WHERE season_year = %s AND week = %s;
        """,
        (year, week),
    )
    row = cur.fetchone()
    if not row:
        print(f"Error: No recap found in vffl.weekly_recaps for {year} Week {week}.")
        cur.close()
        conn.close()
        sys.exit(1)

    data = row["recap_json"]

    # Also fetch Props, Standings, and Power Rankings from Neon views so the Markdown includes the full tables
    cur.execute(
        "SELECT * FROM vffl.vw_weekly_props WHERE season_year = %s AND week = %s;",
        (year, week),
    )
    props_rows = cur.fetchall()

    cur.execute(
        """
        SELECT s.*, bs.standing AS preseason_proj_rank
        FROM vffl.vw_standings s
        LEFT JOIN vffl.baseline_standings bs
            ON s.season_year = bs.season_year
            AND s.league_id = bs.league_id
            AND s.manager_id = bs.manager_id
        WHERE s.season_year = %s AND s.week = %s
        ORDER BY s.league_name, s.standing ASC;
        """,
        (year, week),
    )
    standings_rows = cur.fetchall()

    cur.execute(
        """
        SELECT *
        FROM vffl.vw_div_power_rankings
        WHERE season_year = %s AND week = %s
        ORDER BY league_name, std_power_rank ASC;
        """,
        (year, week),
    )
    power_rows = cur.fetchall()

    cur.close()
    conn.close()

    def fmt_diff_arrow(val):
        if val is None or int(val) == 0:
            return "-"
        v = int(val)
        return f"▲{v}" if v > 0 else f"▼{abs(v)}"

    def fmt_seed_badge(seed):
        s = int(seed or 0)
        if s <= 2:
            return f"🟢 {s}"
        elif s <= 6:
            return f"🟡 {s}"
        return f"🔴 {s}"

    lines = []
    lines.append(f"# 🏈 VFFL {year} Week {week} H2H Recap 🏈\n")

    # 1. Intro
    intro = data.get("intro", [])
    if isinstance(intro, list):
        for p in intro:
            lines.append(f"{p}\n")
    else:
        lines.append(f"{intro}\n")

    lines.append("---\n")

    for div_key, div_header, emoji in [
        ("redDivision", "RED DIVISION", "🔴"),
        ("blackDivision", "BLACK DIVISION", "⚫"),
    ]:
        div = data.get(div_key, {})
        league_name = div.get("leagueName", "")

        # Matchups
        lines.append(f"## ⚔️ {emoji} {div_header} MATCHUPS {emoji} ⚔️\n")
        for m in div.get("matchups", []):
            title_prefix = f"[{m.get('matchupTitle')}] " if m.get("matchupTitle") else ""
            lines.append(
                f"### {title_prefix}{m.get('winningTeam')} ({m.get('winningScore'):.2f}) def. "
                f"{m.get('losingTeam')} ({m.get('losingScore'):.2f})\n"
            )
            lines.append(f"{m.get('introParagraph')}\n")
            lines.append(f"{m.get('winnerParagraph')}\n")
            lines.append(f"{m.get('loserParagraph')}\n")

        # Weekly Props
        lines.append(f"## 🏆 {emoji} {div_header} WEEKLY PROPS {emoji} 🏆\n")
        lines.append(f"{div.get('weeklyPropsCommentary', '')}\n")
        div_props = [p for p in props_rows if p.get("league_name") == league_name]
        if div_props:
            lines.append("| Award | Definition | Team | Manager | Player | Value | Context |")
            lines.append("| :--- | :--- | :--- | :--- | :--- | ---: | :--- |")
            for p in div_props:
                val_str = f"{float(p['value']):.2f}" if p.get("value") is not None else "-"
                lines.append(
                    f"| **{p.get('award')}** | {p.get('definition')} | {p.get('team_name')} | "
                    f"{p.get('manager_name')} | {p.get('player_name') or '-'} | {val_str} | {p.get('supplemental') or '-'} |"
                )
            lines.append("")

        # Standings
        lines.append(f"## 📊 {emoji} {div_header} STANDINGS {emoji} 📊\n")
        lines.append(f"{div.get('standingsCommentary', '')}\n")
        div_std = [s for s in standings_rows if s.get("league_name") == league_name]
        if div_std:
            lines.append("| Seed | +/- | Team Name | Manager | W-L-T | PF | PA | +/- DIFF | Preseason Rank |")
            lines.append("| :--- | :---: | :--- | :--- | :---: | ---: | ---: | ---: | :---: |")
            for s in div_std:
                diff_val = float(s.get("diff") or 0.0)
                diff_str = f"+{diff_val:.2f}" if diff_val > 0 else f"{diff_val:.2f}"
                lines.append(
                    f"| {fmt_seed_badge(s.get('standing'))} | {fmt_diff_arrow(s.get('standing_diff'))} | "
                    f"**{s.get('team_name')}** | {s.get('manager_name')} | "
                    f"{s.get('wins')}-{s.get('losses')}-{s.get('ties')} | "
                    f"{float(s.get('points_for') or 0.0):.2f} | {float(s.get('points_against') or 0.0):.2f} | "
                    f"{diff_str} | {s.get('preseason_proj_rank') or '-'} |"
                )
            lines.append("")

        # Power Rankings
        lines.append(f"## ⚡ {emoji} {div_header} POWER RANKINGS {emoji} ⚡\n")
        lines.append(f"{div.get('powerRankingsCommentary', '')}\n")
        div_pwr = [p for p in power_rows if p.get("league_name") == league_name]
        if div_pwr:
            lines.append(
                "| Power Rank | +/- | Team Name | H2H Seed | Power Score | All-Play (W-L-T) | All-Play % | Actual FPTS | Optimal FPTS | Efficiency % |"
            )
            lines.append("| :---: | :---: | :--- | :---: | ---: | :---: | ---: | ---: | ---: | ---: |")
            for p in div_pwr:
                lines.append(
                    f"| **{p.get('std_power_rank')}** | {fmt_diff_arrow(p.get('std_rank_diff'))} | "
                    f"**{p.get('team_name')}** | {p.get('standing')} | "
                    f"{float(p.get('std_power_score') or 0.0):.2f} | "
                    f"{p.get('std_ap_wins')}-{p.get('std_ap_losses')}-{p.get('std_ap_ties')} | "
                    f"{float(p.get('std_ap_win_pct') or 0.0) * 100.0:.1f}% | "
                    f"{float(p.get('std_act_fpts') or 0.0):.2f} | {float(p.get('std_opt_fpts') or 0.0):.2f} | "
                    f"{float(p.get('std_eff_pct') or 0.0) * 100.0:.1f}% |"
                )
            lines.append("")

        lines.append("---\n")

    # 10. Outro
    lines.append("## 🎙️ The Final Word 🎙️\n")
    lines.append(f"{data.get('outro', '')}\n")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Rendered Week {week} ({year}) recap from Neon to {md_path}")


def main():
    if len(sys.argv) >= 2 and sys.argv[1].lower() == "init":
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("Error: DATABASE_URL is not set in .env.local")
            sys.exit(1)
        conn = psycopg2.connect(db_url)
        ensure_table_exists(conn)
        conn.close()
        print("Successfully ensured table vffl.weekly_recaps exists in Neon!")
        return

    if len(sys.argv) < 4:
        print("Usage:")
        print("  python scripts/vffl_weekly_recap_helper.py init")
        print("  python scripts/vffl_weekly_recap_helper.py generate <year> <week>")
        print("  python scripts/vffl_weekly_recap_helper.py generate-range <year> <start_week> <end_week>")
        print("  python scripts/vffl_weekly_recap_helper.py extract <year> <week> [output_json_path]")
        print("  python scripts/vffl_weekly_recap_helper.py load <year> <week> <recap_json_path>")
        print("  python scripts/vffl_weekly_recap_helper.py render <year> <week> [output_md_path]")
        sys.exit(1)

    mode = sys.argv[1].lower()
    try:
        year = int(sys.argv[2])
        week = int(sys.argv[3])
    except ValueError:
        print("Error: <year> and <week> must be integers.")
        sys.exit(1)

    if mode == "generate":
        generate_and_load_recap(year, week)
    elif mode == "generate-range":
        if len(sys.argv) < 5:
            print("Error: 'generate-range' requires <year> <start_week> <end_week>.")
            sys.exit(1)
        end_week = int(sys.argv[4])
        for w in range(week, end_week + 1):
            generate_and_load_recap(year, w)
    elif mode == "extract":
        default_out = os.path.join(SCRIPT_DIR, f"recap_context_{year}_wk{week}.json")
        out_path = sys.argv[4] if len(sys.argv) >= 5 else default_out
        extract_context(year, week, out_path)
    elif mode == "extract-range":
        if len(sys.argv) < 5:
            print("Error: 'extract-range' requires <year> <start_week> <end_week>.")
            sys.exit(1)
        end_week = int(sys.argv[4])
        for w in range(week, end_week + 1):
            out_path = os.path.join(SCRIPT_DIR, f"recap_context_{year}_wk{w}.json")
            extract_context(year, w, out_path)
    elif mode == "load":
        if len(sys.argv) < 5:
            print("Error: 'load' mode requires <recap_json_path>.")
            sys.exit(1)
        validate_and_load_recap(year, week, sys.argv[4])
    elif mode == "load-range":
        if len(sys.argv) < 5:
            print("Error: 'load-range' requires <year> <start_week> <end_week>.")
            sys.exit(1)
        end_week = int(sys.argv[4])
        for w in range(week, end_week + 1):
            in_path = os.path.join(SCRIPT_DIR, f"recap_output_{year}_wk{w}.json")
            validate_and_load_recap(year, w, in_path)
    elif mode == "render":
        default_md = os.path.join(SCRIPT_DIR, f"VFFL_{year}_Week_{week}_Recap.md")
        md_path = sys.argv[4] if len(sys.argv) >= 5 else default_md
        render_markdown_from_neon(year, week, md_path)
    else:
        print(
            f"Error: Unknown mode '{mode}'. Expected 'init', 'generate', 'generate-range', "
            f"'extract', 'extract-range', 'load', 'load-range', or 'render'."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
