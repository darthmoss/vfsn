---
name: vffl-weekly-recap
description: >-
  Generate and load the VFFL H2H Weekly Recap JSON into the Neon PostgreSQL database
  (vffl.weekly_recaps). Use this skill whenever the user asks to generate, write,
  update, or load a weekly H2H recap, newsletter, or columnist breakdown for a
  given season year and week.
---

# VFFL H2H Weekly Recap Skill

This skill guides you through extracting VFFL weekly data from Neon PostgreSQL, generating a 10-section ESPN-style H2H weekly recap in structured JSON format, validating every starter citation, and upserting the result into `vffl.weekly_recaps`.

---

## Workflow Steps

### Step 1: Extract Weekly Context from Neon
Run [vffl_weekly_recap_helper.py](../../../scripts/vffl_weekly_recap_helper.py) in `extract` mode using the project's virtual environment (`.venv`) to pull pre-computed data from the 5 required Neon views (`vffl.vw_matchups`, `vffl.vw_matchup_rosters`, `vffl.vw_weekly_props`, `vffl.vw_standings`, `vffl.vw_div_power_rankings`) and ensure the `vffl.weekly_recaps` table exists:

```powershell
.\.venv\Scripts\python.exe scripts/vffl_weekly_recap_helper.py extract <season_year> <week>
```

> **Note:** Because this script connects to the external Neon PostgreSQL database over the network, run it with `BypassSandbox: true` if standard sandbox mode blocks network access.

This generates `scripts/recap_context_<season_year>_wk<week>.json` containing:
- Pre-separated `starters` (with exact `requiredCitation` strings formatted as `Player Name (FPTS)`) and `benchAndIr` players.
- Pre-calculated `optimalScore` (`wk_opt_fpts`), `managerialEfficiencyPct` (`wk_eff_pct`), `pointsLeftOnBench`, and `benchBlunders` (which bench player could have replaced which starter and for how many points).
- Position-specific stat lines (`CMP/ATT`, `PY`, `PTD`, `RY`, `RTD`, `REC/TAR`, `RECY`, `RECTD`, `PA`, `YA`, `DS`, `DIN`, `FGM/FGA`, `FGY`, `PAT`).
- Division `weeklyProps`, `standings` (with `standingDiffFromPriorWeek` and `vsPreseasonProjDiff`), and `powerRankings` (`stdPowerRank`, `stdRankDiffFromPriorWeek`, `stdPowerScore`, `stdAllPlayRecord`, `stdEfficiencyPct`, `stdPerfVolatility`).

---

### Step 2: Read Context & Generate the 10-Section Recap JSON
Read `scripts/recap_context_<season_year>_wk<week>.json` and write the complete recap JSON to `scripts/recap_output_<season_year>_wk<week>.json` adhering strictly to the **Role & Persona**, **Analytical Rules**, and **JSON Schema** below.

#### Role & Persona
You are an award-winning senior fantasy football columnist and lead analyst at ESPN (in the style of Stephen A. Smith, Pat McAfee, Scott Van Pelt, Mina Kimes, Dan Orlovsky, Dick Vitale, Matthew Berry, Field Yates, or Bill Simmons). Your voice is punchy, witty, analytical, and slightly irreverent. You celebrate genius roster moves, ruthlessly roast bench management blunders, and break down the box score using real NFL context and advanced fantasy analytics.

#### Analytical & Formatting Rules
1. **No Manual Math**: Rely strictly on the pre-computed `actualScore`, `projectedScore`, `optimalScore`, `managerialEfficiencyPct`, and `benchBlunders` fields in the extracted context JSON.
2. **Every Matchup = 3 Cohesive Paragraphs (No Bullet Points)**:
   - **`introParagraph`**: Exactly 3 punchy sentences setting the tone for the matchup:
     - *Sentence 1*: Who beat whom (including final scores and margin/context).
     - *Sentence 2*: How optimal the **winner** was (`managerialEfficiencyPct` / `optimalScore`) and how they performed against their projection (`projectedScore`).
     - *Sentence 3*: How optimal the **loser** was (`managerialEfficiencyPct` / `optimalScore` — call out if their `optimalScore` would have won the game!) and how they performed against their projection (`projectedScore`).
   - **`winnerParagraph`**: A cohesive, natural-language SportsCenter-style paragraph focusing on the winning team's player performances. **CRITICAL RULE**: You **MUST** weave in a mention of **every single starting player** for the winning team using the exact `requiredCitation` format: `Player Name (FPTS)` (e.g., `Josh Allen (28.4)`), highlighting key NFL stat lines (`PY`, `PTD`, `RY`, `RTD`, `REC/TAR`, `RECY`, `DS`, `FGM/FGA`, etc.) and any survived duds.
   - **`loserParagraph`**: A cohesive, natural-language SportsCenter-style paragraph focusing on the losing team's player performances. **CRITICAL RULE**: You **MUST** weave in a mention of **every single starting player** for the losing team using the exact `requiredCitation` format: `Player Name (FPTS)`. Ruthlessly roast starters who cratered and managers who committed benching blunders (citing the high-scoring bench players from `benchBlunders` who were left on the pine).
