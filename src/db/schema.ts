import { pgSchema, serial, integer, varchar, boolean, text, real, timestamp, pgView } from "drizzle-orm/pg-core"; 

// -----------------------------------------------------------------------------
// 1. VFFL: Victra Fantasy Football League
// -----------------------------------------------------------------------------
export const vffl = pgSchema("vffl");

// League Settings & Current Week Reference Table
export const vfflLeagues = vffl.table("leagues", {
  id: serial("id").primaryKey(),
  leagueId: integer("league_id").notNull(),
  seasonYear: integer("season_year").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  teamCount: integer("team_count"),
  currentWeek: integer("current_week").notNull(),
  regSeasonCount: integer("reg_season_count"),
  scoringType: varchar("scoring_type", { length: 50 }),
});

// Draft Picks Reference Table
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

// League Managers Reference Table
export const vfflManagers = vffl.table("managers", {
  id: serial("id").primaryKey(),
  espnOwnerId: varchar("espn_owner_id", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  primaryOwner: boolean("primary_owner").default(true),
  active: boolean("active").default(true),
});

// League Teams Reference Table
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

// Draft Predraft Rankings Reference Table
export const vfflPredraft = vffl.table("predraft", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  playerId: integer("player_id").notNull().references(() => vfflPlayers.id),
  overallRank: integer("overall_rank"),
  posRank: integer("pos_rank"),
  adp: real("adp"),
  projFpts: real("proj_fpts"),
});

// The Head-to-Head Matchup
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

// The Player Roster / Lineups
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

// The Granular Stat ID Breakdown
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

// The Stat ID Reference Table
export const vfflStats = vffl.table("stats", {
  statId: varchar("stat_id", { length: 50 }).primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  abbrev: varchar("abbrev", { length: 20 }).notNull(),
  catg: varchar("catg", { length: 50 }).notNull(),
  isDisplayed: boolean("is_displayed").default(true),
});

// H2H Standings View
export const vfflVwStandings = vffl.view("vw_standings", {
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
  leagueName: varchar("league_name", { length: 255 }),
  managerName: text("manager_name"),
  teamName: varchar("team_name", { length: 255 }),
}).existing();

export const vfflStandings = vfflVwStandings;

// The Division Power Rankings View
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

// The Overall Power Rankings View
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

// The Transactions Table
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

// Weekly Strength of Schedule (SOS) Table
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

// The Finances Table
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

// The Player Stats Table
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

// Division All-Play Matchups (10-Team)
export const vfflDivAllPlayMatchups = vffl.view("div_all_play_matchups", {
  seasonYear: integer("season_year"),
  leagueId: integer("league_id"),
  leagueName: varchar("league_name", { length: 50 }),
  week: integer("week"),
  
  homeMgrId: integer("home_mgr_id"),
  homeManager: text("home_manager"),
  homeTeam: text("home_team"),
  
  awayMgrId: integer("away_mgr_id"),
  awayManager: text("away_manager"),
  awayTeam: text("away_team"),
  
  homeFpts: real("home_fpts"),
  awayFpts: real("away_fpts"),
  diff: real("diff"),
}).existing();

// Overall All-Play Matchups (20-Team)
export const vfflOverallAllPlayMatchups = vffl.view("overall_all_play_matchups", {
  seasonYear: integer("season_year"),
  week: integer("week"),
  
  homeLeagueId: integer("home_league_id"),
  homeLeagueName: varchar("home_league_name", { length: 50 }),
  homeMgrId: integer("home_mgr_id"),
  homeManager: text("home_manager"),
  homeTeam: text("home_team"),
  
  awayLeagueId: integer("away_league_id"),
  awayLeagueName: varchar("away_league_name", { length: 50 }),
  awayMgrId: integer("away_mgr_id"),
  awayManager: text("away_manager"),
  awayTeam: text("away_team"),
  
  homeFpts: real("home_fpts"),
  awayFpts: real("away_fpts"),
  diff: real("diff"),
}).existing();

// Division All-Play Standings
export const vfflVwDivAllPlayStandings = vffl.view("vw_div_all_play_standings", {
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
  leagueName: varchar("league_name", { length: 255 }),
  managerName: text("manager_name"),
  teamName: varchar("team_name", { length: 255 }),
}).existing();

