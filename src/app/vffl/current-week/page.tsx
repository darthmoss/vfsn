import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  vfflLeagues,
  vfflVwInjuryReport,
  vfflVwMatchupHype,
  vfflVwThisWeekInHistory,
  vfflVwTransactions,
  vfflVwWeeklyProps,
} from "@/db/schema";
import SeasonWeekBadge from "@/components/vffl/SeasonWeekBadge";
import DivisionToggle from "@/components/vffl/DivisionToggle";
import MatchupHypeCard from "@/components/vffl/MatchupHypeCard";
import ThisWeekInHistory from "@/components/vffl/ThisWeekInHistory";
import WeeklyProps from "@/components/vffl/WeeklyProps";
import TransactionsWire from "@/components/vffl/TransactionsWire";
import InjuryReport from "@/components/vffl/InjuryReport";
import type { DivisionKey } from "./mockData";

export const dynamic = "force-dynamic";

const DB_LEAGUE_NAME_MAP: Record<DivisionKey, string> = {
  "Red Division": "VFFL - Red Division",
  "Black Division": "VFFL - Black Division",
};

/**
 * Resolve active seasonYear and week from vffl.leagues:
 * - Wednesday through Monday: use current_week
 * - Tuesday: ESPN cycles current_week early, so hold at current_week - 1 until Wednesday
 */
async function resolveActiveSeasonAndWeek(): Promise<{
  seasonYear: number;
  week: number;
}> {
  const [latestLeague] = await db
    .select({
      seasonYear: vfflLeagues.seasonYear,
      currentWeek: vfflLeagues.currentWeek,
    })
    .from(vfflLeagues)
    .orderBy(desc(vfflLeagues.seasonYear), desc(vfflLeagues.currentWeek))
    .limit(1);

  const seasonYear = latestLeague?.seasonYear ?? new Date().getFullYear();
  const rawWeek = latestLeague?.currentWeek ?? 1;

  // Determine current day of week in US Eastern Time
  const easternWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(new Date());

  const isTuesday = easternWeekday === "Tue";
  const effectiveWeek = isTuesday ? Math.max(1, rawWeek - 1) : rawWeek;

  return { seasonYear, week: effectiveWeek };
}

interface CurrentWeekPageProps {
  searchParams: Promise<{ division?: string }>;
}

export default async function CurrentWeekPage({
  searchParams,
}: CurrentWeekPageProps) {
  const resolvedParams = await searchParams;
  const activeDivision: DivisionKey =
    resolvedParams.division === "Black Division"
      ? "Black Division"
      : "Red Division";
  const dbLeagueName = DB_LEAGUE_NAME_MAP[activeDivision];

  const { seasonYear, week } = await resolveActiveSeasonAndWeek();

  // Execute all 5 view queries in parallel on Neon's serverless HTTP driver
  const [matchups, history, weeklyProps, transactions, injuries] =
    await Promise.all([
      db
        .select()
        .from(vfflVwMatchupHype)
        .where(
          and(
            eq(vfflVwMatchupHype.seasonYear, seasonYear),
            eq(vfflVwMatchupHype.week, week),
            eq(vfflVwMatchupHype.leagueName, dbLeagueName)
          )
        ),
      db
        .select()
        .from(vfflVwThisWeekInHistory)
        .where(
          and(
            eq(vfflVwThisWeekInHistory.seasonYear, seasonYear),
            eq(vfflVwThisWeekInHistory.week, week),
            eq(vfflVwThisWeekInHistory.leagueName, dbLeagueName)
          )
        ),
      db
        .select()
        .from(vfflVwWeeklyProps)
        .where(
          and(
            eq(vfflVwWeeklyProps.seasonYear, seasonYear),
            eq(vfflVwWeeklyProps.week, week),
            eq(vfflVwWeeklyProps.leagueName, dbLeagueName)
          )
        ),
      db
        .select()
        .from(vfflVwTransactions)
        .where(
          and(
            eq(vfflVwTransactions.seasonYear, seasonYear),
            eq(vfflVwTransactions.week, week),
            eq(vfflVwTransactions.leagueName, dbLeagueName)
          )
        )
        .orderBy(desc(vfflVwTransactions.date)),
      db
        .select()
        .from(vfflVwInjuryReport)
        .where(
          and(
            eq(vfflVwInjuryReport.seasonYear, seasonYear),
            eq(vfflVwInjuryReport.week, week)
          )
        ),
    ]);

  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Broadcast Header: Season/Week Badge (Top-Left) & Division Toggle (Top-Right) */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge seasonYear={seasonYear} week={week} />
        <DivisionToggle initialDivision={activeDivision} />
      </header>

      {/* 2. Primary 2-Column Architecture: Locked 67% Left (flex-[2]) / 33% Right (flex-[1]) with generous gap-10 */}
      <div className="w-full flex flex-row items-start gap-10">
        {/* Left Primary Column (67%): Matchup Hype Cards */}
        <section className="flex-[2] min-w-0 flex flex-col gap-10">
          {matchups.map((matchup, idx) => (
            <MatchupHypeCard
              key={matchup.matchupId ?? idx}
              matchup={matchup}
              matchupNumber={idx + 1}
            />
          ))}
        </section>

        {/* Right Supporting Column (33%): 4 Stacked Supporting Modules */}
        <aside className="flex-[1] min-w-0 flex flex-col gap-10">
          <ThisWeekInHistory events={history} />
          <WeeklyProps propsList={weeklyProps} />
          <TransactionsWire transactions={transactions} />
          <InjuryReport injuries={injuries} />
        </aside>
      </div>
    </div>
  );
}
