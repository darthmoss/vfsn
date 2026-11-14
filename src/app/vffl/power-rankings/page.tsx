import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  vfflLeagues,
  vfflMatchups,
  vfflVwDivPowerRankings,
  vfflVwOverallPowerRankings,
} from "@/db/schema";
import SeasonWeekBadge from "@/components/vffl/SeasonWeekBadge";
import DivisionToggle from "@/components/vffl/DivisionToggle";
import BroadcastLoader from "@/components/vffl/BroadcastLoader";
import PowerRankingsControls from "@/components/vffl/PowerRankingsControls";
import PowerRankingsTable from "@/components/vffl/PowerRankingsTable";
import type { DivisionKey } from "@/app/vffl/current-week/mockData";
import type {
  PowerRankingScope,
  PowerRankingTime,
  PowerRankingsRow,
} from "./mockData";

export const dynamic = "force-dynamic";

const DB_LEAGUE_NAME_MAP: Record<DivisionKey, string> = {
  "Red Division": "VFFL - Red Division",
  "Black Division": "VFFL - Black Division",
};

/**
 * Resolve default active seasonYear, week, leagueId, and available season/week dropdown options
 * by unioning vffl.leagues and distinct season_year values from vffl.matchups.
 */
async function resolveSeasonAndWeekContext(
  dbLeagueName: string,
  requestedSeason?: number,
  requestedWeek?: number
): Promise<{
  seasonYear: number;
  week: number;
  leagueId: number | null;
  seasonOptions: number[];
  weekOptions: number[];
}> {
  const [leagues, matchupSeasons] = await Promise.all([
    db
      .select({
        leagueId: vfflLeagues.leagueId,
        name: vfflLeagues.name,
        seasonYear: vfflLeagues.seasonYear,
        currentWeek: vfflLeagues.currentWeek,
        regSeasonCount: vfflLeagues.regSeasonCount,
      })
      .from(vfflLeagues)
      .orderBy(desc(vfflLeagues.seasonYear), desc(vfflLeagues.currentWeek)),
    db
      .selectDistinct({ seasonYear: vfflMatchups.seasonYear })
      .from(vfflMatchups)
      .orderBy(desc(vfflMatchups.seasonYear)),
  ]);

  const distinctSeasons = Array.from(
    new Set([
      ...leagues.map((l) => l.seasonYear),
      ...matchupSeasons
        .map((m) => m.seasonYear)
        .filter((s): s is number => s !== null),
    ])
  ).sort((a, b) => b - a);

  const matchingDivisionLeague = leagues.find((l) => l.name === dbLeagueName);
  const leagueId =
    matchingDivisionLeague?.leagueId ?? leagues[0]?.leagueId ?? null;

  const latestLeague = matchingDivisionLeague ?? leagues[0];
  const defaultSeason = latestLeague?.seasonYear ?? new Date().getFullYear();
  const rawWeek = latestLeague?.currentWeek ?? 1;

  // Determine current day of week in US Eastern Time (hold Tuesday at current_week - 1)
  const easternWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(new Date());
  const isTuesday = easternWeekday === "Tue";
  const defaultWeek = isTuesday ? Math.max(1, rawWeek - 1) : rawWeek;

  const seasonYear =
    requestedSeason && !Number.isNaN(requestedSeason)
      ? requestedSeason
      : defaultSeason;

  const seasonOptions = distinctSeasons.includes(seasonYear)
    ? distinctSeasons
    : [seasonYear, ...distinctSeasons].sort((a, b) => b - a);

  const weekRows = await db
    .selectDistinct({ week: vfflMatchups.week })
    .from(vfflMatchups)
    .where(
      leagueId !== null
        ? and(
            eq(vfflMatchups.seasonYear, seasonYear),
            eq(vfflMatchups.leagueId, leagueId)
          )
        : eq(vfflMatchups.seasonYear, seasonYear)
    )
    .orderBy(asc(vfflMatchups.week));

  const dbWeeks = weekRows
    .map((r) => r.week)
    .filter((w): w is number => w !== null && w > 0);

  const weekOptions =
    dbWeeks.length > 0
      ? dbWeeks
      : Array.from({ length: 17 }, (_, idx) => idx + 1);

  let week =
    requestedWeek && !Number.isNaN(requestedWeek)
      ? requestedWeek
      : seasonYear === defaultSeason
        ? defaultWeek
        : (weekOptions[weekOptions.length - 1] ?? 1);

  if (dbWeeks.length > 0 && !dbWeeks.includes(week)) {
    week = dbWeeks.includes(defaultWeek)
      ? defaultWeek
      : (dbWeeks[dbWeeks.length - 1] ?? 1);
  }

  return {
    seasonYear,
    week,
    leagueId,
    seasonOptions,
    weekOptions,
  };
}

