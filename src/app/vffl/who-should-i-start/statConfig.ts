import type { InferSelectViewModel } from "drizzle-orm";
import type { vfflVwPlayerStats } from "@/db/schema";

// -----------------------------------------------------------------------------
// Data Contract (vffl.vw_player_stats)
// -----------------------------------------------------------------------------
export type PlayerStatViewRow = InferSelectViewModel<typeof vfflVwPlayerStats>;

/** Identity columns always selected regardless of position group. */
export const BASE_KEYS = [
  "seasonYear",
  "week",
  "playerId",
  "playerName",
  "position",
  "nflId",
  "nflAbbrev",
  "opponentAbbrev",
  "actualFpts",
] as const;
type BaseKey = (typeof BASE_KEYS)[number];

type NumericKey = {
  [K in keyof PlayerStatViewRow]-?: PlayerStatViewRow[K] extends number | null
    ? K
    : never;
}[keyof PlayerStatViewRow];

/** Every numeric stat / points column exposed by the view. */
export type StatKey = Exclude<
  NumericKey,
  "seasonYear" | "week" | "playerId" | "nflId" | "opponentId"
>;

/**
 * A weekly row as shipped to the client. Identity columns are guaranteed;
 * stat columns are present only for the active position group.
 */
export type PlayerStatRow = Pick<PlayerStatViewRow, BaseKey> &
  Partial<Pick<PlayerStatViewRow, Exclude<StatKey, "actualFpts">>>;

export const val = (row: PlayerStatRow, key: StatKey): number =>
  row[key] ?? 0;

// -----------------------------------------------------------------------------
// Position Groups
// -----------------------------------------------------------------------------
export type PositionGroup = "qb" | "flex" | "k" | "dst";
export type StatFormat = "count" | "decimal" | "pct" | "points";

export interface RadarAxisDef {
  axis: string;
  label: string;
  points: StatKey;
}

export interface StatExtraDef {
  label: string;
  /** Summed numerator column. */
  num: StatKey;
  /** Optional summed denominator — renders `sum(num) / sum(den)`. */
  den?: StatKey;
  format: StatFormat;
}

export interface StatRowDef {
  key: string;
  label: string;
  /** Weekly value plotted on the line chart. */
  value: StatKey;
  /** Paired fantasy points column. */
  points?: StatKey;
  /** `sum` = counting stat; `rate` = per-attempt / share metric. */
  mode: "sum" | "rate";
  /** Season aggregate for rate stats (`sum(num) / sum(den)`); falls back to weekly mean. */
  rate?: { num: StatKey; den: StatKey };
  format: StatFormat;
  /** Raw value where fewer is better (D/ST Points / Yards Allowed). */
  lowerIsBetter?: boolean;
  extras?: StatExtraDef[];
}

export interface PositionGroupConfig {
  key: PositionGroup;
  label: string;
  positions: string[];
  columns: StatKey[];
  radar: RadarAxisDef[];
  rows: StatRowDef[];
}

const ACTUAL_FPTS_ROW: StatRowDef = {
  key: "actual-fpts",
  label: "Actual Fpts",
  value: "actualFpts",
  mode: "sum",
  format: "points",
};

const RUSH_ROWS: StatRowDef[] = [
  {
    key: "rush-att",
    label: "Rush Attempts",
    value: "rushAtt",
    points: "rushAttPts",
    mode: "sum",
    format: "count",
  },
  {
    key: "yds-per-rush",
    label: "Yards / Rush",
    value: "avgRushYds",
    mode: "rate",
    rate: { num: "rushYds", den: "rushAtt" },
    format: "decimal",
  },
  {
    key: "rush-td",
    label: "Rush TDs",
    value: "rushTd",
    points: "rushTdPts",
    mode: "sum",
    format: "count",
  },
  {
    key: "rush-share",
    label: "Rush Share",
    value: "rushShare",
    mode: "rate",
    format: "pct",
  },
];

