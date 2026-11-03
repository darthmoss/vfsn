"use server";

import type { InferSelectModel } from "drizzle-orm";
import { vfflMatchups } from "@/db/schema";

export type HistoricalMatchupReceipt = InferSelectModel<typeof vfflMatchups>;

const HISTORICAL_RECEIPTS_BY_MATCHUP: Record<
  number,
  HistoricalMatchupReceipt[]
> = {
  20260901: [
    {
      id: 9101,
      seasonYear: 2025,
      leagueId: 101,
      week: 11,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 136.4,
      awayScore: 118.2,
      homeProjected: 122.5,
      awayProjected: 119.0,
    },
    {
      id: 9102,
      seasonYear: 2025,
      leagueId: 101,
      week: 2,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 129.8,
      awayScore: 114.6,
      homeProjected: 120.1,
      awayProjected: 117.4,
    },
    {
      id: 9103,
      seasonYear: 2024,
      leagueId: 101,
      week: 13,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 141.1,
      awayScore: 127.9,
      homeProjected: 125.0,
      awayProjected: 121.8,
    },
    {
      id: 9104,
      seasonYear: 2024,
      leagueId: 101,
      week: 4,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 113.85,
      awayScore: 114.2,
      homeProjected: 118.2,
      awayProjected: 116.5,
    },
    {
      id: 9105,
      seasonYear: 2023,
      leagueId: 101,
      week: 6,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 162.8,
      awayScore: 148.4,
      homeProjected: 124.4,
      awayProjected: 120.2,
    },
  ],
};

export async function fetchHistoricalH2HMatchups(
  matchupId: number
): Promise<HistoricalMatchupReceipt[]> {
  const configured = HISTORICAL_RECEIPTS_BY_MATCHUP[matchupId];
  if (configured) {
    return [...configured].sort(
      (a, b) => b.seasonYear - a.seasonYear || b.week - a.week
    );
  }

  const seed = Math.abs(matchupId % 100);
  const generated: HistoricalMatchupReceipt[] = [
    {
      id: matchupId * 10 + 1,
      seasonYear: 2025,
      leagueId: 101,
      week: 12,
      matchupType: "REGULAR",
      homeManagerId: seed + 1,
      awayManagerId: seed + 2,
      homeScore: Number((118.4 + (seed % 15)).toFixed(2)),
      awayScore: Number((109.2 + (seed % 11)).toFixed(2)),
      homeProjected: 116.5,
      awayProjected: 113.8,
    },
    {
      id: matchupId * 10 + 2,
      seasonYear: 2025,
      leagueId: 101,
      week: 3,
      matchupType: "REGULAR",
      homeManagerId: seed + 1,
      awayManagerId: seed + 2,
      homeScore: Number((104.6 + (seed % 9)).toFixed(2)),
      awayScore: Number((115.9 + (seed % 13)).toFixed(2)),
      homeProjected: 112.0,
      awayProjected: 114.2,
    },
    {
      id: matchupId * 10 + 3,
      seasonYear: 2024,
      leagueId: 101,
      week: 9,
      matchupType: "REGULAR",
      homeManagerId: seed + 1,
      awayManagerId: seed + 2,
      homeScore: Number((131.2 + (seed % 14)).toFixed(2)),
      awayScore: Number((122.7 + (seed % 8)).toFixed(2)),
      homeProjected: 119.4,
      awayProjected: 115.1,
    },
    {
      id: matchupId * 10 + 4,
      seasonYear: 2023,
      leagueId: 101,
      week: 7,
      matchupType: "REGULAR",
      homeManagerId: seed + 1,
      awayManagerId: seed + 2,
      homeScore: Number((111.5 + (seed % 7)).toFixed(2)),
      awayScore: Number((110.9 + (seed % 7)).toFixed(2)),
      homeProjected: 110.8,
      awayProjected: 109.5,
    },
  ];

  return generated.sort(
    (a, b) => b.seasonYear - a.seasonYear || b.week - a.week
  );
}

