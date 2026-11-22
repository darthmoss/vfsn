"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vfflDivAllPlayMatchups, vfflVwManagerGameLuck } from "@/db/schema";
import type { DivAllPlayMatchupRow, ManagerGameLuckRow } from "./mockData";

const isId = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v > 0;

function dedupeByKey<T>(rows: T[], getKey: (row: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = getKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** H2H drill-down: every game vs. one opponent (across all seasons or a single season). */
export async function fetchH2HGames(
  managerId: number,
  opponentId: number,
  seasonYear?: number
): Promise<ManagerGameLuckRow[]> {
  if (!isId(managerId) || !isId(opponentId)) return [];
  const conditions = [
    eq(vfflVwManagerGameLuck.scope, "GAME"),
    eq(vfflVwManagerGameLuck.managerId, managerId),
    eq(vfflVwManagerGameLuck.opponentId, opponentId),
  ];
  if (seasonYear !== undefined) {
    if (!isId(seasonYear)) return [];
    conditions.push(eq(vfflVwManagerGameLuck.seasonYear, seasonYear));
  }
  const rows = await db
    .select()
    .from(vfflVwManagerGameLuck)
    .where(and(...conditions))
    .orderBy(
      desc(vfflVwManagerGameLuck.seasonYear),
      desc(vfflVwManagerGameLuck.week)
    );
  return dedupeByKey(
    rows,
    (r) => `${r.seasonYear ?? ""}:${r.week ?? ""}:${r.opponentId ?? ""}`
  );
}

/** 3rd-level Luck drill-down: every game the manager played in one season. */
export async function fetchLuckGames(
  managerId: number,
  seasonYear: number
): Promise<ManagerGameLuckRow[]> {
  if (!isId(managerId) || !isId(seasonYear)) return [];
  const rows = await db
    .select()
    .from(vfflVwManagerGameLuck)
    .where(
      and(
        eq(vfflVwManagerGameLuck.scope, "GAME"),
        eq(vfflVwManagerGameLuck.managerId, managerId),
        eq(vfflVwManagerGameLuck.seasonYear, seasonYear)
      )
    )
    .orderBy(asc(vfflVwManagerGameLuck.week));
  return dedupeByKey(
    rows,
    (r) => `${r.seasonYear ?? ""}:${r.week ?? ""}:${r.opponentId ?? ""}`
  );
}

/** 3rd-level Division All-Play drill-down: weekly score-offs vs. one opponent. */
export async function fetchDivAllPlayGames(
  managerId: number,
  opponentId: number,
  seasonYear: number
): Promise<DivAllPlayMatchupRow[]> {
  if (!isId(managerId) || !isId(opponentId) || !isId(seasonYear)) return [];
  const rows = await db
    .select()
    .from(vfflDivAllPlayMatchups)
    .where(
      and(
        eq(vfflDivAllPlayMatchups.homeMgrId, managerId),
        eq(vfflDivAllPlayMatchups.awayMgrId, opponentId),
        eq(vfflDivAllPlayMatchups.seasonYear, seasonYear)
      )
    )
    .orderBy(asc(vfflDivAllPlayMatchups.week));
  return dedupeByKey(
    rows,
    (r) => `${r.seasonYear ?? ""}:${r.week ?? ""}:${r.awayMgrId ?? ""}`
  );
}