export const POSITION_GROUPS: Record<PositionGroup, PositionGroupConfig> = {
  qb: {
    key: "qb",
    label: "QB",
    positions: ["QB"],
    columns: [
      "passCmp", "passAtt", "cmpPct", "passYds", "avgPassYds", "passTd",
      "rushAtt", "rushYds", "avgRushYds", "rushTd", "rushShare",
      "passCmpPts", "passYdsPts", "passTdPts", "rushAttPts", "rushYdsPts", "rushTdPts",
    ],
    radar: [
      { axis: "COMP", label: "Completions", points: "passCmpPts" },
      { axis: "PYD", label: "Passing Yards", points: "passYdsPts" },
      { axis: "PTD", label: "Passing TDs", points: "passTdPts" },
      { axis: "RYD", label: "Rushing Yards", points: "rushYdsPts" },
      { axis: "RTD", label: "Rushing TDs", points: "rushTdPts" },
    ],
    rows: [
      ACTUAL_FPTS_ROW,
      {
        key: "completions",
        label: "Completions",
        value: "passCmp",
        points: "passCmpPts",
        mode: "sum",
        format: "count",
        extras: [
          { label: "ATT", num: "passAtt", format: "count" },
          { label: "CMP %", num: "passCmp", den: "passAtt", format: "pct" },
        ],
      },
      {
        key: "pass-yds",
        label: "Passing Yards",
        value: "passYds",
        points: "passYdsPts",
        mode: "sum",
        format: "count",
      },
      {
        key: "yds-per-pass",
        label: "Yards / Pass",
        value: "avgPassYds",
        mode: "rate",
        // Mirrors the view's avg_pass_yds definition (pass_yds / pass_cmp)
        rate: { num: "passYds", den: "passCmp" },
        format: "decimal",
      },
      {
        key: "pass-td",
        label: "Passing TDs",
        value: "passTd",
        points: "passTdPts",
        mode: "sum",
        format: "count",
      },
      ...RUSH_ROWS,
    ],
  },
  flex: {
    key: "flex",
    label: "RB / WR / TE",
    positions: ["RB", "WR", "TE"],
    columns: [
      "rushAtt", "rushYds", "avgRushYds", "rushTd", "rushShare",
      "rec", "targets", "targetShare", "recYds", "avgRecYds", "recTd",
      "rushAttPts", "rushYdsPts", "rushTdPts", "recPts", "recYdsPts", "recTdPts",
    ],
    radar: [
      { axis: "RYD", label: "Rushing Yards", points: "rushYdsPts" },
      { axis: "RTD", label: "Rushing TDs", points: "rushTdPts" },
      { axis: "REC", label: "Receptions", points: "recPts" },
      { axis: "REYD", label: "Receiving Yards", points: "recYdsPts" },
      { axis: "RETD", label: "Receiving TDs", points: "recTdPts" },
    ],
    rows: [
      ACTUAL_FPTS_ROW,
      ...RUSH_ROWS,
      {
        key: "receptions",
        label: "Receptions",
        value: "rec",
        points: "recPts",
        mode: "sum",
        format: "count",
        extras: [
          { label: "TGT", num: "targets", format: "count" },
          { label: "CATCH %", num: "rec", den: "targets", format: "pct" },
        ],
      },
      {
        key: "target-share",
        label: "Target Share",
        value: "targetShare",
        mode: "rate",
        format: "pct",
      },
      {
        key: "rec-yds",
        label: "Receiving Yards",
        value: "recYds",
        points: "recYdsPts",
        mode: "sum",
        format: "count",
      },
      {
        key: "yds-per-rec",
        label: "Yards / Reception",
        value: "avgRecYds",
        mode: "rate",
        rate: { num: "recYds", den: "rec" },
        format: "decimal",
      },
      {
        key: "rec-td",
        label: "Receiving TDs",
        value: "recTd",
        points: "recTdPts",
        mode: "sum",
        format: "count",
      },
    ],
  },
  k: {
    key: "k",
    label: "K",
    positions: ["K"],
    columns: [
      "fgAtt", "fgMade", "fgYdsMade", "patMade",
      "fgAttPts", "fgMadePts", "fgYdsMadePts", "patMadePts",
    ],
    radar: [
      { axis: "FGM", label: "FG Made", points: "fgMadePts" },
      { axis: "FG", label: "FG Yards Made", points: "fgYdsMadePts" },
      { axis: "PAT", label: "PAT Made", points: "patMadePts" },
    ],
    rows: [
      {
        key: "fg-made",
        label: "FG Made",
        value: "fgMade",
        points: "fgMadePts",
        mode: "sum",
        format: "count",
        extras: [
          { label: "ATT", num: "fgAtt", format: "count" },
          { label: "FG %", num: "fgMade", den: "fgAtt", format: "pct" },
        ],
      },
      {
        key: "fg-yds",
        label: "FG Yards Made",
        value: "fgYdsMade",
        points: "fgYdsMadePts",
        mode: "sum",
        format: "count",
      },
      {
        key: "pat-made",
        label: "PAT Made",
        value: "patMade",
        points: "patMadePts",
        mode: "sum",
        format: "count",
      },
    ],
  },
  dst: {
    key: "dst",
    label: "D/ST",
    positions: ["D/ST", "DST", "DEF"],
    columns: [
      "ptsAgainst", "ydsAllowed", "fumblesForced", "defInt", "defSacks", "defTd",
      "ptsAgainstPts", "ydsAllowedPts", "fumblesForcedPts", "defIntPts", "defSacksPts", "defTdPts",
    ],
    radar: [
      { axis: "PA", label: "Points Allowed", points: "ptsAgainstPts" },
      { axis: "YA", label: "Yards Allowed", points: "ydsAllowedPts" },
      { axis: "SACK", label: "Sacks", points: "defSacksPts" },
      { axis: "INT", label: "Interceptions", points: "defIntPts" },
      { axis: "FUM", label: "Fumbles", points: "fumblesForcedPts" },
    ],
    rows: [
      {
        key: "pts-allowed",
        label: "Points Allowed",
        value: "ptsAgainst",
        points: "ptsAgainstPts",
        mode: "sum",
        format: "count",
        lowerIsBetter: true,
      },
      {
        key: "yds-allowed",
        label: "Yards Allowed",
        value: "ydsAllowed",
        points: "ydsAllowedPts",
        mode: "sum",
        format: "count",
        lowerIsBetter: true,
      },
      {
        key: "fumbles",
        label: "Fumbles Forced",
        value: "fumblesForced",
        points: "fumblesForcedPts",
        mode: "sum",
        format: "count",
      },
      {
        key: "ints",
        label: "Interceptions",
        value: "defInt",
        points: "defIntPts",
        mode: "sum",
        format: "count",
      },
      {
        key: "sacks",
        label: "Sacks",
        value: "defSacks",
        points: "defSacksPts",
        mode: "sum",
        format: "count",
      },
      {
        key: "def-td",
        label: "Defensive TDs",
        value: "defTd",
        points: "defTdPts",
        mode: "sum",
        format: "count",
      },
    ],
  },
};