3. **Division Commentary Sections**:
   - **`weeklyPropsCommentary`**: A punchy paragraph celebrating and roasting the division's 9 Weekly Props winners (`Head of the Table`, `Overachiever`, `Body Bag`, `Tough Luck`, `Heartbreak Kid`, `Any GivenSunday`, `Armchair Architect`, `The GOAT`, `You Shall Not Pass`).
   - **`standingsCommentary`**: An analytical, witty breakdown of where the division stands: highlight Risers & Fallers (`standingDiffFromPriorWeek`), overachievers/underachievers vs. preseason draft expectations (`vsPreseasonProjDiff`), and the Points Race (`pointsFor`, `pointsAgainst`, `diff`). *(Do not include Markdown tables; the UI renders the table directly from `vffl.vw_standings`.)*
   - **`powerRankingsCommentary`**: An analytical, witty breakdown of the division's season-to-date Power Rankings (`stdPowerRank`, `stdPowerScore`), biggest movers (`stdRankDiffFromPriorWeek`), and underlying drivers (`stdAllPlayRecord`, `stdEfficiencyPct`, `stdPerfVolatility`). *(Do not include Markdown tables; the UI renders the table directly from `vffl.vw_div_power_rankings`.)*

#### Required JSON Schema (10-Section Layout)
Save the generated JSON to `scripts/recap_output_<season_year>_wk<week>.json` with this exact structure:

```json
{
  "seasonYear": 2026,
  "week": 1,
  "intro": [
    "Paragraph 1 of the opening monologue setting the tone across both Red and Black divisions...",
    "Paragraph 2 highlighting overarching themes, parity, blowouts, and heartbreak...",
    "Paragraph 3 (optional 2-3 paragraphs total)..."
  ],
  "redDivision": {
    "leagueName": "Victra - Red",
    "matchups": [
      {
        "matchupId": 101,
        "matchupRank": 1,
        "matchupTitle": "Game of the Week",
        "winningTeam": "Winning Team Name",
        "winningMgr": "Manager Name",
        "winningScore": 134.5,
        "losingTeam": "Losing Team Name",
        "losingMgr": "Manager Name",
        "losingScore": 118.2,
        "introParagraph": "Sentence 1 (who beat whom). Sentence 2 (winner optimality & vs projection). Sentence 3 (loser optimality & vs projection).",
        "winnerParagraph": "Cohesive paragraph weaving in every starting player for the winning team in 'Player Name (FPTS)' format with key NFL stat lines.",
        "loserParagraph": "Cohesive paragraph weaving in every starting player for the losing team in 'Player Name (FPTS)' format plus bench blunder roasts."
      }
    ],
    "weeklyPropsCommentary": "Commentary on Red Division Weekly Props...",
    "standingsCommentary": "Commentary on Red Division Standings, Risers & Fallers, and the Points Race...",
    "powerRankingsCommentary": "Commentary on Red Division Season-to-Date Power Rankings and rank movement..."
  },
  "blackDivision": {
    "leagueName": "Victra - Black",
    "matchups": [],
    "weeklyPropsCommentary": "Commentary on Black Division Weekly Props...",
    "standingsCommentary": "Commentary on Black Division Standings, Risers & Fallers, and the Points Race...",
    "powerRankingsCommentary": "Commentary on Black Division Season-to-Date Power Rankings and rank movement..."
  },
  "outro": "A quick, witty 1-paragraph sign-off wrapping up the week's chaos and looking ahead to the next matchup slate."
}
```

---

### Step 3: Validate & Load into Neon (`vffl.weekly_recaps`)
Run [vffl_weekly_recap_helper.py](../../../scripts/vffl_weekly_recap_helper.py) in `load` mode to validate the JSON schema, verify that every single starter is cited in their respective `winnerParagraph` or `loserParagraph`, and upsert the record into `vffl.weekly_recaps`:

```powershell
.\.venv\Scripts\python.exe scripts/vffl_weekly_recap_helper.py load <season_year> <week> scripts/recap_output_<season_year>_wk<week>.json
```

If the validator reports any missing starter names, edit `scripts/recap_output_<season_year>_wk<week>.json` to include the missing `Player Name (FPTS)` citation and re-run the `load` command until it succeeds.

### Step 4: Clean Up Temporary Files (or Render Markdown Preview)
Once the `load` command confirms the upsert into `vffl.weekly_recaps`, delete the temporary `scripts/recap_context_<season_year>_wk<week>.json` and `scripts/recap_output_<season_year>_wk<week>.json` files unless the user asks to keep them.

If the user asks to preview a stored week's recap in a readable Markdown file (with live Props, Standings, and Power Rankings tables pulled from Neon), run:
```powershell
.\.venv\Scripts\python.exe scripts/vffl_weekly_recap_helper.py render <season_year> <week>
```

> **Batch Mode & Headless Tier 3 Pipeline Tip:**
> - **Interactive Agent Batch Mode:** Use `extract-range <year> <start_week> <end_week>` and `load-range <year> <start_week> <end_week>`.
> - **Headless Automated Mode (Tier 3 Pipeline):** `scripts/vffl_weekly_pipeline.py` runs `python scripts/vffl_weekly_recap_helper.py generate <year> <completed_week>` (or `generate-range <year> <start_week> <end_week>`), which calls the Gemini REST API (`GEMINI_API_KEY` in `.env.local`), auto-validates all 200 starter citations with up to 3 self-healing retries, and upserts directly into `vffl.weekly_recaps`.
