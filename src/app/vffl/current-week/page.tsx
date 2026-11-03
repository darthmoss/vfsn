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
} from "./mockData";

export default function CurrentWeekPage() {
  const redDivision = DIVISION_DATASETS["Red Division"];

  return (
    <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-[50px] py-6 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* 1. Broadcast Header: Season/Week Badge (Top-Left) & Division Toggle (Top-Right) */}
      <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--vfsn-border)]">
        <SeasonWeekBadge
          seasonYear={CURRENT_SEASON_YEAR}
          week={CURRENT_WEEK}
        />
        <DivisionToggle
          initialDivision="Red Division"
          datasets={DIVISION_DATASETS}
        />
      </header>

      {/* 2. Primary 2-Column Architecture: 67% Left (flex-[2]) / 33% Right (flex-[1]) on Desktop (1024px+), Stacked on Tablet/Mobile */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-8 xl:gap-12">
        {/* Left Primary Column (67%): 5 Matchup Hype Cards */}
        <section className="w-full lg:flex-[2] min-w-0 flex flex-col gap-8">
          {redDivision.matchups.slice(0, 5).map((matchup, idx) => (
            <MatchupHypeCard
              key={matchup.matchupId ?? idx}
              matchup={matchup}
              matchupNumber={idx + 1}
            />
          ))}
        </section>

        {/* Right Supporting Column (33%): 4 Stacked Supporting Modules */}
        <aside className="w-full lg:flex-[1] min-w-0 flex flex-col gap-8">
          <ThisWeekInHistory events={redDivision.history} />
          <WeeklyProps propsList={redDivision.weeklyProps} />
          <TransactionsWire transactions={redDivision.transactions} />
          <InjuryReport injuries={MOCK_INJURY_REPORT} />
        </aside>
      </div>
    </div>
  );
}
