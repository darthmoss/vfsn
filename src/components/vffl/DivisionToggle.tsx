"use client";

import { useState } from "react";
import type {
  DivisionDataset,
  DivisionKey,
} from "@/app/vffl/current-week/mockData";

interface DivisionToggleProps {
  initialDivision?: DivisionKey;
  datasets?: Record<DivisionKey, DivisionDataset>;
  onChange?: (division: DivisionKey) => void;
}

const DIVISIONS: DivisionKey[] = ["Red Division", "Black Division"];

export default function DivisionToggle({
  initialDivision = "Red Division",
  datasets,
  onChange,
}: DivisionToggleProps) {
  const [activeDivision, setActiveDivision] =
    useState<DivisionKey>(initialDivision);

  const handleSelect = (division: DivisionKey) => {
    setActiveDivision(division);
    onChange?.(division);
  };

  const activeCount = datasets?.[activeDivision]?.matchups.length;

  return (
    <div
      role="tablist"
      aria-label="Division Selector"
      data-matchup-count={activeCount}
      className="inline-flex items-center p-1.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1.5"
      style={{ backgroundColor: "var(--vfsn-surface)" }}
    >
      {DIVISIONS.map((division) => {
        const isActive = activeDivision === division;
        return (
          <button
            key={division}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(division)}
            className="px-5 py-2 rounded-[9px] text-xs font-extrabold uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isActive
                ? "var(--vfsn-accent-1)"
                : "var(--vfsn-bg)",
              color: isActive ? "var(--vfsn-bg)" : "var(--vfsn-text)",
              opacity: isActive ? 1 : 0.75,
            }}
          >
            {division}
          </button>
        );
      })}
    </div>
  );
}
