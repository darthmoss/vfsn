"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeeklyRecapMatchupJson } from "@/app/vffl/weekly-recaps/mockData";

export interface TocSubItem {
  id: string;
  label: string;
}

export interface TocGroupItem {
  id: string;
  number: string;
  label: string;
  anchorPrefix?: "red" | "black";
  children?: TocSubItem[];
}

export const WEEKLY_RECAP_TOC_SECTIONS: TocGroupItem[] = [
  {
    id: "recap-intro",
    number: "01",
    label: "Intro",
  },
  {
    id: "red-division",
    number: "02",
    label: "Red Division",
    anchorPrefix: "red",
    children: [
      { id: "red-box-scores", label: "Box Scores" },
      { id: "red-weekly-props", label: "Weekly Props" },
      { id: "red-standings", label: "Standings" },
      { id: "red-power-rankings", label: "Power Rankings" },
    ],
  },
  {
    id: "black-division",
    number: "03",
    label: "Black Division",
    anchorPrefix: "black",
    children: [
      { id: "black-box-scores", label: "Box Scores" },
      { id: "black-weekly-props", label: "Weekly Props" },
      { id: "black-standings", label: "Standings" },
      { id: "black-power-rankings", label: "Power Rankings" },
    ],
  },
  {
    id: "recap-outro",
    number: "04",
    label: "Outro",
  },
];

interface WeeklyRecapTocProps {
  seasonYear: number;
  week: number;
  redMatchups?: WeeklyRecapMatchupJson[];
  blackMatchups?: WeeklyRecapMatchupJson[];
}

