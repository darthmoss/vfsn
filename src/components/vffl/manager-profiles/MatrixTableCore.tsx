"use client";

import { Fragment, useState, type ReactNode } from "react";
import {
  CARD_CLASS,
  CARD_STYLE,
  FIXED_TABLE_STYLE,
  HIGHLIGHT,
  INSET_BG,
  TD_CLASS,
  TH_CLASS,
  fmtPts,
  fmtWinPct,
  type MatrixMetrics,
  type MatrixOpponentGroup,
} from "@/app/vffl/manager-profiles/utils";
import { CardHeader, EmptyState, ExpandButton, InlineLoader } from "./ui";

// Name 22 | Record 11 | Win% 9 | PF 13 | PA 13 | Avg PF 13 | Avg PA 13 | Chevron 6 = 100
const COLS = [22, 11, 9, 13, 13, 13, 13, 6];
const COL_COUNT = COLS.length;

function MatrixColgroup() {
  return (
    <colgroup>
      {COLS.map((w, i) => (
        <col key={i} style={{ width: `${w}%` }} />
      ))}
    </colgroup>
  );
}

function MetricCells({ m }: { m: MatrixMetrics }) {
  const winning = (m.winPct ?? 0) > 0.5;
  const lead = winning ? { color: HIGHLIGHT } : undefined;
  return (
    <>
      <td className={`${TD_CLASS} text-center font-extrabold tabular-nums`} style={lead}>
        {m.record ?? "—"}
      </td>
      <td className={`${TD_CLASS} text-center font-black tabular-nums`} style={lead}>
        {fmtWinPct(m.winPct)}
      </td>
      <td className={`${TD_CLASS} text-right font-bold tabular-nums`}>
        {fmtPts(m.pointsFor)}
      </td>
      <td className={`${TD_CLASS} text-right font-bold tabular-nums opacity-80`}>
        {fmtPts(m.pointsAgainst)}
      </td>
      <td className={`${TD_CLASS} text-right font-bold tabular-nums`}>
        {fmtPts(m.avgPointsFor)}
      </td>
      <td className={`${TD_CLASS} text-right font-bold tabular-nums opacity-80`}>
        {fmtPts(m.avgPointsAgainst)}
      </td>
    </>
  );
}

const toggle = <T,>(set: Set<T>, v: T): Set<T> => {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
};

interface MatrixTableCoreProps<G> {
  eyebrow: string;
  title: string;
  headerRight?: ReactNode;
  groups: MatrixOpponentGroup[];
  loadGames: (opponentId: number, seasonYear: number) => Promise<G[]>;
  renderGames: (games: G[]) => ReactNode;
  loadingLabel: string;
}

export default function MatrixTableCore<G>({
  eyebrow,
  title,
  headerRight,
  groups,
  loadGames,
  renderGames,
  loadingLabel,
}: MatrixTableCoreProps<G>) {
  const [openOpps, setOpenOpps] = useState<Set<number>>(new Set());
  const [openYears, setOpenYears] = useState<Set<string>>(new Set());
  const [cache, setCache] = useState<Record<string, G[]>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const handleYear = async (opponentId: number, seasonYear: number) => {
    const key = `${opponentId}:${seasonYear}`;
    const willOpen = !openYears.has(key);
    setOpenYears((prev) => toggle(prev, key));
    if (!willOpen || cache[key] || loading.has(key)) return;

    setLoading((prev) => new Set(prev).add(key));
    setFailed((prev) => {
      const n = new Set(prev);
      n.delete(key);
      return n;
    });
    try {
      const games = await loadGames(opponentId, seasonYear);
      setCache((prev) => ({ ...prev, [key]: games }));
    } catch (err) {
      console.error("Failed to load matchup games:", err);
      setFailed((prev) => new Set(prev).add(key));
    } finally {
      setLoading((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    }
  };

  return (
    <section className={`${CARD_CLASS} w-full`} style={CARD_STYLE}>
      <CardHeader eyebrow={eyebrow} title={title} right={headerRight} />
      {groups.length === 0 ? (
        <EmptyState message="No opponents on record." />
      ) : (
        <table style={FIXED_TABLE_STYLE} className="text-sm">
          <MatrixColgroup />
          <thead>
            <tr>
              <th className={`${TH_CLASS} text-left`}>Opponent Manager</th>
              <th className={`${TH_CLASS} text-center`}>Record</th>
              <th className={`${TH_CLASS} text-center`}>Win %</th>
              <th className={`${TH_CLASS} text-right`}>PF</th>
              <th className={`${TH_CLASS} text-right`}>PA</th>
              <th className={`${TH_CLASS} text-right`}>Avg PF</th>
              <th className={`${TH_CLASS} text-right`}>Avg PA</th>
              <th className={TH_CLASS} aria-label="Expand" />
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const oppOpen = openOpps.has(g.opponentId);
              return (
                <Fragment key={g.opponentId}>
                  {/* Level 1: Career vs. Opponent */}
                  <tr
                    onClick={() => setOpenOpps((prev) => toggle(prev, g.opponentId))}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  >
                    <td className={TD_CLASS}>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="font-black truncate">{g.opponentName}</span>
                        {!g.opponentActive && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded border border-[var(--vfsn-border)] text-[9px] font-black uppercase tracking-[0.14em] opacity-60">
                            Retired
                          </span>
                        )}
                      </span>
                    </td>
                    <MetricCells m={g} />
                    <td className={`${TD_CLASS} text-right`}>
                      <ExpandButton
                        open={oppOpen}
                        label={`Toggle seasons vs. ${g.opponentName}`}
                      />
                    </td>
                  </tr>

                  {/* Level 2: Season Detail */}
                  {oppOpen && (
                    <tr>
                      <td colSpan={COL_COUNT} className="p-0 border-b border-[var(--vfsn-border)]">
                        <div style={{ backgroundColor: INSET_BG }}>
                          <table style={FIXED_TABLE_STYLE} className="text-sm">
                            <MatrixColgroup />
                            <tbody>
                              {g.seasons.length === 0 && (
                                <tr>
                                  <td colSpan={COL_COUNT} className={`${TD_CLASS} pl-10 opacity-60`}>
                                    No season splits on record.
                                  </td>
                                </tr>
                              )}
                              {g.seasons.map((s) => {
                                const key = `${g.opponentId}:${s.seasonYear}`;
                                const yearOpen = openYears.has(key);
                                return (
                                  <Fragment key={key}>
                                    <tr
                                      onClick={() => handleYear(g.opponentId, s.seasonYear)}
                                      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                                    >
                                      <td className={`${TD_CLASS} pl-10 font-black tabular-nums`}>
                                        {s.seasonYear}
                                      </td>
                                      <MetricCells m={s} />
                                      <td className={`${TD_CLASS} text-right`}>
                                        <ExpandButton
                                          open={yearOpen}
                                          label={`Toggle ${s.seasonYear} games`}
                                        />
                                      </td>
                                    </tr>

                                    {/* Level 3: Individual Games (lazy) */}
                                    {yearOpen && (
                                      <tr>
                                        <td
                                          colSpan={COL_COUNT}
                                          className="px-10 py-4 border-b border-[var(--vfsn-border)]"
                                          style={{ backgroundColor: INSET_BG }}
                                        >
                                          {loading.has(key) ? (
                                            <InlineLoader label={loadingLabel} />
                                          ) : failed.has(key) ? (
                                            <p className="text-xs font-bold opacity-70">
                                              Couldn&apos;t load games. Collapse and retry.
                                            </p>
                                          ) : (
                                            renderGames(cache[key] ?? [])
                                          )}
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
