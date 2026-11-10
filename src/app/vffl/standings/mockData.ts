import type { InferSelectModel } from "@/app/vffl/current-week/mockData";
import {
  vfflDivAllPlayMatchups,
  vfflOverallAllPlayMatchups,
  vfflVwDivAllPlayStandings,
  vfflVwMatchups,
  vfflVwOverallAllPlayStandings,
  vfflVwStandings,
} from "@/db/schema";

export type H2HStandingsRow = InferSelectModel<typeof vfflVwStandings>;
export type DivAllPlayStandingsRow = InferSelectModel<
  typeof vfflVwDivAllPlayStandings
>;
export type OverallAllPlayStandingsRow = InferSelectModel<
  typeof vfflVwOverallAllPlayStandings
>;

export type StandingsRow =
  | H2HStandingsRow
  | DivAllPlayStandingsRow
  | OverallAllPlayStandingsRow;

export type MatchupRow = InferSelectModel<typeof vfflVwMatchups>;
export type DivAllPlayMatchupRow = InferSelectModel<
  typeof vfflDivAllPlayMatchups
>;
export type OverallAllPlayMatchupRow = InferSelectModel<
  typeof vfflOverallAllPlayMatchups
>;

export type StandingsViewMode = "H2H" | "DIV" | "VFFL";

export interface MatrixManagerMeta {
  key: string;
  managerId: number;
  leagueId: number | null;
  leagueName: string | null;
  managerName: string;
  initials: string;
  teamName: string;
  standing: number;
}

export interface MatrixRecordCell {
  wins: number;
  losses: number;
  ties: number;
}

/**
 * Extract 2-letter manager initials from `manager_name` (e.g. "Matt M" -> "MM").
 */
export function getManagerInitials(
  managerName: string | null | undefined,
  teamName?: string | null
): string {
  const cleaned = (managerName ?? "").trim();
  if (cleaned) {
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
  }
  const fallback = (teamName ?? "TM").trim();
  return fallback.slice(0, 2).toUpperCase();
}
