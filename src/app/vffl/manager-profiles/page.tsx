import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  vfflVwManagerAllPlayMatrix,
  vfflVwManagerCareerSummary,
  vfflVwManagerExtremeGames,
  vfflVwManagerH2hMatrix,
  vfflVwManagerSeasonHistory,
} from "@/db/schema";
import BroadcastLoader from "@/components/vffl/BroadcastLoader";
import ManagerSelector from "@/components/vffl/manager-profiles/ManagerSelector";
import ManagerHero from "@/components/vffl/manager-profiles/ManagerHero";
import ExtremeGamesGrid from "@/components/vffl/manager-profiles/ExtremeGamesGrid";
import H2HMatrixTable from "@/components/vffl/manager-profiles/H2HMatrixTable";
import AllPlayMatrixTable from "@/components/vffl/manager-profiles/AllPlayMatrixTable";
import LuckBreakdownTable from "@/components/vffl/manager-profiles/LuckBreakdownTable";
import {
  parseProfileTab,
  type ManagerCareerSummaryRow,
  type ManagerOption,
  type ProfileTab,
} from "./mockData";
import {
  CARD_CLASS,
  CARD_STYLE,
  HIGHLIGHT,
  SURFACE,
  buildAllPlayGroups,
  buildH2HGroups,
  dedupeSeasons,
} from "./utils";

export const dynamic = "force-dynamic";

interface ManagerProfilesPageProps {
  searchParams: Promise<{ managerId?: string; tab?: string }>;
}

async function renderRivalryCard(tab: ProfileTab, managerId: number) {
  if (tab === "all-play") {
    const rows = await db
      .select()
      .from(vfflVwManagerAllPlayMatrix)
      .where(eq(vfflVwManagerAllPlayMatrix.managerId, managerId));
    return (
      <AllPlayMatrixTable
        key={`all-play-${managerId}`}
        managerId={managerId}
        groups={buildAllPlayGroups(rows)}
      />
    );
  }

  const rows = await db
    .select()
    .from(vfflVwManagerH2hMatrix)
    .where(eq(vfflVwManagerH2hMatrix.managerId, managerId));
  return (
    <H2HMatrixTable
      key={`h2h-${managerId}`}
      managerId={managerId}
      groups={buildH2HGroups(rows)}
    />
  );
}

export default async function ManagerProfilesPage({
  searchParams,
}: ManagerProfilesPageProps) {
  const resolvedParams = await searchParams;
  const activeTab = parseProfileTab(resolvedParams.tab);

  const seenManagers = new Set<number>();
  const summaries = (
    await db
      .select()
      .from(vfflVwManagerCareerSummary)
      .where(eq(vfflVwManagerCareerSummary.scope, "CAREER"))
  )
    .filter(
      (m): m is ManagerCareerSummaryRow & { managerId: number } => {
        if (m.managerId === null || seenManagers.has(m.managerId)) return false;
        seenManagers.add(m.managerId);
        return true;
      }
    )
    .sort(
      (a, b) =>
        Number(b.active ?? false) - Number(a.active ?? false) ||
        (a.managerName ?? "").localeCompare(b.managerName ?? "")
    );

  const requestedId = resolvedParams.managerId
    ? Number.parseInt(resolvedParams.managerId, 10)
    : NaN;
  const selected =
    summaries.find((m) => m.managerId === requestedId) ??
    summaries.find((m) => m.active) ??
    summaries[0];

  const shellClass =
    "w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]";

  if (!selected) {
    return (
      <div className={shellClass}>
        <div className={CARD_CLASS} style={CARD_STYLE}>
          <p className="text-sm font-semibold opacity-70">
            No managers found.
          </p>
        </div>
      </div>
    );
  }

  const managerOptions: ManagerOption[] = summaries.map((m) => ({
    managerId: m.managerId,
    managerName: m.managerName,
    active: m.active,
  }));

  const [extremeGames, rivalryCard, seasons] = await Promise.all([
    db
      .select()
      .from(vfflVwManagerExtremeGames)
      .where(eq(vfflVwManagerExtremeGames.managerId, selected.managerId))
      .orderBy(asc(vfflVwManagerExtremeGames.rank)),
    renderRivalryCard(activeTab, selected.managerId),
    db
      .select()
      .from(vfflVwManagerSeasonHistory)
      .where(eq(vfflVwManagerSeasonHistory.managerId, selected.managerId))
      .orderBy(desc(vfflVwManagerSeasonHistory.seasonYear)),
  ]);
  const isActive = selected.active ?? false;
  const dedupedSeasons = dedupeSeasons(seasons);

  return (
    <div className={shellClass}>
      {/* 1. Header Bar */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">
            Manager Profiles
          </span>
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight uppercase">
              {selected.managerName}
            </h1>
            <span
              className="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.18em]"
              style={
                isActive
                  ? {
                      backgroundColor: HIGHLIGHT,
                      borderColor: HIGHLIGHT,
                      color: SURFACE,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "var(--vfsn-border)",
                      color: "var(--vfsn-text)",
                      opacity: 0.75,
                    }
              }
            >
              {isActive ? "Active" : "Retired"}
            </span>
          </div>
        </div>

        <ManagerSelector
          managers={managerOptions}
          selectedId={selected.managerId}
        />
      </header>

      {/* 2. Side-by-Side Hero & Extreme Games + 3. Side-by-Side Rivalry Ledger & Luck Breakdown */}
      <BroadcastLoader>
        <div className="w-full grid grid-cols-2 gap-8 items-stretch">
          <ManagerHero
            key={`hero-${selected.managerId}`}
            summary={selected}
            seasons={dedupedSeasons}
          />
          <ExtremeGamesGrid
            key={`extremes-${selected.managerId}`}
            games={extremeGames}
          />
        </div>
        <div className="w-full grid grid-cols-2 gap-8 items-start">
          {rivalryCard}
          <LuckBreakdownTable
            key={`luck-${selected.managerId}`}
            managerId={selected.managerId}
            career={selected}
            seasons={dedupedSeasons}
          />
        </div>
      </BroadcastLoader>
    </div>
  );
}