export const vfflDivAllPlayStandings = vfflVwDivAllPlayStandings;

// Overall All-Play Standings
export const vfflVwOverallAllPlayStandings = vffl.view("vw_overall_all_play_standings", {
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
  leagueName: varchar("league_name", { length: 255 }),
  managerName: text("manager_name"),
  teamName: varchar("team_name", { length: 255 }),
}).existing();

export const vfflOverallAllPlayStandings = vfflVwOverallAllPlayStandings;

// The Points Against View
export const vfflPointsAgainst = vffl.view("points_against", {
  seasonYear: integer("season_year"),
  week: integer("week"),
  nflId: integer("nfl_id"),
  pos: varchar("pos", { length: 10 }),
  fpts: real("fpts"),
  pvo: real("pvo"),
}).existing();

// The Baseline Standings Table
export const vfflBaselineStandings = vffl.table("baseline_standings", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  leagueId: integer("league_id").notNull(),
  managerId: integer("manager_id").notNull().references(() => vfflManagers.id),
  standing: integer("standing").notNull(), // ESPN's draft_projected_rank
});

// Matchup Hype View
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
  homeScore: real("home_score"),
  homeProjected: real("home_projected"),
  
  awayMgr: text("away_mgr"),
  awayTeam: text("away_team"),
  awayLogoUrl: text("away_logo_url"),
  awayStanding: integer("away_standing"),
  awayRecord: text("away_record"),
  awayScore: real("away_score"),
  awayProjected: real("away_projected"),
  
  homeWins: integer("home_wins"),
  homeLosses: integer("home_losses"),
  h2hLeader: text("h2h_leader"),
  lastMeetWeek: text("last_meet_week"),
  lastMeetWinner: text("last_meet_winner"),
  lastMeetScore: text("last_meet_score"),
  
  apHomeWins: integer("ap_home_wins"),
  apHomeLosses: integer("ap_home_losses"),
  apLeader: text("ap_leader"),
  
  currentStreak: integer("current_streak"),
  currentStreakTeam: text("current_streak_team"),
  
  highScoreWeek: text("high_score_week"),
  highScore: text("high_score"),
  highScoreTeam: text("high_score_team"),
  
  closeScoreWeek: text("close_score_week"),
  closeScore: text("close_score"),
  closeScoreTeam: text("close_score_team"),
}).existing();

// This Week in History View
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

// The Weekly Props View
export const vfflVwWeeklyProps = vffl.view("vw_weekly_props", {
  seasonYear: integer("season_year"),
  week: integer("week"),
  leagueName: varchar("league_name", { length: 255 }),
  managerName: text("manager_name"),
  teamName: varchar("team_name", { length: 255 }),
  playerName: varchar("player_name", { length: 255 }),
  award: varchar("award", { length: 255 }),
  definition: varchar("definition", { length: 255 }),
  value: real("value"),
  supplemental: varchar("supplemental", { length: 255 }),
}).existing();

// The Transactions View
export const vfflVwTransactions = vffl.view("vw_transactions", {
  groupId: varchar("group_id", { length: 255 }),
  leagueId: integer("league_id"),
  leagueName: varchar("league_name", { length: 255 }),
  seasonYear: integer("season_year"),
  week: integer("week"),
  date: timestamp("date"),
  managerId: integer("manager_id"),
  managerName: text("manager_name"),
  teamName: varchar("team_name", { length: 255 }),
  bidAmount: integer("bid_amount"),
  playersAdded: text("players_added"),
  playersAddedPos: text("players_added_pos"),
  playersAddedNfl: text("players_added_nfl"),
  playersDropped: text("players_dropped"),
  playersDroppedPos: text("players_dropped_pos"),
  playersDroppedNfl: text("players_dropped_nfl"),
  playersTraded: text("players_traded"),
  transactionType: text("transaction_type"),
}).existing();

