"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

const FILTER_LOADING_EVENT = "vfsn:filter-loading";

export function triggerVfsnFilterLoading(
  nextParamsString: string,
  currentParamsString: string,
  label = "Updating Standings..."
) {
  if (typeof window === "undefined") return;
  if (nextParamsString === currentParamsString) return;
  window.dispatchEvent(
    new CustomEvent(FILTER_LOADING_EVENT, {
      detail: { nextParamsString, label },
    })
  );
}

interface BroadcastLoaderProps {
  children: ReactNode;
}

export default function BroadcastLoader({ children }: BroadcastLoaderProps) {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  const [loadingState, setLoadingState] = useState<{
    active: boolean;
    label: string;
  }>({
    active: false,
    label: "Updating Standings...",
  });

  // Clear loading state as soon as the Server Component finishes rendering the new searchParams
  useEffect(() => {
    setLoadingState((prev) =>
      prev.active ? { ...prev, active: false } : prev
    );
  }, [currentSearch]);

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const handleStart = (e: Event) => {
      const customEvent = e as CustomEvent<{
        nextParamsString?: string;
        label?: string;
      }>;
      setLoadingState({
        active: true,
        label: customEvent.detail?.label ?? "Updating Standings...",
      });

      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(() => {
        setLoadingState((prev) =>
          prev.active ? { ...prev, active: false } : prev
        );
      }, 10000);
    };

    window.addEventListener(FILTER_LOADING_EVENT, handleStart);
    return () => {
      window.removeEventListener(FILTER_LOADING_EVENT, handleStart);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="relative w-full flex flex-col gap-10">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes vfsn-sweep {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(250%); }
            }
          `,
        }}
      />

      {loadingState.active && (
        <>
          {/* Top Sweeping Broadcast Bar */}
          <div className="w-full h-1 rounded-full overflow-hidden bg-white/10 -mb-6 z-30">
            <div
              className="w-2/5 h-full rounded-full"
              style={{
                backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
                animation: "vfsn-sweep 1.1s ease-in-out infinite",
              }}
            />
          </div>

          {/* Floating Broadcast Status Pill */}
          <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
            <div
              className="px-5 py-3 rounded-xl border border-[var(--vfsn-border)] shadow-[0_8px_30px_rgba(0,0,0,0.65)] flex items-center gap-3.5"
              style={{
                backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                color: "var(--nav-text, var(--vfsn-text))",
              }}
            >
              <span
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                style={{
                  borderColor: "var(--nav-highlight, var(--vfsn-accent-1))",
                  borderTopColor: "transparent",
                }}
              />
              <span className="text-xs font-black uppercase tracking-[0.16em]">
                {loadingState.label}
              </span>
            </div>
          </div>
        </>
      )}

      <div
        className={`w-full flex flex-col gap-10 transition-opacity duration-200 ${
          loadingState.active
            ? "opacity-45 pointer-events-none select-none"
            : "opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
