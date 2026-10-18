import { pgSchema, serial, integer, varchar, boolean, text, real, timestamp, pgView } from "drizzle-orm/pg-core"; 

// -----------------------------------------------------------------------------
// 1. VFFL: Victra Fantasy Football League
// -----------------------------------------------------------------------------
export const vffl = pgSchema("vffl");

export const vfflDraft = vffl.table("draft", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  overallPick: integer("overall_pick").notNull(),
  roundNum: integer("round_num").notNull(),
  roundPick: integer("round_pick").notNull(),
  managerId: integer("manager_id").references(() => vfflManagers.id),
  nflId: integer("nfl_id"),
  playerId: integer("player_id").notNull(),
  pos: varchar("pos", { length: 10 })
});

export const vfflManagers = vffl.table("managers", {
  id: serial("id").primaryKey(),
  espnOwnerId: varchar("espn_owner_id", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  primaryOwner: boolean("primary_owner").default(true),
  active: boolean("active").default(true),
});

export const vfflTeams = vffl.table("teams", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  espnTeamId: integer("espn_team_id").notNull(),
  managerId: integer("manager_id").references(() => vfflManagers.id),
  teamName: varchar("team_name", { length: 255 }).notNull(),
  teamAbbrev: varchar("team_abbrev", { length: 10 }),
  logoUrl: text("logo_url"),
});

export const vfflPredraft = vffl.table("predraft", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  playerId: integer("player_id").notNull().references(() => vfflPlayers.id),
  overallRank: integer("overall_rank"),
  posRank: integer("pos_rank"),
  adp: real("adp"),
  projFpts: real("proj_fpts"),
});

// 1. The Head-to-Head Matchup
export const vfflMatchups = vffl.table("matchups", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  week: integer("week").notNull(),
  matchupType: varchar("matchup_type", { length: 50 }),
  homeManagerId: integer("home_manager_id").references(() => vfflManagers.id),
  awayManagerId: integer("away_manager_id").references(() => vfflManagers.id),
  homeScore: real("home_score"),
  awayScore: real("away_score"),
  homeProjected: real("home_projected"),
  awayProjected: real("away_projected"),
});

// 2. The Player Roster / Lineups
export const vfflMatchupRosters = vffl.table("matchup_rosters", {
  id: serial("id").primaryKey(),
  matchupId: integer("matchup_id").notNull().references(() => vfflMatchups.id, { onDelete: "cascade" }),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  playerId: integer("player_id").notNull().references(() => vfflPlayers.id),
  slotPosition: varchar("slot_position", { length: 10 }).notNull(),
  projFpts: real("proj_fpts"),
  actualFpts: real("actual_fpts"),
});

// Players Reference Table
export const vfflPlayers = vffl.table("players", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 10 }).notNull(),
  nflId: integer("nfl_id").references(() => vfflNfl.id),
});

// 3. The Granular Stat ID Breakdown
export const vfflMatchupPlayerStats = vffl.table("matchup_player_stats", {
  id: serial("id").primaryKey(),
  rosterId: integer("roster_id").notNull().references(() => vfflMatchupRosters.id, { onDelete: "cascade" }),
  statId: varchar("stat_id", { length: 50 }).notNull(),
  statValue: real("stat_value"),
  statPoints: real("stat_points"),
});

// NFL Teams Reference Table
export const vfflNfl = vffl.table("nfl", {
  id: integer("id").primaryKey(),
  abbrev: varchar("abbrev", { length: 10 }).notNull(),
  location: varchar("location", { length: 255 }),
  name: varchar("name", { length: 255 }),
});

export const vfflStats = vffl.table("stats", {
  statId: varchar("stat_id", { length: 50 }).primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  abbrev: varchar("abbrev", { length: 20 }).notNull(),
  catg: varchar("catg", { length: 50 }).notNull(),
  isDisplayed: boolean("is_displayed").default(true),
});

export const vfflStandings = vffl.view("standings", {
  seasonYear: integer("season_year"),
  leagueId: integer("league_id"),
  week: integer("week"),
  standing: integer("standing"),
  managerId: integer("manager_id"),
  wins: integer("wins"),
  losses: integer("losses"),
  ties: integer("ties"),
  winPct: real("win_pct"),
  pointsFor: real("points_for"),
  pointsAgainst: real("points_against"),
  diff: real("diff"),
  avgDiff: real("avg_diff"),
  standingDiff: integer("standing_diff"),
}).existing();