export default function WeeklyRecapToc({
  seasonYear,
  week,
  redMatchups = [],
  blackMatchups = [],
}: WeeklyRecapTocProps) {
  const [activeId, setActiveId] = useState<string>("recap-intro");

  const allObservedIds = useMemo(() => {
    const ids: string[] = [];
    for (const section of WEEKLY_RECAP_TOC_SECTIONS) {
      ids.push(section.id);
      if (section.anchorPrefix === "red") {
        ids.push("red-box-scores");
        redMatchups.forEach((m, idx) => {
          ids.push(`red-matchup-${m.matchupRank ?? idx + 1}`);
        });
        ids.push(
          "red-weekly-props",
          "red-standings",
          "red-power-rankings"
        );
      } else if (section.anchorPrefix === "black") {
        ids.push("black-box-scores");
        blackMatchups.forEach((m, idx) => {
          ids.push(`black-matchup-${m.matchupRank ?? idx + 1}`);
        });
        ids.push(
          "black-weekly-props",
          "black-standings",
          "black-power-rankings"
        );
      }
    }
    return ids;
  }, [redMatchups, blackMatchups]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 160;
      let current = allObservedIds[0] ?? "recap-intro";

      for (const id of allObservedIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= scrollThreshold) {
          current = id;
        }
      }

      setActiveId(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allObservedIds]);

  const scrollToAnchor = (id: string) => {
    setActiveId(id);
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Weekly Recap Table of Contents"
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-5 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* Card Header */}
      <header className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--vfsn-border)]">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            Season {seasonYear} • Week {week} Index
          </span>
          <h2 className="text-base font-black uppercase tracking-tight">
            Table of Contents
          </h2>
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-2.5 py-1 rounded-lg border border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.14em] transition-opacity hover:opacity-100 opacity-75 cursor-pointer"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            color: "var(--nav-text, var(--vfsn-text))",
          }}
        >
          Top ↑
        </button>
      </header>

      {/* Section Links */}
      <ol className="flex flex-col gap-3">
        {WEEKLY_RECAP_TOC_SECTIONS.map((section) => {
          const prefix = section.anchorPrefix;
          const divisionMatchups =
            prefix === "red"
              ? redMatchups
              : prefix === "black"
                ? blackMatchups
                : [];

          const isMatchupActiveInDivision = Boolean(
            prefix && activeId.startsWith(`${prefix}-matchup-`)
          );
          const isChildActive = Boolean(
            section.children?.some((c) => c.id === activeId) ||
              isMatchupActiveInDivision
          );
          const isSectionActive = activeId === section.id || isChildActive;

          return (
            <li
              key={section.id}
              className="rounded-xl border border-[var(--vfsn-border)] overflow-hidden transition-colors"
              style={{
                backgroundColor: isSectionActive
                  ? "rgba(0, 0, 0, 0.28)"
                  : "rgba(0, 0, 0, 0.16)",
              }}
            >
              <button
                type="button"
                onClick={() => scrollToAnchor(section.id)}
                className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer transition-colors hover:bg-white/[0.04]"
                style={{
                  borderLeft: isSectionActive
                    ? "3px solid var(--nav-highlight, var(--vfsn-accent-1))"
                    : "3px solid transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-black tabular-nums px-2 py-0.5 rounded-md border border-[var(--vfsn-border)]"
                    style={
                      isSectionActive
                        ? {
                            backgroundColor:
                              "var(--nav-highlight, var(--vfsn-accent-1))",
                            color:
                              "var(--nav-background, var(--vfsn-surface))",
                          }
                        : {
                            backgroundColor: "rgba(0, 0, 0, 0.3)",
                            color: "var(--nav-text, var(--vfsn-text))",
                          }
                    }
                  >
                    {section.number}
                  </span>
                  <span
                    className="text-sm font-black uppercase tracking-tight"
                    style={{
                      color: isSectionActive
                        ? "var(--nav-highlight, var(--vfsn-accent-1))"
                        : "var(--nav-text, var(--vfsn-text))",
                    }}
                  >
                    {section.label}
                  </span>
                </div>

                <span
                  className="text-xs font-bold opacity-50"
                  style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                >
                  →
                </span>
              </button>

              {/* Vertical Sub-Links for Divisions */}
              {section.children && section.children.length > 0 && (
                <div className="px-4 pb-3 pt-2 border-t border-[var(--vfsn-border)]">
                  <ul className="flex flex-col gap-1.5">
                    {section.children.map((sub) => {
                      const isBoxScoreSub =
                        prefix && sub.id === `${prefix}-box-scores`;
                      const isSubActive =
                        activeId === sub.id ||
                        Boolean(isBoxScoreSub && isMatchupActiveInDivision);

                      return (
                        <li key={sub.id} className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => scrollToAnchor(sub.id)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--vfsn-border)] text-left text-xs font-extrabold tracking-tight flex items-center justify-between gap-2 transition-colors cursor-pointer hover:bg-white/[0.05]"
                            style={
                              isSubActive
                                ? {
                                    backgroundColor:
                                      "var(--nav-highlight, var(--vfsn-accent-1))",
                                    color:
                                      "var(--nav-background, var(--vfsn-surface))",
                                  }
                                : {
                                    backgroundColor: "rgba(0, 0, 0, 0.24)",
                                    color: "var(--nav-text, var(--vfsn-text))",
                                  }
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: isSubActive
                                    ? "var(--nav-background, var(--vfsn-surface))"
                                    : "var(--nav-highlight, var(--vfsn-accent-1))",
                                }}
                              />
                              <span className="truncate">{sub.label}</span>
                            </div>

                            {isBoxScoreSub && divisionMatchups.length > 0 && (
                              <span className="text-[10px] font-black opacity-75 shrink-0">
                                ▾
                              </span>
                            )}
                          </button>

                          {/* Matchup Quick-Jump Sub-Pills Always Visible & Indented Under Box Scores */}
                          {isBoxScoreSub &&
                            prefix &&
                            divisionMatchups.length > 0 && (
                              <ul
                                className="ml-3 pl-2.5 border-l-2 border-[var(--vfsn-border)] flex flex-col gap-1"
                              >
                                {divisionMatchups.map((m, idx) => {
                                  const mId = `${prefix}-matchup-${
                                    m.matchupRank ?? idx + 1
                                  }`;
                                  const isMatchupSelected = activeId === mId;

                                  const winnerColor = isMatchupSelected
                                    ? "var(--nav-background, var(--vfsn-surface))"
                                    : "var(--nav-highlight, var(--vfsn-accent-1))";
                                  const loserColor = isMatchupSelected
                                    ? "var(--nav-background, var(--vfsn-surface))"
                                    : "var(--nav-text, var(--vfsn-text))";

                                  return (
                                    <li key={m.matchupId ?? idx}>
                                      <button
                                        type="button"
                                        onClick={() => scrollToAnchor(mId)}
                                        className="w-full px-2.5 py-1.5 rounded-md border border-[var(--vfsn-border)] text-left transition-colors cursor-pointer hover:bg-white/[0.06] flex flex-col gap-0.5"
                                        style={
                                          isMatchupSelected
                                            ? {
                                                backgroundColor:
                                                  "var(--nav-highlight, var(--vfsn-accent-1))",
                                                color:
                                                  "var(--nav-background, var(--vfsn-surface))",
                                              }
                                            : {
                                                backgroundColor:
                                                  "rgba(0, 0, 0, 0.22)",
                                                color:
                                                  "var(--nav-text, var(--vfsn-text))",
                                              }
                                        }
                                      >
                                        {/* Line 1: Game Title */}
                                        <span
                                          className="text-[9px] font-black uppercase tracking-[0.14em] truncate"
                                          style={{
                                            color: isMatchupSelected
                                              ? "var(--nav-background, var(--vfsn-surface))"
                                              : "var(--nav-highlight, var(--vfsn-accent-1))",
                                          }}
                                        >
                                          {m.matchupTitle ?? `Matchup #${idx + 1}`}
                                        </span>

                                        {/* Line 2: Winning Team & Score */}
                                        <div
                                          className="flex items-center justify-between gap-2 text-[11px] font-extrabold"
                                          style={{ color: winnerColor }}
                                        >
                                          <span className="truncate">{m.winningTeam}</span>
                                          <span className="tabular-nums shrink-0">
                                            {Number(m.winningScore ?? 0).toFixed(2)}
                                          </span>
                                        </div>

                                        {/* Line 3: Losing Team & Score */}
                                        <div
                                          className="flex items-center justify-between gap-2 text-[11px] font-bold opacity-80"
                                          style={{ color: loserColor }}
                                        >
                                          <span className="truncate">{m.losingTeam}</span>
                                          <span className="tabular-nums shrink-0">
                                            {Number(m.losingScore ?? 0).toFixed(2)}
                                          </span>
                                        </div>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
