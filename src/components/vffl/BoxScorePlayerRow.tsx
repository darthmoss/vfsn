"use client";

import { useState } from "react";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";
import { vfflVwMatchupRosters } from "@/db/schema";

export type MatchupRosterRow = InferSelectModel<typeof vfflVwMatchupRosters>;

interface BoxScorePlayerRowProps {
  player: MatchupRosterRow;
}

interface StatItem {
  label: string;
  value: string | number;
}

function formatNumberStat(val: number | null | undefined): string {
  if (val === null || val === undefined) return "0";
  return Number.isInteger(val) ? String(val) : val.toFixed(1);
}

function getPlayerStatItems(player: MatchupRosterRow): StatItem[] {
  const pos = (player.position ?? "").toUpperCase();

  switch (pos) {
    case "QB":
      return [
        { label: "Comp/Att", value: player.passPct ?? "0 / 0" },
        { label: "PYD", value: formatNumberStat(player.passYds) },
        { label: "PTD", value: formatNumberStat(player.passTds) },
        { label: "RYD", value: formatNumberStat(player.rushYds) },
        { label: "RTD", value: formatNumberStat(player.rushTds) },
      ];
    case "RB":
      return [
        { label: "RYD", value: formatNumberStat(player.rushYds) },
        { label: "RTD", value: formatNumberStat(player.rushTds) },
        { label: "Rec/Tar", value: player.recPct ?? "0 / 0" },
        { label: "REYD", value: formatNumberStat(player.recYds) },
        { label: "RETD", value: formatNumberStat(player.recTds) },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Rec/Tar", value: player.recPct ?? "0 / 0" },
        { label: "REYD", value: formatNumberStat(player.recYds) },
        { label: "RETD", value: formatNumberStat(player.recTds) },
        { label: "RYD", value: formatNumberStat(player.rushYds) },
        { label: "RTD", value: formatNumberStat(player.rushTds) },
      ];
    case "D/ST":
    case "DST":
      return [
        { label: "PA", value: formatNumberStat(player.pa) },
        { label: "YA", value: formatNumberStat(player.ya) },
        { label: "SACK", value: formatNumberStat(player.sacks) },
        { label: "INT", value: formatNumberStat(player.ints) },
      ];
    case "K":
      return [
        { label: "FG/FGA", value: player.fg ?? "0 / 0" },
        { label: "FYYD", value: formatNumberStat(player.fgYd) },
        { label: "PAT", value: formatNumberStat(player.pat) },
      ];
    default:
      return [
        { label: "Rec/Tar", value: player.recPct ?? "0 / 0" },
        { label: "REYD", value: formatNumberStat(player.recYds) },
        { label: "RETD", value: formatNumberStat(player.recTds) },
        { label: "RYD", value: formatNumberStat(player.rushYds) },
        { label: "RTD", value: formatNumberStat(player.rushTds) },
      ];
  }
}

function formatDiff(diff: number): string {
  const prefix = diff > 0 ? "+" : "";
  return `${prefix}${diff.toFixed(2)}`;
}

export default function BoxScorePlayerRow({ player }: BoxScorePlayerRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const proj = player.projFpts ?? 0;
  const actual = player.actualFpts ?? 0;
  const diff = player.diff ?? actual - proj;
  const statItems = getPlayerStatItems(player);

  const normalizedSlot =
    player.slot === "RB/WR/TE"
      ? "FLEX"
      : player.slot === "BE"
        ? "BN"
        : (player.slot ?? "—");

  return (
    <>
      <tr
        onClick={() => setIsExpanded((prev) => !prev)}
        className="transition-colors hover:bg-white/[0.04] cursor-pointer"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
      >
        {/* 1. Slot */}
        <td className="py-2.5 px-2.5 font-extrabold uppercase tracking-wider text-[11px] whitespace-nowrap">
          <span
            className="inline-block px-2 py-0.5 rounded border border-[var(--vfsn-border)] text-center min-w-[42px]"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              color: "var(--nav-text, var(--vfsn-text))",
            }}
          >
            {normalizedSlot}
          </span>
        </td>

        {/* 2. Pos */}
        <td className="py-2.5 px-2 text-xs font-bold uppercase opacity-80 whitespace-nowrap">
          {player.position ?? "—"}
        </td>

        {/* 3. Depth (Directly from vffl.vw_matchup_rosters.depth) */}
        <td className="py-2.5 px-2 text-xs font-extrabold uppercase tracking-wide opacity-85 whitespace-nowrap">
          {player.depth ?? `${player.position ?? "POS"}1`}
        </td>

        {/* 4. NFL */}
        <td className="py-2.5 px-2 text-xs font-bold uppercase tracking-wider opacity-75 whitespace-nowrap">
          {player.nflTeam ?? "FA"}
        </td>

        {/* 5. Player (Right of NFL column) */}
        <td
          className="py-2.5 px-2.5 text-xs font-extrabold truncate max-w-[180px]"
          style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          title={player.playerName ?? "Player"}
        >
          {player.playerName ?? "Unknown Player"}
        </td>

        {/* 6. Proj */}
        <td className="py-2.5 px-2 text-xs font-semibold tabular-nums text-right opacity-80 whitespace-nowrap">
          {proj.toFixed(2)}
        </td>

        {/* 7. +/- */}
        <td className="py-2.5 px-2 text-xs font-bold tabular-nums text-right opacity-85 whitespace-nowrap">
          {formatDiff(diff)}
        </td>

        {/* 8. Fpts */}
        <td
          className="py-2.5 px-2.5 text-xs font-black tabular-nums text-right whitespace-nowrap"
          style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
        >
          {actual.toFixed(2)}
        </td>

        {/* 9. Action Chevron */}
        <td className="py-2.5 px-2 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            aria-expanded={isExpanded}
            aria-label={`Toggle stat line for ${player.playerName ?? "Player"}`}
            className="w-6 h-6 rounded-md border border-[var(--vfsn-border)] inline-flex items-center justify-center transition-colors cursor-pointer"
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
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
      </tr>

      {/* 3C. Expandable Stat Line (Nested Row) */}
      {isExpanded && (
        <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.32)" }}>
          <td colSpan={9} className="px-3.5 py-3 border-t border-[var(--vfsn-border)]">
            <div
              className="grid gap-2 text-center"
              style={{
                gridTemplateColumns: `repeat(${statItems.length}, minmax(0, 1fr))`,
              }}
            >
              {statItems.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[var(--vfsn-border)] py-2 px-2 flex flex-col items-center justify-center gap-0.5"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-70">
                    {stat.label}
                  </span>
                  <span
                    className="text-xs font-black tabular-nums"
                    style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
