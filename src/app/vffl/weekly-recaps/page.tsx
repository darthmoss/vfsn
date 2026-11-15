import { and, asc, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  vfflLeagues,
  vfflMatchups,
  vfflVwDivPowerRankings,
  vfflVwMatchups,
  vfflVwStandings,
  vfflVwWeeklyProps,
  vfflWeeklyRecaps,
} from "@/db/schema";
import SeasonWeekBadge from "@/components/vffl/SeasonWeekBadge";
import BroadcastLoader from "@/components/vffl/BroadcastLoader";
import WeeklyRecapArticle from "@/components/vffl/WeeklyRecapArticle";
import WeeklyRecapToc from "@/components/vffl/WeeklyRecapToc";
import {
  MOCK_BLACK_POWER_RANKINGS,
  MOCK_BLACK_STANDINGS,
  MOCK_BLACK_WEEKLY_PROPS,
  MOCK_RED_POWER_RANKINGS,
  MOCK_RED_STANDINGS,
  MOCK_RED_WEEKLY_PROPS,
  MOCK_WEEKLY_RECAP_ROW,
  type DivPowerRankingsRow,
  type DivisionRecapBundle,
  type MatchupRow,
  type StandingsRow,
  type WeeklyPropsRow,
  type WeeklyRecapRow,
} from "./mockData";

export const dynamic = "force-dynamic";

function isRedLeague(leagueName: string | null | undefined): boolean {
  return Boolean(leagueName && leagueName.toLowerCase().includes("red"));
}

function isBlackLeague(leagueName: string | null | undefined): boolean {
  return Boolean(leagueName && leagueName.toLowerCase().includes("black"));
}

/**
 * Resolve active seasonYear, week, and available season/week dropdown options
 * by unioning vffl.leagues, distinct season_year values from vffl.matchups,
 * and published recaps from vffl.weekly_recaps.
 */
async function resolveSeasonAndWeekContext(
  requestedSeason?: number,
  requestedWeek?: number
): Promise<{
  seasonYear: number;
  week: number;
  seasonOptions: number[];
  weekOptions: number[];
}> {
  const [leagues, matchupSeasons, recapMeta] = await Promise.all([
    db
      .select({
        leagueId: vfflLeagues.leagueId,
        name: vfflLeagues.name,
        seasonYear: vfflLeagues.seasonYear,
        currentWeek: vfflLeagues.currentWeek,
      })
      .from(vfflLeagues)
      .orderBy(desc(vfflLeagues.seasonYear), desc(vfflLeagues.currentWeek)),
    db
      .selectDistinct({ seasonYear: vfflMatchups.seasonYear })
      .from(vfflMatchups)
      .orderBy(desc(vfflMatchups.seasonYear)),
    db
      .select({
        seasonYear: vfflWeeklyRecaps.seasonYear,
        week: vfflWeeklyRecaps.week,
      })
      .from(vfflWeeklyRecaps)
      .orderBy(desc(vfflWeeklyRecaps.seasonYear), desc(vfflWeeklyRecaps.week))
      .catch(() => []),
  ]);

  const distinctSeasons = Array.from(
    new Set([
      ...leagues.map((l) => l.seasonYear),
      ...matchupSeasons
        .map((m) => m.seasonYear)
        .filter((s): s is number => s !== null),
      ...recapMeta.map((r) => r.seasonYear),
    ])
  ).sort((a, b) => b - a);

  const latestLeague = leagues[0];
  const defaultSeason =
    recapMeta[0]?.seasonYear ??
    latestLeague?.seasonYear ??
    MOCK_WEEKLY_RECAP_ROW.seasonYear;

  const rawWeek = latestLeague?.currentWeek ?? MOCK_WEEKLY_RECAP_ROW.week;
  const easternWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(new Date());
  const isTuesday = easternWeekday === "Tue";
  const computedDefaultWeek = isTuesday ? Math.max(1, rawWeek - 1) : rawWeek;

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
    .where(eq(vfflMatchups.seasonYear, seasonYear))
    .orderBy(asc(vfflMatchups.week));

  const dbWeeks = weekRows
    .map((r) => r.week)
    .filter((w): w is number => w !== null && w > 0);

  const recapWeeksForSeason = recapMeta
    .filter((r) => r.seasonYear === seasonYear)
    .map((r) => r.week)
    .sort((a, b) => a - b);

  const weekOptions =
    dbWeeks.length > 0
      ? dbWeeks
      : recapWeeksForSeason.length > 0
        ? recapWeeksForSeason
        : Array.from({ length: 17 }, (_, idx) => idx + 1);

  const latestRecapWeekForSeason =
    recapWeeksForSeason[recapWeeksForSeason.length - 1];

  let week =
    requestedWeek && !Number.isNaN(requestedWeek)
      ? requestedWeek
      : latestRecapWeekForSeason ??
        (seasonYear === defaultSeason
          ? computedDefaultWeek
          : (weekOptions[weekOptions.length - 1] ?? 1));

  if (dbWeeks.length > 0 && !dbWeeks.includes(week)) {
    week =
      latestRecapWeekForSeason ??
      (dbWeeks.includes(computedDefaultWeek)
        ? computedDefaultWeek
        : (dbWeeks[dbWeeks.length - 1] ?? 1));
  }

  return {
    seasonYear,
    week,
    seasonOptions,
    weekOptions,
  };
}

