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

// Season 11 | Week 9 | Opponent 31 | PF 16 | PA 18 | Margin 15 = 100
const COLS = [11, 9, 31, 16, 18, 15];

type ExtremeMode = "wins" | "losses";

const MODE_OPTIONS: {
  id: ExtremeMode;
  label: string;
  eyebrow: string;
  title: string;
}[] = [
  {
    id: "wins",
    label: "Biggest Wins",
    eyebrow: "Top 5 Beatdowns",
    title: "Biggest Wins",
  },
  {
    id: "losses",
    label: "Biggest Losses",
    eyebrow: "Bottom 5 Blowouts",
    title: "Biggest Losses",
  },
];

export default function ExtremeGamesGrid({
  games,
}: {
  games: ManagerExtremeGameRow[];
}) {
  const [mode, setMode] = useState<ExtremeMode>("wins");

  const wins = games
    .filter((g) => g.category === "BIGGEST_WIN")
    .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
    .slice(0, 5);

  const losses = games
    .filter((g) => g.category === "BIGGEST_LOSS")
    .sort((a, b) => (a.margin ?? 0) - (b.margin ?? 0))
    .slice(0, 5);

  const activeMeta =
    MODE_OPTIONS.find((opt) => opt.id === mode) ?? MODE_OPTIONS[0];
  const rows = mode === "wins" ? wins : losses;

  return (
    <section
      className={`${CARD_CLASS} w-full h-full flex flex-col`}
      style={CARD_STYLE}
    >
      <CardHeader
        eyebrow={activeMeta.eyebrow}
        title={activeMeta.title}
        right={
          <div
            role="tablist"
            aria-label="Extreme Games Mode"
            className="inline-flex items-center p-1 rounded-[10px] border border-[var(--vfsn-border)] gap-1"
            style={{ backgroundColor: INSET_BG }}
          >
            {MODE_OPTIONS.map((option) => {
              const isActive = mode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMode(option.id)}
                  className="px-4 py-2 rounded-[7px] text-xs font-black uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: isActive ? HIGHLIGHT : "transparent",
                    color: isActive ? SURFACE : TEXT,
                    opacity: isActive ? 1 : 0.75,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState message="No games on record." />
      ) : (
        <table style={FIXED_TABLE_STYLE} className="text-sm">
          <colgroup>
            {COLS.map((w, i) => (
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
