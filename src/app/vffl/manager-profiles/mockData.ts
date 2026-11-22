import type { InferSelectModel } from "@/app/vffl/current-week/mockData";
import type {
  vfflDivAllPlayMatchups,
  vfflVwManagerAllPlayMatrix,
  vfflVwManagerCareerSummary,
  vfflVwManagerExtremeGames,
  vfflVwManagerGameLuck,
  vfflVwManagerH2hMatrix,
  vfflVwManagerSeasonHistory,
} from "@/db/schema";

// -----------------------------------------------------------------------------
// Drizzle-derived Row Contracts (pgView-safe InferSelectModel helper)
// -----------------------------------------------------------------------------
export type ManagerCareerSummaryRow = InferSelectModel<
  typeof vfflVwManagerCareerSummary
>;
export type ManagerExtremeGameRow = InferSelectModel<
  typeof vfflVwManagerExtremeGames
>;
export type ManagerH2hMatrixRow = InferSelectModel<typeof vfflVwManagerH2hMatrix>;
export type ManagerAllPlayMatrixRow = InferSelectModel<
  typeof vfflVwManagerAllPlayMatrix
>;
export type ManagerSeasonHistoryRow = InferSelectModel<
  typeof vfflVwManagerSeasonHistory
>;
export type ManagerGameLuckRow = InferSelectModel<typeof vfflVwManagerGameLuck>;
export type DivAllPlayMatchupRow = InferSelectModel<typeof vfflDivAllPlayMatchups>;

export type ManagerOption = Pick<
  ManagerCareerSummaryRow,
  "managerId" | "managerName" | "active"
>;

// -----------------------------------------------------------------------------
// URL-Driven Tabs (Career Rivalry Ledger Mode)
// -----------------------------------------------------------------------------
export type ProfileTab = "h2h" | "all-play";

export const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: "h2h", label: "Head-to-Head" },
  { id: "all-play", label: "Division All-Play" },
];

export function parseProfileTab(raw: string | undefined): ProfileTab {
  const match = PROFILE_TABS.find((t) => t.id === raw);
  return match ? match.id : "h2h";
}

// -----------------------------------------------------------------------------
// Typed Mock Fixtures (slice-by-slice component development)
// -----------------------------------------------------------------------------
export const MOCK_CAREER_SUMMARIES: ManagerCareerSummaryRow[] = [
  {
    managerId: 1,
    managerName: "Matt M",
    active: true,
    totalSeasons: 12,
    h2hWins: 98,
    h2hLosses: 62,
    h2hTies: 1,
    h2hRecord: "98-62-1",
    h2hWinPct: 0.612,
    totalPf: 19842.36,
    totalPa: 18571.04,
    avgPfPerSeason: 1653.53,
    avgPpg: 123.24,
    playoffTrips: 8,
    championships: 2,
    runnerUps: 1,
    pointsTitles: 3,
    playoffWins: 9,
    playoffLosses: 6,
    playoffRecord: "9-6",
    playoffWinPct: 0.6,
    divApWins: 912,
    divApLosses: 529,
    divApTies: 8,
    divApRecord: "912-529-8",
    divApWinPct: 0.632,
    ovrApWins: 1702,
    ovrApLosses: 1121,
    ovrApTies: 11,
    ovrApRecord: "1702-1121-11",
    ovrApWinPct: 0.602,
    deservedWins: 61,
    luckyWins: 9,
    tossUps: 52,
    unluckyLosses: 14,
    deservedLosses: 25,
    careerLuckScore: -2.41,
    scope: "CAREER",
    seasonYear: null,
    ovrPowerScore: 90.42,
    ovrPowerRank: 4,
  },
  {
    managerId: 2,
    managerName: "Chris D",
    active: false,
    totalSeasons: 4,
    h2hWins: 22,
    h2hLosses: 30,
    h2hTies: 0,
    h2hRecord: "22-30",
    h2hWinPct: 0.423,
    totalPf: 5980.12,
    totalPa: 6211.48,
    avgPfPerSeason: 1495.03,
    avgPpg: 115.0,
    playoffTrips: 1,
    championships: 0,
    runnerUps: 0,
    pointsTitles: 0,
    playoffWins: 0,
    playoffLosses: 1,
    playoffRecord: "0-1",
    playoffWinPct: 0,
    divApWins: 201,
    divApLosses: 265,
    divApTies: 2,
    divApRecord: "201-265-2",
    divApWinPct: 0.432,
    ovrApWins: null,
    ovrApLosses: null,
    ovrApTies: null,
    ovrApRecord: null,
    ovrApWinPct: null,
    deservedWins: 10,
    luckyWins: 6,
    tossUps: 18,
    unluckyLosses: 4,
    deservedLosses: 14,
    careerLuckScore: 1.87,
    scope: "CAREER",
    seasonYear: null,
    ovrPowerScore: 79.15,
    ovrPowerRank: 16,
  },
];

