"use client";

import type { OverallLine, PlayerOption } from "@/app/vffl/who-should-i-start/statConfig";
import { PlayerCombobox, TeamListbox } from "./Dropdowns";
import { CARD_CLASS, INSET_BG, SEGMENT_CLASS, TEXT, sideColor } from "./theme";

interface PlayerSelectorCardProps {
  side: "A" | "B";
  teams: string[];
  team: string | null;
  onTeamChange: (team: string | null) => void;
  players: PlayerOption[];
  selected: PlayerOption | null;
  blockedId: number | null;
  overall: OverallLine | null;
  isLeader: boolean;
  onSelect: (playerId: number) => void;
}

const pts = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PlayerSelectorCard({
  side,
  teams,
  team,
  onTeamChange,
  players,
  selected,
  blockedId,
  overall,
  isLeader,
  onSelect,
}: PlayerSelectorCardProps) {
  const accent = sideColor(side);

  return (
    <section
      aria-label={`Player ${side}`}
      className={`${CARD_CLASS} ${SEGMENT_CLASS[side]} h-full flex flex-col gap-5`}
      style={{ color: TEXT }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-[11px] font-black uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          Player {side}
        </span>
        {isLeader && (
          <span
            className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ backgroundColor: accent, color: "var(--vfsn-surface)" }}
          >
            Start ’Em
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <TeamListbox teams={teams} value={team} accent={accent} onChange={onTeamChange} />
        <PlayerCombobox
          players={players}
          selectedId={selected?.playerId ?? null}
          blockedId={blockedId}
          accent={accent}
          onSelect={onSelect}
        />
      </div>

      {selected && overall ? (
        <div
          className="mt-auto rounded-xl border border-[var(--vfsn-border)] p-5 flex flex-col gap-4"
          style={{ backgroundColor: INSET_BG }}
        >
          <div className="flex flex-col gap-1 min-w-0">
            <span
              className="text-2xl font-black uppercase tracking-tight leading-tight break-words"
              style={{ color: accent }}
            >
              {selected.playerName}
            </span>
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-70">
              {selected.position} · {selected.nflAbbrev}
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: "Season", value: pts(overall.totalFpts) },
              { label: "Avg / G", value: pts(overall.avgFpts) },
              { label: "GP", value: String(overall.games) },
            ].map((s) => (
              <div key={`${side}-kpi-${s.label}`} className="flex flex-col gap-0.5 min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">
                  {s.label}
                </dt>
                <dd className="text-lg font-black tabular-nums truncate">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="mt-auto text-xs font-bold uppercase tracking-[0.14em] opacity-60">
          Pick a player to load the tape.
        </p>
      )}
    </section>
  );
}
