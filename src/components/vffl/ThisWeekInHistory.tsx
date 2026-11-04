"use client";

import { useState } from "react";
import { vfflVwThisWeekInHistory } from "@/db/schema";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";

export type ThisWeekInHistoryData = InferSelectModel<
  typeof vfflVwThisWeekInHistory
>;

interface ThisWeekInHistoryProps {
  events: ThisWeekInHistoryData[];
}

const EVENT_ORDER = [
  "Highest Scoring Game",
  "Highest Scoring Team",
  "Highest Margin to Projection",
  "Biggest Blowout",
  "Tightest Matchup",
];

export default function ThisWeekInHistory({ events }: ThisWeekInHistoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const orderedEvents = [...events].sort((a, b) => {
    const idxA = EVENT_ORDER.indexOf(a.highlight ?? "");
    const idxB = EVENT_ORDER.indexOf(b.highlight ?? "");
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  if (orderedEvents.length === 0) {
    return null;
  }

  const safeIndex = activeIndex % orderedEvents.length;
  const current = orderedEvents[safeIndex];

  const handlePrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + orderedEvents.length) % orderedEvents.length
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % orderedEvents.length);
  };

  const homeFpts = current.homeFpts ?? 0;
  const awayFpts = current.awayFpts ?? 0;
  const homeProj = current.homeProjected ?? 0;
  const awayProj = current.awayProjected ?? 0;
  const totalFpts = current.totalFpts ?? homeFpts + awayFpts;
  const victoryMargin = current.victoryMargin ?? Math.abs(homeFpts - awayFpts);
  const projMargin =
    current.projectionMargin ?? totalFpts - (homeProj + awayProj);

  const isHomeWinner = homeFpts >= awayFpts;
  const winnerTeam = isHomeWinner
    ? current.homeTeam ?? "Home Team"
    : current.awayTeam ?? "Away Team";
  const highestTeamScore = Math.max(homeFpts, awayFpts);
  const matchupScoreFormatted = `${homeFpts.toFixed(2)} - ${awayFpts.toFixed(2)}`;

  const renderEventSpotlight = () => {
    const teamScoresNode = (
      <>
        {current.homeTeam} (
        <span style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}>
          {homeFpts.toFixed(2)}
        </span>
        ) vs. {current.awayTeam} (
        <span style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}>
          {awayFpts.toFixed(2)}
        </span>
        )
      </>
    );

    switch (current.highlight) {
      case "Highest Scoring Game":
        return {
          primaryMetricLabel: "Combined Total Points",
          primaryMetricValue: `${totalFpts.toFixed(2)}`,
          primaryMetricRight: null,
          secondaryMetricLabel: null,
          secondaryMetricValue: teamScoresNode,
        };
      case "Highest Scoring Team":
        return {
          primaryMetricLabel: `Record Team Score • ${winnerTeam}`,
          primaryMetricValue: `${highestTeamScore.toFixed(2)}`,
          primaryMetricRight: null,
          secondaryMetricLabel: null,
          secondaryMetricValue: teamScoresNode,
        };
      case "Highest Margin to Projection": {
        const homeDiff = homeFpts - homeProj;
        const awayDiff = awayFpts - awayProj;
        const topTeam =
          homeDiff >= awayDiff
            ? current.homeTeam ?? "Home"
            : current.awayTeam ?? "Away";
        const topActual = homeDiff >= awayDiff ? homeFpts : awayFpts;
        return {
          primaryMetricLabel: `Actual vs. Proj Margin • ${topTeam}`,
          primaryMetricValue: `${topActual.toFixed(2)}`,
          primaryMetricRight: `+${projMargin.toFixed(2)} vs PROJ`,
          secondaryMetricLabel: null,
          secondaryMetricValue: teamScoresNode,
        };
      }
      case "Biggest Blowout":
        return {
          primaryMetricLabel: "Victory Margin",
          primaryMetricValue: `+${victoryMargin.toFixed(2)}`,
          primaryMetricRight: null,
          secondaryMetricLabel: null,
          secondaryMetricValue: teamScoresNode,
        };
      case "Tightest Matchup":
      default:
        return {
          primaryMetricLabel: "Victory Margin",
          primaryMetricValue: `${victoryMargin.toFixed(2)}`,
          primaryMetricRight: null,
          secondaryMetricLabel: null,
          secondaryMetricValue: teamScoresNode,
        };
    }
  };

  const spotlight = renderEventSpotlight();

  return (
    <section
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-5 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* Header & Carousel Controls */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--vfsn-border)]">
        <div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] block"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            Vault Archive • Week {current.week}
          </span>
          <h2 className="text-base font-black uppercase tracking-tight">
            This Week in History
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous historical event"
            className="w-8 h-8 rounded-lg border border-[var(--vfsn-border)] flex items-center justify-center transition-opacity hover:opacity-100 opacity-80 cursor-pointer"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              color: "var(--nav-highlight, var(--vfsn-accent-1))",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-xs font-extrabold tabular-nums px-1 opacity-80">
            {safeIndex + 1} / {orderedEvents.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next historical event"
            className="w-8 h-8 rounded-lg border border-[var(--vfsn-border)] flex items-center justify-center transition-opacity hover:opacity-100 opacity-80 cursor-pointer"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.25)",
              color: "var(--nav-highlight, var(--vfsn-accent-1))",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Event Card Body */}
      <div
        className="rounded-xl border border-[var(--vfsn-border)] p-4 flex flex-col gap-3"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs font-black uppercase tracking-[0.14em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {current.highlight}
          </span>
          <span
            className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider border border-[var(--vfsn-border)]"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          >
            {current.highlightYear} • WK {current.highlightWeek}
          </span>
        </div>

        <div className="pt-1">
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
            {spotlight.primaryMetricLabel}
          </div>
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <div
              className="text-2xl font-black tabular-nums tracking-tight"
              style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
            >
              {spotlight.primaryMetricValue}
            </div>
            {spotlight.primaryMetricRight && (
              <div
                className="text-2xl font-black tabular-nums tracking-tight uppercase"
                style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
              >
                {spotlight.primaryMetricRight}
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--vfsn-border)] flex flex-col gap-1.5 text-xs">
          {spotlight.secondaryMetricLabel && (
            <div className="flex items-center justify-between gap-2">
              <span className="opacity-75 font-semibold">
                {spotlight.secondaryMetricLabel}
              </span>
            </div>
          )}
          <div className="font-bold tabular-nums">
            {spotlight.secondaryMetricValue}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Matchup Winner
            </span>
            <span
              className="text-xs font-extrabold uppercase tracking-wide"
              style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
            >
              {winnerTeam}
            </span>
          </div>
        </div>
      </div>

      {/* Pagination Indicator Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {orderedEvents.map((ev, idx) => {
          const isCurrent = idx === safeIndex;
          return (
            <button
              key={`${ev.highlight}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View ${ev.highlight}`}
              className="h-1.5 rounded-full transition-all duration-200 cursor-pointer"
              style={{
                width: isCurrent ? "24px" : "8px",
                backgroundColor: isCurrent
                  ? "var(--nav-highlight, var(--vfsn-accent-1))"
                  : "var(--vfsn-border)",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
