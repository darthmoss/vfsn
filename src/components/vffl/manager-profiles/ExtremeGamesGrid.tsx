"use client";

import { useState } from "react";
import type { ManagerExtremeGameRow } from "@/app/vffl/manager-profiles/mockData";
import {
  CARD_CLASS,
  CARD_STYLE,
  FIXED_TABLE_STYLE,
  HIGHLIGHT,
  INSET_BG,
  SURFACE,
  TD_CLASS,
  TEXT,
  TH_CLASS,
  fmtPts,
  fmtSignedPts,
} from "@/app/vffl/manager-profiles/utils";
import { CardHeader, EmptyState } from "./ui";

// Team: Season 11 | Week 9 | Opponent 31 | PF 16 | PA 18 | Margin 15 = 100
const TEAM_COLS = [11, 9, 31, 16, 18, 15];
// Position: Season 10 | Week 8 | Player 23 | Opponent 21 | Points 12 | Projected 13 | Margin 13 = 100
const POS_COLS = [10, 8, 23, 21, 12, 13, 13];

type ExtremeMode =
  | "wins"
  | "losses"
  | "qb"
  | "rb"
  | "wr"
  | "te"
  | "k"
  | "dst";

interface ModeOption {
  id: ExtremeMode;
  label: string;
  eyebrow: string;
  category: string;
  group: "team" | "position";
  sortOrder: "desc" | "asc";
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "wins",
    label: "Wins",
    eyebrow: "Top 5 Beatdowns",
    category: "BIGGEST_WIN",
    group: "team",
    sortOrder: "desc",
  },
  {
    id: "losses",
    label: "Losses",
    eyebrow: "Bottom 5 Blowouts",
    category: "BIGGEST_LOSS",
    group: "team",
    sortOrder: "asc",
  },
  {
    id: "qb",
    label: "QB",
    eyebrow: "Top 5 QB Performances",
    category: "TOP_QB",
    group: "position",
    sortOrder: "desc",
  },
  {
    id: "rb",
    label: "RB",
    eyebrow: "Top 5 RB Performances",
    category: "TOP_RB",
    group: "position",
    sortOrder: "desc",
  },
  {
    id: "wr",
    label: "WR",
    eyebrow: "Top 5 WR Performances",
    category: "TOP_WR",
    group: "position",
    sortOrder: "desc",
  },
  {
    id: "te",
    label: "TE",
    eyebrow: "Top 5 TE Performances",
    category: "TOP_TE",
    group: "position",
    sortOrder: "desc",
  },
  {
    id: "k",
    label: "K",
    eyebrow: "Top 5 K Performances",
    category: "TOP_K",
    group: "position",
    sortOrder: "desc",
  },
  {
    id: "dst",
    label: "D/ST",
    eyebrow: "Top 5 D/ST Performances",
    category: "TOP_DST",
    group: "position",
    sortOrder: "desc",
  },
];

function renderOptionButton(
  option: ModeOption,
  activeMode: ExtremeMode,
  onSelect: (id: ExtremeMode) => void
) {
  const isActive = activeMode === option.id;
  return (
    <button
      key={option.id}
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect(option.id)}
      className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-200 cursor-pointer whitespace-nowrap"
      style={{
        backgroundColor: isActive ? HIGHLIGHT : "transparent",
        color: isActive ? SURFACE : TEXT,
        opacity: isActive ? 1 : 0.75,
      }}
    >
      {option.label}
    </button>
  );
}