interface PowerRankingsPageProps {
  searchParams: Promise<{
    division?: string;
    season?: string;
    week?: string;
    scope?: string;
    time?: string;
  }>;
}

export default async function PowerRankingsPage({
  searchParams,
}: PowerRankingsPageProps) {
  const resolvedParams = await searchParams;

  const activeDivision: DivisionKey =
    resolvedParams.division === "Black Division"
      ? "Black Division"
      : "Red Division";
  const dbLeagueName = DB_LEAGUE_NAME_MAP[activeDivision];

  const rawScope = (resolvedParams.scope ?? "div").toLowerCase();
  const activeScope: PowerRankingScope = rawScope === "vffl" ? "vffl" : "div";

  const rawTime = (resolvedParams.time ?? "std").toLowerCase();
  const activeTime: PowerRankingTime = rawTime === "week" ? "week" : "std";

  const parsedSeason = resolvedParams.season
    ? Number.parseInt(resolvedParams.season, 10)
    : undefined;
  const parsedWeek = resolvedParams.week
    ? Number.parseInt(resolvedParams.week, 10)
    : undefined;

  const { seasonYear, week, seasonOptions, weekOptions } =
    await resolveSeasonAndWeekContext(dbLeagueName, parsedSeason, parsedWeek);

  let powerRows: PowerRankingsRow[] = [];

  if (activeScope === "div") {
    powerRows = await db
      .select()
      .from(vfflVwDivPowerRankings)
      .where(
        and(
          eq(vfflVwDivPowerRankings.seasonYear, seasonYear),
          eq(vfflVwDivPowerRankings.week, week),
          eq(vfflVwDivPowerRankings.leagueName, dbLeagueName)
        )
      )
      .orderBy(
        activeTime === "week"
          ? asc(vfflVwDivPowerRankings.wkPowerRank)
          : asc(vfflVwDivPowerRankings.stdPowerRank),
        activeTime === "week"
          ? desc(vfflVwDivPowerRankings.wkPowerScore)
          : desc(vfflVwDivPowerRankings.stdPowerScore)
      );
  } else {
    powerRows = await db
      .select()
      .from(vfflVwOverallPowerRankings)
      .where(
        and(
          eq(vfflVwOverallPowerRankings.seasonYear, seasonYear),
          eq(vfflVwOverallPowerRankings.week, week)
        )
      )
      .orderBy(
        activeTime === "week"
          ? asc(vfflVwOverallPowerRankings.wkPowerRank)
          : asc(vfflVwOverallPowerRankings.stdPowerRank),
        activeTime === "week"
          ? desc(vfflVwOverallPowerRankings.wkPowerScore)
          : desc(vfflVwOverallPowerRankings.stdPowerScore)
      );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Header Area: Top-Left SeasonWeekBadge & Top-Right DivisionToggle */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge
          seasonYear={seasonYear}
          week={week}
          label="Z-Score Power Index"
          title="VFFL Power Rankings"
          interactive
          seasonOptions={seasonOptions}
          weekOptions={weekOptions}
        />

        <DivisionToggle initialDivision={activeDivision} />
      </header>

      {/* 2. Toggles (Scope: DIV | VFFL, Time: Week | Season-to-Date) & Horizontal Formula Display */}
      <PowerRankingsControls
        activeScope={activeScope}
        activeTime={activeTime}
        subtitle={
          activeScope === "vffl" ? "All 20 Managers" : activeDivision
        }
      />

      {/* 3. Broadcast Loader & Power Rankings Table */}
      <BroadcastLoader>
        <PowerRankingsTable
          rows={powerRows}
          scope={activeScope}
          time={activeTime}
          seasonYear={seasonYear}
          week={week}
          division={activeDivision}
        />
      </BroadcastLoader>
    </div>
  );
}
