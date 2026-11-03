"use client";

import { useMemo, useState } from "react";
import { vfflVwInjuryReport } from "@/db/schema";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";

export type InjuryReportData = InferSelectModel<typeof vfflVwInjuryReport>;

interface InjuryReportProps {
  injuries: InjuryReportData[];
}

export default function InjuryReport({ injuries }: InjuryReportProps) {
  const [selectedNflTeam, setSelectedNflTeam] = useState<string>("All");
  const [selectedPosition, setSelectedPosition] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

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
      new Set(injuries.map((item) => item.position).filter(Boolean))
    ).sort();
    return ["All", ...unique];
  }, [injuries]);

  const statusOptions = useMemo(() => {
    const unique = Array.from(
      new Set(injuries.map((item) => item.injuryStatus).filter(Boolean))
    ).sort();
    return ["All", ...unique];
  }, [injuries]);

  const filteredInjuries = useMemo(() => {
    return injuries.filter((player) => {
      const matchesTeam =
        selectedNflTeam === "All" || player.nflTeam === selectedNflTeam;
      const matchesPos =
        selectedPosition === "All" || player.position === selectedPosition;
      const matchesStatus =
        selectedStatus === "All" || player.injuryStatus === selectedStatus;
      return matchesTeam && matchesPos && matchesStatus;
    });
  }, [injuries, selectedNflTeam, selectedPosition, selectedStatus]);

  return (
    <section
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-4"
      style={{ backgroundColor: "var(--vfsn-surface)" }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--vfsn-border)]">
        <div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] block"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            League Medical Wire
          </span>
          <h2 className="text-base font-black uppercase tracking-tight">
            Injury Report
          </h2>
        </div>
        <span className="text-xs font-extrabold opacity-60">
          {filteredInjuries.length} Listed
        </span>
      </div>

      {/* Three Dropdown Filters: NFL Team, Position, Injury Status (Defaulting to "All") */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-nfl-team"
            className="text-[10px] font-extrabold uppercase tracking-wider opacity-60"
          >
            NFL Team
          </label>
          <select
            id="filter-nfl-team"
            value={selectedNflTeam}
            onChange={(e) => setSelectedNflTeam(e.target.value)}
            className="w-full rounded-lg border border-[var(--vfsn-border)] px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--vfsn-bg)",
              color: "var(--vfsn-text)",
            }}
          >
            {nflTeamOptions.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-position"
            className="text-[10px] font-extrabold uppercase tracking-wider opacity-60"
          >
            Position
          </label>
          <select
            id="filter-position"
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full rounded-lg border border-[var(--vfsn-border)] px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--vfsn-bg)",
              color: "var(--vfsn-text)",
            }}
          >
            {positionOptions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-injury-status"
            className="text-[10px] font-extrabold uppercase tracking-wider opacity-60"
          >
            Status
          </label>
          <select
            id="filter-injury-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-[var(--vfsn-border)] px-2.5 py-2 text-xs font-bold outline-none cursor-pointer"
            style={{
              backgroundColor: "var(--vfsn-bg)",
              color: "var(--vfsn-text)",
            }}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Player Designations List */}
      <div className="flex flex-col gap-2 pt-1">
        {filteredInjuries.length === 0 ? (
          <div
            className="rounded-xl border border-[var(--vfsn-border)] py-6 px-4 text-center text-xs font-semibold opacity-60"
            style={{ backgroundColor: "var(--vfsn-bg)" }}
          >
            No injured players match the selected filters.
          </div>
        ) : (
          filteredInjuries.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--vfsn-border)] text-xs"
              style={{ backgroundColor: "var(--vfsn-bg)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: "var(--vfsn-surface)",
                    color: "var(--vfsn-accent-1)",
                  }}
                >
                  {player.position}
                </span>
                <div className="truncate">
                  <div className="font-extrabold truncate">
                    {player.playerName}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    {player.nflTeam ?? "FA"}
                  </div>
                </div>
              </div>

              <span
                className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                style={{
                  backgroundColor: "var(--vfsn-accent-1)",
                  color: "var(--vfsn-bg)",
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
