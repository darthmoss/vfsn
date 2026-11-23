import type { PlayerStatRow } from "./statConfig";

/**
 * Strictly typed mock pool (QB group) for isolated component work.
 * Shape mirrors the exact `vffl.vw_player_stats` selection shipped by page.tsx.
 */
function mockQbWeek(
  playerId: number,
  playerName: string,
  nflAbbrev: string,
  week: number,
  s: { cmp: number; att: number; yds: number; td: number; ratt: number; ryds: number; rtd: number; share: number }
): PlayerStatRow {
  const passCmpPts = Number((s.cmp * 0.1).toFixed(2));
  const passYdsPts = Number((s.yds * 0.04).toFixed(2));
  const passTdPts = s.td * 4;
  const rushYdsPts = Number((s.ryds * 0.1).toFixed(2));
  const rushTdPts = s.rtd * 6;
  return {
    seasonYear: 2026,
    week,
    playerId,
    playerName,
    position: "QB",
    nflId: null,
    nflAbbrev,
    opponentAbbrev: null,
    actualFpts: Number((passCmpPts + passYdsPts + passTdPts + rushYdsPts + rushTdPts).toFixed(2)),
    passCmp: s.cmp,
    passAtt: s.att,
    cmpPct: Number((s.cmp / s.att).toFixed(3)),
    passYds: s.yds,
    avgPassYds: Number((s.yds / s.cmp).toFixed(2)),
    passTd: s.td,
    rushAtt: s.ratt,
    rushYds: s.ryds,
    avgRushYds: s.ratt ? Number((s.ryds / s.ratt).toFixed(2)) : 0,
    rushTd: s.rtd,
    rushShare: s.share,
    passCmpPts,
    passYdsPts,
    passTdPts,
    rushAttPts: 0,
    rushYdsPts,
    rushTdPts,
  };
}

export const MOCK_QB_POOL: PlayerStatRow[] = [
  mockQbWeek(1001, "Josh Allen", "BUF", 1, { cmp: 24, att: 35, yds: 281, td: 2, ratt: 8, ryds: 46, rtd: 1, share: 0.267 }),
  mockQbWeek(1001, "Josh Allen", "BUF", 2, { cmp: 19, att: 30, yds: 234, td: 1, ratt: 6, ryds: 15, rtd: 0, share: 0.214 }),
  mockQbWeek(1001, "Josh Allen", "BUF", 3, { cmp: 27, att: 38, yds: 312, td: 3, ratt: 9, ryds: 52, rtd: 1, share: 0.3 }),
  mockQbWeek(1002, "Lamar Jackson", "BAL", 1, { cmp: 18, att: 26, yds: 226, td: 2, ratt: 12, ryds: 88, rtd: 0, share: 0.353 }),
  mockQbWeek(1002, "Lamar Jackson", "BAL", 2, { cmp: 21, att: 29, yds: 258, td: 3, ratt: 10, ryds: 61, rtd: 1, share: 0.333 }),
  mockQbWeek(1002, "Lamar Jackson", "BAL", 4, { cmp: 16, att: 25, yds: 190, td: 1, ratt: 14, ryds: 102, rtd: 1, share: 0.4 }),
];
