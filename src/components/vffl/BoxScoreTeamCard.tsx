import BoxScorePlayerRow, { type MatchupRosterRow } from "./BoxScorePlayerRow";

interface BoxScoreTeamCardProps {
  standing: number | null;
  teamName: string | null;
  managerName: string | null;
  actualScore: number | null;
  projectedScore: number | null;
  optimalScore: number | null;
  efficiencyPct: number | null;
  rosterRows: MatchupRosterRow[];
}

const STARTER_SLOT_ORDER: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  FLEX: 5,
  "RB/WR/TE": 5,
  "D/ST": 6,
  DST: 6,
  K: 7,
};

const POSITION_ORDER: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  "D/ST": 5,
  DST: 5,
  K: 6,
};

function isStarterSlot(slot: string | null): boolean {
  if (!slot) return false;
  const upper = slot.toUpperCase();
  return upper !== "BN" && upper !== "BE" && upper !== "IR";
}

function isIrSlot(slot: string | null): boolean {
  if (!slot) return false;
  return slot.toUpperCase() === "IR";
}

function isBenchSlot(slot: string | null): boolean {
  if (!slot) return false;
  const upper = slot.toUpperCase();
  return upper === "BN" || upper === "BE";
}

function formatStanding(standing: number | null): string {
  if (!standing || standing <= 0) return "#-";
  return `#${standing}`;
}

function formatSignedDiff(diff: number): string {
  const prefix = diff > 0 ? "+" : "";
  return `${prefix}${diff.toFixed(2)}`;
}

/**
 * Fallback optimal lineup calculator when vffl.division_power_rankings
 * does not have a precomputed row for the requested season/week/manager.
 * Standard VFFL starting slots: 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX (RB/WR/TE), 1 D/ST, 1 K
 */
function computeFallbackOptimalScore(rows: MatchupRosterRow[]): number {
  const byPos = (pos: string) =>
    rows
      .filter((r) => (r.position ?? "").toUpperCase() === pos)
      .map((r) => r.actualFpts ?? 0)
      .sort((a, b) => b - a);

  const qbs = byPos("QB");
  const rbs = byPos("RB");
  const wrs = byPos("WR");
  const tes = byPos("TE");
  const dsts = [...byPos("D/ST"), ...byPos("DST")].sort((a, b) => b - a);
  const ks = byPos("K");

  let optimal = 0;
  optimal += qbs[0] ?? 0;
  optimal += (rbs[0] ?? 0) + (rbs[1] ?? 0);
  optimal += (wrs[0] ?? 0) + (wrs[1] ?? 0);
  optimal += tes[0] ?? 0;
  optimal += dsts[0] ?? 0;
  optimal += ks[0] ?? 0;

  const flexPool = [
    ...rbs.slice(2),
    ...wrs.slice(2),
    ...tes.slice(1),
  ].sort((a, b) => b - a);

  optimal += flexPool[0] ?? 0;
  return optimal;
}

interface RosterSectionTableProps {
  title: string;
  players: MatchupRosterRow[];
  hideHeaderAndSubtotal?: boolean;
}

