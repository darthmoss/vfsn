"use client";

import { useState, useTransition } from "react";
import { vfflMatchups, vfflVwMatchupHype } from "@/db/schema";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";
import {
  fetchHistoricalH2HMatchups,
  type HistoricalMatchupReceipt,
} from "@/app/vffl/current-week/actions";

export type MatchupHypeCardData = InferSelectModel<typeof vfflVwMatchupHype> &
  Partial<
    Pick<
      InferSelectModel<typeof vfflMatchups>,
      "homeScore" | "awayScore" | "homeProjected" | "awayProjected"
    >
  >;

interface MatchupHypeCardProps {
  matchup: MatchupHypeCardData;
  matchupNumber?: number;
}

function getTeamInitials(teamName: string | null): string {
  if (!teamName) return "VF";
  const words = teamName.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return teamName.slice(0, 2).toUpperCase();
}

function formatOrdinal(standing: number | null): string {
  if (!standing || standing <= 0) return "Unranked";
  const mod10 = standing % 10;
  const mod100 = standing % 100;
  if (mod10 === 1 && mod100 !== 11) return `${standing}st Place`;
  if (mod10 === 2 && mod100 !== 12) return `${standing}nd Place`;
  if (mod10 === 3 && mod100 !== 13) return `${standing}rd Place`;
  return `${standing}th Place`;
}

