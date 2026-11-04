"use server";

import { and, desc, eq, lt, or, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { vfflMatchups } from "@/db/schema";

export type HistoricalMatchupReceipt = InferSelectModel<typeof vfflMatchups>;

export async function fetchHistoricalH2HMatchups(
  matchupId: number
): Promise<HistoricalMatchupReceipt[]> {
  try {
    // 1. Fetch the target matchup to identify the two managers and the current year/week cutoff
    const [target] = await db
      .select({
        seasonYear: vfflMatchups.seasonYear,
        week: vfflMatchups.week,
        homeManagerId: vfflMatchups.homeManagerId,
        awayManagerId: vfflMatchups.awayManagerId,
      })
      .from(vfflMatchups)
      .where(eq(vfflMatchups.id, matchupId))
      .limit(1);

    if (!target || !target.homeManagerId || !target.awayManagerId) {
      return [];
    }

    // 2. Fetch all completed prior meetings between these two managers (in either home/away orientation)
    const rows = await db
      .select()
      .from(vfflMatchups)
      .where(
        and(
          or(
            and(
              eq(vfflMatchups.homeManagerId, target.homeManagerId),
              eq(vfflMatchups.awayManagerId, target.awayManagerId)
            ),
            and(
              eq(vfflMatchups.homeManagerId, target.awayManagerId),
              eq(vfflMatchups.awayManagerId, target.homeManagerId)
            )
          ),
          or(
            lt(vfflMatchups.seasonYear, target.seasonYear),
            and(
              eq(vfflMatchups.seasonYear, target.seasonYear),
              lt(vfflMatchups.week, target.week)
            )
          )
        )
      )
      .orderBy(desc(vfflMatchups.seasonYear), desc(vfflMatchups.week));

    // Normalize scores so homeScore always corresponds to the current matchup's homeTeam
    return rows
      .filter((r) => r.homeScore !== null && r.awayScore !== null)
      .map((r) => {
        if (r.homeManagerId === target.homeManagerId) {
          return r;
        }
        return {
          ...r,
          homeManagerId: target.homeManagerId,
          awayManagerId: target.awayManagerId,
          homeScore: r.awayScore,
          awayScore: r.homeScore,
          homeProjected: r.awayProjected,
          awayProjected: r.homeProjected,
        };
      });
  } catch (error) {
    console.error("Failed to fetch historical H2H receipts:", error);
    return [];
  }
}