export const POSITION_GROUP_ORDER: PositionGroup[] = ["qb", "flex", "k", "dst"];

export function parsePositionGroup(raw: string | undefined): PositionGroup {
  const key = (raw ?? "").toLowerCase();
  return key === "flex" || key === "k" || key === "dst" ? key : "qb";
}

// -----------------------------------------------------------------------------
// Player Pool Helpers
// -----------------------------------------------------------------------------
export interface PlayerOption {
  playerId: number;
  playerName: string;
  nflAbbrev: string;
  position: string;
  totalFpts: number;
  games: number;
}

const sum = (rows: PlayerStatRow[], key: StatKey) =>
  rows.reduce((acc, r) => acc + val(r, key), 0);

export function groupRowsByPlayer(
  rows: PlayerStatRow[]
): Map<number, PlayerStatRow[]> {
  const map = new Map<number, PlayerStatRow[]>();
  for (const row of rows) {
    if (row.playerId === null) continue;
    const list = map.get(row.playerId);
    if (list) list.push(row);
    else map.set(row.playerId, [row]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.week ?? 0) - (b.week ?? 0));
  }
  return map;
}

export function buildPlayerOptions(
  byPlayer: Map<number, PlayerStatRow[]>
): PlayerOption[] {
  return Array.from(byPlayer.entries())
    .map(([playerId, rows]) => ({
      playerId,
      playerName: rows[0]?.playerName ?? "Unknown Player",
      nflAbbrev: rows[0]?.nflAbbrev ?? "FA",
      position: rows[0]?.position ?? "",
      totalFpts: sum(rows, "actualFpts"),
      games: rows.length,
    }))
    .sort(
      (a, b) =>
        b.totalFpts - a.totalFpts || a.playerName.localeCompare(b.playerName)
    );
}

