"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { triggerVfsnFilterLoading } from "@/components/vffl/BroadcastLoader";
import {
  POSITION_GROUPS,
  POSITION_GROUP_ORDER,
  type PositionGroup,
} from "@/app/vffl/who-should-i-start/statConfig";
import { SURFACE, TEXT } from "./theme";

interface PositionGroupToggleProps {
  active: PositionGroup;
}

export default function PositionGroupToggle({ active }: PositionGroupToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (group: PositionGroup) => {
    if (group === active) return;
    const currentStr = searchParams.toString();
    const params = new URLSearchParams(currentStr);
    params.set("pos", group);
    // Player IDs never carry across position groups
    params.delete("p1");
    params.delete("p2");
    const nextStr = params.toString();
    if (nextStr === currentStr) return;

    triggerVfsnFilterLoading(
      nextStr,
      currentStr,
      `Loading ${POSITION_GROUPS[group].label} Pool...`
    );
    router.push(`${pathname}?${nextStr}`, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Position Group"
      className="inline-flex flex-wrap items-center p-1.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1.5 transition-colors duration-300"
      style={{ backgroundColor: SURFACE, color: TEXT }}
    >
      {POSITION_GROUP_ORDER.map((group) => {
        const isActive = group === active;
        return (
          <button
            key={`pos-${group}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(group)}
            className="px-5 py-2 rounded-[9px] text-xs font-extrabold uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: isActive ? "var(--vfsn-accent-1)" : "rgba(0, 0, 0, 0.25)",
              color: isActive ? "var(--vfsn-surface)" : TEXT,
              opacity: isActive ? 1 : 0.8,
            }}
          >
            {POSITION_GROUPS[group].label}
          </button>
        );
      })}
    </div>
  );
}
