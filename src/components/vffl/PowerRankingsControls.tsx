"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  POWER_FORMULA_WEIGHTS,
  type PowerRankingScope,
  type PowerRankingTime,
} from "@/app/vffl/power-rankings/mockData";
import { triggerVfsnFilterLoading } from "./BroadcastLoader";

interface PowerRankingsControlsProps {
  activeScope: PowerRankingScope;
  activeTime: PowerRankingTime;
  subtitle?: string;
}

const SCOPE_OPTIONS: {
  id: PowerRankingScope;
  label: string;
  description: string;
}[] = [
  {
    id: "div",
    label: "DIV",
    description: "Division Power Rankings",
  },
  {
    id: "vffl",
    label: "VFFL",
    description: "Overall 20-Team Power Rankings",
  },
];

const TIME_OPTIONS: {
  id: PowerRankingTime;
  label: string;
  description: string;
}[] = [
  {
    id: "week",
    label: "Week",
    description: "Single-Week Performance Index",
  },
  {
    id: "std",
    label: "Season-to-Date",
    description: "Cumulative Season Index",
  },
];

export default function PowerRankingsControls({
  activeScope,
  activeTime,
  subtitle,
}: PowerRankingsControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedScope, setSelectedScope] =
    useState<PowerRankingScope>(activeScope);
  const [selectedTime, setSelectedTime] =
    useState<PowerRankingTime>(activeTime);

  useEffect(() => {
    setSelectedScope(activeScope);
  }, [activeScope]);

  useEffect(() => {
    setSelectedTime(activeTime);
  }, [activeTime]);

  const handleSelectScope = (nextScope: PowerRankingScope) => {
    setSelectedScope(nextScope);
    const currentStr = searchParams.toString();
    const params = new URLSearchParams(currentStr);
    params.set("scope", nextScope);
    const nextStr = params.toString();
    if (nextStr === currentStr) return;

    triggerVfsnFilterLoading(
      nextStr,
      currentStr,
      `Loading ${nextScope.toUpperCase()} Power Rankings...`
    );
    router.push(`${pathname}?${nextStr}`, { scroll: false });
  };

  const handleSelectTime = (nextTime: PowerRankingTime) => {
    setSelectedTime(nextTime);
    const currentStr = searchParams.toString();
    const params = new URLSearchParams(currentStr);
    params.set("time", nextTime);
    const nextStr = params.toString();
    if (nextStr === currentStr) return;

    const label = nextTime === "week" ? "Weekly" : "Season-to-Date";
    triggerVfsnFilterLoading(
      nextStr,
      currentStr,
      `Loading ${label} Rankings...`
    );
    router.push(`${pathname}?${nextStr}`, { scroll: false });
  };

  const activeScopeMeta =
    SCOPE_OPTIONS.find((opt) => opt.id === selectedScope) ?? SCOPE_OPTIONS[0];
  const activeTimeMeta =
    TIME_OPTIONS.find((opt) => opt.id === selectedTime) ?? TIME_OPTIONS[0];

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Row 1: Scope & Time Toggle Button Groups + Broadcast Context */}
      <div className="w-full flex flex-row items-center justify-between gap-6">
        <div className="flex flex-row items-center gap-4">
          {/* Scope Toggle Group: DIV | VFFL */}
          <div
            role="tablist"
            aria-label="Power Rankings Scope"
            className="inline-flex items-center p-1.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1.5 transition-colors duration-300"
            style={{
              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
              color: "var(--nav-text, var(--vfsn-text))",
            }}
          >
            {SCOPE_OPTIONS.map((option) => {
              const isActive = selectedScope === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectScope(option.id)}
                  className="px-6 py-2.5 rounded-[9px] text-xs font-black uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: isActive
                      ? "var(--nav-highlight, var(--vfsn-accent-1))"
                      : "rgba(0, 0, 0, 0.25)",
                    color: isActive
                      ? "var(--nav-background, var(--vfsn-surface))"
                      : "var(--nav-text, var(--vfsn-text))",
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Time Toggle Group: Week | Season-to-Date */}
          <div
            role="tablist"
            aria-label="Power Rankings Time Window"
            className="inline-flex items-center p-1.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1.5 transition-colors duration-300"
            style={{
              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
              color: "var(--nav-text, var(--vfsn-text))",
            }}
          >
            {TIME_OPTIONS.map((option) => {
              const isActive = selectedTime === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectTime(option.id)}
                  className="px-6 py-2.5 rounded-[9px] text-xs font-black uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: isActive
                      ? "var(--nav-highlight, var(--vfsn-accent-1))"
                      : "rgba(0, 0, 0, 0.25)",
                    color: isActive
                      ? "var(--nav-background, var(--vfsn-surface))"
                      : "var(--nav-text, var(--vfsn-text))",
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Broadcast Context Tag */}
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-extrabold uppercase tracking-[0.16em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {activeScopeMeta.description}
          </span>
          <span className="opacity-30 font-light">•</span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">
            {activeTimeMeta.description}
          </span>
          {subtitle && (
            <>
              <span className="opacity-30 font-light">•</span>
              <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                {subtitle}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Horizontal Power Ranking Formula Display */}
      <div
        aria-label="Power Ranking Matrix Weighting Formula"
        className="w-full rounded-[12px] border border-[var(--vfsn-border)] px-6 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-row items-center justify-between gap-6 transition-colors duration-300"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
            }}
          />
          <span className="text-[11px] font-black uppercase tracking-[0.18em] opacity-80">
            Power Index Formula
          </span>
        </div>

        <div className="flex flex-row items-center justify-end gap-4 flex-wrap">
          {POWER_FORMULA_WEIGHTS.map((item, idx) => (
            <div key={item.metricKey} className="flex items-center gap-4">
              <div
                tabIndex={0}
                className="group relative inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--vfsn-border)] cursor-help focus:outline-none"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
              >
                <span
                  className="text-xs font-black tabular-nums tracking-wider"
                  style={{
                    color: "var(--nav-highlight, var(--vfsn-accent-1))",
                  }}
                >
                  {item.weight}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] opacity-90">
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full border border-[var(--vfsn-border)] inline-flex items-center justify-center text-[9px] font-black leading-none opacity-65 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.35)",
                    color: "var(--nav-highlight, var(--vfsn-accent-1))",
                  }}
                >
                  i
                </span>

                {/* Broadcast Info Tooltip */}
                <div
                  role="tooltip"
                  className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-40 absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 rounded-xl border border-[var(--vfsn-border)] shadow-[0_8px_28px_rgba(0,0,0,0.65)] text-left"
                  style={{
                    backgroundColor:
                      "var(--nav-background, var(--vfsn-surface))",
                    color: "var(--nav-text, var(--vfsn-text))",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[var(--vfsn-border)]">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{
                        color: "var(--nav-highlight, var(--vfsn-accent-1))",
                      }}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] font-black tabular-nums opacity-75">
                      {item.weight} Weight
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-snug opacity-90 normal-case tracking-normal">
                    {item.tooltip}
                  </p>
                </div>
              </div>

              {idx < POWER_FORMULA_WEIGHTS.length - 1 && (
                <span className="text-xs font-light opacity-30 select-none">
                  |
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