const mockExtreme = (
  category: "BIGGEST_WIN" | "BIGGEST_LOSS",
  rank: number,
  seasonYear: number,
  week: number,
  pointsFor: number,
  pointsAgainst: number
): ManagerExtremeGameRow => ({
  managerId: 1,
  managerName: "Matt M",
  category,
  rank,
  seasonYear,
  week,
  leagueName: "VFFL - Red Division",
  matchupType: "Regular Season",
  teamName: "Gridiron Gangsters",
  logoUrl: null,
  opponentId: 2,
  opponentName: "Chris D",
  opponentTeamName: "Sunday Scaries",
  opponentLogoUrl: null,
  pointsFor,
  pointsAgainst,
  margin: Math.round((pointsFor - pointsAgainst) * 100) / 100,
  playerId: null,
  playerName: null,
  playerPosition: null,
  slotPosition: null,
  nflTeam: null,
  playerFpts: null,
  playerProjFpts: null,
  playerMargin: null,
});

export const MOCK_EXTREME_GAMES: ManagerExtremeGameRow[] = [
  mockExtreme("BIGGEST_WIN", 1, 2021, 7, 188.42, 84.1),
  mockExtreme("BIGGEST_WIN", 2, 2019, 3, 171.08, 92.5),
  mockExtreme("BIGGEST_LOSS", 1, 2018, 11, 71.36, 159.9),
  mockExtreme("BIGGEST_LOSS", 2, 2023, 2, 88.12, 151.44),
];

const mockH2h = (
  scope: "CAREER" | "SEASON",
  seasonYear: number | null,
  wins: number,
  losses: number,
  pointsFor: number,
  pointsAgainst: number
): ManagerH2hMatrixRow => ({
  scope,
  seasonYear,
  managerId: 1,
  managerName: "Matt M",
  opponentId: 2,
  opponentName: "Chris D",
  opponentActive: false,
  wins,
  losses,
  ties: 0,
  record: `${wins}-${losses}`,
  winPct: Math.round((wins / (wins + losses)) * 1000) / 1000,
  pointsFor,
  pointsAgainst,
  pointDiff: Math.round((pointsFor - pointsAgainst) * 100) / 100,
  teamName: "Gridiron Gangsters",
  opponentTeamName: "Sunday Scaries",
});

export const MOCK_H2H_MATRIX: ManagerH2hMatrixRow[] = [
  mockH2h("CAREER", null, 5, 3, 1012.44, 941.2),
  mockH2h("SEASON", 2019, 2, 0, 262.1, 210.4),
  mockH2h("SEASON", 2018, 3, 3, 750.34, 730.8),
];

const mockAllPlay = (
  scope: "CAREER" | "SEASON",
  seasonYear: number | null,
  wins: number,
  losses: number,
  pointsForSum: number,
  pointsAgainstSum: number
): ManagerAllPlayMatrixRow => {
  const games = wins + losses;
  return {
    scope,
    seasonYear,
    managerId: 1,
    managerName: "Matt M",
    opponentId: 2,
    opponentName: "Chris D",
    opponentActive: false,
    wins,
    losses,
    ties: 0,
    record: `${wins}-${losses}`,
    winPct: Math.round((wins / games) * 1000) / 1000,
    pointsForSum,
    pointsForAvg: Math.round((pointsForSum / games) * 100) / 100,
    pointsAgainstSum,
    pointsAgainstAvg: Math.round((pointsAgainstSum / games) * 100) / 100,
    teamName: "Gridiron Gangsters",
    opponentTeamName: "Sunday Scaries",
  };
};

export const MOCK_ALL_PLAY_MATRIX: ManagerAllPlayMatrixRow[] = [
  mockAllPlay("CAREER", null, 34, 18, 6420.5, 5980.12),
  mockAllPlay("SEASON", 2019, 9, 4, 1640.2, 1490.6),
  mockAllPlay("SEASON", 2018, 25, 14, 4780.3, 4489.52),
];