export default function ExtremeGamesGrid({
  games,
}: {
  games: ManagerExtremeGameRow[];
}) {
  const [mode, setMode] = useState<ExtremeMode>("wins");

  const activeMeta =
    MODE_OPTIONS.find((opt) => opt.id === mode) ?? MODE_OPTIONS[0];
  const isPositionMode = activeMeta.group === "position";

  const rows = games
    .filter((g) => g.category === activeMeta.category)
    .sort((a, b) => {
      if (isPositionMode) {
        return (b.playerFpts ?? 0) - (a.playerFpts ?? 0);
      }
      const aMargin = a.margin ?? 0;
      const bMargin = b.margin ?? 0;
      return activeMeta.sortOrder === "desc"
        ? bMargin - aMargin
        : aMargin - bMargin;
    })
    .slice(0, 5);

  return (
    <section
      className={`${CARD_CLASS} w-full h-full flex flex-col`}
      style={CARD_STYLE}
    >
      <CardHeader
        eyebrow={activeMeta.eyebrow}
        title="Signature Performances"
        right={
          <div
            role="tablist"
            aria-label="Signature Performances Mode"
            className="inline-flex items-center p-1 rounded-[10px] border border-[var(--vfsn-border)] gap-0.5 shrink-0"
            style={{ backgroundColor: INSET_BG }}
          >
            {MODE_OPTIONS.map((option, idx) => {
              const prevGroup = idx > 0 ? MODE_OPTIONS[idx - 1].group : option.group;
              const showDivider = prevGroup !== option.group;
              return (
                <div key={option.id} className="inline-flex items-center">
                  {showDivider && (
                    <span
                      aria-hidden="true"
                      className="w-px h-4 mx-1 bg-[var(--vfsn-border)]"
                    />
                  )}
                  {renderOptionButton(option, mode, setMode)}
                </div>
              );
            })}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState message="No games on record." />
      ) : isPositionMode ? (
        <table style={FIXED_TABLE_STYLE} className="text-sm">
          <colgroup>
            {POS_COLS.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={`${TH_CLASS} text-left`}>Season</th>
              <th className={`${TH_CLASS} text-left`}>Week</th>
              <th className={`${TH_CLASS} text-left`}>Player</th>
              <th className={`${TH_CLASS} text-left`}>Opponent</th>
              <th className={`${TH_CLASS} text-right`}>Points</th>
              <th className={`${TH_CLASS} text-right`}>Projected</th>
              <th className={`${TH_CLASS} text-right`}>Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={`${r.category}-${r.seasonYear}-${r.week}-${r.playerId ?? idx}`}
              >
                <td className={`${TD_CLASS} font-bold tabular-nums`}>
                  {r.seasonYear}
                </td>
                <td className={`${TD_CLASS} font-bold tabular-nums opacity-80`}>
                  {r.week}
                </td>
                <td className={TD_CLASS}>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold truncate">
                      {r.playerName ?? "—"}
                    </span>
                    <span className="text-xs font-semibold opacity-60 truncate">
                      {r.nflTeam ?? "—"}
                      {r.slotPosition === "RB/WR/TE" ? " · FLEX" : ""}
                    </span>
                  </div>
                </td>
                <td className={TD_CLASS}>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold truncate">
                      {r.opponentName ?? "—"}
                    </span>
                    {r.opponentTeamName && (
                      <span className="text-xs font-semibold opacity-60 truncate">
                        {r.opponentTeamName}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`${TD_CLASS} text-right font-black tabular-nums`}>
                  {fmtPts(r.playerFpts)}
                </td>
                <td
                  className={`${TD_CLASS} text-right font-bold tabular-nums opacity-80`}
                >
                  {fmtPts(r.playerProjFpts)}
                </td>
                <td
                  className={`${TD_CLASS} text-right font-black tabular-nums`}
                  style={
                    (r.playerMargin ?? 0) > 0 ? { color: HIGHLIGHT } : undefined
                  }
                >
                  {fmtSignedPts(r.playerMargin)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={FIXED_TABLE_STYLE} className="text-sm">
          <colgroup>
            {TEAM_COLS.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className={`${TH_CLASS} text-left`}>Season</th>
              <th className={`${TH_CLASS} text-left`}>Week</th>
              <th className={`${TH_CLASS} text-left`}>Opponent</th>
              <th className={`${TH_CLASS} text-right`}>Points For</th>
              <th className={`${TH_CLASS} text-right`}>Points Against</th>
              <th className={`${TH_CLASS} text-right`}>Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={`${r.category}-${r.seasonYear}-${r.week}-${idx}`}>
                <td className={`${TD_CLASS} font-bold tabular-nums`}>
                  {r.seasonYear}
                </td>
                <td className={`${TD_CLASS} font-bold tabular-nums opacity-80`}>
                  {r.week}
                </td>
                <td className={TD_CLASS}>
                  <div className="flex flex-col min-w-0">
                    <span className="font-extrabold truncate">
                      {r.opponentName ?? "—"}
                    </span>
                    {r.opponentTeamName && (
                      <span className="text-xs font-semibold opacity-60 truncate">
                        {r.opponentTeamName}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`${TD_CLASS} text-right font-black tabular-nums`}>
                  {fmtPts(r.pointsFor)}
                </td>
                <td
                  className={`${TD_CLASS} text-right font-bold tabular-nums opacity-80`}
                >
                  {fmtPts(r.pointsAgainst)}
                </td>
                <td
                  className={`${TD_CLASS} text-right font-black tabular-nums`}
                  style={(r.margin ?? 0) > 0 ? { color: HIGHLIGHT } : undefined}
                >
                  {fmtSignedPts(r.margin)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