export default function MatchupHypeCard({
  matchup,
  matchupNumber,
}: MatchupHypeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [receipts, setReceipts] = useState<HistoricalMatchupReceipt[] | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleToggleReceipts = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);

    if (nextState && receipts === null && matchup.matchupId !== null) {
      const id = matchup.matchupId;
      startTransition(async () => {
        const result = await fetchHistoricalH2HMatchups(id);
        setReceipts(result);
      });
    }
  };

  const homeScoreDisplay = (matchup.homeScore ?? 0).toFixed(2);
  const awayScoreDisplay = (matchup.awayScore ?? 0).toFixed(2);
  const homeProjDisplay = (matchup.homeProjected ?? 0).toFixed(2);
  const awayProjDisplay = (matchup.awayProjected ?? 0).toFixed(2);

  return (
    <article
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300"
      style={{ backgroundColor: "var(--vfsn-surface)" }}
    >
      {/* Broadcast Top Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--vfsn-border)] text-[11px] font-extrabold uppercase tracking-[0.16em]">
        <div className="flex items-center gap-2.5">
          <span
            className="px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest"
            style={{
              backgroundColor: "var(--vfsn-accent-1)",
              color: "var(--vfsn-bg)",
            }}
          >
            {matchup.leagueName ?? "VFFL"}
          </span>
          <span className="opacity-60">
            {matchupNumber ? `Matchup 0${matchupNumber}` : "Featured Matchup"}
          </span>
        </div>
        <span className="opacity-50">
          {matchup.seasonYear} • WK {matchup.week}
        </span>
      </div>

      {/* Head-to-Head Broadcast Graphic: Home (Left) vs. Away (Right) */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        {/* HOME TEAM (LEFT) - Strict 1..6 Top-to-Bottom Stack */}
        <div className="flex flex-col items-center text-center gap-1.5 min-w-0">
          {/* 1. Team Logo */}
          <div
            className="w-16 h-16 rounded-2xl border border-[var(--vfsn-border)] flex items-center justify-center overflow-hidden mb-1 shadow-inner"
            style={{ backgroundColor: "var(--vfsn-bg)" }}
          >
            {matchup.homeLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={matchup.homeLogoUrl}
                alt={matchup.homeTeam ?? "Home Team"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-lg font-black tracking-wider"
                style={{ color: "var(--vfsn-accent-1)" }}
              >
                {getTeamInitials(matchup.homeTeam)}
              </span>
            )}
          </div>

          {/* 2. Manager Name */}
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-65">
            {matchup.homeMgr ?? "Home Manager"}
          </span>

          {/* 3. Team Name (Featuring --vfsn-accent-1) */}
          <h2
            className="text-base sm:text-lg font-black tracking-tight truncate max-w-full"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.homeTeam ?? "Home Team"}
          </h2>

          {/* 4. W-L Record & Current Standing */}
          <span className="text-xs font-semibold opacity-75">
            {matchup.homeRecord ?? "0-0"} •{" "}
            {formatOrdinal(matchup.homeStanding)}
          </span>

          {/* 5. Current Score (Featuring --vfsn-accent-1) */}
          <div
            className="mt-2 text-3xl sm:text-4xl font-black tabular-nums tracking-tight"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {homeScoreDisplay}
          </div>

          {/* 6. Projected Score (PROJ ###.##) */}
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-55 tabular-nums">
            PROJ {homeProjDisplay}
          </span>
        </div>

        {/* CENTER BROADCAST VS DIVIDER */}
        <div className="flex flex-col items-center justify-center gap-2 self-stretch">
          <div className="w-px flex-1 bg-[var(--vfsn-border)]" />
          <div
            className="w-9 h-9 rounded-full border border-[var(--vfsn-border)] flex items-center justify-center text-[11px] font-black tracking-widest uppercase shadow-md"
            style={{
              backgroundColor: "var(--vfsn-bg)",
              color: "var(--vfsn-accent-2)",
            }}
          >
            VS
          </div>
          <div className="w-px flex-1 bg-[var(--vfsn-border)]" />
        </div>

        {/* AWAY TEAM (RIGHT) - Strict 1..6 Top-to-Bottom Stack */}
        <div className="flex flex-col items-center text-center gap-1.5 min-w-0">
          {/* 1. Team Logo */}
          <div
            className="w-16 h-16 rounded-2xl border border-[var(--vfsn-border)] flex items-center justify-center overflow-hidden mb-1 shadow-inner"
            style={{ backgroundColor: "var(--vfsn-bg)" }}
          >
            {matchup.awayLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={matchup.awayLogoUrl}
                alt={matchup.awayTeam ?? "Away Team"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-lg font-black tracking-wider"
                style={{ color: "var(--vfsn-accent-1)" }}
              >
                {getTeamInitials(matchup.awayTeam)}
              </span>
            )}
          </div>

          {/* 2. Manager Name */}
          <span className="text-xs font-bold uppercase tracking-[0.14em] opacity-65">
            {matchup.awayMgr ?? "Away Manager"}
          </span>

          {/* 3. Team Name (Featuring --vfsn-accent-1) */}
          <h2
            className="text-base sm:text-lg font-black tracking-tight truncate max-w-full"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.awayTeam ?? "Away Team"}
          </h2>

          {/* 4. W-L Record & Current Standing */}
          <span className="text-xs font-semibold opacity-75">
            {matchup.awayRecord ?? "0-0"} •{" "}
            {formatOrdinal(matchup.awayStanding)}
          </span>

          {/* 5. Current Score (Featuring --vfsn-accent-1) */}
          <div
            className="mt-2 text-3xl sm:text-4xl font-black tabular-nums tracking-tight"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {awayScoreDisplay}
          </div>

          {/* 6. Projected Score (PROJ ###.##) */}
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-55 tabular-nums">
            PROJ {awayProjDisplay}
          </span>
        </div>
      </div>

      {/* Historical 2-Row x 3-Column KPI Grid */}
      <div className="pt-5 grid grid-cols-3 gap-3">
        {/* KPI 1: H2H W-L Record & Series Leader (Interactive) */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] p-3.5 flex flex-col justify-between gap-1.5 transition-colors"
          style={{ backgroundColor: "var(--vfsn-bg)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60">
              H2H Series
            </span>
            <button
              type="button"
              onClick={handleToggleReceipts}
              aria-expanded={isExpanded}
              aria-label="Toggle historical H2H matchup receipts"
              className="w-6 h-6 rounded-md border border-[var(--vfsn-border)] flex items-center justify-center transition-transform duration-200 cursor-pointer hover:opacity-100"
              style={{
                backgroundColor: isExpanded
                  ? "var(--vfsn-accent-1)"
                  : "var(--vfsn-surface)",
                color: isExpanded
                  ? "var(--vfsn-bg)"
                  : "var(--vfsn-accent-1)",
              }}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
          <div
            className="text-base font-black tabular-nums"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.homeWins ?? 0} - {matchup.homeLosses ?? 0}
          </div>
          <div className="text-xs font-semibold opacity-80 truncate">
            {matchup.h2hLeader ?? "The Series Is Tied"}
          </div>
        </div>

        {/* KPI 2: All-Play Record & Series Leader */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] p-3.5 flex flex-col justify-between gap-1.5"
          style={{ backgroundColor: "var(--vfsn-bg)" }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60">
            All-Play H2H
          </span>
          <div
            className="text-base font-black tabular-nums"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.apHomeWins ?? 0} - {matchup.apHomeLosses ?? 0}
          </div>
          <div className="text-xs font-semibold opacity-80 truncate">
            {matchup.apLeader ?? "The Series Is Tied"}
          </div>
        </div>

        {/* KPI 3: Current Streak (Count & Team) */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] p-3.5 flex flex-col justify-between gap-1.5"
          style={{ backgroundColor: "var(--vfsn-bg)" }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60">
            Current Streak
          </span>
          <div
            className="text-base font-black tabular-nums"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            W{matchup.currentStreak ?? 0}
          </div>
          <div className="text-xs font-semibold opacity-80 truncate">
            {matchup.currentStreakTeam ?? "None"}
          </div>
        </div>

        {/* Interactive Full-Width (col-span-3) Historical H2H Receipts Drawer */}
        {isExpanded && (
          <div
            className="col-span-3 rounded-xl border border-[var(--vfsn-border)] p-4 transition-all duration-300"
            style={{ backgroundColor: "var(--vfsn-bg)" }}
          >
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--vfsn-border)]">
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.15em]"
                style={{ color: "var(--vfsn-accent-1)" }}
              >
                Historical H2H Matchup Receipts (Most Recent First)
              </span>
              <span className="text-[11px] font-semibold opacity-60">
                Source: vffl.matchups
              </span>
            </div>

            {isPending || receipts === null ? (
              <div className="py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">
                Loading historical receipts...
              </div>
            ) : receipts.length === 0 ? (
              <div className="py-4 text-xs font-semibold opacity-60 text-center">
                No previous head-to-head meetings recorded.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {receipts.map((item) => {
                  const homeScore = item.homeScore ?? 0;
                  const awayScore = item.awayScore ?? 0;
                  const homeWon = homeScore >= awayScore;
                  const winnerName = homeWon
                    ? matchup.homeTeam ?? "Home"
                    : matchup.awayTeam ?? "Away";

                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-[var(--vfsn-border)] text-xs"
                      style={{ backgroundColor: "var(--vfsn-surface)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-[10px]"
                          style={{
                            backgroundColor: "var(--vfsn-bg)",
                            color: "var(--vfsn-accent-1)",
                          }}
                        >
                          {item.seasonYear} • WK {item.week}
                        </span>
                        <span className="opacity-60 font-medium">
                          {item.matchupType ?? "REGULAR"}
                        </span>
                      </div>

                      <div className="font-bold tabular-nums">
                        <span className="opacity-80">{matchup.homeTeam}</span>{" "}
                        <span style={{ color: "var(--vfsn-accent-1)" }}>
                          {homeScore.toFixed(2)}
                        </span>{" "}
                        <span className="opacity-40 mx-1">vs</span>{" "}
                        <span style={{ color: "var(--vfsn-accent-1)" }}>
                          {awayScore.toFixed(2)}
                        </span>{" "}
                        <span className="opacity-80">{matchup.awayTeam}</span>
                      </div>

                      <div className="text-[11px] font-extrabold uppercase tracking-wider">
                        Winner:{" "}
                        <span style={{ color: "var(--vfsn-accent-1)" }}>
                          {winnerName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KPI 4: Last Meeting (Score, Week, Winner) */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] p-3.5 flex flex-col justify-between gap-1.5"
          style={{ backgroundColor: "var(--vfsn-bg)" }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60">
              Last Meeting
            </span>
            <span className="text-[10px] font-bold opacity-55">
              {matchup.lastMeetWeek ?? "N/A"}
            </span>
          </div>
          <div
            className="text-sm sm:text-base font-black tabular-nums"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.lastMeetScore ?? "—"}
          </div>
          <div className="text-xs font-semibold opacity-80 truncate">
            {matchup.lastMeetWinner ?? "None"}
          </div>
        </div>

        {/* KPI 5: Highest Scoring Matchup (Score, Week, Winner) */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] p-3.5 flex flex-col justify-between gap-1.5"
          style={{ backgroundColor: "var(--vfsn-bg)" }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60">
              Highest Scoring
            </span>
            <span className="text-[10px] font-bold opacity-55">
              {matchup.highScoreWeek ?? "N/A"}
            </span>
          </div>
          <div
            className="text-sm sm:text-base font-black tabular-nums"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.highScore ?? "—"}
          </div>
          <div className="text-xs font-semibold opacity-80 truncate">
            {matchup.highScoreTeam ?? "None"}
          </div>
        </div>

        {/* KPI 6: Closest Scoring Matchup (Score, Week, Winner) */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] p-3.5 flex flex-col justify-between gap-1.5"
          style={{ backgroundColor: "var(--vfsn-bg)" }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] opacity-60">
              Closest Matchup
            </span>
            <span className="text-[10px] font-bold opacity-55">
              {matchup.closeScoreWeek ?? "N/A"}
            </span>
          </div>
          <div
            className="text-sm sm:text-base font-black tabular-nums"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {matchup.closeScore ?? "—"}
          </div>
          <div className="text-xs font-semibold opacity-80 truncate">
            {matchup.closeScoreTeam ?? "None"}
          </div>
        </div>
      </div>
    </article>
  );
}
