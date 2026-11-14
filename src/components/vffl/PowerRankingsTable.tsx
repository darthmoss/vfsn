import type { DivisionKey } from "@/app/vffl/current-week/mockData";
import {
  POWER_FORMULA_WEIGHTS,
  type NormalizedPowerRow,
  type PowerRankingScope,
  type PowerRankingTime,
  type PowerRankingsRow,
} from "@/app/vffl/power-rankings/mockData";

interface PowerRankingsTableProps {
  rows: PowerRankingsRow[];
  scope: PowerRankingScope;
  time: PowerRankingTime;
  seasonYear: number;
  week: number;
  division: DivisionKey;
}

function toPercentage(val: number | null | undefined): number {
  if (val === null || val === undefined || Number.isNaN(val)) return 0;
  const pct = val <= 1.0001 ? val * 100 : val;
  return Math.max(0, Math.min(100, pct));
}

function normalizeRows(
  rows: PowerRankingsRow[],
  time: PowerRankingTime
): NormalizedPowerRow[] {
  const isWeek = time === "week";

  const mapped = rows.map((row, idx) => {
    const rawApWinPct = isWeek ? row.wkApWinPct : row.stdApWinPct;
    const rawEffPct = isWeek ? row.wkEffPct : row.stdEffPct;

    return {
      key: `${row.leagueId ?? "lg"}-${row.managerId ?? idx}`,
      managerId: row.managerId ?? null,
      leagueId: row.leagueId ?? null,
      leagueName: row.leagueName ?? null,
      standing: row.standing ?? null,
      teamName: row.teamName ?? "Unknown Team",
      managerName: row.managerName ?? "Manager",
      powerRank: (isWeek ? row.wkPowerRank : row.stdPowerRank) ?? idx + 1,
      rankDiff: (isWeek ? row.wkRankDiff : row.stdRankDiff) ?? 0,
      apWins: (isWeek ? row.wkApWins : row.stdApWins) ?? 0,
      apLosses: (isWeek ? row.wkApLosses : row.stdApLosses) ?? 0,
      apTies: (isWeek ? row.wkApTies : row.stdApTies) ?? 0,
      apWinPct: toPercentage(rawApWinPct),
      actFpts: (isWeek ? row.wkActFpts : row.stdActFpts) ?? 0,
      effPct: toPercentage(rawEffPct),
      perfVar: (isWeek ? row.wkPerfVar : row.stdPerfVar) ?? 0,
      optFpts: (isWeek ? row.wkOptFpts : row.stdOptFpts) ?? 0,
      powerScore: (isWeek ? row.wkPowerScore : row.stdPowerScore) ?? 0,
    };
  });

  return mapped.sort((a, b) => {
    if (a.powerRank !== b.powerRank) return a.powerRank - b.powerRank;
    if (b.powerScore !== a.powerScore) return b.powerScore - a.powerScore;
    return b.actFpts - a.actFpts;
  });
}

function formatStanding(rank: number | null | undefined): string {
  if (rank === null || rank === undefined || rank <= 0) return "#-";
  return `#${rank}`;
}

function formatScore(val: number | null | undefined): string {
  if (val === null || val === undefined) return "0.00";
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "0.0%";
  return `${pct.toFixed(1)}%`;
}

function formatPowerScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "0.00";
  return score.toFixed(2);
}

function getShortDivisionBadge(leagueName: string | null | undefined): string {
  if (!leagueName) return "";
  if (leagueName.toLowerCase().includes("red")) return "RED";
  if (leagueName.toLowerCase().includes("black")) return "BLK";
  return leagueName;
}

function computePaddedBarPct(
  val: number,
  min: number,
  max: number,
  floorPct = 15
): number {
  if (val <= 0 || max <= 0) return 0;
  const spread = max - min;
  if (spread <= 0.0001) return 100;
  const normalized = (val - min) / spread;
  return Math.max(
    floorPct,
    Math.min(100, floorPct + normalized * (100 - floorPct))
  );
}

interface MetricBarCellProps {
  fillPct: number;
  formattedValue: string;
  subLabel?: string;
  isLeader?: boolean;
}

