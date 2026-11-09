"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface SeasonWeekBadgeProps {
  seasonYear: number;
  week: number;
  label?: string;
  title?: string;
  interactive?: boolean;
  seasonOptions?: number[];
  weekOptions?: number[];
}

export default function SeasonWeekBadge({
  seasonYear,
  week,
  label = "Weekly League Hub",
  title = "VFFL GameDay Central",
  interactive = false,
  seasonOptions = [],
  weekOptions = [],
}: SeasonWeekBadgeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openMenu, setOpenMenu] = useState<"season" | "week" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [interactive]);

  const handleSelectSeason = (nextSeason: number) => {
    setOpenMenu(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("season", String(nextSeason));
    params.delete("matchupId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSelectWeek = (nextWeek: number) => {
    setOpenMenu(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", String(nextWeek));
    params.delete("matchupId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const resolvedSeasons =
    seasonOptions.length > 0 ? seasonOptions : [seasonYear];
  const resolvedWeeks =
    weekOptions.length > 0
      ? weekOptions
      : Array.from({ length: 17 }, (_, i) => i + 1);

  return (
    <div ref={containerRef} className="flex items-center gap-4">
      {interactive && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .vfsn-sw-option:hover {
                background-color: var(--nav-highlight, var(--vfsn-accent-1)) !important;
                color: var(--nav-background, var(--vfsn-surface)) !important;
              }
            `,
          }}
        />
      )}

      <div
        className="inline-flex items-center gap-3 px-4 py-2 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-colors duration-300"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
          style={{
            backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
          }}
        />

        <div className="flex items-center gap-2.5">
          {/* Season Display or Custom Listbox Dropdown */}
          {interactive ? (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={openMenu === "season"}
                onClick={() =>
                  setOpenMenu((prev) => (prev === "season" ? null : "season"))
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--vfsn-border)] text-xs font-extrabold uppercase tracking-[0.16em] cursor-pointer transition-colors"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.25)",
                  color: "var(--nav-highlight, var(--vfsn-accent-1))",
                }}
              >
                <span>Season {seasonYear}</span>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    openMenu === "season" ? "rotate-180" : ""
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

              {openMenu === "season" && (
                <ul
                  role="listbox"
                  aria-label="Select Season"
                  className="z-40 absolute left-0 top-full mt-2 min-w-[140px] max-h-60 overflow-y-auto rounded-xl border border-[var(--vfsn-border)] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col gap-0.5"
                  style={{
                    backgroundColor:
                      "var(--nav-background, var(--vfsn-surface))",
                    color: "var(--nav-text, var(--vfsn-text))",
                  }}
                >
                  {resolvedSeasons.map((yr) => {
                    const isSelected = yr === seasonYear;
                    return (
                      <li key={yr} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => handleSelectSeason(yr)}
                          className="vfsn-sw-option w-full text-left px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-between"
                          style={
                            isSelected
                              ? {
                                  backgroundColor:
                                    "var(--nav-highlight, var(--vfsn-accent-1))",
                                  color:
                                    "var(--nav-background, var(--vfsn-surface))",
                                }
                              : {
                                  color: "var(--nav-text, var(--vfsn-text))",
                                }
                          }
                        >
                          <span>Season {yr}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <span
              className="text-xs font-extrabold uppercase tracking-[0.18em]"
              style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
            >
              Season {seasonYear}
            </span>
          )}

          <span className="opacity-30 font-light">|</span>

          {/* Week Display or Custom Listbox Dropdown */}
          {interactive ? (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={openMenu === "week"}
                onClick={() =>
                  setOpenMenu((prev) => (prev === "week" ? null : "week"))
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--vfsn-border)] text-sm font-black uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.25)",
                  color: "var(--nav-text, var(--vfsn-text))",
                }}
              >
                <span>Week {week}</span>
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    openMenu === "week" ? "rotate-180" : ""
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

              {openMenu === "week" && (
                <ul
                  role="listbox"
                  aria-label="Select Week"
                  className="z-40 absolute left-0 top-full mt-2 min-w-[130px] max-h-64 overflow-y-auto rounded-xl border border-[var(--vfsn-border)] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col gap-0.5"
                  style={{
                    backgroundColor:
                      "var(--nav-background, var(--vfsn-surface))",
                    color: "var(--nav-text, var(--vfsn-text))",
                  }}
                >
                  {resolvedWeeks.map((wk) => {
                    const isSelected = wk === week;
                    return (
                      <li key={wk} role="option" aria-selected={isSelected}>
                        <button
                          type="button"
                          onClick={() => handleSelectWeek(wk)}
                          className="vfsn-sw-option w-full text-left px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-between"
                          style={
                            isSelected
                              ? {
                                  backgroundColor:
                                    "var(--nav-highlight, var(--vfsn-accent-1))",
                                  color:
                                    "var(--nav-background, var(--vfsn-surface))",
                                }
                              : {
                                  color: "var(--nav-text, var(--vfsn-text))",
                                }
                          }
                        >
                          <span>Week {wk}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <span
              className="text-sm font-black uppercase tracking-wider"
              style={{ color: "var(--nav-text, var(--vfsn-text))" }}
            >
              Week {week}
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex flex-col">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">
          {label}
        </span>
        <h1 className="text-xl font-black tracking-tight uppercase">
          {title}
        </h1>
      </div>
    </div>
  );
}
