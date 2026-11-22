"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { triggerVfsnFilterLoading } from "@/components/vffl/BroadcastLoader";
import type { ManagerOption } from "@/app/vffl/manager-profiles/mockData";
import { HIGHLIGHT, SURFACE, TEXT, INSET_BG } from "@/app/vffl/manager-profiles/utils";
import { ChevronIcon } from "./ui";

interface ManagerSelectorProps {
  managers: ManagerOption[];
  selectedId: number;
}

export default function ManagerSelector({
  managers,
  selectedId,
}: ManagerSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const selected = managers.find((m) => m.managerId === selectedId);
  const groups: { label: string; items: ManagerOption[] }[] = [
    { label: "Active", items: managers.filter((m) => m.active) },
    { label: "Retired", items: managers.filter((m) => !m.active) },
  ].filter((g) => g.items.length > 0);

  const handleSelect = (manager: ManagerOption) => {
    setOpen(false);
    if (manager.managerId === null) return;
    const currentStr = searchParams.toString();
    const params = new URLSearchParams(currentStr);
    params.set("managerId", String(manager.managerId));
    const nextStr = params.toString();
    if (nextStr === currentStr) return;

    triggerVfsnFilterLoading(
      nextStr,
      currentStr,
      `Loading ${manager.managerName ?? "Manager"}...`
    );
    router.push(`${pathname}?${nextStr}`, { scroll: false });
  };

  return (
    <div ref={containerRef} className="relative">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .vfsn-mp-option:hover {
              background-color: var(--nav-highlight, var(--vfsn-accent-1)) !important;
              color: var(--nav-background, var(--vfsn-surface)) !important;
            }
          `,
        }}
      />

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-4 pl-4 pr-3 py-2.5 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] cursor-pointer min-w-[280px] justify-between transition-colors duration-300"
        style={{ backgroundColor: SURFACE, color: TEXT }}
      >
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
            Manager
          </span>
          <span className="text-sm font-black uppercase tracking-wider">
            {selected?.managerName ?? "Select Manager"}
          </span>
        </span>
        <span
          className="inline-flex w-8 h-8 items-center justify-center rounded-lg border border-[var(--vfsn-border)]"
          style={{ backgroundColor: INSET_BG, color: HIGHLIGHT }}
        >
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select Manager"
          className="z-40 absolute right-0 top-full mt-2 w-[320px] max-h-[480px] overflow-y-auto rounded-xl border border-[var(--vfsn-border)] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col gap-3"
          style={{ backgroundColor: SURFACE, color: TEXT }}
        >
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <span className="px-3 pt-1 pb-1.5 text-[10px] font-black uppercase tracking-[0.18em] opacity-55">
                {group.label}
              </span>
              {group.items.map((m) => {
                const isSelected = m.managerId === selectedId;
                return (
                  <button
                    key={m.managerId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(m)}
                    className="vfsn-mp-option w-full text-left px-3 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                    style={
                      isSelected
                        ? { backgroundColor: HIGHLIGHT, color: SURFACE }
                        : { color: TEXT, opacity: m.active ? 1 : 0.75 }
                    }
                  >
                    {m.managerName}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
