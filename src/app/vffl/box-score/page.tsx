import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  vfflDivisionPowerRankings,
  vfflLeagues,
  vfflManagers,
  vfflMatchups,
  vfflTeams,
  vfflVwMatchupRosters,
  vfflVwMatchups,
  vfflVwStandings,
} from "@/db/schema";
import SeasonWeekBadge from "@/components/vffl/SeasonWeekBadge";
import DivisionToggle from "@/components/vffl/DivisionToggle";
import BoxScoreSnapshot, {
  type BoxScoreMatchupRow,
} from "@/components/vffl/BoxScoreSnapshot";
import BoxScoreTeamCard from "@/components/vffl/BoxScoreTeamCard";
import type { MatchupRosterRow } from "@/components/vffl/BoxScorePlayerRow";
import type { DivisionKey } from "@/app/vffl/current-week/mockData";

export const dynamic = "force-dynamic";

const DB_LEAGUE_NAME_MAP: Record<DivisionKey, string> = {
  "Red Division": "VFFL - Red Division",
  "Black Division": "VFFL - Black Division",
};

function formatManagerShortName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.trim() ?? "";
  const lastInitial = lastName?.trim()?.[0] ?? "";
  if (first && lastInitial) return `${first} ${lastInitial}`;
  return first || "Manager";
}

/**
 * Resolve default active seasonYear, week, leagueId, and available season/week dropdown options
 * from vffl.leagues and vffl.matchups.
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

  // Query available weeks for the selected season & division from vffl.matchups
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
        : (weekOptions[0] ?? 1);

  if (dbWeeks.length > 0 && !dbWeeks.includes(week)) {
    week = dbWeeks.includes(defaultWeek) ? defaultWeek : (dbWeeks[0] ?? 1);
  }

  return {
    seasonYear,
    week,
    leagueId,
    seasonOptions,
    weekOptions,
  };
}

/**
 * Fallback builder that constructs BoxScoreMatchupRow[] directly from vffl.matchups,
 * vffl.teams, vffl.managers, and vffl.vw_standings if vffl.vw_matchups in Neon
 * has not yet had the updated view DDL applied.
 */
async function fetchHistoricalMatchupsFallback(
  seasonYear: number,
  week: number,
  leagueId: number | null,
  dbLeagueName: string
): Promise<BoxScoreMatchupRow[]> {
  if (leagueId === null) return [];

  const [rawMatchups, teams, managers, priorStandings] = await Promise.all([
    db
      .select()
      .from(vfflMatchups)
      .where(
        and(
          eq(vfflMatchups.seasonYear, seasonYear),
          eq(vfflMatchups.week, week),
          eq(vfflMatchups.leagueId, leagueId)
        )
      )
      .orderBy(asc(vfflMatchups.id)),
    db
      .select()
      .from(vfflTeams)
      .where(
        and(
          eq(vfflTeams.seasonYear, seasonYear),
          eq(vfflTeams.leagueId, leagueId)
        )
      ),
    db.select().from(vfflManagers),
    db
      .select()
      .from(vfflVwStandings)
      .where(
        and(
          eq(vfflVwStandings.seasonYear, seasonYear),
          eq(vfflVwStandings.leagueId, leagueId),
          eq(vfflVwStandings.week, week - 1)
        )
      ),
  ]);

  const teamByManagerId = new Map(
    teams
      .filter((t) => t.managerId !== null)
      .map((t) => [t.managerId as number, t])
  );
  const managerById = new Map(managers.map((m) => [m.id, m]));
  const standingByManagerId = new Map(
    priorStandings
      .filter((s) => s.managerId !== null)
      .map((s) => [s.managerId as number, s.standing ?? 0])
  );

  return rawMatchups.map((m) => {
    const homeMgrObj =
      m.homeManagerId !== null ? managerById.get(m.homeManagerId) : undefined;
    const awayMgrObj =
      m.awayManagerId !== null ? managerById.get(m.awayManagerId) : undefined;
    const homeTeamObj =
      m.homeManagerId !== null
        ? teamByManagerId.get(m.homeManagerId)
        : undefined;
    const awayTeamObj =
      m.awayManagerId !== null
        ? teamByManagerId.get(m.awayManagerId)
        : undefined;

    return {
      matchupId: m.id,
      leagueName: dbLeagueName,
      seasonYear: m.seasonYear,
      week: m.week,
      matchupType: m.matchupType,
      homeMgr: formatManagerShortName(
        homeMgrObj?.firstName,
        homeMgrObj?.lastName
      ),
      homeTeam: homeTeamObj?.teamName ?? "Home Team",
      homeStanding:
        m.homeManagerId !== null
          ? (standingByManagerId.get(m.homeManagerId) ?? 0)
          : 0,
      homeProjected: m.homeProjected,
      homeScore: m.homeScore,
      awayMgr: formatManagerShortName(
        awayMgrObj?.firstName,
        awayMgrObj?.lastName
      ),
      awayTeam: awayTeamObj?.teamName ?? "Away Team",
      awayStanding:
        m.awayManagerId !== null
          ? (standingByManagerId.get(m.awayManagerId) ?? 0)
          : 0,
      awayProjected: m.awayProjected,
      awayScore: m.awayScore,
      mqi: null,
      matchupRank: null,
      matchupTitle: null,
      diff:
        m.homeScore !== null && m.awayScore !== null
          ? m.homeScore - m.awayScore
          : null,
      winLoss:
        m.homeScore !== null && m.awayScore !== null
          ? m.homeScore > m.awayScore
            ? "W"
            : m.homeScore < m.awayScore
              ? "L"
              : "T"
          : "T",
    };
  });
}

