"use client";

import { Fragment, useState } from "react";
import { fetchH2HGames } from "@/app/vffl/manager-profiles/actions";
import type { ManagerGameLuckRow } from "@/app/vffl/manager-profiles/mockData";
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
  type MatrixOpponentGroup,
} from "@/app/vffl/manager-profiles/utils";
import ProfileTabs from "./ProfileTabs";
import {
  CardHeader,
  EmptyState,
  ExpandButton,
  InlineLoader,
  ResultBadge,
} from "./ui";

// Level 1: Opponent 22 | Record 11 | Win% 9 | PF 13 | PA 13 | Avg PF 13 | Avg PA 13 | Chevron 6 = 100
const COLS = [22, 11, 9, 13, 13, 13, 13, 6];
const COL_COUNT = COLS.length;

// Level 2 (Individual Games): Year 10 | Week 8 | Team 23 | Opponent Team 23 | PF 13 | PA 13 | Result 10 = 100
const GAME_COLS = [10, 8, 23, 23, 13, 13, 10];

function H2HGamesTable({ games }: { games: ManagerGameLuckRow[] }) {
  if (games.length === 0) {
    return <p className="text-xs font-bold opacity-60">No games found.</p>;
  }
  return (
    <table style={FIXED_TABLE_STYLE} className="text-[13px]">
      <colgroup>
        {GAME_COLS.map((w, i) => (
          <col key={i} style={{ width: `${w}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={`${TH_CLASS} text-left`}>Year</th>
          <th className={`${TH_CLASS} text-left`}>Week</th>
          <th className={`${TH_CLASS} text-left`}>Team</th>
          <th className={`${TH_CLASS} text-left`}>Opponent Team</th>
          <th className={`${TH_CLASS} text-right`}>Points For</th>
          <th className={`${TH_CLASS} text-right`}>Points Against</th>
          <th className={`${TH_CLASS} text-center`}>Result</th>
        </tr>
      </thead>
      <tbody>
        {games.map((g, idx) => (
          <tr key={`${g.seasonYear}-${g.week}-${idx}`}>
            <td className={`${TD_CLASS} py-2.5 font-bold tabular-nums opacity-80`}>
              {g.seasonYear}
            </td>
            <td className={`${TD_CLASS} py-2.5 font-bold tabular-nums`}>
              {g.week}
            </td>
            <td className={`${TD_CLASS} py-2.5 font-semibold truncate`}>
              {g.teamName ?? "—"}
            </td>
            <td className={`${TD_CLASS} py-2.5 font-semibold truncate opacity-80`}>
              {g.opponentTeamName ?? "—"}
            </td>
            <td
              className={`${TD_CLASS} py-2.5 text-right font-black tabular-nums`}
              style={g.result === "W" ? { color: HIGHLIGHT } : undefined}
            >
              {fmtPts(g.pointsFor)}
            </td>
            <td className={`${TD_CLASS} py-2.5 text-right font-bold tabular-nums opacity-80`}>
              {fmtPts(g.pointsAgainst)}
            </td>
            <td className={`${TD_CLASS} py-2.5 text-center`}>
              <ResultBadge result={g.result} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function H2HMatrixTable({
  managerId,
  groups,
}: {
  managerId: number;
  groups: MatrixOpponentGroup[];
}) {
  const [openOpps, setOpenOpps] = useState<Set<number>>(new Set());
  const [cache, setCache] = useState<Record<number, ManagerGameLuckRow[]>>({});
  const [loading, setLoading] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const handleOpponent = async (opponentId: number) => {
    const willOpen = !openOpps.has(opponentId);
    setOpenOpps((prev) => {
      const next = new Set(prev);
      if (next.has(opponentId)) next.delete(opponentId);
      else next.add(opponentId);
      return next;
    });
    if (!willOpen || cache[opponentId] || loading.has(opponentId)) return;

    setLoading((prev) => new Set(prev).add(opponentId));
    setFailed((prev) => {
      const next = new Set(prev);
      next.delete(opponentId);
      return next;
    });
    try {
      const games = await fetchH2HGames(managerId, opponentId);
      setCache((prev) => ({ ...prev, [opponentId]: games }));
    } catch (err) {
      console.error("Failed to load H2H games:", err);
      setFailed((prev) => new Set(prev).add(opponentId));
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(opponentId);
        return next;
      });
    }
  };

  return (
    <section className={`${CARD_CLASS} w-full`} style={CARD_STYLE}>
      <CardHeader
        eyebrow="Career Rivalry Ledger"
        title="Head-to-Head Showdowns"
        right={<ProfileTabs activeTab="h2h" />}
      />
      {groups.length === 0 ? (
        <EmptyState message="No opponents on record." />
      ) : (
        <table style={FIXED_TABLE_STYLE} className="text-sm">
          <colgroup>
            {COLS.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
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
              const winning = (g.winPct ?? 0) > 0.5;
              const lead = winning ? { color: HIGHLIGHT } : undefined;
              return (
                <Fragment key={g.opponentId}>
                  <tr
                    onClick={() => handleOpponent(g.opponentId)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  >
                    <td className={TD_CLASS}>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="font-black truncate">
                          {g.opponentName}
                        </span>
                        {!g.opponentActive && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded border border-[var(--vfsn-border)] text-[9px] font-black uppercase tracking-[0.14em] opacity-60">
                            Retired
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className={`${TD_CLASS} text-center font-extrabold tabular-nums`}
                      style={lead}
                    >
                      {g.record ?? "—"}
                    </td>
                    <td
                      className={`${TD_CLASS} text-center font-black tabular-nums`}
                      style={lead}
                    >
                      {fmtWinPct(g.winPct)}
                    </td>
                    <td className={`${TD_CLASS} text-right font-bold tabular-nums`}>
                      {fmtPts(g.pointsFor)}
                    </td>
                    <td
                      className={`${TD_CLASS} text-right font-bold tabular-nums opacity-80`}
                    >
                      {fmtPts(g.pointsAgainst)}
                    </td>
                    <td className={`${TD_CLASS} text-right font-bold tabular-nums`}>
                      {fmtPts(g.avgPointsFor)}
                    </td>
                    <td
                      className={`${TD_CLASS} text-right font-bold tabular-nums opacity-80`}
                    >
                      {fmtPts(g.avgPointsAgainst)}
                    </td>
                    <td className={`${TD_CLASS} text-right`}>
                      <ExpandButton
                        open={oppOpen}
                        label={`Toggle games vs. ${g.opponentName}`}
                      />
                    </td>
                  </tr>

                  {oppOpen && (
                    <tr>
                      <td
                        colSpan={COL_COUNT}
                        className="px-10 py-4 border-b border-[var(--vfsn-border)]"
                        style={{ backgroundColor: INSET_BG }}
                      >
                        {loading.has(g.opponentId) ? (
                          <InlineLoader label="Pulling the tape..." />
                        ) : failed.has(g.opponentId) ? (
                          <p className="text-xs font-bold opacity-70">
                            Couldn&apos;t load games. Collapse and retry.
                          </p>
                        ) : (
                          <H2HGamesTable games={cache[g.opponentId] ?? []} />
                        )}
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
