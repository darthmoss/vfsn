"use client";

import { useState } from "react";
import type {
  ManagerCareerSummaryRow,
  ManagerSeasonHistoryRow,
} from "@/app/vffl/manager-profiles/mockData";
import {
  CARD_CLASS,
  CARD_STYLE,
  HIGHLIGHT,
  INSET_BG,
  fmtCount,
  fmtPts,
  fmtWinPct,
} from "@/app/vffl/manager-profiles/utils";
import { CardHeader, ChevronIcon } from "./ui";

type SeasonRow = ManagerSeasonHistoryRow & { seasonYear: number };

interface YearStatRow {
  year: number;
  value: string;
  secondary?: string;
}

function ExpandableStatTile({
  label,
  value,
  yearRows,
  open,
  onToggle,
}: {
  label: string;
  value: string;
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
        <span className="text-xl font-black tabular-nums tracking-tight truncate">
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
  record,
  winPct,
  yearRows,
  open,
  onToggle,
}: {
  label: string;
  record: string;
  winPct: string;
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
            {record}
          </span>
          <span
            className="text-xl font-black tabular-nums tracking-tight shrink-0"
            style={{ color: HIGHLIGHT }}
          >
            {winPct}
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
}: {
  summary: ManagerCareerSummaryRow;
  seasons: SeasonRow[];
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

  return (
    <section
      className={`${CARD_CLASS} w-full h-full flex flex-col`}
      style={CARD_STYLE}
    >
      <CardHeader eyebrow="All-Time Resume" title="Career Snapshot" />

      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* Row 1: Seasons | Points Titles | Playoff Trips */}
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Seasons" value={fmtCount(summary.totalSeasons)} />
          <StatTile
            label="Points Titles"
            value={fmtCount(summary.pointsTitles)}
            emphasize
          />
          <StatTile label="Playoff Trips" value={fmtCount(summary.playoffTrips)} />
        </div>

        {/* Row 2: Playoff Record | Championships | Runner-Ups */}
        <div className="grid grid-cols-3 gap-4">
          <StatTile
            label="Playoff Record"
            value={summary.playoffRecord ?? "—"}
          />
          <StatTile
            label="Championships"
            value={fmtCount(summary.championships)}
            emphasize
          />
          <StatTile label="Runner-Ups" value={fmtCount(summary.runnerUps)} />
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
            record={summary.h2hRecord ?? "—"}
            winPct={fmtWinPct(summary.h2hWinPct)}
            yearRows={h2hRows}
            open={!!openTiles.h2h}
            onToggle={() => toggleTile("h2h")}
          />
          <ExpandableRecordTile
            label="Division All-Play"
            record={summary.divApRecord ?? "N/A"}
            winPct={fmtWinPct(summary.divApWinPct, "N/A")}
            yearRows={divApRows}
            open={!!openTiles.divAp}
            onToggle={() => toggleTile("divAp")}
          />
          <ExpandableRecordTile
            label="Overall All-Play"
            record={hasOverall ? (summary.ovrApRecord ?? "N/A") : "N/A"}
            winPct={hasOverall ? fmtWinPct(summary.ovrApWinPct, "N/A") : "N/A"}
            yearRows={ovrApRows}
            open={!!openTiles.ovrAp}
            onToggle={() => toggleTile("ovrAp")}
          />
        </div>
      </div>
    </section>
  );
}
