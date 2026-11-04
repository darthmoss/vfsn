import SeasonWeekBadge from "@/components/vffl/SeasonWeekBadge";
import DivisionToggle from "@/components/vffl/DivisionToggle";
import MatchupHypeCard from "@/components/vffl/MatchupHypeCard";
import ThisWeekInHistory from "@/components/vffl/ThisWeekInHistory";
import WeeklyProps from "@/components/vffl/WeeklyProps";
import TransactionsWire from "@/components/vffl/TransactionsWire";
import InjuryReport from "@/components/vffl/InjuryReport";
import {
  CURRENT_SEASON_YEAR,
  CURRENT_WEEK,
  DIVISION_DATASETS,
  MOCK_INJURY_REPORT,
  type DivisionKey,
} from "./mockData";

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
  const divisionData = DIVISION_DATASETS[activeDivision];

  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Broadcast Header: Season/Week Badge (Top-Left) & Division Toggle (Top-Right) */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge
          seasonYear={CURRENT_SEASON_YEAR}
          week={CURRENT_WEEK}
        />
        <DivisionToggle
          initialDivision={activeDivision}
          datasets={DIVISION_DATASETS}
        />
      </header>

      {/* 2. Primary 2-Column Architecture: Locked 67% Left (flex-[2]) / 33% Right (flex-[1]) with generous gap-10 */}
      <div className="w-full flex flex-row items-start gap-10">
        {/* Left Primary Column (67%): 5 Matchup Hype Cards */}
        <section className="flex-[2] min-w-0 flex flex-col gap-10">
          {divisionData.matchups.slice(0, 5).map((matchup, idx) => (
            <MatchupHypeCard
              key={matchup.matchupId ?? idx}
              matchup={matchup}
              matchupNumber={idx + 1}
            />
          ))}
        </section>

        {/* Right Supporting Column (33%): 4 Stacked Supporting Modules */}
        <aside className="flex-[1] min-w-0 flex flex-col gap-10">
          <ThisWeekInHistory events={divisionData.history} />
          <WeeklyProps propsList={divisionData.weeklyProps} />
          <TransactionsWire transactions={divisionData.transactions} />
          <InjuryReport injuries={MOCK_INJURY_REPORT} />
        </aside>
      </div>
    </div>
  );
}
