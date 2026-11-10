"use client";

import { useState, Fragment } from "react";
import type {
  MatchupRow,
  StandingsRow,
  StandingsViewMode,
} from "@/app/vffl/standings/mockData";

interface StandingsTableProps {
  rows: StandingsRow[];
  viewMode: StandingsViewMode;
  teamMatchupsMap?: Record<string, MatchupRow[]>;
  seasonYear: number;
  week: number;
}

type PlayoffTier = "BYE" | "PLAYOFFS" | "OUTSIDE";

function getPlayoffTier(rowIndex: number): PlayoffTier {
  if (rowIndex < 2) return "BYE";
  if (rowIndex < 6) return "PLAYOFFS";
  return "OUTSIDE";
}

function getTierHeaderMeta(
  rowIndex: number
): { title: string; tier: PlayoffTier } | null {
  if (rowIndex === 0) {
    return {
      title: "Playoff Bye-Week",
      tier: "BYE",
    };
  }
  if (rowIndex === 2) {
    return {
      title: "Make Playoffs",
      tier: "PLAYOFFS",
    };
  }
  if (rowIndex === 6) {
    return {
      title: "Miss Playoffs",
      tier: "OUTSIDE",
    };
  }
  return null;
}

function formatStanding(standing: number | null | undefined): string {
  if (standing === null || standing === undefined || standing <= 0) return "#-";
  return `#${standing}`;
}

function formatWinPct(winPct: number | null | undefined): string {
  if (winPct === null || winPct === undefined) return ".000";
  const normalized = winPct > 1 ? winPct / 100 : winPct;
  if (normalized >= 1) return "1.000";
  return normalized.toFixed(3).replace(/^0/, "");
}

