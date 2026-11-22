import type { CSSProperties } from "react";
import type {
  ManagerAllPlayMatrixRow,
  ManagerH2hMatrixRow,
  ManagerSeasonHistoryRow,
} from "./mockData";

// -----------------------------------------------------------------------------
// Theme Tokens (no hardcoded hex values)
// -----------------------------------------------------------------------------
export const HIGHLIGHT = "var(--nav-highlight, var(--vfsn-accent-1))";
export const SURFACE = "var(--nav-background, var(--vfsn-surface))";
export const TEXT = "var(--nav-text, var(--vfsn-text))";
export const INSET_BG = "rgba(0, 0, 0, 0.2)";

/** Tailwind replica of the VFFL `.config-card` spec. */
export const CARD_CLASS =
  "rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)]";
export const CARD_STYLE: CSSProperties = {
  backgroundColor: SURFACE,
  color: TEXT,
};

export const TH_CLASS =
  "px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] opacity-70 border-b border-[var(--vfsn-border)]";
export const TD_CLASS = "px-4 py-3.5 border-b border-[var(--vfsn-border)]";

export const FIXED_TABLE_STYLE: CSSProperties = {
  tableLayout: "fixed",
  width: "100%",
};

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------
const TWO_DECIMALS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

export function fmtPts(v: number | null | undefined): string {
  return isNum(v) ? v.toLocaleString("en-US", TWO_DECIMALS) : "—";
}

/** Signed point margin, e.g. `+104.32` / `-88.54`. */
export function fmtSignedPts(v: number | null | undefined): string {
  if (!isNum(v)) return "—";
  const abs = Math.abs(v).toLocaleString("en-US", TWO_DECIMALS);
  if (v > 0) return `+${abs}`;
  if (v < 0) return `-${abs}`;
  return abs;
}

/** Win % to 3 decimals, baseball-style (`.615`, `1.000`). */
export function fmtWinPct(
  v: number | null | undefined,
  fallback = "—"
): string {
  if (!isNum(v)) return fallback;
  const s = v.toFixed(3);
  return s.startsWith("0.") ? s.slice(1) : s;
}

export function fmtLuck(v: number | null | undefined, digits = 2): string {
  if (!isNum(v)) return "—";
  const s = Math.abs(v).toFixed(digits);
  if (v > 0) return `+${s}`;
  if (v < 0) return `-${s}`;
  return s;
}

export function fmtCount(v: number | null | undefined): string {
  return isNum(v) ? v.toLocaleString("en-US") : "—";
}

// -----------------------------------------------------------------------------
// Expandable Matrix Normalization (shared by H2H & Division All-Play)
// -----------------------------------------------------------------------------
export interface MatrixMetrics {
  record: string | null;
  winPct: number | null;
  pointsFor: number | null;
  pointsAgainst: number | null;
  avgPointsFor: number | null;
  avgPointsAgainst: number | null;
}

export interface MatrixSeasonRow extends MatrixMetrics {
  seasonYear: number;
}

export interface MatrixOpponentGroup extends MatrixMetrics {
  opponentId: number;
  opponentName: string;
  opponentActive: boolean;
  opponentTeamName: string | null;
  seasons: MatrixSeasonRow[];
}

function safeAvg(total: number | null, games: number): number | null {
  return total !== null && games > 0 ? total / games : null;
}

function h2hMetrics(r: ManagerH2hMatrixRow): MatrixMetrics {
  const games = (r.wins ?? 0) + (r.losses ?? 0) + (r.ties ?? 0);
  return {
    record: r.record,
    winPct: r.winPct,
    pointsFor: r.pointsFor,
    pointsAgainst: r.pointsAgainst,
    avgPointsFor: safeAvg(r.pointsFor, games),
    avgPointsAgainst: safeAvg(r.pointsAgainst, games),
  };
}

function allPlayMetrics(r: ManagerAllPlayMatrixRow): MatrixMetrics {
  return {
    record: r.record,
    winPct: r.winPct,
    pointsFor: r.pointsForSum,
    pointsAgainst: r.pointsAgainstSum,
    avgPointsFor: r.pointsForAvg,
    avgPointsAgainst: r.pointsAgainstAvg,
  };
}

function buildGroups<
  R extends {
    scope: string | null;
    seasonYear: number | null;
    opponentId: number | null;
    opponentName: string | null;
    opponentActive: boolean | null;
    opponentTeamName: string | null;
  },
>(rows: R[], toMetrics: (r: R) => MatrixMetrics): MatrixOpponentGroup[] {
  const seasonsByOpp = new Map<number, Map<number, MatrixSeasonRow>>();
  for (const r of rows) {
    if (r.scope !== "SEASON" || r.opponentId === null || r.seasonYear === null)
      continue;
    let yearMap = seasonsByOpp.get(r.opponentId);
    if (!yearMap) {
      yearMap = new Map<number, MatrixSeasonRow>();
      seasonsByOpp.set(r.opponentId, yearMap);
    }
    if (!yearMap.has(r.seasonYear)) {
      yearMap.set(r.seasonYear, {
        seasonYear: r.seasonYear,
        ...toMetrics(r),
      });
    }
  }

  const seenOpponents = new Set<number>();
  return rows
    .filter((r): r is R & { opponentId: number } => {
      if (r.scope !== "CAREER" || r.opponentId === null) return false;
      if (seenOpponents.has(r.opponentId)) return false;
      seenOpponents.add(r.opponentId);
      return true;
    })
    .map((r) => ({
      opponentId: r.opponentId,
      opponentName: r.opponentName ?? "Unknown Manager",
      opponentActive: r.opponentActive ?? false,
      opponentTeamName: r.opponentTeamName,
      ...toMetrics(r),
      seasons: Array.from(seasonsByOpp.get(r.opponentId)?.values() ?? []).sort(
        (a, b) => b.seasonYear - a.seasonYear
      ),
    }))
    .sort(
      (a, b) =>
        Number(b.opponentActive) - Number(a.opponentActive) ||
        a.opponentName.localeCompare(b.opponentName)
    );
}

export function dedupeSeasons(
  seasons: ManagerSeasonHistoryRow[]
): (ManagerSeasonHistoryRow & { seasonYear: number })[] {
  const byYear = new Map<
    number,
    ManagerSeasonHistoryRow & { seasonYear: number }
  >();

  for (const s of seasons) {
    if (s.seasonYear === null) continue;
    const dated = s as ManagerSeasonHistoryRow & { seasonYear: number };
    const existing = byYear.get(dated.seasonYear);
    if (!existing) {
      byYear.set(dated.seasonYear, dated);
      continue;
    }
    const existingScore =
      (existing.h2hWins ?? 0) +
      (existing.h2hLosses ?? 0) +
      (existing.h2hTies ?? 0) +
      (existing.pointsFor ?? 0);
    const nextScore =
      (dated.h2hWins ?? 0) +
      (dated.h2hLosses ?? 0) +
      (dated.h2hTies ?? 0) +
      (dated.pointsFor ?? 0);
    if (nextScore > existingScore) {
      byYear.set(dated.seasonYear, dated);
    }
  }

  return Array.from(byYear.values()).sort(
    (a, b) => b.seasonYear - a.seasonYear
  );
}

export function buildH2HGroups(
  rows: ManagerH2hMatrixRow[]
): MatrixOpponentGroup[] {
  return buildGroups(rows, h2hMetrics);
}

export function buildAllPlayGroups(
  rows: ManagerAllPlayMatrixRow[]
): MatrixOpponentGroup[] {
  return buildGroups(rows, allPlayMetrics);
}