export const vfflDivisionPowerRankings = vffl.table("division_power_rankings", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  week: integer("week").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  
  // Weekly Metrics
  wkApWins: integer("wk_ap_wins"),
  wkApLosses: integer("wk_ap_losses"),
  wkApTies: integer("wk_ap_ties"),
  wkApWinPct: real("wk_ap_win_pct"),
  wkActFpts: real("wk_act_fpts"),
  wkOptFpts: real("wk_opt_fpts"),
  wkEffPct: real("wk_eff_pct"),
  wkPerfVar: real("wk_perf_var"),
  wkApZ: real("wk_ap_z"),
  wkActZ: real("wk_act_z"),
  wkOptZ: real("wk_opt_z"),
  wkEffZ: real("wk_eff_z"),
  wkPerfZ: real("wk_perf_z"),
  wkPowerScore: real("wk_power_score"),
  wkPowerRank: integer("wk_power_rank"),
  wkRankDiff: integer("wk_rank_diff"),

  // Season-to-Date (STD) Metrics
  stdApWins: integer("std_ap_wins"),
  stdApLosses: integer("std_ap_losses"),
  stdApTies: integer("std_ap_ties"),
  stdApWinPct: real("std_ap_win_pct"),
  stdActFpts: real("std_act_fpts"),
  stdOptFpts: real("std_opt_fpts"),
  stdEffPct: real("std_eff_pct"),
  stdPerfVar: real("std_perf_var"),
  stdApZ: real("std_ap_z"),
  stdActZ: real("std_act_z"),
  stdOptZ: real("std_opt_z"),
  stdEffZ: real("std_eff_z"),
  stdPerfZ: real("std_perf_z"),
  stdPowerScore: real("std_power_score"),
  stdPowerRank: integer("std_power_rank"),
  stdRankDiff: integer("std_rank_diff"),
});

export const vfflOverallPowerRankings = vffl.table("overall_power_rankings", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(), 
  week: integer("week").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  
  // Weekly Metrics
  wkApWins: integer("wk_ap_wins"),
  wkApLosses: integer("wk_ap_losses"),
  wkApTies: integer("wk_ap_ties"),
  wkApWinPct: real("wk_ap_win_pct"),
  wkActFpts: real("wk_act_fpts"),
  wkOptFpts: real("wk_opt_fpts"),
  wkEffPct: real("wk_eff_pct"),
  wkPerfVar: real("wk_perf_var"),
  wkApZ: real("wk_ap_z"),
  wkActZ: real("wk_act_z"),
  wkOptZ: real("wk_opt_z"),
  wkEffZ: real("wk_eff_z"),
  wkPerfZ: real("wk_perf_z"),
  wkPowerScore: real("wk_power_score"),
  wkPowerRank: integer("wk_power_rank"),
  wkRankDiff: integer("wk_rank_diff"),

  // Season-to-Date (STD) Metrics
  stdApWins: integer("std_ap_wins"),
  stdApLosses: integer("std_ap_losses"),
  stdApTies: integer("std_ap_ties"),
  stdApWinPct: real("std_ap_win_pct"),
  stdActFpts: real("std_act_fpts"),
  stdOptFpts: real("std_opt_fpts"),
  stdEffPct: real("std_eff_pct"),
  stdPerfVar: real("std_perf_var"),
  stdApZ: real("std_ap_z"),
  stdActZ: real("std_act_z"),
  stdOptZ: real("std_opt_z"),
  stdEffZ: real("std_eff_z"),
  stdPerfZ: real("std_perf_z"),
  stdPowerScore: real("std_power_score"),
  stdPowerRank: integer("std_power_rank"),
  stdRankDiff: integer("std_rank_diff"),
});

