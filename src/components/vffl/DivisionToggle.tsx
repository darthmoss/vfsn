"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeDivision, setActiveDivision] =
    useState<DivisionKey>(initialDivision);

  useEffect(() => {
    setActiveDivision(initialDivision);
  }, [initialDivision]);

  const handleSelect = (division: DivisionKey) => {
    setActiveDivision(division);
    onChange?.(division);

    const params = new URLSearchParams(searchParams.toString());
    params.set("division", division);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeCount = datasets?.[activeDivision]?.matchups.length;

  return (
    <div
      role="tablist"
      aria-label="Division Selector"
      data-matchup-count={activeCount}
      className="inline-flex items-center p-1.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1.5 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
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
                ? "var(--nav-highlight, var(--vfsn-accent-1))"
                : "rgba(0, 0, 0, 0.25)",
              color: isActive
                ? "var(--nav-background, #0A0A0C)"
                : "var(--nav-text, var(--vfsn-text))",
              opacity: isActive ? 1 : 0.8,
            }}
          >
            {division}
          </button>
        );
      })}
    </div>
  );
}
