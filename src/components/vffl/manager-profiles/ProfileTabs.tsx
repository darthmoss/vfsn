"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { triggerVfsnFilterLoading } from "@/components/vffl/BroadcastLoader";
import {
  PROFILE_TABS,
  type ProfileTab,
} from "@/app/vffl/manager-profiles/mockData";
import {
  HIGHLIGHT,
  INSET_BG,
  SURFACE,
  TEXT,
} from "@/app/vffl/manager-profiles/utils";

export default function ProfileTabs({ activeTab }: { activeTab: ProfileTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<ProfileTab>(activeTab);
  const [syncedTab, setSyncedTab] = useState<ProfileTab>(activeTab);

  if (syncedTab !== activeTab) {
    setSyncedTab(activeTab);
    setSelected(activeTab);
  }

  const handleSelect = (tab: ProfileTab, label: string) => {
    setSelected(tab);
    const currentStr = searchParams.toString();
    const params = new URLSearchParams(currentStr);
    params.set("tab", tab);
    const nextStr = params.toString();
    if (nextStr === currentStr) return;

    triggerVfsnFilterLoading(nextStr, currentStr, `Loading ${label}...`);
    router.push(`${pathname}?${nextStr}`, { scroll: false });
  };

  return (
    <div
      role="tablist"
      aria-label="Showdowns View Mode"
      className="inline-flex items-center p-1 rounded-[10px] border border-[var(--vfsn-border)] gap-1"
      style={{ backgroundColor: INSET_BG }}
    >
      {PROFILE_TABS.map((tab) => {
        const isActive = selected === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.id, tab.label)}
            className="px-4 py-2 rounded-[7px] text-xs font-black uppercase tracking-[0.14em] transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isActive ? HIGHLIGHT : "transparent",
              color: isActive ? SURFACE : TEXT,
              opacity: isActive ? 1 : 0.75,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
