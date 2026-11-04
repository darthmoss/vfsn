"use server";

import type { InferSelectModel } from "drizzle-orm";
import { vfflMatchups } from "@/db/schema";
import { DIVISION_DATASETS } from "./mockData";

export type HistoricalMatchupReceipt = InferSelectModel<typeof vfflMatchups>;

const HISTORICAL_RECEIPTS_BY_MATCHUP: Record<
  number,
  HistoricalMatchupReceipt[]
> = {
  20260901: [
    // 14 historical games matching the 9-5 H2H record for Carolina Cartel vs. Gridiron Syndicate
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
      week: 12,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 124.7,
      awayScore: 119.3,
      homeProjected: 121.0,
      awayProjected: 118.5,
    },
    {
      id: 9106,
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
    {
      id: 9107,
      seasonYear: 2022,
      leagueId: 101,
      week: 14,
      matchupType: "PLAYOFF",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 133.5,
      awayScore: 121.0,
      homeProjected: 123.0,
      awayProjected: 119.8,
    },
    {
      id: 9108,
      seasonYear: 2022,
      leagueId: 101,
      week: 8,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 108.4,
      awayScore: 119.7,
      homeProjected: 115.6,
      awayProjected: 116.2,
    },
    {
      id: 9109,
      seasonYear: 2021,
      leagueId: 101,
      week: 10,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 127.2,
      awayScore: 112.5,
      homeProjected: 118.9,
      awayProjected: 114.0,
    },
    {
      id: 9110,
      seasonYear: 2021,
      leagueId: 101,
      week: 3,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 101.6,
      awayScore: 115.8,
      homeProjected: 112.4,
      awayProjected: 113.1,
    },
    {
      id: 9111,
      seasonYear: 2020,
      leagueId: 101,
      week: 11,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 138.9,
      awayScore: 122.4,
      homeProjected: 121.5,
      awayProjected: 117.8,
    },
    {
      id: 9112,
      seasonYear: 2020,
      leagueId: 101,
      week: 5,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 110.2,
      awayScore: 124.1,
      homeProjected: 116.0,
      awayProjected: 118.4,
    },
    {
      id: 9113,
      seasonYear: 2019,
      leagueId: 101,
      week: 9,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 119.5,
      awayScore: 106.8,
      homeProjected: 114.2,
      awayProjected: 110.5,
    },
    {
      id: 9114,
      seasonYear: 2019,
      leagueId: 101,
      week: 1,
      matchupType: "REGULAR",
      homeManagerId: 1,
      awayManagerId: 2,
      homeScore: 98.7,
      awayScore: 109.3,
      homeProjected: 108.0,
      awayProjected: 109.0,
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

  // Find the matchup in mock datasets so generated receipts match homeWins + homeLosses exactly
  const allMatchups = [
    ...DIVISION_DATASETS["Red Division"].matchups,
    ...DIVISION_DATASETS["Black Division"].matchups,
  ];
  const matched = allMatchups.find((m) => m.matchupId === matchupId);
  const homeWinsCount = matched?.homeWins ?? 3;
  const homeLossesCount = matched?.homeLosses ?? 2;
  const totalGames = homeWinsCount + homeLossesCount;

  const seed = Math.abs(matchupId % 100);
  const generated: HistoricalMatchupReceipt[] = [];

  let winsRemaining = homeWinsCount;
  let lossesRemaining = homeLossesCount;

  for (let i = 0; i < totalGames; i++) {
    const seasonYear = 2025 - Math.floor(i / 2);
    const week = i % 2 === 0 ? 12 - (i % 5) : 4 + (i % 5);

    const shouldHomeWin =
      winsRemaining > 0 && (lossesRemaining === 0 || i % 2 === 0);
    if (shouldHomeWin) {
      winsRemaining--;
    } else {
      lossesRemaining--;
    }

    const winningScore = Number((122.4 + ((seed + i * 7) % 24)).toFixed(2));
    const losingScore = Number((104.2 + ((seed + i * 5) % 16)).toFixed(2));

    generated.push({
      id: matchupId * 100 + i + 1,
      seasonYear,
      leagueId: 101,
      week,
      matchupType: "REGULAR",
      homeManagerId: seed + 1,
      awayManagerId: seed + 2,
      homeScore: shouldHomeWin ? winningScore : losingScore,
      awayScore: shouldHomeWin ? losingScore : winningScore,
      homeProjected: 116.5,
      awayProjected: 113.8,
    });
  }

  return generated.sort(
    (a, b) => b.seasonYear - a.seasonYear || b.week - a.week
  );
}

