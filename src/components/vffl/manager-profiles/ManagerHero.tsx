"use client";

import { useState, type ReactNode } from "react";
import type {
  ManagerCareerSummaryRow,
  ManagerSeasonHistoryRow,
} from "@/app/vffl/manager-profiles/mockData";
import {
  CARD_CLASS,
  CARD_STYLE,
  HIGHLIGHT,
  INSET_BG,
  TEXT,
  fmtCount,
  fmtPts,
  fmtWinPct,
} from "@/app/vffl/manager-profiles/utils";
import { CardHeader, ChevronIcon } from "./ui";

type SeasonRow = ManagerSeasonHistoryRow & { seasonYear: number };

interface YearStatRow {
  year: number;
  value: string;
  secondary?: ReactNode;
}

function ExpandableStatTile({
  label,
  value,
  yearRows,
  open,
  onToggle,
  emphasize = false,
}: {
  label: string;
  value: string;
  yearRows: YearStatRow[];
  open: boolean;
  onToggle: () => void;
  emphasize?: boolean;
}) {
  const hasYears = yearRows.length > 0;

  return (
    <div
      className="flex flex-col rounded-lg border border-[var(--vfsn-border)] min-w-0 overflow-hidden"
      style={{ backgroundColor: INSET_BG }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasYears}
        aria-expanded={open}
        className={`w-full flex flex-col justify-between gap-2 px-4 py-3.5 text-left transition-colors ${
          hasYears ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"
        }`}
      >
        <div className="w-full flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65 truncate">
            {label}
          </span>
          {hasYears && (
            <span style={{ color: HIGHLIGHT }} className="shrink-0">
              <ChevronIcon open={open} />
            </span>
          )}
        </div>
        <span
          className="text-xl font-black tabular-nums tracking-tight truncate"
          style={emphasize ? { color: HIGHLIGHT } : undefined}
        >
          {value}
        </span>
      </button>

      {open && hasYears && (
        <div className="border-t border-[var(--vfsn-border)] px-4 py-2.5 flex flex-col gap-1.5 bg-black/15">
          {yearRows.map((row) => (
            <div
              key={row.year}
              className="flex items-center justify-between gap-2 text-xs tabular-nums"
            >
              <span className="font-bold opacity-65">{row.year}</span>
              <span className="font-bold">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandableRecordTile({
  label,
  primary,
  secondary,
  yearRows,
  open,
  onToggle,
}: {
  label: string;
  primary: string;
  secondary: ReactNode;
  yearRows: YearStatRow[];
  open: boolean;
  onToggle: () => void;
}) {
  const hasYears = yearRows.length > 0;

  return (
    <div
      className="flex flex-col rounded-lg border border-[var(--vfsn-border)] min-w-0 overflow-hidden"
      style={{ backgroundColor: INSET_BG }}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!hasYears}
        aria-expanded={open}
        className={`w-full flex flex-col justify-between gap-2 px-4 py-3.5 text-left transition-colors ${
          hasYears ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"
        }`}
      >
        <div className="w-full flex items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65 truncate">
            {label}
          </span>
          {hasYears && (
            <span style={{ color: HIGHLIGHT }} className="shrink-0">
              <ChevronIcon open={open} />
            </span>
          )}
        </div>
        <div className="w-full flex flex-row items-baseline justify-between gap-3">
          <span className="text-xl font-black tabular-nums tracking-tight truncate">
            {primary}
          </span>
          <span
            className="text-xl font-black tabular-nums tracking-tight shrink-0"
            style={{ color: HIGHLIGHT }}
          >
            {secondary}
          </span>
        </div>
      </button>

      {open && hasYears && (
        <div className="border-t border-[var(--vfsn-border)] px-4 py-2.5 flex flex-col gap-1.5 bg-black/15">
          {yearRows.map((row) => (
            <div
              key={row.year}
              className="flex items-center justify-between gap-2 text-xs tabular-nums"
            >
              <span className="font-bold opacity-65">{row.year}</span>
              <div className="flex items-baseline gap-2.5">
                <span className="font-bold">{row.value}</span>
                {row.secondary !== undefined && (
                  <span
                    className="font-black min-w-[2.5rem] text-right"
                    style={{ color: HIGHLIGHT }}
                  >
                    {row.secondary}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className="flex flex-col justify-between gap-2 px-4 py-3.5 rounded-lg border border-[var(--vfsn-border)] min-w-0"
      style={{ backgroundColor: INSET_BG }}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65 truncate">
        {label}
      </span>
      <span
        className="text-xl font-black tabular-nums tracking-tight truncate"
        style={emphasize ? { color: HIGHLIGHT } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export default function ManagerHero({
  summary,
  seasons,
  careerPowerTotal = 0,
  seasonPowerTotals = {},
  playoffFinishes = {},
}: {
  summary: ManagerCareerSummaryRow;
  seasons: SeasonRow[];
  careerPowerTotal?: number;
  seasonPowerTotals?: Record<number, number>;
  playoffFinishes?: Record<number, string>;
}) {
  const [openTiles, setOpenTiles] = useState<Record<string, boolean>>({});
  const toggleTile = (key: string) =>
    setOpenTiles((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasOverall = summary.ovrApRecord !== null;
  const careerGames =
    (summary.h2hWins ?? 0) + (summary.h2hLosses ?? 0) + (summary.h2hTies ?? 0);
  const careerAvgPa =
    careerGames > 0 && summary.totalPa !== null
      ? summary.totalPa / careerGames
      : null;

  const seasonGameCount = (s: SeasonRow) =>
    (s.h2hWins ?? 0) + (s.h2hLosses ?? 0) + (s.h2hTies ?? 0);

  const playoffTripRows: YearStatRow[] = seasons
    .filter((s) => s.madePlayoffs)
    .map((s) => ({
      year: s.seasonYear,
      value:
        playoffFinishes[s.seasonYear] ??
        (s.isChampion ? "1st" : s.isRunnerUp ? "2nd" : "Playoffs"),
    }));

  const playoffRecordRows: YearStatRow[] = seasons
    .filter(
      (s) =>
        s.madePlayoffs || (s.playoffWins ?? 0) + (s.playoffLosses ?? 0) > 0
    )
    .map((s) => {
      const pw = s.playoffWins ?? 0;
      const pl = s.playoffLosses ?? 0;
      const total = pw + pl;
      return {
        year: s.seasonYear,
        value: s.playoffRecord ?? "—",
        secondary: total > 0 ? fmtWinPct(pw / total) : "—",
      };
    });

  const championshipRows: YearStatRow[] = seasons
    .filter((s) => s.isChampion)
    .map((s) => ({
      year: s.seasonYear,
      value: s.teamName ?? "Champion",
    }));

  const runnerUpRows: YearStatRow[] = seasons
    .filter((s) => s.isRunnerUp)
    .map((s) => ({
      year: s.seasonYear,
      value: s.teamName ?? "Runner-Up",
    }));

  const pointsTitleRows: YearStatRow[] = seasons
    .filter((s) => s.isPointsTitle)
    .map((s) => ({
      year: s.seasonYear,
      value: fmtPts(s.pointsFor),
    }));

  const pfRows: YearStatRow[] = seasons.map((s) => ({
    year: s.seasonYear,
    value: fmtPts(s.pointsFor),
  }));

  const paRows: YearStatRow[] = seasons.map((s) => ({
    year: s.seasonYear,
    value: fmtPts(s.pointsAgainst),
  }));

  const avgPfRows: YearStatRow[] = seasons.map((s) => {
    const games = seasonGameCount(s);
    const val =
      s.avgPpg ??
      (games > 0 && s.pointsFor !== null ? s.pointsFor / games : null);
    return { year: s.seasonYear, value: fmtPts(val) };
  });

  const avgPaRows: YearStatRow[] = seasons.map((s) => {
    const games = seasonGameCount(s);
    const val =
      games > 0 && s.pointsAgainst !== null ? s.pointsAgainst / games : null;
    return { year: s.seasonYear, value: fmtPts(val) };
  });

  const h2hRows: YearStatRow[] = seasons.map((s) => ({
    year: s.seasonYear,
    value: s.h2hRecord ?? "—",
    secondary: fmtWinPct(s.h2hWinPct),
  }));

  const divApRows: YearStatRow[] = seasons.map((s) => ({
    year: s.seasonYear,
    value: s.divApRecord ?? "N/A",
    secondary: fmtWinPct(s.divApWinPct, "N/A"),
  }));

  const ovrApRows: YearStatRow[] = seasons.map((s) => ({
    year: s.seasonYear,
    value: s.ovrApRecord ?? "N/A",
    secondary: fmtWinPct(s.ovrApWinPct, "N/A"),
  }));

  const hasCareerPower = (summary.ovrPowerRank ?? 0) > 0;
  const powerRows: YearStatRow[] = seasons.map((s) => {
    const hasPower = (s.ovrPowerRank ?? 0) > 0;
    const totalForYear = seasonPowerTotals[s.seasonYear] ?? 0;
    return {
      year: s.seasonYear,
      value: hasPower ? fmtPts(s.ovrPowerScore) : "—",
      secondary: hasPower ? (
        <>
          {`#${s.ovrPowerRank}`}
          {totalForYear > 0 && (
            <span
              className="opacity-60 font-semibold ml-1"
              style={{ color: TEXT }}
            >
              {`/ ${totalForYear}`}
            </span>
          )}
        </>
      ) : (
        "—"
      ),
    };
  });

  return (
    <section
      className={`${CARD_CLASS} w-full h-full flex flex-col`}
      style={CARD_STYLE}
    >
      <CardHeader
        eyebrow="All-Time Resume"
        title="Career Snapshot"
        right={
          <div
            className="inline-flex items-baseline gap-2 px-3 py-1.5 rounded-lg border border-[var(--vfsn-border)] shrink-0"
            style={{ backgroundColor: INSET_BG }}
          >
            <span className="text-sm font-black tabular-nums tracking-tight">
              {fmtCount(summary.totalSeasons)}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65">
              {summary.totalSeasons === 1 ? "Season" : "Seasons"}
            </span>
          </div>
        }
      />

      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* Row 1: Playoff Trips | Playoff Record | Championships | Runner-Ups */}
        <div className="grid grid-cols-4 gap-4 items-start">
          <ExpandableStatTile
            label="Playoff Trips"
            value={fmtCount(summary.playoffTrips)}
            yearRows={playoffTripRows}
            open={!!openTiles.playoffTrips}
            onToggle={() => toggleTile("playoffTrips")}
          />
          <ExpandableRecordTile
            label="Playoff Record"
            primary={summary.playoffRecord ?? "—"}
            secondary={fmtWinPct(summary.playoffWinPct)}
            yearRows={playoffRecordRows}
            open={!!openTiles.playoffRecord}
            onToggle={() => toggleTile("playoffRecord")}
          />
          <ExpandableStatTile
            label="Championships"
            value={fmtCount(summary.championships)}
            yearRows={championshipRows}
            open={!!openTiles.championships}
            onToggle={() => toggleTile("championships")}
            emphasize
          />
          <ExpandableStatTile
            label="Runner-Ups"
            value={fmtCount(summary.runnerUps)}
            yearRows={runnerUpRows}
            open={!!openTiles.runnerUps}
            onToggle={() => toggleTile("runnerUps")}
          />
        </div>

        {/* Row 2: Points Titles | Avg PF / Season | Power Score */}
        <div className="grid grid-cols-3 gap-4 items-start">
          <ExpandableStatTile
            label="Points Titles"
            value={fmtCount(summary.pointsTitles)}
            yearRows={pointsTitleRows}
            open={!!openTiles.pointsTitles}
            onToggle={() => toggleTile("pointsTitles")}
            emphasize
          />
          <StatTile
            label="Avg PF / Season"
            value={fmtPts(summary.avgPfPerSeason)}
          />
          <ExpandableRecordTile
            label="Power Score"
            primary={hasCareerPower ? fmtPts(summary.ovrPowerScore) : "—"}
            secondary={
              hasCareerPower ? (
                <>
                  {`#${summary.ovrPowerRank}`}
                  {careerPowerTotal > 0 && (
                    <span
                      className="text-sm font-bold opacity-60 ml-1"
                      style={{ color: TEXT }}
                    >
                      {`/ ${careerPowerTotal}`}
                    </span>
                  )}
                </>
              ) : (
                "—"
              )
            }
            yearRows={powerRows}
            open={!!openTiles.power}
            onToggle={() => toggleTile("power")}
          />
        </div>

        {/* Row 3: Total Points For | Total Points Against | Avg Points For | Avg Points Against */}
        <div className="grid grid-cols-4 gap-4 items-start">
          <ExpandableStatTile
            label="Total Points For"
            value={fmtPts(summary.totalPf)}
            yearRows={pfRows}
            open={!!openTiles.totalPf}
            onToggle={() => toggleTile("totalPf")}
          />
          <ExpandableStatTile
            label="Total Points Against"
            value={fmtPts(summary.totalPa)}
            yearRows={paRows}
            open={!!openTiles.totalPa}
            onToggle={() => toggleTile("totalPa")}
          />
          <ExpandableStatTile
            label="Avg Points For"
            value={fmtPts(summary.avgPpg)}
            yearRows={avgPfRows}
            open={!!openTiles.avgPf}
            onToggle={() => toggleTile("avgPf")}
          />
          <ExpandableStatTile
            label="Avg Points Against"
            value={fmtPts(careerAvgPa)}
            yearRows={avgPaRows}
            open={!!openTiles.avgPa}
            onToggle={() => toggleTile("avgPa")}
          />
        </div>

        {/* Row 4: Head-to-Head | Division All-Play | Overall All-Play */}
        <div className="grid grid-cols-3 gap-4 items-start">
          <ExpandableRecordTile
            label="Head-to-Head"
            primary={summary.h2hRecord ?? "—"}
            secondary={fmtWinPct(summary.h2hWinPct)}
            yearRows={h2hRows}
            open={!!openTiles.h2h}
            onToggle={() => toggleTile("h2h")}
          />
          <ExpandableRecordTile
            label="Division All-Play"
            primary={summary.divApRecord ?? "N/A"}
            secondary={fmtWinPct(summary.divApWinPct, "N/A")}
            yearRows={divApRows}
            open={!!openTiles.divAp}
            onToggle={() => toggleTile("divAp")}
          />
          <ExpandableRecordTile
            label="Overall All-Play"
            primary={hasOverall ? (summary.ovrApRecord ?? "N/A") : "N/A"}
            secondary={hasOverall ? fmtWinPct(summary.ovrApWinPct, "N/A") : "N/A"}
            yearRows={ovrApRows}
            open={!!openTiles.ovrAp}
            onToggle={() => toggleTile("ovrAp")}
          />
        </div>
      </div>
    </section>
  );
}