export const vfflTransactions = vffl.table("transactions", {
  id: serial("id").primaryKey(),
  groupId: varchar("group_id", { length: 255 }).notNull(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  week: integer("week").notNull(),
  date: timestamp("date").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  playerId: integer("player_id").notNull().references(() => vfflPlayers.id),
  bidAmount: integer("bid_amount").default(0),
});

export const vfflSos = vffl.table("sos", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  week: integer("week").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  remainingGames: integer("remaining_games").notNull(),
  oppAvgWinPct: real("opp_avg_win_pct"),
  oppAvgPf: real("opp_avg_pf"),
  sosRank: integer("sos_rank"),
});

export const vfflAwards = vffl.table("awards", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull(),
  seasonYear: integer("season_year").notNull(),
  week: integer("week").notNull(),
  award: varchar("award", { length: 255 }).notNull(),
  definition: varchar("definition", { length: 255 }).notNull(),
  managerId: integer("manager_id").references(() => vfflManagers.id),
  playerId: integer("player_id").references(() => vfflPlayers.id), // Optional: captures the specific player for GOAT/Defense
  value: real("value"),
  supplemental: varchar("supplemental", { length: 255 }),
});

export const vfflFinances = vffl.table("finances", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull(),
  seasonYear: integer("season_year").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  entryFee: real("entry_fee").default(0),
  collected: real("collected").default(0),
  leaguePayout: real("league_payout").default(0),
  propsPayout: real("props_payout").default(0),
});

export const vfflPlayerStats = vffl.table("player_stats", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  week: integer("week").notNull(),
  playerId: integer("player_id").notNull().references(() => vfflPlayers.id),
  opponentId: integer("opponent_id").references(() => vfflNfl.id),
  statId: varchar("stat_id", { length: 50 }).notNull(),
  statValue: real("stat_value"),
  statPoints: real("stat_points"),
});

// Division All-Play View
export const vfflDivAllPlayMatchups = vffl.view("div_all_play_matchups", {
  seasonYear: integer("season_year"),
  leagueId: integer("league_id"),
  week: integer("week"),
  homeMgrId: integer("home_mgr_id"),
  awayMgrId: integer("away_mgr_id"),
  homeFpts: real("home_fpts"),
  awayFpts: real("away_fpts"),
  diff: real("diff"),
}).existing();

// Overall All-Play View
export const vfflOverallAllPlayMatchups = vffl.view("overall_all_play_matchups", {
  seasonYear: integer("season_year"),
  leagueId: integer("league_id"),
  week: integer("week"),
  homeMgrId: integer("home_mgr_id"),
  awayMgrId: integer("away_mgr_id"),
  homeFpts: real("home_fpts"),
  awayFpts: real("away_fpts"),
  diff: real("diff"),
}).existing();

// Division All-Play Standings View
export const vfflDivAllPlayStandings = vffl.view("div_all_play_standings", {
  leagueId: integer("league_id"),
  seasonYear: integer("season_year"),
  week: integer("week"),
  standing: integer("standing"),
  managerId: integer("manager_id"),
  wins: integer("wins"),
  losses: integer("losses"),
  ties: integer("ties"),
  winPct: real("win_pct"),
  pointsFor: real("points_for"),
  pointsAgainst: real("points_against"),
  diff: real("diff"),
  avgDiff: real("avg_diff"),
  standingDiff: integer("standing_diff"),
}).existing();

// Overall All-Play Standings View
export const vfflOverallAllPlayStandings = vffl.view("overall_all_play_standings", {
  leagueId: integer("league_id"),
  seasonYear: integer("season_year"),
  week: integer("week"),
  standing: integer("standing"),
  managerId: integer("manager_id"),
  wins: integer("wins"),
  losses: integer("losses"),
  ties: integer("ties"),
  winPct: real("win_pct"),
  pointsFor: real("points_for"),
  pointsAgainst: real("points_against"),
  diff: real("diff"),
  avgDiff: real("avg_diff"),
  standingDiff: integer("standing_diff"),
}).existing();

export const vfflPointsAgainst = vffl.view("points_against", {
  seasonYear: integer("season_year"),
  week: integer("week"),
  nflId: integer("nfl_id"),
  pos: varchar("pos", { length: 10 }),
  fpts: real("fpts"),
  pvo: real("pvo"),
}).existing();

export const vfflBaselineStandings = vffl.table("baseline_standings", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  standing: integer("standing").notNull(), // ESPN's draft_projected_rank
});

