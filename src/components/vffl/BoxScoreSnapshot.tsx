"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";
import { vfflVwMatchups } from "@/db/schema";

export type BoxScoreMatchupRow = InferSelectModel<typeof vfflVwMatchups>;

interface BoxScoreSnapshotProps {
  matchups: BoxScoreMatchupRow[];
  activeMatchupId: number | null;
}

function formatStandingPrefix(standing: number | null): string {
  if (!standing || standing <= 0) return "#-";
  return `#${standing}`;
}

export default function BoxScoreSnapshot({
  matchups,
  activeMatchupId,
}: BoxScoreSnapshotProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelectMatchup = (matchupId: number | null) => {
    if (matchupId === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("matchupId", String(matchupId));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (matchups.length === 0) {
    return (
      <section
        className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-center text-sm font-bold opacity-75"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        No matchups recorded for the selected division, season, and week.
      </section>
    );
  }

  return (
    <section
      aria-label="Box Score Matchup Snapshot"
      className="w-full grid grid-cols-2 md:grid-cols-5 gap-6"
    >
      {matchups.map((matchup, idx) => {
        const isActive =
          matchup.matchupId !== null && matchup.matchupId === activeMatchupId;
        const homeVal = matchup.homeScore ?? 0;
        const awayVal = matchup.awayScore ?? 0;
        const isHomeLeading = homeVal > awayVal;
        const isAwayLeading = awayVal > homeVal;
        const homeScore = homeVal.toFixed(2);
        const awayScore = awayVal.toFixed(2);

        return (
          <button
            key={matchup.matchupId ?? idx}
            type="button"
            onClick={() => handleSelectMatchup(matchup.matchupId)}
            aria-pressed={isActive}
            className="w-full text-left rounded-[12px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 hover:translate-y-[-2px]"
            style={{
              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
              color: "var(--nav-text, var(--vfsn-text))",
              border: isActive
                ? "1.5px solid var(--vfsn-accent-1)"
                : "1px solid var(--vfsn-border)",
              boxShadow: isActive
                ? "0 4px 24px rgba(0, 0, 0, 0.4)"
                : "0 4px 20px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Top Micro Header: Matchup Label & Active Indicator */}
            <div className="w-full flex items-center justify-between gap-2 pb-2 border-b border-[var(--vfsn-border)]">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] opacity-70 truncate">
                {matchup.matchupTitle ?? `Matchup ${idx + 1}`}
              </span>
              {isActive && (
                <span
                  className="text-[9px] font-black uppercase tracking-[0.14em] px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
                    color: "var(--nav-background, var(--vfsn-surface))",
                  }}
                >
                  Selected
                </span>
              )}
            </div>

            {/* Home Team (Top Row) */}
            <div className="w-full flex items-center justify-between gap-2.5 min-w-0">
              <span
                className="text-xs font-extrabold truncate"
                style={{
                  color: isHomeLeading
                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                    : "var(--nav-text, var(--vfsn-text))",
                  opacity: isHomeLeading ? 1 : 0.85,
                }}
                title={`${formatStandingPrefix(matchup.homeStanding)} ${matchup.homeTeam ?? "Home Team"}`}
              >
                <span
                  className="opacity-75 font-bold mr-1"
                  style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                >
                  {formatStandingPrefix(matchup.homeStanding)}
                </span>
                {matchup.homeTeam ?? "Home Team"}
              </span>
              <span
                className="text-sm font-black tabular-nums shrink-0"
                style={{
                  color: isHomeLeading
                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                    : "var(--nav-text, var(--vfsn-text))",
                  opacity: isHomeLeading ? 1 : 0.85,
                }}
              >
                {homeScore}
              </span>
            </div>

            {/* Away Team (Bottom Row) */}
            <div className="w-full flex items-center justify-between gap-2.5 min-w-0">
              <span
                className="text-xs font-extrabold truncate"
                style={{
                  color: isAwayLeading
                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                    : "var(--nav-text, var(--vfsn-text))",
                  opacity: isAwayLeading ? 1 : 0.85,
                }}
                title={`${formatStandingPrefix(matchup.awayStanding)} ${matchup.awayTeam ?? "Away Team"}`}
              >
                <span
                  className="opacity-75 font-bold mr-1"
                  style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                >
                  {formatStandingPrefix(matchup.awayStanding)}
                </span>
                {matchup.awayTeam ?? "Away Team"}
              </span>
              <span
                className="text-sm font-black tabular-nums shrink-0"
                style={{
                  color: isAwayLeading
                    ? "var(--nav-highlight, var(--vfsn-accent-1))"
                    : "var(--nav-text, var(--vfsn-text))",
                  opacity: isAwayLeading ? 1 : 0.85,
                }}
              >
                {awayScore}
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