/**
 * Fetches matchup rosters from vffl.vw_matchup_rosters.
 * Selects the updated view columns (`depth`, `diff`) first; if the live Neon database
 * hasn't run CREATE OR REPLACE VIEW yet, falls back to computing `depth` and `diff`
 * in PostgreSQL via Drizzle sql<T> window expressions on vffl.vw_matchup_rosters.
 */
async function fetchMatchupRostersServerSide(
  matchupId: number
): Promise<MatchupRosterRow[]> {
  try {
    return await db
      .select()
      .from(vfflVwMatchupRosters)
      .where(eq(vfflVwMatchupRosters.matchupId, matchupId));
  } catch {
    return await db
      .select({
        matchupId: vfflVwMatchupRosters.matchupId,
        managerId: vfflVwMatchupRosters.managerId,
        slot: vfflVwMatchupRosters.slot,
        playerName: vfflVwMatchupRosters.playerName,
        nflTeam: vfflVwMatchupRosters.nflTeam,
        position: vfflVwMatchupRosters.position,
        projFpts: vfflVwMatchupRosters.projFpts,
        actualFpts: vfflVwMatchupRosters.actualFpts,
        passPct: vfflVwMatchupRosters.passPct,
        passYds: vfflVwMatchupRosters.passYds,
        passTds: vfflVwMatchupRosters.passTds,
        rushYds: vfflVwMatchupRosters.rushYds,
        rushTds: vfflVwMatchupRosters.rushTds,
        recPct: vfflVwMatchupRosters.recPct,
        recYds: vfflVwMatchupRosters.recYds,
        recTds: vfflVwMatchupRosters.recTds,
        pa: vfflVwMatchupRosters.pa,
        ya: vfflVwMatchupRosters.ya,
        sacks: vfflVwMatchupRosters.sacks,
        ints: vfflVwMatchupRosters.ints,
        fg: vfflVwMatchupRosters.fg,
        fgYd: vfflVwMatchupRosters.fgYd,
        pat: vfflVwMatchupRosters.pat,
        depth: sql<string>`(${vfflVwMatchupRosters.position} || row_number() OVER (PARTITION BY ${vfflVwMatchupRosters.matchupId}, ${vfflVwMatchupRosters.managerId}, ${vfflVwMatchupRosters.position} ORDER BY COALESCE(${vfflVwMatchupRosters.actualFpts}, 0::real) DESC, COALESCE(${vfflVwMatchupRosters.projFpts}, 0::real) DESC))`,
        diff: sql<number>`(COALESCE(${vfflVwMatchupRosters.actualFpts}, 0::real) - COALESCE(${vfflVwMatchupRosters.projFpts}, 0::real))`,
      })
      .from(vfflVwMatchupRosters)
      .where(eq(vfflVwMatchupRosters.matchupId, matchupId));
  }
}

interface BoxScorePageProps {
  searchParams: Promise<{
    division?: string;
    season?: string;
    week?: string;
    matchupId?: string;
  }>;
}