function formatScore(val: number | null | undefined): string {
  if (val === null || val === undefined) return "0.00";
  return val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSignedDiff(val: number | null | undefined): string {
  if (val === null || val === undefined) return "0.00";
  const prefix = val > 0 ? "+" : val < 0 ? "-" : "";
  return `${prefix}${Math.abs(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMatchupType(
  matchupType: string | null | undefined,
  week: number | null | undefined
): string {
  const wkPrefix = week ? `Wk ${week}` : "";
  const raw = (matchupType ?? "REGULAR").trim();
  const normalized =
    raw.toUpperCase() === "NONE" || raw.toUpperCase() === "REGULAR"
      ? "Regular"
      : raw.replace(/_/g, " ");
  return wkPrefix ? `${wkPrefix} • ${normalized}` : normalized;
}

function getShortDivisionBadge(leagueName: string | null | undefined): string {
  if (!leagueName) return "";
  if (leagueName.toLowerCase().includes("red")) return "RED";
  if (leagueName.toLowerCase().includes("black")) return "BLK";
  return leagueName;
}

export default function StandingsTable({
  rows,
  viewMode,
  teamMatchupsMap = {},
  seasonYear,
  week,
}: StandingsTableProps) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const isH2H = viewMode === "H2H";
  const isOverall = viewMode === "VFFL";
  const totalCols = isH2H ? 12 : 11;

  const toggleRow = (rowKey: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  return (
    <section
      aria-label={`${viewMode} Standings Table`}
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
            Season {seasonYear} • Through Week {week}
          </span>
          <h2
            className="text-lg sm:text-xl font-black uppercase tracking-tight"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {viewMode === "H2H" && "Head-to-Head Standings"}
            {viewMode === "DIV" && "Division All-Play Standings"}
            {viewMode === "VFFL" && "VFFL Overall All-Play Standings"}
          </h2>
        </div>

        {/* Playoff Legend Pills (H2H Only) */}
        {isH2H && (
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-lg border border-[var(--vfsn-border)] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    "var(--nav-highlight, var(--vfsn-accent-1))",
                }}
              />
              <span>Playoff Bye-Week</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg border border-[var(--vfsn-border)] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "var(--nav-text, var(--vfsn-text))",
                }}
              />
              <span>Make Playoffs</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg border border-[var(--vfsn-border)] flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
            >
              <span className="w-2 h-2 rounded-full border border-current" />
              <span>Miss Playoffs</span>
            </div>
          </div>
        )}
      </header>

      {/* Standings Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--vfsn-border)]">
        <table
          className="w-full text-left border-collapse"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <colgroup>
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: isH2H ? "21%" : "23%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: isH2H ? "8%" : "10%" }} />
            {isH2H && <col style={{ width: "4%" }} />}
          </colgroup>
          <thead>
            <tr
              className="border-b border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.15em]"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.38)",
                color: "var(--nav-text, var(--vfsn-text))",
              }}
            >
              <th className="py-3 px-2 text-center">+/-</th>
              <th className="py-3 px-2 text-center border-r border-[var(--vfsn-border)]">
                Rank
              </th>
              <th className="py-3 px-4 text-left border-r border-[var(--vfsn-border)]">
                Team
              </th>
              <th className="py-3 px-2 text-center">W</th>
              <th className="py-3 px-2 text-center">L</th>
              <th className="py-3 px-2 text-center">T</th>
              <th className="py-3 px-2 text-center border-r border-[var(--vfsn-border)]">
                Win%
              </th>
              <th className="py-3 px-2 text-center">PF</th>
              <th className="py-3 px-2 text-center">PA</th>
              <th className="py-3 px-2 text-center">Diff</th>
              <th
                className={`py-3 px-2 text-center ${
                  isH2H ? "border-r border-[var(--vfsn-border)]" : ""
                }`}
              >
                Avg Diff
              </th>
              {isH2H && (
                <th className="py-3 px-2 text-center">
                  <span className="sr-only">Matchups</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--vfsn-border)]">
            {rows.length === 0 ? (
              <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                <td
                  colSpan={totalCols}
                  className="py-8 px-4 text-center text-sm font-semibold opacity-70"
                >
                  No standings data available for Season {seasonYear}, Week{" "}
                  {week}.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const rowKey = `${row.leagueId ?? "lg"}-${row.managerId ?? idx}`;
                const tier = isH2H ? getPlayoffTier(idx) : null;
                const tierHeader = isH2H ? getTierHeaderMeta(idx) : null;
                const isExpanded = Boolean(expandedKeys[rowKey]);
                const standingDiff = row.standingDiff ?? 0;
                const diffVal = row.diff ?? 0;
                const avgDiffVal = row.avgDiff ?? 0;

                const teamMatchups =
                  teamMatchupsMap[rowKey] ??
                  teamMatchupsMap[String(row.managerId ?? "")] ??
                  teamMatchupsMap[row.teamName ?? ""] ??
                  [];

                const isBye = isH2H && tier === "BYE";
                const isPlayoffs = isH2H && tier === "PLAYOFFS";
                const isOutside = isH2H && tier === "OUTSIDE";

                return (
                  <Fragment key={rowKey}>
                    {/* Playoff Tier Grouping Banner Row (H2H Only) */}
                    {tierHeader && (
                      <tr
                        className="border-y border-[var(--vfsn-border)]"
                        style={{
                          backgroundColor:
                            tierHeader.tier === "BYE"
                              ? "rgba(0, 0, 0, 0.45)"
                              : tierHeader.tier === "PLAYOFFS"
                                ? "rgba(0, 0, 0, 0.35)"
                                : "rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        <td colSpan={totalCols} className="py-2 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  tierHeader.tier === "BYE"
                                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                    : tierHeader.tier === "PLAYOFFS"
                                      ? "var(--nav-text, var(--vfsn-text))"
                                      : "var(--vfsn-border)",
                              }}
                            />
                            <span
                              className="text-[10px] font-black uppercase tracking-[0.18em]"
                              style={{
                                color:
                                  tierHeader.tier === "BYE"
                                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                    : "var(--nav-text, var(--vfsn-text))",
                                opacity:
                                  tierHeader.tier === "OUTSIDE" ? 0.65 : 1,
                              }}
                            >
                              {tierHeader.title}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Team Standings Row */}
                    <tr
                      onClick={isH2H ? () => toggleRow(rowKey) : undefined}
                      className={`transition-colors ${
                        isH2H ? "cursor-pointer hover:bg-white/[0.04]" : ""
                      } ${isOutside ? "opacity-70" : ""}`}
                      style={{
                        backgroundColor: isH2H
                          ? isBye
                            ? "rgba(0, 0, 0, 0.16)"
                            : isPlayoffs
                              ? "rgba(0, 0, 0, 0.22)"
                              : "rgba(0, 0, 0, 0.34)"
                          : "rgba(0, 0, 0, 0.2)",
                        borderLeft: isH2H
                          ? isBye
                            ? "4px solid var(--nav-highlight, var(--vfsn-accent-1))"
                            : isPlayoffs
                              ? "4px solid var(--nav-text, var(--vfsn-text))"
                              : "4px solid transparent"
                          : undefined,
                      }}
                    >
                      {/* 1. standing_diff */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {standingDiff > 0 ? (
                          <span
                            className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums border border-[var(--vfsn-border)]"
                            style={{
                              backgroundColor: "rgba(0, 0, 0, 0.3)",
                              color:
                                "var(--nav-highlight, var(--vfsn-accent-1))",
                            }}
                          >
                            <span>▲</span>
                            <span>{standingDiff}</span>
                          </span>
                        ) : standingDiff < 0 ? (
                          <span
                            className="inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums opacity-75 border border-[var(--vfsn-border)]"
                            style={{
                              backgroundColor: "rgba(0, 0, 0, 0.3)",
                              color: "var(--nav-text, var(--vfsn-text))",
                            }}
                          >
                            <span>▼</span>
                            <span>{Math.abs(standingDiff)}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold opacity-40 tabular-nums">
                            —
                          </span>
                        )}
                      </td>

                      {/* 2. standing (#1, #2, etc.) */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap border-r border-[var(--vfsn-border)]">
                        <span
                          className="inline-flex items-center justify-center min-w-[36px] px-2 py-1 rounded-lg text-xs font-black tabular-nums border border-[var(--vfsn-border)]"
                          style={
                            isBye
                              ? {
                                  backgroundColor:
                                    "var(--nav-highlight, var(--vfsn-accent-1))",
                                  color:
                                    "var(--nav-background, var(--vfsn-surface))",
                                }
                              : {
                                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                                  color: "var(--nav-text, var(--vfsn-text))",
                                }
                          }
                        >
                          {formatStanding(row.standing)}
                        </span>
                      </td>

                      {/* 3. team_name */}
                      <td className="py-3.5 px-4 whitespace-nowrap border-r border-[var(--vfsn-border)]">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className="text-sm font-black tracking-tight"
                            style={{
                              color: isBye
                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                : "var(--nav-text, var(--vfsn-text))",
                            }}
                          >
                            {row.teamName ?? "Unknown Team"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {row.managerName && (
                              <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                                {row.managerName}
                              </span>
                            )}
                            {isOverall && row.leagueName && (
                              <span
                                className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-[0.14em] border border-[var(--vfsn-border)] opacity-80"
                                style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
                              >
                                {getShortDivisionBadge(row.leagueName)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. wins */}
                      <td className="py-3.5 px-2 text-center text-sm font-extrabold tabular-nums whitespace-nowrap">
                        {row.wins ?? 0}
                      </td>

                      {/* 5. losses */}
                      <td className="py-3.5 px-2 text-center text-sm font-bold tabular-nums opacity-85 whitespace-nowrap">
                        {row.losses ?? 0}
                      </td>

                      {/* 6. ties */}
                      <td className="py-3.5 px-2 text-center text-sm font-semibold tabular-nums opacity-70 whitespace-nowrap">
                        {row.ties ?? 0}
                      </td>

                      {/* 7. wins_pct */}
                      <td
                        className="py-3.5 px-2 text-center text-sm font-black tabular-nums whitespace-nowrap border-r border-[var(--vfsn-border)]"
                        style={{
                          color: isBye
                            ? "var(--nav-highlight, var(--vfsn-accent-1))"
                            : "var(--nav-text, var(--vfsn-text))",
                        }}
                      >
                        {formatWinPct(row.winPct)}
                      </td>

                      {/* 8. points_for */}
                      <td
                        className="py-3.5 px-2 text-center text-sm font-black tabular-nums whitespace-nowrap"
                        style={{
                          color: "var(--nav-highlight, var(--vfsn-accent-1))",
                        }}
                      >
                        {formatScore(row.pointsFor)}
                      </td>

                      {/* 9. points_against */}
                      <td className="py-3.5 px-2 text-center text-sm font-semibold tabular-nums opacity-85 whitespace-nowrap">
                        {formatScore(row.pointsAgainst)}
                      </td>

                      {/* 10. diff */}
                      <td
                        className="py-3.5 px-2 text-center text-sm font-extrabold tabular-nums whitespace-nowrap"
                        style={{
                          color:
                            diffVal > 0
                              ? "var(--nav-highlight, var(--vfsn-accent-1))"
                              : "var(--nav-text, var(--vfsn-text))",
                          opacity: diffVal < 0 ? 0.75 : 1,
                        }}
                      >
                        {formatSignedDiff(diffVal)}
                      </td>

                      {/* 11. avg_diff */}
                      <td
                        className={`py-3.5 px-2 text-center text-sm font-bold tabular-nums whitespace-nowrap ${
                          isH2H ? "border-r border-[var(--vfsn-border)]" : ""
                        }`}
                        style={{
                          color:
                            avgDiffVal > 0
                              ? "var(--nav-highlight, var(--vfsn-accent-1))"
                              : "var(--nav-text, var(--vfsn-text))",
                          opacity: avgDiffVal < 0 ? 0.75 : 0.9,
                        }}
                      >
                        {formatSignedDiff(avgDiffVal)}
                      </td>

                      {/* 12. Expandable Arrow Toggle (H2H View Only) */}
                      {isH2H && (
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(rowKey);
                            }}
                            aria-expanded={isExpanded}
                            aria-label={`Toggle matchups for ${row.teamName ?? "Team"}`}
                            className="w-7 h-7 rounded-lg border border-[var(--vfsn-border)] inline-flex items-center justify-center transition-colors cursor-pointer"
                            style={{
                              backgroundColor: isExpanded
                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                : "rgba(0, 0, 0, 0.3)",
                              color: isExpanded
                                ? "var(--nav-background, var(--vfsn-surface))"
                                : "var(--nav-text, var(--vfsn-text))",
                            }}
                          >
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Nested Expandable H2H Matchup Table */}
                    {isH2H && isExpanded && (
                      <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.36)" }}>
                        <td
                          colSpan={totalCols}
                          className="p-5 border-t border-[var(--vfsn-border)]"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[11px] font-black uppercase tracking-[0.16em]"
                                style={{
                                  color:
                                    "var(--nav-highlight, var(--vfsn-accent-1))",
                                }}
                              >
                                {row.teamName} • Season {seasonYear} Matchup Log
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-65">
                                Weeks 1 – {week}
                              </span>
                            </div>

                            <div className="w-full rounded-xl border border-[var(--vfsn-border)] overflow-hidden">
                              <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                  <tr
                                    className="border-b border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.14em]"
                                    style={{
                                      backgroundColor: "rgba(0, 0, 0, 0.42)",
                                      color: "var(--nav-text, var(--vfsn-text))",
                                    }}
                                  >
                                    <th className="py-2.5 px-3.5 w-[16%]">
                                      Matchup Type
                                    </th>
                                    <th className="py-2.5 px-3.5 w-[20%]">
                                      Home Team
                                    </th>
                                    <th className="py-2.5 px-3.5 text-center w-[12%]">
                                      Home Score
                                    </th>
                                    <th className="py-2.5 px-3.5 text-center w-[12%]">
                                      Away Score
                                    </th>
                                    <th className="py-2.5 px-3.5 w-[20%]">
                                      Away Team
                                    </th>
                                    <th className="py-2.5 px-3.5 text-center w-[10%]">
                                      Diff
                                    </th>
                                    <th className="py-2.5 px-3.5 text-center w-[10%]">
                                      Win / Loss
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--vfsn-border)]">
                                  {teamMatchups.length === 0 ? (
                                    <tr
                                      style={{
                                        backgroundColor: "rgba(0, 0, 0, 0.2)",
                                      }}
                                    >
                                      <td
                                        colSpan={7}
                                        className="py-4 px-4 text-center text-xs font-semibold opacity-70"
                                      >
                                        No matchups recorded through Week {week}
                                        .
                                      </td>
                                    </tr>
                                  ) : (
                                    teamMatchups.map((m, mIdx) => {
                                      const isSelectedHome =
                                        m.homeTeam === row.teamName ||
                                        (m.homeMgr &&
                                          row.managerName &&
                                          m.homeMgr === row.managerName);

                                      const homeScore = m.homeScore ?? 0;
                                      const awayScore = m.awayScore ?? 0;
                                      const rawDiff =
                                        m.diff ?? homeScore - awayScore;
                                      const orientedDiff = isSelectedHome
                                        ? rawDiff
                                        : -rawDiff;

                                      const orientedOutcome =
                                        orientedDiff > 0
                                          ? "W"
                                          : orientedDiff < 0
                                            ? "L"
                                            : "T";

                                      const isWin = orientedOutcome === "W";

                                      return (
                                        <tr
                                          key={`${m.matchupId ?? mIdx}-${m.week ?? mIdx}`}
                                          style={{
                                            backgroundColor:
                                              "rgba(0, 0, 0, 0.22)",
                                          }}
                                        >
                                          {/* 1. matchup_type */}
                                          <td className="py-2.5 px-3.5 text-xs font-bold uppercase tracking-wider opacity-85 whitespace-nowrap">
                                            {formatMatchupType(
                                              m.matchupType,
                                              m.week
                                            )}
                                          </td>

                                          {/* 2. home_team */}
                                          <td
                                            className="py-2.5 px-3.5 text-xs font-extrabold whitespace-nowrap"
                                            style={{
                                              color: isSelectedHome
                                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                                : "var(--nav-text, var(--vfsn-text))",
                                            }}
                                          >
                                            {m.homeTeam ?? "Home Team"}
                                          </td>

                                          {/* 3. home_score */}
                                          <td
                                            className="py-2.5 px-3.5 text-xs font-black tabular-nums text-center whitespace-nowrap"
                                            style={{
                                              color:
                                                homeScore > awayScore
                                                  ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                                  : "var(--nav-text, var(--vfsn-text))",
                                            }}
                                          >
                                            {formatScore(m.homeScore)}
                                          </td>

                                          {/* 4. away_score */}
                                          <td
                                            className="py-2.5 px-3.5 text-xs font-black tabular-nums text-center whitespace-nowrap"
                                            style={{
                                              color:
                                                awayScore > homeScore
                                                  ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                                  : "var(--nav-text, var(--vfsn-text))",
                                            }}
                                          >
                                            {formatScore(m.awayScore)}
                                          </td>

                                          {/* 5. away_team */}
                                          <td
                                            className="py-2.5 px-3.5 text-xs font-extrabold whitespace-nowrap"
                                            style={{
                                              color: !isSelectedHome
                                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                                : "var(--nav-text, var(--vfsn-text))",
                                            }}
                                          >
                                            {m.awayTeam ?? "Away Team"}
                                          </td>

                                          {/* 6. diff (oriented to selected team) */}
                                          <td
                                            className="py-2.5 px-3.5 text-xs font-extrabold tabular-nums text-center whitespace-nowrap"
                                            style={{
                                              color: isWin
                                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                                : "var(--nav-text, var(--vfsn-text))",
                                              opacity:
                                                orientedOutcome === "L"
                                                  ? 0.75
                                                  : 1,
                                            }}
                                          >
                                            {formatSignedDiff(orientedDiff)}
                                          </td>

                                          {/* 7. win_loss (oriented to selected team) */}
                                          <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                            <span
                                              className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-[11px] font-black uppercase border border-[var(--vfsn-border)]"
                                              style={
                                                isWin
                                                  ? {
                                                      backgroundColor:
                                                        "var(--nav-highlight, var(--vfsn-accent-1))",
                                                      color:
                                                        "var(--nav-background, var(--vfsn-surface))",
                                                    }
                                                  : {
                                                      backgroundColor:
                                                        "rgba(0, 0, 0, 0.35)",
                                                      color:
                                                        "var(--nav-text, var(--vfsn-text))",
                                                      opacity: 0.75,
                                                    }
                                              }
                                            >
                                              {orientedOutcome}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