function MetricBarCell({
  fillPct,
  formattedValue,
  subLabel,
  isLeader = false,
}: MetricBarCellProps) {
  const clampedPct = Math.max(0, Math.min(100, fillPct));

  return (
    <div className="w-full flex flex-col gap-1.5 px-1">
      {/* Horizontal Progress Bar Track */}
      <div
        className="w-full h-2.5 rounded-full overflow-hidden border border-[var(--vfsn-border)]"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.38)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${clampedPct}%`,
            backgroundColor: isLeader
              ? "var(--nav-highlight, var(--vfsn-accent-1))"
              : "var(--nav-text, var(--vfsn-text))",
            opacity: isLeader ? 1 : 0.72,
          }}
        />
      </div>

      {/* Numerical Value Directly Beneath Bar */}
      <div className="flex items-center justify-between gap-1 text-xs tabular-nums">
        <span
          className="font-extrabold tracking-tight"
          style={{
            color: isLeader
              ? "var(--nav-highlight, var(--vfsn-accent-1))"
              : "var(--nav-text, var(--vfsn-text))",
          }}
        >
          {formattedValue}
        </span>
        {subLabel && (
          <span className="text-[10px] font-bold opacity-60">{subLabel}</span>
        )}
      </div>
    </div>
  );
}

export default function PowerRankingsTable({
  rows,
  scope,
  time,
  seasonYear,
  week,
  division,
}: PowerRankingsTableProps) {
  const normalizedRows = normalizeRows(rows, time);
  const isOverall = scope === "vffl";
  const isWeek = time === "week";

  // Dynamic column bounds for padded min-max scaling
  const minActFpts =
    normalizedRows.length > 0
      ? normalizedRows.reduce((min, r) => Math.min(min, r.actFpts), Infinity)
      : 0;
  const maxActFpts = normalizedRows.reduce(
    (max, r) => Math.max(max, r.actFpts),
    0
  );

  const minOptFpts =
    normalizedRows.length > 0
      ? normalizedRows.reduce((min, r) => Math.min(min, r.optFpts), Infinity)
      : 0;
  const maxOptFpts = normalizedRows.reduce(
    (max, r) => Math.max(max, r.optFpts),
    0
  );

  const minEffPct =
    normalizedRows.length > 0
      ? normalizedRows.reduce((min, r) => Math.min(min, r.effPct), Infinity)
      : 0;
  const maxEffPct = normalizedRows.reduce(
    (max, r) => Math.max(max, r.effPct),
    0
  );

  const minPerfVar =
    normalizedRows.length > 0
      ? normalizedRows.reduce((min, r) => Math.min(min, r.perfVar), Infinity)
      : 0;
  const maxPerfVar = normalizedRows.reduce(
    (max, r) => Math.max(max, r.perfVar),
    0
  );

  const minApWinPct =
    normalizedRows.length > 0
      ? normalizedRows.reduce((min, r) => Math.min(min, r.apWinPct), Infinity)
      : 0;
  const maxApWinPct = normalizedRows.reduce(
    (max, r) => Math.max(max, r.apWinPct),
    0
  );

  const headingTitle = isOverall
    ? "VFFL Overall Power Rankings"
    : `${division} Power Rankings`;

  const timeSubtitle = isWeek
    ? `Season ${seasonYear} • Week ${week} Matrix`
    : `Season ${seasonYear} • Cumulative Through Week ${week}`;

  return (
    <section
      aria-label={headingTitle}
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-5 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* Card Header */}
      <header className="w-full flex flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--vfsn-border)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-70">
            {timeSubtitle}
          </span>
          <h2
            className="text-lg sm:text-xl font-black uppercase tracking-tight"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {headingTitle}
          </h2>
        </div>

        {/* Scale Legend Pill */}
        <div className="flex items-center gap-3">
          <div
            className="px-3.5 py-1.5 rounded-lg border border-[var(--vfsn-border)] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em]"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
              }}
            />
            <span>Column Leader</span>
          </div>
          <div
            className="px-3.5 py-1.5 rounded-lg border border-[var(--vfsn-border)] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-80"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          >
            <span>Z-Score Weighted Matrix</span>
          </div>
        </div>
      </header>

      {/* Power Rankings Widescreen Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--vfsn-border)]">
        <table
          className="w-full text-left border-collapse"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
          <thead>
            <tr
              className="border-b border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.15em]"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.38)",
                color: "var(--nav-text, var(--vfsn-text))",
              }}
            >
              <th className="py-3.5 px-2 text-center">Rank</th>
              <th className="py-3.5 px-2 text-center border-r border-[var(--vfsn-border)]">
                +/-
              </th>
              <th className="py-3.5 px-4 text-left border-r border-[var(--vfsn-border)]">
                Team
              </th>
              {POWER_FORMULA_WEIGHTS.map((factor, idx) => {
                const isLastFactor = idx === POWER_FORMULA_WEIGHTS.length - 1;
                return (
                  <th
                    key={factor.metricKey}
                    className={`py-3.5 px-3 text-left ${
                      isLastFactor ? "border-r border-[var(--vfsn-border)]" : ""
                    }`}
                  >
                    <div
                      tabIndex={0}
                      className="group relative inline-flex items-center gap-1.5 cursor-help focus:outline-none"
                    >
                      <span>{factor.shortHeader}</span>
                      <span
                        aria-hidden="true"
                        className="w-3.5 h-3.5 rounded-full border border-[var(--vfsn-border)] inline-flex items-center justify-center text-[9px] font-black leading-none opacity-60 group-hover:opacity-100 transition-opacity"
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.35)",
                          color: "var(--nav-highlight, var(--vfsn-accent-1))",
                        }}
                      >
                        i
                      </span>

                      {/* Column Header Broadcast Info Tooltip (pops downward inside table container) */}
                      <div
                        role="tooltip"
                        className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-40 absolute top-full left-0 mt-2 w-60 p-3 rounded-xl border border-[var(--vfsn-border)] shadow-[0_8px_28px_rgba(0,0,0,0.65)] text-left"
                        style={{
                          backgroundColor:
                            "var(--nav-background, var(--vfsn-surface))",
                          color: "var(--nav-text, var(--vfsn-text))",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[var(--vfsn-border)]">
                          <span
                            className="text-[10px] font-black uppercase tracking-[0.14em]"
                            style={{
                              color:
                                "var(--nav-highlight, var(--vfsn-accent-1))",
                            }}
                          >
                            {factor.label}
                          </span>
                          <span className="text-[10px] font-black tabular-nums opacity-75">
                            {factor.weight}
                          </span>
                        </div>
                        <p className="text-xs font-semibold leading-snug opacity-90 normal-case tracking-normal">
                          {factor.tooltip}
                        </p>
                      </div>
                    </div>
                  </th>
                );
              })}
              <th className="py-3.5 px-3 text-center">Power Score</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--vfsn-border)]">
            {normalizedRows.length === 0 ? (
              <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                <td
                  colSpan={9}
                  className="py-8 px-4 text-center text-sm font-semibold opacity-70"
                >
                  No power rankings data available for Season {seasonYear}, Week{" "}
                  {week}.
                </td>
              </tr>
            ) : (
              normalizedRows.map((row) => {
                const isTopRank = row.powerRank === 1;
                const isTopThree = row.powerRank <= 3;

                // Padded min-max scaling (15% floor -> 100% ceiling) so tightly clustered metrics show clear visual separation
                const apBarPct = computePaddedBarPct(
                  row.apWinPct,
                  minApWinPct,
                  maxApWinPct
                );
                const actBarPct = computePaddedBarPct(
                  row.actFpts,
                  minActFpts,
                  maxActFpts
                );
                const effBarPct = computePaddedBarPct(
                  row.effPct,
                  minEffPct,
                  maxEffPct
                );
                const perfBarPct = computePaddedBarPct(
                  row.perfVar,
                  minPerfVar,
                  maxPerfVar
                );
                const optBarPct = computePaddedBarPct(
                  row.optFpts,
                  minOptFpts,
                  maxOptFpts
                );

                const apRecordLabel =
                  row.apTies > 0
                    ? `${row.apWins}-${row.apLosses}-${row.apTies}`
                    : `${row.apWins}-${row.apLosses}`;

                return (
                  <tr
                    key={row.key}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{
                      backgroundColor: isTopRank
                        ? "rgba(0, 0, 0, 0.14)"
                        : "rgba(0, 0, 0, 0.22)",
                      borderLeft: isTopRank
                        ? "4px solid var(--nav-highlight, var(--vfsn-accent-1))"
                        : isTopThree
                          ? "4px solid var(--nav-text, var(--vfsn-text))"
                          : "4px solid transparent",
                    }}
                  >
                    {/* 1. power_rank (Heavily Weighted Anchor) */}
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <span
                        className="inline-flex items-center justify-center min-w-[44px] px-2.5 py-1.5 rounded-lg text-base font-black tabular-nums border border-[var(--vfsn-border)]"
                        style={
                          isTopRank
                            ? {
                                backgroundColor:
                                  "var(--nav-highlight, var(--vfsn-accent-1))",
                                color:
                                  "var(--nav-background, var(--vfsn-surface))",
                              }
                            : {
                                backgroundColor: "rgba(0, 0, 0, 0.34)",
                                color: isTopThree
                                  ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                  : "var(--nav-text, var(--vfsn-text))",
                              }
                        }
                      >
                        {formatStanding(row.powerRank)}
                      </span>
                    </td>

                    {/* 2. rank_diff */}
                    <td className="py-3.5 px-2 text-center whitespace-nowrap border-r border-[var(--vfsn-border)]">
                      {row.rankDiff > 0 ? (
                        <span
                          className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums border border-[var(--vfsn-border)]"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            color: "var(--nav-highlight, var(--vfsn-accent-1))",
                          }}
                        >
                          <span>▲</span>
                          <span>{row.rankDiff}</span>
                        </span>
                      ) : row.rankDiff < 0 ? (
                        <span
                          className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums opacity-75 border border-[var(--vfsn-border)]"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            color: "var(--nav-text, var(--vfsn-text))",
                          }}
                        >
                          <span>▼</span>
                          <span>{Math.abs(row.rankDiff)}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold opacity-40 tabular-nums">
                          —
                        </span>
                      )}
                    </td>

                    {/* 3. (#x) team_name with manager_name muted subtitle directly below */}
                    <td className="py-3.5 px-4 border-r border-[var(--vfsn-border)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            className="text-sm font-black tracking-tight truncate"
                            style={{
                              color: isTopRank
                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                : "var(--nav-text, var(--vfsn-text))",
                            }}
                            title={`${formatStanding(row.standing)} ${row.teamName}`}
                          >
                            <span
                              className="opacity-75 font-extrabold mr-1.5 tabular-nums"
                              style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                            >
                              {formatStanding(row.standing)}
                            </span>
                            {row.teamName}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 truncate">
                            {row.managerName}
                          </span>
                        </div>

                        {isOverall && row.leagueName && (
                          <span
                            className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-[0.14em] border border-[var(--vfsn-border)] opacity-80 shrink-0"
                            style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                          >
                            {getShortDivisionBadge(row.leagueName)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. ap_win_pct (Static 100% max) */}
                    <td className="py-3.5 px-3 align-middle">
                      <MetricBarCell
                        fillPct={apBarPct}
                        formattedValue={formatPct(row.apWinPct)}
                        subLabel={apRecordLabel}
                        isLeader={
                          maxApWinPct > 0 &&
                          Math.abs(row.apWinPct - maxApWinPct) < 0.01
                        }
                      />
                    </td>

                    {/* 5. act_fpts (Dynamic dataset max) */}
                    <td className="py-3.5 px-3 align-middle">
                      <MetricBarCell
                        fillPct={actBarPct}
                        formattedValue={formatScore(row.actFpts)}
                        isLeader={
                          maxActFpts > 0 &&
                          Math.abs(row.actFpts - maxActFpts) < 0.01
                        }
                      />
                    </td>

                    {/* 6. eff_pct (Static 100% max) */}
                    <td className="py-3.5 px-3 align-middle">
                      <MetricBarCell
                        fillPct={effBarPct}
                        formattedValue={formatPct(row.effPct)}
                        isLeader={
                          maxEffPct > 0 &&
                          Math.abs(row.effPct - maxEffPct) < 0.01
                        }
                      />
                    </td>

                    {/* 7. perf_var (Dynamic dataset max) */}
                    <td className="py-3.5 px-3 align-middle">
                      <MetricBarCell
                        fillPct={perfBarPct}
                        formattedValue={formatScore(row.perfVar)}
                        isLeader={
                          maxPerfVar > 0 &&
                          Math.abs(row.perfVar - maxPerfVar) < 0.01
                        }
                      />
                    </td>

                    {/* 8. opt_fpts (Dynamic dataset max) */}
                    <td className="py-3.5 px-3 align-middle border-r border-[var(--vfsn-border)]">
                      <MetricBarCell
                        fillPct={optBarPct}
                        formattedValue={formatScore(row.optFpts)}
                        isLeader={
                          maxOptFpts > 0 &&
                          Math.abs(row.optFpts - maxOptFpts) < 0.01
                        }
                      />
                    </td>

                    {/* 9. power_score (Heavily Weighted Anchor) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className="inline-flex items-center justify-center min-w-[76px] px-3 py-1.5 rounded-lg text-base font-black tabular-nums tracking-tight border border-[var(--vfsn-border)]"
                        style={
                          isTopRank
                            ? {
                                backgroundColor:
                                  "var(--nav-highlight, var(--vfsn-accent-1))",
                                color:
                                  "var(--nav-background, var(--vfsn-surface))",
                              }
                            : {
                                backgroundColor: "rgba(0, 0, 0, 0.34)",
                                color:
                                  row.powerScore >= 85
                                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                    : "var(--nav-text, var(--vfsn-text))",
                              }
                        }
                      >
                        {formatPowerScore(row.powerScore)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