export default async function BoxScorePage({
  searchParams,
}: BoxScorePageProps) {
  const resolvedParams = await searchParams;

  const activeDivision: DivisionKey =
    resolvedParams.division === "Black Division"
      ? "Black Division"
      : "Red Division";
  const dbLeagueName = DB_LEAGUE_NAME_MAP[activeDivision];

  const parsedSeason = resolvedParams.season
    ? Number.parseInt(resolvedParams.season, 10)
    : undefined;
  const parsedWeek = resolvedParams.week
    ? Number.parseInt(resolvedParams.week, 10)
    : undefined;
  const parsedMatchupId = resolvedParams.matchupId
    ? Number.parseInt(resolvedParams.matchupId, 10)
    : undefined;

  const { seasonYear, week, leagueId, seasonOptions, weekOptions } =
    await resolveSeasonAndWeekContext(dbLeagueName, parsedSeason, parsedWeek);

  // 1. Fetch Box Score Snapshot matchups from vffl.vw_matchups
  const viewMatchups = await db
    .select()
    .from(vfflVwMatchups)
    .where(
      and(
        eq(vfflVwMatchups.seasonYear, seasonYear),
        eq(vfflVwMatchups.week, week),
        eq(vfflVwMatchups.leagueName, dbLeagueName)
      )
    )
    .orderBy(asc(vfflVwMatchups.matchupRank), asc(vfflVwMatchups.matchupId));

  const matchups: BoxScoreMatchupRow[] =
    viewMatchups.length > 0
      ? viewMatchups
      : await fetchHistoricalMatchupsFallback(
          seasonYear,
          week,
          leagueId,
          dbLeagueName
        );

  // Resolve active matchup (either matching ?matchupId= or defaulting to the first matchup in the division)
  const activeMatchup =
    (parsedMatchupId !== undefined && !Number.isNaN(parsedMatchupId)
      ? matchups.find((m) => m.matchupId === parsedMatchupId)
      : undefined) ??
    matchups[0] ??
    null;

  const activeMatchupId = activeMatchup?.matchupId ?? null;

  // 2. Fetch Detail data for the active matchup in parallel:
  //    - vffl.vw_matchup_rosters for player rows, stats, depth, and diff
  //    - vffl.matchups for homeManagerId & awayManagerId
  const [rosterRows, rawMatchupRows] =
    activeMatchupId !== null
      ? await Promise.all([
          fetchMatchupRostersServerSide(activeMatchupId),
          db
            .select({
              id: vfflMatchups.id,
              leagueId: vfflMatchups.leagueId,
              homeManagerId: vfflMatchups.homeManagerId,
              awayManagerId: vfflMatchups.awayManagerId,
            })
            .from(vfflMatchups)
            .where(eq(vfflMatchups.id, activeMatchupId))
            .limit(1),
        ])
      : [[], []];

  const rawMatchup = rawMatchupRows[0] ?? null;
  const homeManagerId = rawMatchup?.homeManagerId ?? null;
  const awayManagerId = rawMatchup?.awayManagerId ?? null;

  // 3. Pull wkOptFpts and wkEffPct from vffl.division_power_rankings for Home & Away managers
  const managerIds = [homeManagerId, awayManagerId].filter(
    (id): id is number => id !== null
  );

  const powerRankRows =
    managerIds.length > 0
      ? await db
          .select({
            managerId: vfflDivisionPowerRankings.managerId,
            wkOptFpts: vfflDivisionPowerRankings.wkOptFpts,
            wkEffPct: vfflDivisionPowerRankings.wkEffPct,
          })
          .from(vfflDivisionPowerRankings)
          .where(
            and(
              eq(vfflDivisionPowerRankings.seasonYear, seasonYear),
              eq(vfflDivisionPowerRankings.week, week),
              inArray(vfflDivisionPowerRankings.managerId, managerIds)
            )
          )
      : [];

  const homePowerMetrics = powerRankRows.find(
    (r) => r.managerId === homeManagerId
  );
  const awayPowerMetrics = powerRankRows.find(
    (r) => r.managerId === awayManagerId
  );

  // Partition roster rows into Home and Away
  const homeRosterRows =
    homeManagerId !== null
      ? rosterRows.filter((r) => r.managerId === homeManagerId)
      : [];
  const awayRosterRows =
    awayManagerId !== null
      ? rosterRows.filter((r) => r.managerId === awayManagerId)
      : [];

  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Header Section: Interactive Season/Week Dropdown Badge (Left) & Division Toggle (Right) */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge
          seasonYear={seasonYear}
          week={week}
          label="Head-to-Head Showdowns"
          title="VFFL Box Score"
          interactive
          seasonOptions={seasonOptions}
          weekOptions={weekOptions}
        />
        <DivisionToggle initialDivision={activeDivision} />
      </header>

      {/* 2. Box Score Snapshot (Top Grid) - Data: vffl.vw_matchups */}
      <BoxScoreSnapshot
        matchups={matchups}
        activeMatchupId={activeMatchupId}
      />

      {/* 3. Box Score Detail (Main Canvas) - Data: vffl.vw_matchup_rosters */}
      {activeMatchup ? (
        <section
          aria-label="Box Score Matchup Detail"
          className="w-full grid grid-cols-2 lg:grid-cols-2 gap-8 items-start"
        >
          {/* Left 50% Box: Home Team */}
          <BoxScoreTeamCard
            standing={activeMatchup.homeStanding}
            teamName={activeMatchup.homeTeam}
            managerName={activeMatchup.homeMgr}
            actualScore={activeMatchup.homeScore}
            projectedScore={activeMatchup.homeProjected}
            optimalScore={homePowerMetrics?.wkOptFpts ?? null}
            efficiencyPct={homePowerMetrics?.wkEffPct ?? null}
            rosterRows={homeRosterRows}
          />

          {/* Right 50% Box: Away Team */}
          <BoxScoreTeamCard
            standing={activeMatchup.awayStanding}
            teamName={activeMatchup.awayTeam}
            managerName={activeMatchup.awayMgr}
            actualScore={activeMatchup.awayScore}
            projectedScore={activeMatchup.awayProjected}
            optimalScore={awayPowerMetrics?.wkOptFpts ?? null}
            efficiencyPct={awayPowerMetrics?.wkEffPct ?? null}
            rosterRows={awayRosterRows}
          />
        </section>
      ) : null}
    </div>
  );
}
