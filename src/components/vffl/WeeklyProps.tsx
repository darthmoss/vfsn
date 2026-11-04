"use client";

import { useState } from "react";
import { vfflVwWeeklyProps } from "@/db/schema";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";

export type WeeklyPropsData = InferSelectModel<typeof vfflVwWeeklyProps>;

interface WeeklyPropsProps {
  propsList: WeeklyPropsData[];
}

function formatAwardValue(award: string | null, value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (award === "Armchair Architect") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (award === "Overachiever" || award === "Body Bag") {
    return `+${value.toFixed(2)}`;
  }
  return value.toFixed(2);
}

export default function WeeklyProps({ propsList }: WeeklyPropsProps) {
  const [openTooltipAward, setOpenTooltipAward] = useState<string | null>(null);

  return (
    <section
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-4 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--vfsn-border)]">
        <div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] block"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            Broadcast Honors • 9 Weekly Awards
          </span>
          <h2 className="text-base font-black uppercase tracking-tight">
            Weekly Props
          </h2>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--vfsn-border)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="border-b border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "var(--nav-text, var(--vfsn-text))",
              }}
            >
              <th className="py-3 px-3.5">Award</th>
              <th className="py-3 px-3.5">Winner</th>
              <th className="py-3 px-3.5 text-right">Stat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--vfsn-border)] text-xs">
            {propsList.map((row, idx) => {
              const awardKey = `${row.award}-${idx}`;
              const isTooltipOpen = openTooltipAward === awardKey;

              return (
                <tr
                  key={awardKey}
                  className="transition-colors hover:bg-white/[0.04]"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
                >
                  {/* Award + Info Tooltip Trigger */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold tracking-tight">
                          {row.award}
                        </span>
                        <div className="relative inline-flex items-center group">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenTooltipAward(
                                isTooltipOpen ? null : awardKey
                              )
                            }
                            aria-label={`Definition for ${row.award}: ${row.definition}`}
                            className="w-4 h-4 rounded-full border border-[var(--vfsn-border)] inline-flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer"
                            style={{
                              backgroundColor: isTooltipOpen
                                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                                : "rgba(0, 0, 0, 0.25)",
                              color: isTooltipOpen
                                ? "var(--nav-background, #0A0A0C)"
                                : "var(--nav-text, var(--vfsn-text))",
                            }}
                          >
                            i
                          </button>

                          {/* Hover / Click Pop-up Definition */}
                          <div
                            className={`z-20 absolute left-0 bottom-full mb-2 w-48 p-2.5 rounded-lg border border-[var(--vfsn-border)] shadow-xl text-[11px] font-semibold leading-snug pointer-events-none transition-opacity duration-150 ${
                              isTooltipOpen
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                            style={{
                              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                              color: "var(--nav-text, var(--vfsn-text))",
                            }}
                          >
                            <span
                              className="block text-[9px] font-extrabold uppercase tracking-wider mb-0.5"
                              style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                            >
                              {row.award}
                            </span>
                            {row.definition ?? "Weekly prop honor"}
                          </div>
                        </div>
                      </div>

                      {isTooltipOpen && (
                        <span
                          className="text-[10px] font-semibold opacity-85"
                          style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                        >
                          {row.definition}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Winner Team / Player / Manager */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="font-bold leading-tight">
                      {row.playerName ? (
                        <>
                          <span style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}>
                            {row.playerName}
                          </span>
                          <span className="block text-[11px] opacity-80 font-semibold">
                            {row.teamName} ({row.managerName})
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}>
                            {row.teamName}
                          </span>
                          <span className="block text-[11px] opacity-75 font-semibold">
                            {row.managerName}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Value & Supplemental */}
                  <td className="py-3 px-3.5 align-top text-right tabular-nums">
                    <div
                      className="font-black text-xs"
                      style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                    >
                      {formatAwardValue(row.award, row.value)}
                    </div>
                    {row.supplemental && (
                      <div className="text-[10px] font-semibold opacity-70">
                        {row.supplemental}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