function RosterSectionTable({
  title,
  players,
  hideHeaderAndSubtotal = false,
}: RosterSectionTableProps) {
  const subtotalProj = players.reduce((acc, p) => acc + (p.projFpts ?? 0), 0);
  const subtotalActual = players.reduce(
    (acc, p) => acc + (p.actualFpts ?? 0),
    0
  );
  const subtotalDiff = subtotalActual - subtotalProj;

  return (
    <div className="flex flex-col gap-2.5">
      {!hideHeaderAndSubtotal && (
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-black uppercase tracking-[0.16em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {title}
          </span>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-[var(--vfsn-border)]">
        <table className="w-full text-left border-collapse">
          {!hideHeaderAndSubtotal && (
            <thead>
              {/* Column Headers */}
              <tr
                className="border-b border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.14em]"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.35)",
                  color: "var(--nav-text, var(--vfsn-text))",
                }}
              >
                <th className="py-2.5 px-2.5">Slot</th>
                <th className="py-2.5 px-2">Pos</th>
                <th className="py-2.5 px-2">Depth</th>
                <th className="py-2.5 px-2">NFL</th>
                <th className="py-2.5 px-2.5">Player</th>
                <th className="py-2.5 px-2 text-right">Proj</th>
                <th className="py-2.5 px-2 text-right">+/-</th>
                <th className="py-2.5 px-2.5 text-right">Fpts</th>
                <th className="py-2.5 px-2 text-right w-8">
                  <span className="sr-only">Expand</span>
                </th>
              </tr>

              {/* Group Subtotal Row at Top */}
              <tr
                className="border-b border-[var(--vfsn-border)] text-xs"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.28)" }}
              >
                <td colSpan={5} className="py-2 px-2.5" />
                <td className="py-2 px-2 text-right font-bold tabular-nums opacity-85">
                  {subtotalProj.toFixed(2)}
                </td>
                <td className="py-2 px-2 text-right font-bold tabular-nums opacity-85">
                  {formatSignedDiff(subtotalDiff)}
                </td>
                <td
                  className="py-2 px-2.5 text-right font-black tabular-nums"
                  style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                >
                  {subtotalActual.toFixed(2)}
                </td>
                <td className="py-2 px-2" />
              </tr>
            </thead>
          )}

          <tbody className="divide-y divide-[var(--vfsn-border)]">
            {players.length === 0 ? (
              <tr style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
                <td
                  colSpan={9}
                  className="py-5 px-4 text-center text-xs font-semibold opacity-70"
                >
                  No {title.toLowerCase()} recorded for this matchup.
                </td>
              </tr>
            ) : (
              players.map((player, idx) => (
                <BoxScorePlayerRow
                  key={`${player.playerName ?? "p"}-${player.slot ?? "s"}-${idx}`}
                  player={player}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BoxScoreTeamCard({
  standing,
  teamName,
  managerName,
  actualScore,
  projectedScore,
  optimalScore,
  efficiencyPct,
  rosterRows,
}: BoxScoreTeamCardProps) {
  const starters = rosterRows
    .filter((r) => isStarterSlot(r.slot))
    .sort((a, b) => {
      const slotA =
        STARTER_SLOT_ORDER[(a.slot ?? "").toUpperCase()] ?? 99;
      const slotB =
        STARTER_SLOT_ORDER[(b.slot ?? "").toUpperCase()] ?? 99;
      if (slotA !== slotB) return slotA - slotB;
      return (b.actualFpts ?? 0) - (a.actualFpts ?? 0);
    });

  const bench = rosterRows
    .filter((r) => isBenchSlot(r.slot))
    .sort((a, b) => {
      const posA = POSITION_ORDER[(a.position ?? "").toUpperCase()] ?? 99;
      const posB = POSITION_ORDER[(b.position ?? "").toUpperCase()] ?? 99;
      if (posA !== posB) return posA - posB;
      return (b.actualFpts ?? 0) - (a.actualFpts ?? 0);
    });

  const ir = rosterRows
    .filter((r) => isIrSlot(r.slot))
    .sort((a, b) => {
      const posA = POSITION_ORDER[(a.position ?? "").toUpperCase()] ?? 99;
      const posB = POSITION_ORDER[(b.position ?? "").toUpperCase()] ?? 99;
      if (posA !== posB) return posA - posB;
      return (b.actualFpts ?? 0) - (a.actualFpts ?? 0);
    });

  const starterActualSum = starters.reduce(
    (sum, r) => sum + (r.actualFpts ?? 0),
    0
  );
  const starterProjSum = starters.reduce(
    (sum, r) => sum + (r.projFpts ?? 0),
    0
  );

  const resolvedActual = actualScore ?? starterActualSum;
  const resolvedProjected = projectedScore ?? starterProjSum;
  const projDiff = resolvedActual - resolvedProjected;

  const fallbackOpt = computeFallbackOptimalScore(rosterRows);
  const resolvedOptimal =
    optimalScore !== null && optimalScore !== undefined && optimalScore > 0
      ? optimalScore
      : fallbackOpt;

  const resolvedEffRatio =
    efficiencyPct !== null && efficiencyPct !== undefined && efficiencyPct > 0
      ? efficiencyPct > 1.5
        ? efficiencyPct
        : efficiencyPct * 100
      : resolvedOptimal > 0
        ? (resolvedActual / resolvedOptimal) * 100
        : 0;

  return (
    <article
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-6 transition-colors duration-300 min-w-0"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* 3A. Detail Header (4-Column Flex Header inside the 50/50 box) */}
      <header className="w-full flex flex-row items-center justify-between gap-4 pb-5 border-b border-[var(--vfsn-border)]">
        {/* Col 1 (Left): #{Standing} {Team Name} */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {managerName && (
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-70">
              {managerName}
            </span>
          )}
          <h2
            className="text-lg sm:text-xl font-black tracking-tight truncate"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
            title={`${formatStanding(standing)} ${teamName ?? "Team"}`}
          >
            <span
              className="opacity-80 font-extrabold mr-1.5"
              style={{ color: "var(--nav-text, var(--vfsn-text))" }}
            >
              {formatStanding(standing)}
            </span>
            {teamName ?? "Team"}
          </h2>
        </div>

        {/* Col 2: Optimal Score with Efficiency % directly under it (dimmed/smaller text) */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] px-3.5 py-2 flex flex-row items-center gap-3 shrink-0"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] opacity-65">
            Optimal
          </span>
          <div className="flex flex-col items-end justify-center">
            <span className="text-sm font-black tabular-nums leading-tight">
              {resolvedOptimal.toFixed(2)}
            </span>
            <span className="text-[10px] font-bold tabular-nums opacity-60 leading-tight">
              {resolvedEffRatio.toFixed(1)}% EFF
            </span>
          </div>
        </div>

        {/* Col 3: Projected Score with +/- directly under it */}
        <div
          className="rounded-xl border border-[var(--vfsn-border)] px-3.5 py-2 flex flex-row items-center gap-3 shrink-0"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
        >
          <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] opacity-65">
            Projected
          </span>
          <div className="flex flex-col items-end justify-center">
            <span className="text-sm font-black tabular-nums leading-tight">
              {resolvedProjected.toFixed(2)}
            </span>
            <span
              className="text-[10px] font-extrabold tabular-nums leading-tight"
              style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
            >
              {formatSignedDiff(projDiff)}
            </span>
          </div>
        </div>

        {/* Col 4 (Right): Actual total points (large, heavy font) */}
        <div className="flex flex-col items-end justify-center pl-2 shrink-0">
          <span
            className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight leading-none"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {resolvedActual.toFixed(2)}
          </span>
        </div>
      </header>

      {/* 3B. Roster Tables: Starters, Bench, and single-row IR (when populated) */}
      <div className="flex flex-col gap-6">
        <RosterSectionTable title="Starters" players={starters} />
        <RosterSectionTable title="Bench" players={bench} />
        {ir.length > 0 && (
          <RosterSectionTable
            title="IR"
            players={ir}
            hideHeaderAndSubtotal
          />
        )}
      </div>
    </article>
  );
}