function buildTeamMatchupsMap(
  standingsRows: StandingsRow[],
  matchupsRows: MatchupRow[]
): Record<string, MatchupRow[]> {
  const map: Record<string, MatchupRow[]> = {};
  for (const row of standingsRows) {
    const rowKey = `${row.leagueId ?? "lg"}-${row.managerId ?? ""}`;
    map[rowKey] = matchupsRows.filter(
      (m) =>
        (row.teamName &&
          (m.homeTeam === row.teamName || m.awayTeam === row.teamName)) ||
        (row.managerName &&
          (m.homeMgr === row.managerName || m.awayMgr === row.managerName))
    );
  }
  return map;
}

interface WeeklyRecapsPageProps {
  searchParams: Promise<{
    season?: string;
    week?: string;
  }>;
}

export default async function WeeklyRecapsPage({
  searchParams,
}: WeeklyRecapsPageProps) {
  const resolvedParams = await searchParams;

  const parsedSeason = resolvedParams.season
    ? Number.parseInt(resolvedParams.season, 10)
    : undefined;
  const parsedWeek = resolvedParams.week
    ? Number.parseInt(resolvedParams.week, 10)
    : undefined;

  const { seasonYear, week, seasonOptions, weekOptions } =
    await resolveSeasonAndWeekContext(parsedSeason, parsedWeek);

  const [recapRows, propsRows, standingsRows, matchupsRows, powerRows] =
    await Promise.all([
      db
        .select()
        .from(vfflWeeklyRecaps)
        .where(
          and(
            eq(vfflWeeklyRecaps.seasonYear, seasonYear),
            eq(vfflWeeklyRecaps.week, week)
          )
        )
        .limit(1)
        .catch((): WeeklyRecapRow[] => []),
      db
        .select()
        .from(vfflVwWeeklyProps)
        .where(
          and(
            eq(vfflVwWeeklyProps.seasonYear, seasonYear),
            eq(vfflVwWeeklyProps.week, week)
          )
        )
        .catch((): WeeklyPropsRow[] => []),
      db
        .select()
        .from(vfflVwStandings)
        .where(
          and(
            eq(vfflVwStandings.seasonYear, seasonYear),
            eq(vfflVwStandings.week, week)
          )
        )
        .orderBy(
          asc(vfflVwStandings.standing),
          desc(vfflVwStandings.pointsFor)
        )
        .catch((): StandingsRow[] => []),
      db
        .select()
        .from(vfflVwMatchups)
        .where(
          and(
            eq(vfflVwMatchups.seasonYear, seasonYear),
            lte(vfflVwMatchups.week, week)
          )
        )
        .orderBy(asc(vfflVwMatchups.week), asc(vfflVwMatchups.matchupId))
        .catch((): MatchupRow[] => []),
      db
        .select()
        .from(vfflVwDivPowerRankings)
        .where(
          and(
            eq(vfflVwDivPowerRankings.seasonYear, seasonYear),
            eq(vfflVwDivPowerRankings.week, week)
          )
        )
        .orderBy(
          asc(vfflVwDivPowerRankings.stdPowerRank),
          desc(vfflVwDivPowerRankings.stdPowerScore)
        )
        .catch((): DivPowerRankingsRow[] => []),
    ]);

  const useMockFallback =
    recapRows.length === 0 &&
    seasonYear === MOCK_WEEKLY_RECAP_ROW.seasonYear &&
    week === MOCK_WEEKLY_RECAP_ROW.week;

  const activeRecapRow: WeeklyRecapRow | null =
    recapRows[0] ?? (useMockFallback ? MOCK_WEEKLY_RECAP_ROW : null);

  const redProps =
    propsRows.filter((r) => isRedLeague(r.leagueName)).length > 0
      ? propsRows.filter((r) => isRedLeague(r.leagueName))
      : useMockFallback
        ? MOCK_RED_WEEKLY_PROPS
        : [];

  const blackProps =
    propsRows.filter((r) => isBlackLeague(r.leagueName)).length > 0
      ? propsRows.filter((r) => isBlackLeague(r.leagueName))
      : useMockFallback
        ? MOCK_BLACK_WEEKLY_PROPS
        : [];

  const redStandings =
    standingsRows.filter((r) => isRedLeague(r.leagueName)).length > 0
      ? standingsRows.filter((r) => isRedLeague(r.leagueName))
      : useMockFallback
        ? MOCK_RED_STANDINGS
        : [];

  const blackStandings =
    standingsRows.filter((r) => isBlackLeague(r.leagueName)).length > 0
      ? standingsRows.filter((r) => isBlackLeague(r.leagueName))
      : useMockFallback
        ? MOCK_BLACK_STANDINGS
        : [];

  const redMatchups = matchupsRows.filter((m) => isRedLeague(m.leagueName));
  const blackMatchups = matchupsRows.filter((m) => isBlackLeague(m.leagueName));

  const redPowerRankings =
    powerRows.filter((r) => isRedLeague(r.leagueName)).length > 0
      ? powerRows.filter((r) => isRedLeague(r.leagueName))
      : useMockFallback
        ? MOCK_RED_POWER_RANKINGS
        : [];

  const blackPowerRankings =
    powerRows.filter((r) => isBlackLeague(r.leagueName)).length > 0
      ? powerRows.filter((r) => isBlackLeague(r.leagueName))
      : useMockFallback
        ? MOCK_BLACK_POWER_RANKINGS
        : [];

  const divisions: DivisionRecapBundle[] = activeRecapRow
    ? [
        {
          divisionKey: "Red Division",
          anchorPrefix: "red",
          recapSection: activeRecapRow.recapJson.redDivision,
          weeklyProps: redProps,
          standingsRows: redStandings,
          teamMatchupsMap: buildTeamMatchupsMap(redStandings, redMatchups),
          powerRankingsRows: redPowerRankings,
        },
        {
          divisionKey: "Black Division",
          anchorPrefix: "black",
          recapSection: activeRecapRow.recapJson.blackDivision,
          weeklyProps: blackProps,
          standingsRows: blackStandings,
          teamMatchupsMap: buildTeamMatchupsMap(blackStandings, blackMatchups),
          powerRankingsRows: blackPowerRankings,
        },
      ]
    : [];

  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Top-Left Header Component: Interactive Season & Week Dropdown Badge */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge
          seasonYear={seasonYear}
          week={week}
          label="Columnist Breakdown"
          title="VFFL Weekly Recaps"
          interactive
          seasonOptions={seasonOptions}
          weekOptions={weekOptions}
        />
      </header>

      {/* 2. Broadcast Loader + 2-Column Architecture: 75% Left (flex-[3]) / 25% Right Sticky TOC (flex-[1]) on Desktop (1024px+), Stacked on Tablet/Mobile */}
      <BroadcastLoader>
        <div className="w-full flex flex-col-reverse lg:flex-row items-start gap-10">
          {/* Left Primary Column (75% Desktop): Long-Form Editorial H2H Weekly Recap */}
          <div className="w-full lg:flex-[3] min-w-0">
            <WeeklyRecapArticle
              recapRow={activeRecapRow}
              divisions={divisions}
              seasonYear={seasonYear}
              week={week}
            />
          </div>

          {/* Right Supporting Column (25% Desktop): Sticky Interactive Table of Contents */}
          <aside className="w-full lg:flex-[1] min-w-0 lg:sticky lg:top-24 self-start">
            <WeeklyRecapToc
              seasonYear={seasonYear}
              week={week}
              redMatchups={activeRecapRow?.recapJson.redDivision.matchups ?? []}
              blackMatchups={
                activeRecapRow?.recapJson.blackDivision.matchups ?? []
              }
            />
          </aside>
        </div>
      </BroadcastLoader>
    </div>
  );
}
