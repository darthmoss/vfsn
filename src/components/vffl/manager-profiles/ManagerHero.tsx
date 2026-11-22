import type { ManagerCareerSummaryRow } from "@/app/vffl/manager-profiles/mockData";
import {
  CARD_CLASS,
  CARD_STYLE,
  HIGHLIGHT,
  INSET_BG,
  fmtCount,
  fmtPts,
  fmtWinPct,
} from "@/app/vffl/manager-profiles/utils";

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

function RecordWinPctTile({
  label,
  record,
  winPct,
}: {
  label: string;
  record: string;
  winPct: string;
}) {
  return (
    <div
      className="flex flex-col justify-between gap-2 px-4 py-3.5 rounded-lg border border-[var(--vfsn-border)] min-w-0"
      style={{ backgroundColor: INSET_BG }}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65 truncate">
        {label}
      </span>
      <div className="flex flex-row items-baseline justify-between gap-3">
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
    </div>
  );
}

export default function ManagerHero({
  summary,
}: {
  summary: ManagerCareerSummaryRow;
}) {
  const hasOverall = summary.ovrApRecord !== null;

  return (
    <section
      className={`${CARD_CLASS} w-full h-full flex flex-col justify-between gap-4`}
      style={CARD_STYLE}
    >
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

      {/* Row 3: Total Points For | Total Points Against | Avg Points / Season | Avg Points / Game */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="Total Points For" value={fmtPts(summary.totalPf)} />
        <StatTile
          label="Total Points Against"
          value={fmtPts(summary.totalPa)}
        />
        <StatTile
          label="Avg Points / Season"
          value={fmtPts(summary.avgPfPerSeason)}
        />
        <StatTile label="Avg Points / Game" value={fmtPts(summary.avgPpg)} />
      </div>

      {/* Row 4: Head-to-Head | Division All-Play | Overall All-Play */}
      <div className="grid grid-cols-3 gap-4">
        <RecordWinPctTile
          label="Head-to-Head"
          record={summary.h2hRecord ?? "—"}
          winPct={fmtWinPct(summary.h2hWinPct)}
        />
        <RecordWinPctTile
          label="Division All-Play"
          record={summary.divApRecord ?? "N/A"}
          winPct={fmtWinPct(summary.divApWinPct, "N/A")}
        />
        <RecordWinPctTile
          label="Overall All-Play"
          record={hasOverall ? (summary.ovrApRecord ?? "N/A") : "N/A"}
          winPct={hasOverall ? fmtWinPct(summary.ovrApWinPct, "N/A") : "N/A"}
        />
      </div>
    </section>
  );
}
