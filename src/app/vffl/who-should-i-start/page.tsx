import { and, asc, desc, eq, gt, inArray, max } from "drizzle-orm";
import { db } from "@/db";
import { vfflLeagues, vfflVwPlayerStats } from "@/db/schema";
import BroadcastLoader from "@/components/vffl/BroadcastLoader";
import PositionGroupToggle from "@/components/vffl/who-should-i-start/PositionGroupToggle";
import ComparisonWorkspace from "@/components/vffl/who-should-i-start/ComparisonWorkspace";
import {
  BASE_KEYS,
  POSITION_GROUPS,
  parsePositionGroup,
  type PlayerStatRow,
  type PositionGroupConfig,
} from "./statConfig";

export const dynamic = "force-dynamic";

/** Current season = latest season in vffl.leagues (falls back to calendar year). */
async function resolveCurrentSeason(): Promise<number> {
  const [league] = await db
    .select({ seasonYear: vfflLeagues.seasonYear })
    .from(vfflLeagues)
    .orderBy(desc(vfflLeagues.seasonYear))
    .limit(1);
  return league?.seasonYear ?? new Date().getFullYear();
}

/** Select only identity columns + the active group's stat/points columns. */
async function fetchPositionPool(
  config: PositionGroupConfig,
  seasonYear: number
): Promise<PlayerStatRow[]> {
  const keys = [...BASE_KEYS, ...config.columns];
  const fields = Object.fromEntries(
    keys.map((k) => [k, vfflVwPlayerStats[k]])
  ) as Pick<typeof vfflVwPlayerStats, (typeof BASE_KEYS)[number]>;

  const rows = await db
    .select(fields)
    .from(vfflVwPlayerStats)
    .where(
      and(
        eq(vfflVwPlayerStats.seasonYear, seasonYear),
        gt(vfflVwPlayerStats.week, 0),
        inArray(vfflVwPlayerStats.position, config.positions)
      )
    )
    .orderBy(asc(vfflVwPlayerStats.playerId), asc(vfflVwPlayerStats.week));

  return rows as PlayerStatRow[];
}

interface WhoShouldIStartPageProps {
  searchParams: Promise<{ pos?: string; p1?: string; p2?: string }>;
}

const parseId = (raw: string | undefined) => {
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isNaN(n) ? null : n;
};

export default async function WhoShouldIStartPage({
  searchParams,
}: WhoShouldIStartPageProps) {
  const resolvedParams = await searchParams;
  const group = parsePositionGroup(resolvedParams.pos);
  const config = POSITION_GROUPS[group];

  let seasonYear = await resolveCurrentSeason();
  let rows = await fetchPositionPool(config, seasonYear);

  // Preseason fallback: roll back to the latest season with stats on file
  if (rows.length === 0) {
    const [latest] = await db
      .select({ seasonYear: max(vfflVwPlayerStats.seasonYear) })
      .from(vfflVwPlayerStats);
    if (latest?.seasonYear && latest.seasonYear !== seasonYear) {
      seasonYear = latest.seasonYear;
      rows = await fetchPositionPool(config, seasonYear);
    }
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto px-6 lg:px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* Header: Title + Season Indicator | Position Group Toggles */}
      <header className="w-full flex flex-wrap items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <div className="flex flex-col gap-1.5">
          <span
            className="text-[11px] font-black uppercase tracking-[0.22em]"
            style={{ color: "var(--vfsn-accent-1)" }}
          >
            {seasonYear} Season · Start / Sit Showdown
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight m-0">
            Who Should I Start
          </h1>
        </div>
        <PositionGroupToggle active={group} />
      </header>

      <BroadcastLoader>
        <ComparisonWorkspace
          key={`wsis-${group}-${seasonYear}`}
          group={group}
          rows={rows}
          initialP1={parseId(resolvedParams.p1)}
          initialP2={parseId(resolvedParams.p2)}
        />
      </BroadcastLoader>
    </div>
  );
}