export const vfflVwMatchupHype = vffl.view("vw_matchup_hype", {
  matchupId: integer("matchup_id"),
  seasonYear: integer("season_year"),
  week: integer("week"),
  leagueName: varchar("league_name", { length: 50 }),
  
  homeMgr: text("home_mgr"),
  homeTeam: text("home_team"),
  homeLogoUrl: text("home_logo_url"),
  homeStanding: integer("home_standing"),
  homeRecord: text("home_record"),
  
  awayMgr: text("away_mgr"),
  awayTeam: text("away_team"),
  awayLogoUrl: text("away_logo_url"),
  awayStanding: integer("away_standing"),
  awayRecord: text("away_record"),
  
  homeWins: integer("home_wins"),
  homeLosses: integer("home_losses"),
  lastMeetWeek: text("last_meet_week"),
  lastMeetWinner: text("last_meet_winner"),
  lastMeetScore: text("last_meet_score"),
  
  apHomeWins: integer("ap_home_wins"),
  apHomeLosses: integer("ap_home_losses"),
  
  currentStreak: integer("current_streak"),
  currentStreakTeam: text("current_streak_team"),
  
  highScoreWeek: text("high_score_week"),
  highScore: text("high_score"),
  highScoreTeam: text("high_score_team"),
  
  closeScoreWeek: text("close_score_week"),
  closeScore: text("close_score"),
  closeScoreTeam: text("close_score_team"),
}).existing();

export const vfflVwThisWeekInHistory = vffl.view("vw_this_week_in_history", {
  leagueName: varchar("league_name", { length: 255 }),
  seasonYear: integer("season_year"),
  week: integer("week"),
  highlight: text("highlight"),
  highlightYear: integer("highlight_year"),
  highlightWeek: integer("highlight_week"),
  homeTeam: text("home_team"),
  awayTeam: text("away_team"),
  homeFpts: real("home_fpts"),
  homeProjected: real("home_projected"),
  awayFpts: real("away_fpts"),
  awayProjected: real("away_projected"),
  totalFpts: real("total_fpts"),
  victoryMargin: real("victory_margin"),
  projectionMargin: real("projection_margin"),
}).existing();

// -----------------------------------------------------------------------------
// 2. NCAA: Pick-10 Challenge
// -----------------------------------------------------------------------------
export const ncaa = pgSchema("ncaa");

export const ncaaEntrants = ncaa.table("entrants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const ncaaTournamentBrackets = ncaa.table("tournament_brackets", {
  id: serial("id").primaryKey(),
  entrantId: integer("entrant_id").references(() => ncaaEntrants.id),
  year: integer("year").notNull(),
  picksJson: text("picks_json"), 
});

export const ncaaLegacyChamps = ncaa.table("legacy_champs", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  entrantId: integer("entrant_id").references(() => ncaaEntrants.id),
});

// -----------------------------------------------------------------------------
// 3. VFGL: Victra Fantasy Golf League
// -----------------------------------------------------------------------------
export const vfgl = pgSchema("vfgl");

export const vfglUsers = vfgl.table("golf_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const vfglRosters = vfgl.table("rosters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => vfglUsers.id),
  tournamentName: varchar("tournament_name", { length: 255 }).notNull(),
  golferIdsJson: text("golfer_ids_json"),
});

export const vfglLiveScoring = vfgl.table("live_scoring", {
  id: serial("id").primaryKey(),
  tournamentName: varchar("tournament_name", { length: 255 }).notNull(),
  golferName: varchar("golfer_name", { length: 255 }).notNull(),
  scoreToPar: integer("score_to_par"),
  thru: varchar("thru", { length: 10 }),
});

// -----------------------------------------------------------------------------
// 4. VFCF: Victra Fantasy College Football
// -----------------------------------------------------------------------------
export const vfcf = pgSchema("vfcf");

export const vfcfManagers = vfcf.table("cfb_managers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const vfcfStandings = vfcf.table("standings", {
  id: serial("id").primaryKey(),
  managerId: integer("manager_id").references(() => vfcfManagers.id),
  seasonYear: integer("season_year").notNull(),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
});