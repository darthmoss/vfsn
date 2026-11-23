"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PlayerOption } from "@/app/vffl/who-should-i-start/statConfig";
import { ChevronIcon } from "@/components/vffl/manager-profiles/ui";
import { INSET_BG, SURFACE, TEXT } from "./theme";

const OPTION_HOVER_CSS = `
  .vfsn-wsis-option:hover,
  .vfsn-wsis-option[data-active="true"] {
    background-color: var(--nav-highlight, var(--vfsn-accent-1)) !important;
    color: var(--nav-background, var(--vfsn-surface)) !important;
  }
`;

const TRIGGER_CLASS =
  "w-full inline-flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-[12px] border border-[var(--vfsn-border)] cursor-pointer justify-between transition-colors duration-300 text-left";
const PANEL_CLASS =
  "z-40 absolute left-0 right-0 top-full mt-2 rounded-xl border border-[var(--vfsn-border)] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col";

/** Closes a popover on outside click / Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function TriggerContent({ label, value, accent, open }: {
  label: string;
  value: string;
  accent: string;
  open: boolean;
}) {
  return (
    <>
      <span className="flex flex-col items-start leading-tight min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
          {label}
        </span>
        <span className="text-sm font-black uppercase tracking-wider truncate max-w-full">
          {value}
        </span>
      </span>
      <span
        className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg border border-[var(--vfsn-border)]"
        style={{ backgroundColor: INSET_BG, color: accent }}
      >
        <ChevronIcon open={open} />
      </span>
    </>
  );
}

// -----------------------------------------------------------------------------
// NFL Team Listbox
// -----------------------------------------------------------------------------
interface TeamListboxProps {
  teams: string[];
  value: string | null;
  accent: string;
  onChange: (team: string | null) => void;
}

export function TeamListbox({ teams, value, accent, onChange }: TeamListboxProps) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const options: (string | null)[] = [null, ...teams];

  return (
    <div ref={ref} className="relative w-full">
      <style dangerouslySetInnerHTML={{ __html: OPTION_HOVER_CSS }} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className={TRIGGER_CLASS}
        style={{ backgroundColor: INSET_BG, color: TEXT }}
      >
        <TriggerContent label="NFL Team" value={value ?? "All"} accent={accent} open={open} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="NFL Team"
          className={`${PANEL_CLASS} max-h-[360px] overflow-y-auto gap-0.5`}
          style={{ backgroundColor: SURFACE, color: TEXT }}
        >
          {options.map((team) => {
            const isSelected = team === value;
            return (
              <button
                key={`team-${team ?? "all"}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setOpen(false);
                  onChange(team);
                }}
                className="vfsn-wsis-option w-full text-left px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                style={isSelected ? { backgroundColor: accent, color: SURFACE } : { color: TEXT }}
              >
                {team ?? "All"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Searchable Player Combobox
// -----------------------------------------------------------------------------
interface PlayerComboboxProps {
  players: PlayerOption[];
  selectedId: number | null;
  /** Player locked on the opposite side (cannot face themselves). */
  blockedId: number | null;
  accent: string;
  onSelect: (playerId: number) => void;
}

const optionLabel = (p: PlayerOption) => `${p.playerName} (${p.nflAbbrev})`;

export function PlayerCombobox({
  players,
  selectedId,
  blockedId,
  accent,
  onSelect,
}: PlayerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useDismiss(open, () => setOpen(false));
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const selected = players.find((p) => p.playerId === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = players.filter((p) => p.playerId !== blockedId);
    if (!q) return pool;
    return pool.filter((p) => optionLabel(p).toLowerCase().includes(q));
  }, [players, blockedId, query]);

  const openPanel = () => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  };

  const commit = (p: PlayerOption | undefined) => {
    if (!p) return;
    setOpen(false);
    onSelect(p.playerId);
  };

  const scrollToIndex = (idx: number) => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${idx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + delta + filtered.length) % filtered.length;
      setActiveIndex(next);
      scrollToIndex(next);
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(filtered[activeIndex]);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <style dangerouslySetInnerHTML={{ __html: OPTION_HOVER_CSS }} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={TRIGGER_CLASS}
        style={{ backgroundColor: INSET_BG, color: TEXT }}
      >
        <TriggerContent
          label="Player"
          value={selected ? optionLabel(selected) : "Select Player"}
          accent={accent}
          open={open}
        />
      </button>

      {open && (
        <div className={`${PANEL_CLASS} gap-2`} style={{ backgroundColor: SURFACE, color: TEXT }}>
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              filtered[activeIndex] ? `${listId}-${filtered[activeIndex].playerId}` : undefined
            }
            placeholder="Search players..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 rounded-lg border border-[var(--vfsn-border)] text-sm font-bold outline-none placeholder:opacity-50"
            style={{ backgroundColor: INSET_BG, color: TEXT }}
          />
          <div
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label="Players"
            className="max-h-[360px] overflow-y-auto flex flex-col gap-0.5"
          >
            {filtered.length === 0 && (
              <span className="px-3 py-2 text-xs font-bold uppercase tracking-wider opacity-60">
                No players found
              </span>
            )}
            {filtered.map((p, idx) => {
              const isSelected = p.playerId === selectedId;
              return (
                <button
                  key={`player-opt-${p.playerId}`}
                  id={`${listId}-${p.playerId}`}
                  data-index={idx}
                  data-active={idx === activeIndex}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(p)}
                  className="vfsn-wsis-option w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                  style={isSelected ? { backgroundColor: accent, color: SURFACE } : { color: TEXT }}
                >
                  <span className="truncate">{optionLabel(p)}</span>
                  <span className="shrink-0 tabular-nums opacity-70">
                    {p.totalFpts.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
