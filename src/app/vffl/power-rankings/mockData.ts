import type { InferSelectModel } from "@/app/vffl/current-week/mockData";
import {
  vfflVwDivPowerRankings,
  vfflVwOverallPowerRankings,
} from "@/db/schema";

export type DivPowerRankingsRow = InferSelectModel<
  typeof vfflVwDivPowerRankings
>;
export type OverallPowerRankingsRow = InferSelectModel<
  typeof vfflVwOverallPowerRankings
>;

export type PowerRankingsRow = DivPowerRankingsRow | OverallPowerRankingsRow;

export type PowerRankingScope = "div" | "vffl";
export type PowerRankingTime = "week" | "std";

export interface NormalizedPowerRow {
  key: string;
  managerId: number | null;
  leagueId: number | null;
  leagueName: string | null;
  standing: number | null;
  teamName: string;
  managerName: string;
  powerRank: number;
  rankDiff: number;
  apWins: number;
  apLosses: number;
  apTies: number;
  apWinPct: number; // 0 to 100 percentage
  actFpts: number;
  effPct: number; // 0 to 100 percentage
  perfVar: number;
  optFpts: number;
  powerScore: number;
}

export const POWER_FORMULA_WEIGHTS: {
  weight: string;
  label: string;
  shortHeader: string;
  metricKey: string;
  tooltip: string;
}[] = [
  {
    weight: "45%",
    label: "All-Play Record",
    shortHeader: "All-Play %",
    metricKey: "ap_win_pct",
    tooltip: "The all-play record removes the H2H matchup luck",
  },
  {
    weight: "30%",
    label: "Total Actual Points",
    shortHeader: "Actual",
    metricKey: "act_fpts",
    tooltip: "Putting real points on the board is what really matters",
  },
  {
    weight: "10%",
    label: "Efficiency %",
    shortHeader: "Efficiency",
    metricKey: "eff_pct",
    tooltip: "Reading the tea leaves and setting your best lineup",
  },
  {
    weight: "10%",
    label: "Performance",
    shortHeader: "Performance",
    metricKey: "perf_var",
    tooltip: "Identifying boom or bust opportunities",
  },
  {
    weight: "5%",
    label: "Total Optimal Points",
    shortHeader: "Optimal",
    metricKey: "opt_fpts",
    tooltip: "Measure how good your team could be",
  },
];

/**
 * Typed mock dataset matching `vffl.vw_div_power_rankings` & `vffl.vw_overall_power_rankings`
 * for isolated slice prototyping and fallback verification.
 */
export const MOCK_POWER_RANKINGS_ROWS: PowerRankingsRow[] = [
  {
    seasonYear: 2026,
    leagueId: 1,
    week: 9,
    managerId: 101,
    wkApWins: 9,
    wkApLosses: 0,
    wkApTies: 0,
    wkApWinPct: 1.0,
    wkActFpts: 148.65,
    wkOptFpts: 156.2,
    wkEffPct: 0.9517,
    wkPerfVar: 19.84,
    wkApZ: 1.48,
    wkActZ: 1.52,
    wkOptZ: 1.35,
    wkEffZ: 0.94,
    wkPerfZ: 0.62,
    wkPowerScore: 95.764,
    wkPowerRank: 1,
    wkRankDiff: 2,
    stdApWins: 64,
    stdApLosses: 17,
    stdApTies: 0,
    stdApWinPct: 0.7901,
    stdActFpts: 1184.4,
    stdOptFpts: 1278.9,
    stdEffPct: 0.9261,
    stdPerfVar: 19.84,
    stdApZ: 1.56,
    stdActZ: 1.49,
    stdOptZ: 1.41,
    stdEffZ: 1.08,
    stdPerfZ: 0.62,
    stdPowerScore: 96.116,
    stdPowerRank: 1,
    stdRankDiff: 0,
    leagueName: "VFFL - Red Division",
    managerName: "Matt M",
    teamName: "Carolina Cartel",
    standing: 1,
  },
  {
    seasonYear: 2026,
    leagueId: 1,
    week: 9,
    managerId: 102,
    wkApWins: 8,
    wkApLosses: 1,
    wkApTies: 0,
    wkApWinPct: 0.8889,
    wkActFpts: 139.2,
    wkOptFpts: 149.8,
    wkEffPct: 0.9292,
    wkPerfVar: 17.45,
    wkApZ: 1.12,
    wkActZ: 1.08,
    wkOptZ: 1.02,
    wkEffZ: 0.61,
    wkPerfZ: 0.24,
    wkPowerScore: 0.964,
    wkPowerRank: 2,
    wkRankDiff: 0,
    stdApWins: 58,
    stdApLosses: 23,
    stdApTies: 0,
    stdApWinPct: 0.716,
    stdActFpts: 1142.15,
    stdOptFpts: 1244.6,
    stdEffPct: 0.9177,
    stdPerfVar: 17.45,
    stdApZ: 1.18,
    stdActZ: 1.14,
    stdOptZ: 1.09,
    stdEffZ: 0.82,
    stdPerfZ: 0.24,
    stdPowerScore: 1.0335,
    stdPowerRank: 2,
    stdRankDiff: 1,
    leagueName: "VFFL - Red Division",
    managerName: "Ryan K",
    teamName: "Gridiron Syndicate",
    standing: 2,
  },
  {
    seasonYear: 2026,
    leagueId: 1,
    week: 9,
    managerId: 103,
    wkApWins: 7,
    wkApLosses: 2,
    wkApTies: 0,
    wkApWinPct: 0.7778,
    wkActFpts: 131.85,
    wkOptFpts: 146.5,
    wkEffPct: 0.9,
    wkPerfVar: 22.1,
    wkApZ: 0.76,
    wkActZ: 0.69,
    wkOptZ: 0.84,
    wkEffZ: 0.15,
    wkPerfZ: 1.04,
    wkPowerScore: 0.71,
    wkPowerRank: 3,
    wkRankDiff: -2,
    stdApWins: 53,
    stdApLosses: 28,
    stdApTies: 0,
    stdApWinPct: 0.6543,
    stdActFpts: 1108.9,
    stdOptFpts: 1229.4,
    stdEffPct: 0.902,
    stdPerfVar: 22.1,
    stdApZ: 0.81,
    stdActZ: 0.78,
    stdOptZ: 0.88,
    stdEffZ: 0.34,
    stdPerfZ: 1.04,
    stdPowerScore: 0.7805,
    stdPowerRank: 3,
    stdRankDiff: -1,
    leagueName: "VFFL - Red Division",
    managerName: "Chris B",
    teamName: "Blitzkrieg Express",
    standing: 3,
  },
];