const mockSeason = (
  seasonYear: number,
  luck: [number, number, number, number, number],
  seasonLuckScore: number
): ManagerSeasonHistoryRow => ({
  managerId: 1,
  managerName: "Matt M",
  seasonYear,
  leagueId: 101,
  leagueName: "VFFL - Red Division",
  teamName: "Gridiron Gangsters",
  teamAbbrev: "GG",
  logoUrl: null,
  h2hWins: 9,
  h2hLosses: 4,
  h2hTies: 0,
  h2hRecord: "9-4",
  h2hWinPct: 0.692,
  pointsFor: 1702.44,
  pointsAgainst: 1544.9,
  avgPpg: 130.96,
  divApWins: 82,
  divApLosses: 35,
  divApTies: 0,
  divApRecord: "82-35",
  divApWinPct: 0.701,
  ovrApWins: null,
  ovrApLosses: null,
  ovrApTies: null,
  ovrApRecord: null,
  ovrApWinPct: null,
  madePlayoffs: true,
  isChampion: false,
  isRunnerUp: false,
  isPointsTitle: false,
  playoffWins: 1,
  playoffLosses: 1,
  playoffRecord: "1-1",
  deservedWins: luck[0],
  luckyWins: luck[1],
  tossUps: luck[2],
  unluckyLosses: luck[3],
  deservedLosses: luck[4],
  seasonLuckScore,
  ovrPowerScore: 91.2,
  ovrPowerRank: 3,
});

export const MOCK_SEASON_HISTORY: ManagerSeasonHistoryRow[] = [
  mockSeason(2019, [6, 1, 5, 1, 0], 0.42),
  mockSeason(2018, [4, 0, 6, 2, 1], -1.18),
];

const mockGameLuck = (
  week: number,
  pointsFor: number,
  pointsAgainst: number,
  gameLuck: number,
  luckCategory: string
): ManagerGameLuckRow => ({
  managerId: 1,
  managerName: "Matt M",
  seasonYear: 2019,
  leagueId: 101,
  leagueName: "VFFL - Red Division",
  week,
  teamName: "Gridiron Gangsters",
  opponentId: 2,
  opponentName: "Chris D",
  opponentTeamName: "Sunday Scaries",
  pointsFor,
  pointsAgainst,
  result: pointsFor > pointsAgainst ? "W" : pointsFor < pointsAgainst ? "L" : "T",
  wkApWins: 6,
  wkApLosses: 3,
  wkApTies: 0,
  wkApWinPct: 0.667,
  wkDivRank: 4,
  gameLuck,
  luckCategory,
  scope: "GAME",
  deservedWins: luckCategory === "Deserved Win" ? 1 : 0,
  luckyWins: luckCategory === "Lucky Win" ? 1 : 0,
  tossUps: luckCategory === "Toss-Up" ? 1 : 0,
  unluckyLosses: luckCategory === "Unlucky Loss" ? 1 : 0,
  deservedLosses: luckCategory === "Deserved Loss" ? 1 : 0,
});

export const MOCK_GAME_LUCK: ManagerGameLuckRow[] = [
  mockGameLuck(3, 141.2, 118.06, 0.111, "Deserved Win"),
  mockGameLuck(9, 96.4, 92.1, 0.778, "Lucky Win"),
  mockGameLuck(12, 128.8, 131.02, -0.556, "Unlucky Loss"),
];

export const MOCK_DIV_ALL_PLAY_GAMES: DivAllPlayMatchupRow[] = [
  {
    seasonYear: 2019,
    leagueId: 101,
    leagueName: "VFFL - Red Division",
    week: 1,
    homeMgrId: 1,
    homeManager: "Matt M",
    homeTeam: "Gridiron Gangsters",
    awayMgrId: 2,
    awayManager: "Chris D",
    awayTeam: "Sunday Scaries",
    homeFpts: 131.4,
    awayFpts: 109.22,
    diff: 22.18,
  },
  {
    seasonYear: 2019,
    leagueId: 101,
    leagueName: "VFFL - Red Division",
    week: 2,
    homeMgrId: 1,
    homeManager: "Matt M",
    homeTeam: "Gridiron Gangsters",
    awayMgrId: 2,
    awayManager: "Chris D",
    awayTeam: "Sunday Scaries",
    homeFpts: 98.6,
    awayFpts: 117.3,
    diff: -18.7,
  },
];
