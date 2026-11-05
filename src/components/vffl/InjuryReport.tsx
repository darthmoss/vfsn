"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { vfflVwInjuryReport } from "@/db/schema";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";

export type InjuryReportData = InferSelectModel<typeof vfflVwInjuryReport>;

interface InjuryReportProps {
  injuries: InjuryReportData[];
}

const POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "D/ST"];

interface ThemedFilterDropdownProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
}

function ThemedFilterDropdown({
  id,
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: ThemedFilterDropdownProps) {
  return (
    <div className="flex flex-col gap-1 relative">
      <label
        htmlFor={id}
        className="text-[10px] font-extrabold uppercase tracking-wider opacity-75"
      >
        {label}
      </label>

      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="w-full rounded-lg border border-[var(--vfsn-border)] px-2.5 py-2 text-xs font-bold outline-none cursor-pointer flex items-center justify-between gap-1.5 transition-colors"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        <span className="truncate">{value}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
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

      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="z-30 absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-[var(--vfsn-border)] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)] flex flex-col gap-0.5"
          style={{
            backgroundColor: "var(--nav-background, var(--vfsn-surface))",
            color: "var(--nav-text, var(--vfsn-text))",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <li key={opt} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => onSelect(opt)}
                  className="vfsn-dropdown-option w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-between"
                  style={
                    isSelected
                      ? {
                          backgroundColor:
                            "var(--nav-highlight, var(--vfsn-accent-1))",
                          color: "var(--nav-background, var(--vfsn-surface))",
                        }
                      : {
                          color: "var(--nav-text, var(--vfsn-text))",
                        }
                  }
                >
                  <span className="truncate">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function InjuryReport({ injuries }: InjuryReportProps) {
  const [selectedNflTeam, setSelectedNflTeam] = useState<string>("All");
  const [selectedPosition, setSelectedPosition] = useState<string>("QB");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [openDropdown, setOpenDropdown] = useState<"team" | "status" | null>(
    null
  );

  const filterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nflTeamOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        injuries
          .map((item) => item.nflTeam)
          .filter((team): team is string => Boolean(team))
      )
    ).sort();
    return ["All", ...unique];
  }, [injuries]);

  const positionOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        injuries
          .map((item) => item.position)
          .filter((pos): pos is string => Boolean(pos))
      )
    ).sort((a, b) => {
      const idxA = POSITION_ORDER.indexOf(a);
      const idxB = POSITION_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return unique.length > 0 ? unique : POSITION_ORDER;
  }, [injuries]);

  const activePosition = positionOptions.includes(selectedPosition)
    ? selectedPosition
    : (positionOptions[0] ?? "QB");

  const statusOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        injuries
          .map((item) => item.injuryStatus)
          .filter((status): status is string => Boolean(status))
      )
    ).sort();
    return ["All", ...unique];
  }, [injuries]);

  const filteredInjuries = useMemo(() => {
    return injuries
      .filter((player) => {
        const matchesTeam =
          selectedNflTeam === "All" || player.nflTeam === selectedNflTeam;
        const matchesPos = player.position === activePosition;
        const matchesStatus =
          selectedStatus === "All" || player.injuryStatus === selectedStatus;
        return matchesTeam && matchesPos && matchesStatus;
      })
      .sort((a, b) => a.playerName.localeCompare(b.playerName));
  }, [injuries, selectedNflTeam, activePosition, selectedStatus]);

  return (
    <section
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-4 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .vfsn-dropdown-option:hover {
              background-color: var(--nav-highlight, var(--vfsn-accent-1)) !important;
              color: var(--nav-background, var(--vfsn-surface)) !important;
            }
          `,
        }}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--vfsn-border)]">
        <div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] block"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            League Medical Wire
          </span>
          <h2 className="text-base font-black uppercase tracking-tight">
            Injury Report
          </h2>
        </div>
        <span className="text-xs font-extrabold opacity-75">
          {filteredInjuries.length} Listed
        </span>
      </div>

      {/* Two Custom-Themed Dropdown Filters: NFL Team & Injury Status */}
      <div ref={filterContainerRef} className="grid grid-cols-2 gap-2.5">
        <ThemedFilterDropdown
          id="filter-nfl-team"
          label="NFL Team"
          value={selectedNflTeam}
          options={nflTeamOptions}
          isOpen={openDropdown === "team"}
          onToggle={() =>
            setOpenDropdown(openDropdown === "team" ? null : "team")
          }
          onSelect={(val) => {
            setSelectedNflTeam(val);
            setOpenDropdown(null);
          }}
        />

        <ThemedFilterDropdown
          id="filter-injury-status"
          label="Status"
          value={selectedStatus}
          options={statusOptions}
          isOpen={openDropdown === "status"}
          onToggle={() =>
            setOpenDropdown(openDropdown === "status" ? null : "status")
          }
          onSelect={(val) => {
            setSelectedStatus(val);
            setOpenDropdown(null);
          }}
        />
      </div>

      {/* Single-Select Position Toggle Buttons */}
      <div
        role="radiogroup"
        aria-label="Filter by Position"
        className="flex flex-row items-center gap-1.5"
      >
        {positionOptions.map((pos) => {
          const isActive = pos === activePosition;
          return (
            <button
              key={pos}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setSelectedPosition(pos)}
              className="flex-1 py-1.5 px-2 rounded-lg border border-[var(--vfsn-border)] text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors text-center"
              style={
                isActive
                  ? {
                      backgroundColor:
                        "var(--nav-highlight, var(--vfsn-accent-1))",
                      color: "var(--nav-background, var(--vfsn-surface))",
                    }
                  : {
                      backgroundColor: "rgba(0, 0, 0, 0.25)",
                      color: "var(--nav-text, var(--vfsn-text))",
                    }
              }
            >
              {pos}
            </button>
          );
        })}
      </div>

      {/* Player Designations List */}
      <div className="flex flex-col gap-2 pt-1">
        {filteredInjuries.length === 0 ? (
          <div
            className="rounded-xl border border-[var(--vfsn-border)] py-6 px-4 text-center text-xs font-semibold opacity-75"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          >
            No injured players match the selected filters.
          </div>
        ) : (
          filteredInjuries.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--vfsn-border)] text-xs"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    color: "var(--nav-highlight, var(--vfsn-accent-1))",
                  }}
                >
                  {player.position}
                </span>
                <div className="truncate">
                  <div
                    className="font-extrabold truncate"
                    style={{
                      color: "var(--nav-highlight, var(--vfsn-accent-1))",
                    }}
                  >
                    {player.playerName}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    {player.nflTeam ?? "FA"}
                  </div>
                </div>
              </div>

              <span
                className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                style={{
                  backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
                  color: "var(--nav-background, var(--vfsn-surface))",
                }}
              >
                {player.injuryStatus}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
