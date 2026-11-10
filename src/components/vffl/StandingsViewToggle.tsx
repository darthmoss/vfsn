"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { StandingsViewMode } from "@/app/vffl/standings/mockData";
import { triggerVfsnFilterLoading } from "./BroadcastLoader";

interface StandingsViewToggleProps {
  activeView: StandingsViewMode;
  subtitle?: string;
}

const VIEW_OPTIONS: {
  id: StandingsViewMode;
  label: string;
  description: string;
}[] = [
  {
    id: "H2H",
    label: "H2H",
    description: "Head-to-Head Division Standings",
  },
  {
    id: "DIV",
    label: "DIV",
    description: "Division All-Play Standings",
  },
  {
    id: "VFFL",
    label: "VFFL",
    description: "VFFL Overall All-Play Standings",
  },
];

export default function StandingsViewToggle({
  activeView,
  subtitle,
}: StandingsViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedView, setSelectedView] =
    useState<StandingsViewMode>(activeView);

  useEffect(() => {
    setSelectedView(activeView);
  }, [activeView]);

  const handleSelectView = (view: StandingsViewMode) => {
    setSelectedView(view);
    const currentStr = searchParams.toString();
    const params = new URLSearchParams(currentStr);
    params.set("view", view);
    const nextStr = params.toString();
    if (nextStr === currentStr) return;

    triggerVfsnFilterLoading(
      nextStr,
      currentStr,
      `Loading ${view} Standings...`
    );
    router.push(`${pathname}?${nextStr}`, { scroll: false });
  };

  const activeMeta =
    VIEW_OPTIONS.find((opt) => opt.id === selectedView) ?? VIEW_OPTIONS[0];

  return (
    <div className="w-full flex flex-row items-center justify-between gap-6">
      {/* Left: View Mode Toggle Pill Group */}
      <div
        role="tablist"
        aria-label="Standings View Mode"
        className="inline-flex items-center p-1.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1.5 transition-colors duration-300"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        {VIEW_OPTIONS.map((option) => {
          const isActive = selectedView === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectView(option.id)}
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

      {/* Right: Broadcast Context Tag */}
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-extrabold uppercase tracking-[0.16em]"
          style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
        >
          {activeMeta.description}
        </span>
        {subtitle && (
          <>
            <span className="opacity-30 font-light">•</span>
            <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">
              {subtitle}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