// The Weekly Player Status Table
export const vfflWeeklyPlayerStatus = vffl.table("weekly_player_status", {
  id: serial("id").primaryKey(),
  seasonYear: integer("season_year").notNull(),
  week: integer("week").notNull(),
  playerId: integer("player_id").notNull().references(() => vfflPlayers.id),
  injuryStatus: varchar("injury_status", { length: 20 }).notNull(),
  isInjured: boolean("is_injured").notNull(),
});

// The Weekly Injury Report View
export const vfflVwInjuryReport = vffl.view("vw_injury_report", {
  seasonYear: integer("season_year").notNull(),
  week: integer("week").notNull(),
  playerId: integer("player_id").notNull(),
  playerName: varchar("player_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 10 }).notNull(),
  nflTeam: varchar("nfl_team", { length: 10 }),
  injuryStatus: varchar("injury_status", { length: 20 }).notNull(),
}).existing();

// The H2H Matchups View
export const vfflVwMatchups = vffl.view("vw_matchups", {
  matchupId: integer("matchup_id"),
  leagueName: varchar("league_name", { length: 50 }),
  seasonYear: integer("season_year"),
  week: integer("week"),
  matchupType: varchar("matchup_type", { length: 50 }),
  
  homeMgr: text("home_mgr"),
  homeTeam: text("home_team"),
  homeStanding: integer("home_standing"),
  homeProjected: real("home_projected"),
  homeScore: real("home_score"),
  
  awayMgr: text("away_mgr"),
  awayTeam: text("away_team"),
  awayStanding: integer("away_standing"),
  awayProjected: real("away_projected"),
  awayScore: real("away_score"),
  mqi: real("mqi"),
  matchupRank: integer("matchup_rank"),
  matchupTitle: text("matchup_title"),
  diff: real("diff"),
  winLoss: text("win_loss"),
}).existing();

// The Matchup Rosters & Box Score Stats View
export const vfflVwMatchupRosters = vffl.view("vw_matchup_rosters", {
  matchupId: integer("matchup_id"),
  managerId: integer("manager_id"),
  slot: varchar("slot", { length: 10 }),
  playerName: varchar("player_name", { length: 255 }),
  nflTeam: varchar("nfl_team", { length: 10 }),
  position: varchar("position", { length: 10 }),
  projFpts: real("proj_fpts"),
  actualFpts: real("actual_fpts"),
  passPct: text("pass_pct"),
  passYds: real("pass_yds"),
  passTds: real("pass_tds"),
  rushYds: real("rush_yds"),
  rushTds: real("rush_tds"),
  recPct: text("rec_pct"),
  recYds: real("rec_yds"),
  recTds: real("rec_tds"),
  pa: real("pa"),
  ya: real("ya"),
  sacks: real("sacks"),
  ints: real("ints"),
  fg: text("fg"),
  fgYd: real("fg_yd"),
  pat: real("pat"),
  depth: text("depth"),
  diff: real("diff"),
}).existing();

// The Pre-Kickoff Matchup Quality Index (MQI) Ranking View
export const vfflVwMatchupRanking = vffl.view("vw_matchup_ranking", {
  matchupId: integer("matchup_id"),
  seasonYear: integer("season_year"),
  leagueId: integer("league_id"),
  leagueName: varchar("league_name", { length: 50 }),
  week: integer("week"),
  matchupType: varchar("matchup_type", { length: 50 }),

  homeMgr: text("home_mgr"),
  homeTeam: text("home_team"),
  homeStanding: integer("home_standing"),
  homeWinPct: real("home_win_pct"),
  homeProjected: real("home_projected"),

  awayMgr: text("away_mgr"),
  awayTeam: text("away_team"),
  awayStanding: integer("away_standing"),
  awayWinPct: real("away_win_pct"),
  awayProjected: real("away_projected"),

  projSpread: real("proj_spread"),
  combinedWinPct: real("combined_win_pct"),
  combinedProjected: real("combined_projected"),

  compZ: real("comp_z"),
  stakesZ: real("stakes_z"),
  shootoutZ: real("shootout_z"),
  mqi: real("mqi"),
  matchupRank: integer("matchup_rank"),
  compRank: integer("comp_rank"),
  stakesRank: integer("stakes_rank"),
  shootoutRank: integer("shootout_rank"),
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
