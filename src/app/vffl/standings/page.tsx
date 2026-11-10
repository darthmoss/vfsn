import { and, asc, desc, eq, gt, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  vfflDivAllPlayMatchups,
  vfflLeagues,
  vfflMatchups,
  vfflOverallAllPlayMatchups,
  vfflVwDivAllPlayStandings,
  vfflVwMatchups,
  vfflVwOverallAllPlayStandings,
  vfflVwStandings,
} from "@/db/schema";
import SeasonWeekBadge from "@/components/vffl/SeasonWeekBadge";
import DivisionToggle from "@/components/vffl/DivisionToggle";
import StandingsViewToggle from "@/components/vffl/StandingsViewToggle";
import StandingsTable from "@/components/vffl/StandingsTable";
import AllPlayMatrix from "@/components/vffl/AllPlayMatrix";
import BroadcastLoader from "@/components/vffl/BroadcastLoader";
import type { DivisionKey } from "@/app/vffl/current-week/mockData";
import {
  getManagerInitials,
  type MatchupRow,
  type MatrixManagerMeta,
  type MatrixRecordCell,
  type StandingsRow,
  type StandingsViewMode,
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

function buildMatrixManagers(rows: StandingsRow[]): MatrixManagerMeta[] {
  return rows.map((row, idx) => {
    const key = `${row.leagueId ?? "lg"}-${row.managerId ?? idx}`;
    return {
      key,
      managerId: row.managerId ?? idx,
      leagueId: row.leagueId ?? null,
      leagueName: row.leagueName ?? null,
      managerName: row.managerName ?? "Manager",
      initials: getManagerInitials(row.managerName, row.teamName),
      teamName: row.teamName ?? "Unknown Team",
      standing: row.standing ?? idx + 1,
    };
  });
}

interface StandingsPageProps {
  searchParams: Promise<{
    division?: string;
    season?: string;
    week?: string;
    view?: string;
  }>;
}

export default async function StandingsPage({
  searchParams,
}: StandingsPageProps) {
  const resolvedParams = await searchParams;

  const activeDivision: DivisionKey =
    resolvedParams.division === "Black Division"
      ? "Black Division"
      : "Red Division";
  const dbLeagueName = DB_LEAGUE_NAME_MAP[activeDivision];

  const rawView = (resolvedParams.view ?? "H2H").toUpperCase();
  const activeView: StandingsViewMode =
    rawView === "DIV" || rawView === "VFFL" ? rawView : "H2H";

  const parsedSeason = resolvedParams.season
    ? Number.parseInt(resolvedParams.season, 10)
    : undefined;
  const parsedWeek = resolvedParams.week
    ? Number.parseInt(resolvedParams.week, 10)
    : undefined;

  const { seasonYear, week, seasonOptions, weekOptions } =
    await resolveSeasonAndWeekContext(dbLeagueName, parsedSeason, parsedWeek);

  let standingsRows: StandingsRow[] = [];
  const teamMatchupsMap: Record<string, MatchupRow[]> = {};
  let matrixManagers: MatrixManagerMeta[] = [];
  const matrixRecordsMap: Record<string, MatrixRecordCell> = {};

  if (activeView === "H2H") {
    const [h2hRows, divisionMatchups] = await Promise.all([
      db
        .select()
        .from(vfflVwStandings)
        .where(
          and(
            eq(vfflVwStandings.seasonYear, seasonYear),
            eq(vfflVwStandings.week, week),
            eq(vfflVwStandings.leagueName, dbLeagueName)
          )
        )
        .orderBy(
          asc(vfflVwStandings.standing),
          desc(vfflVwStandings.pointsFor)
        ),
      db
        .select()
        .from(vfflVwMatchups)
        .where(
          and(
            eq(vfflVwMatchups.seasonYear, seasonYear),
            lte(vfflVwMatchups.week, week),
            eq(vfflVwMatchups.leagueName, dbLeagueName)
          )
        )
        .orderBy(asc(vfflVwMatchups.week), asc(vfflVwMatchups.matchupId)),
    ]);

    standingsRows = h2hRows;

    // Partition nested matchups by team row key
    for (const row of h2hRows) {
      const rowKey = `${row.leagueId ?? "lg"}-${row.managerId ?? ""}`;
      teamMatchupsMap[rowKey] = divisionMatchups.filter(
        (m) =>
          (row.teamName &&
            (m.homeTeam === row.teamName || m.awayTeam === row.teamName)) ||
          (row.managerName &&
            (m.homeMgr === row.managerName || m.awayMgr === row.managerName))
      );
    }
  } else if (activeView === "DIV") {
    const [divStandings, divAllPlayRows] = await Promise.all([
      db
        .select()
        .from(vfflVwDivAllPlayStandings)
        .where(
          and(
            eq(vfflVwDivAllPlayStandings.seasonYear, seasonYear),
            eq(vfflVwDivAllPlayStandings.week, week),
            eq(vfflVwDivAllPlayStandings.leagueName, dbLeagueName)
          )
        )
        .orderBy(
          asc(vfflVwDivAllPlayStandings.standing),
          desc(vfflVwDivAllPlayStandings.pointsFor)
        ),
      db
        .select()
        .from(vfflDivAllPlayMatchups)
        .where(
          and(
            eq(vfflDivAllPlayMatchups.seasonYear, seasonYear),
            gt(vfflDivAllPlayMatchups.week, 0),
            lte(vfflDivAllPlayMatchups.week, week),
            eq(vfflDivAllPlayMatchups.leagueName, dbLeagueName)
          )
        ),
    ]);

    standingsRows = divStandings;
    matrixManagers = buildMatrixManagers(divStandings);

    for (const m of divAllPlayRows) {
      if (m.homeMgrId === null || m.awayMgrId === null) continue;
      const homeKey = `${m.leagueId ?? "lg"}-${m.homeMgrId}`;
      const awayKey = `${m.leagueId ?? "lg"}-${m.awayMgrId}`;
      const pairKey = `${homeKey}__${awayKey}`;

      if (!matrixRecordsMap[pairKey]) {
        matrixRecordsMap[pairKey] = { wins: 0, losses: 0, ties: 0 };
      }

      const diff = m.diff ?? (m.homeFpts ?? 0) - (m.awayFpts ?? 0);
      if (diff > 0) {
        matrixRecordsMap[pairKey].wins += 1;
      } else if (diff < 0) {
        matrixRecordsMap[pairKey].losses += 1;
      } else {
        matrixRecordsMap[pairKey].ties += 1;
      }
    }
  } else {
    // activeView === "VFFL" (20-Team Overall All-Play)
    const [overallStandings, overallAllPlayRows] = await Promise.all([
      db
        .select()
        .from(vfflVwOverallAllPlayStandings)
        .where(
          and(
            eq(vfflVwOverallAllPlayStandings.seasonYear, seasonYear),
            eq(vfflVwOverallAllPlayStandings.week, week)
          )
        )
        .orderBy(
          asc(vfflVwOverallAllPlayStandings.standing),
          desc(vfflVwOverallAllPlayStandings.pointsFor)
        ),
      db
        .select()
        .from(vfflOverallAllPlayMatchups)
        .where(
          and(
            eq(vfflOverallAllPlayMatchups.seasonYear, seasonYear),
            gt(vfflOverallAllPlayMatchups.week, 0),
            lte(vfflOverallAllPlayMatchups.week, week)
          )
        ),
    ]);

    standingsRows = overallStandings;
    matrixManagers = buildMatrixManagers(overallStandings);

    for (const m of overallAllPlayRows) {
      if (m.homeMgrId === null || m.awayMgrId === null) continue;
      const homeKey = `${m.homeLeagueId ?? "lg"}-${m.homeMgrId}`;
      const awayKey = `${m.awayLeagueId ?? "lg"}-${m.awayMgrId}`;
      const pairKey = `${homeKey}__${awayKey}`;

      if (!matrixRecordsMap[pairKey]) {
        matrixRecordsMap[pairKey] = { wins: 0, losses: 0, ties: 0 };
      }

      const diff = m.diff ?? (m.homeFpts ?? 0) - (m.awayFpts ?? 0);
      if (diff > 0) {
        matrixRecordsMap[pairKey].wins += 1;
      } else if (diff < 0) {
        matrixRecordsMap[pairKey].losses += 1;
      } else {
        matrixRecordsMap[pairKey].ties += 1;
      }
    }
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Broadcast Header: Interactive Season/Week Dropdown Badge (Left) & Division Toggle (Right) */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge
          seasonYear={seasonYear}
          week={week}
          label="League Leaderboard"
          title="VFFL Standings"
          interactive
          seasonOptions={seasonOptions}
          weekOptions={weekOptions}
        />

        {activeView !== "VFFL" ? (
          <DivisionToggle initialDivision={activeDivision} />
        ) : (
          <div
            className="inline-flex items-center px-5 py-3 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-2.5"
            style={{
              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
              color: "var(--nav-text, var(--vfsn-text))",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))",
              }}
            />
            <span className="text-xs font-extrabold uppercase tracking-[0.14em]">
              Red & Black Combined • 20 Teams
            </span>
          </div>
        )}
      </header>

      {/* 2. Standings View Mode Toggles (H2H | DIV | VFFL) */}
      <StandingsViewToggle
        activeView={activeView}
        subtitle={
          activeView === "VFFL" ? "All 20 Managers" : activeDivision
        }
      />

      {/* 3 & 4. Broadcast Loader Wrapper around Standings Table & All-Play Matrix */}
      <BroadcastLoader>
        <StandingsTable
          rows={standingsRows}
          viewMode={activeView}
          teamMatchupsMap={teamMatchupsMap}
          seasonYear={seasonYear}
          week={week}
        />

        {activeView === "DIV" && (
          <AllPlayMatrix
            title="Div All-Play Record"
            subtitle={`${activeDivision} • Cumulative Head-to-Head Through Week ${week}`}
            managers={matrixManagers}
            recordsMap={matrixRecordsMap}
          />
        )}

        {activeView === "VFFL" && (
          <AllPlayMatrix
            title="VFFL All-Play Record"
            subtitle={`All 20 Teams • Cumulative Head-to-Head Through Week ${week}`}
            managers={matrixManagers}
            recordsMap={matrixRecordsMap}
          />
        )}
      </BroadcastLoader>
    </div>
  );
}