// -----------------------------------------------------------------------------
// Stat Line Computation
// -----------------------------------------------------------------------------
export interface StatLine {
  games: number;
  total: number;
  totalPts: number | null;
  avg: number;
  avgPts: number | null;
  extras: { label: string; display: string }[];
  /** Comparable edge tuple — higher wins; second entry breaks ties. */
  edge: [number, number];
}

export function computeStatLine(
  rows: PlayerStatRow[],
  def: StatRowDef
): StatLine | null {
  const games = rows.length;
  if (games === 0) return null;

  const weeklyMean = sum(rows, def.value) / games;
  let total: number;
  let avg: number;
  if (def.mode === "sum") {
    total = sum(rows, def.value);
    avg = total / games;
  } else {
    const den = def.rate ? sum(rows, def.rate.den) : 0;
    total = def.rate ? (den > 0 ? sum(rows, def.rate.num) / den : 0) : weeklyMean;
    avg = weeklyMean;
  }

  const totalPts = def.points ? sum(rows, def.points) : null;
  const avgPts = totalPts !== null ? totalPts / games : null;

  const extras = (def.extras ?? []).map((x) => {
    const num = sum(rows, x.num);
    if (x.den) {
      const den = sum(rows, x.den);
      return { label: x.label, display: formatStat(den > 0 ? num / den : 0, x.format) };
    }
    return { label: x.label, display: formatStat(num, x.format) };
  });

  // Per-game fantasy points decide the edge when available; otherwise the raw
  // metric (inverted where fewer is better, e.g. D/ST Points / Yards Allowed).
  const rawBasis = def.mode === "sum" ? avg : total;
  const signedRaw = def.lowerIsBetter ? -rawBasis : rawBasis;
  const edge: [number, number] =
    avgPts !== null ? [avgPts, signedRaw] : [signedRaw, 0];

  return { games, total, totalPts, avg, avgPts, extras, edge };
}

export type EdgeResult = "A" | "B" | "EVEN" | null;

const EPSILON = 1e-6;

export function compareEdge(
  a: { edge: [number, number] } | null,
  b: { edge: [number, number] } | null
): EdgeResult {
  if (!a || !b) return a ? "A" : b ? "B" : null;
  for (let i = 0; i < 2; i += 1) {
    const diff = a.edge[i] - b.edge[i];
    if (Math.abs(diff) > EPSILON) return diff > 0 ? "A" : "B";
  }
  return "EVEN";
}

export interface OverallLine {
  games: number;
  totalFpts: number;
  avgFpts: number;
  edge: [number, number];
}

export function computeOverall(rows: PlayerStatRow[]): OverallLine | null {
  if (rows.length === 0) return null;
  const totalFpts = sum(rows, "actualFpts");
  const avgFpts = totalFpts / rows.length;
  return { games: rows.length, totalFpts, avgFpts, edge: [avgFpts, totalFpts] };
}

/** Per-game fantasy points for each radar axis. */
export function computeRadarValues(
  rows: PlayerStatRow[],
  axes: RadarAxisDef[]
): number[] {
  if (rows.length === 0) return axes.map(() => 0);
  return axes.map((a) => sum(rows, a.points) / rows.length);
}

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------
const fixed = (v: number, digits: number) =>
  v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export function formatStat(
  v: number,
  format: StatFormat,
  { perGame = false }: { perGame?: boolean } = {}
): string {
  if (!Number.isFinite(v)) return "—";
  switch (format) {
    case "pct":
      return `${fixed(v * 100, 1)}%`;
    case "decimal":
    case "points":
      return fixed(v, 2);
    case "count":
    default:
      if (perGame) return fixed(v, 2);
      return Number.isInteger(v) ? fixed(v, 0) : fixed(v, 1);
  }
}
