"use client";

import { useCallback } from "react";
import { fetchDivAllPlayGames } from "@/app/vffl/manager-profiles/actions";
import type { DivAllPlayMatchupRow } from "@/app/vffl/manager-profiles/mockData";
import {
  FIXED_TABLE_STYLE,
  HIGHLIGHT,
  TD_CLASS,
  TH_CLASS,
  fmtPts,
  fmtSignedPts,
  type MatrixOpponentGroup,
} from "@/app/vffl/manager-profiles/utils";
import MatrixTableCore from "./MatrixTableCore";
import ProfileTabs from "./ProfileTabs";
import { ResultBadge } from "./ui";

// Week 16 | Manager Score 22 | Opponent Score 22 | Diff 20 | Result 20 = 100
const GAME_COLS = [16, 22, 22, 20, 20];

const resultFromDiff = (diff: number | null): string | null =>
  diff === null ? null : diff > 0 ? "W" : diff < 0 ? "L" : "T";

function AllPlayGamesTable({ games }: { games: DivAllPlayMatchupRow[] }) {
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
          <th className={`${TH_CLASS} text-left`}>Week</th>
          <th className={`${TH_CLASS} text-right`}>Manager Score</th>
          <th className={`${TH_CLASS} text-right`}>Opponent Score</th>
          <th className={`${TH_CLASS} text-right`}>Diff</th>
          <th className={`${TH_CLASS} text-center`}>Result</th>
        </tr>
      </thead>
      <tbody>
        {games.map((g, idx) => {
          const result = resultFromDiff(g.diff);
          return (
            <tr key={`${g.seasonYear}-${g.week}-${idx}`}>
              <td className={`${TD_CLASS} py-2.5 font-bold tabular-nums`}>
                {g.week}
              </td>
              <td
                className={`${TD_CLASS} py-2.5 text-right font-black tabular-nums`}
                style={result === "W" ? { color: HIGHLIGHT } : undefined}
              >
                {fmtPts(g.homeFpts)}
              </td>
              <td
                className={`${TD_CLASS} py-2.5 text-right font-bold tabular-nums opacity-80`}
              >
                {fmtPts(g.awayFpts)}
              </td>
              <td
                className={`${TD_CLASS} py-2.5 text-right font-bold tabular-nums`}
              >
                {fmtSignedPts(g.diff)}
              </td>
              <td className={`${TD_CLASS} py-2.5 text-center`}>
                <ResultBadge result={result} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function AllPlayMatrixTable({
  managerId,
  groups,
}: {
  managerId: number;
  groups: MatrixOpponentGroup[];
}) {
  const loadGames = useCallback(
    (opponentId: number, seasonYear: number) =>
      fetchDivAllPlayGames(managerId, opponentId, seasonYear),
    [managerId]
  );

  return (
    <MatrixTableCore<DivAllPlayMatchupRow>
      eyebrow="Weekly Score-Offs"
      title="Division All-Play Matrix"
      headerRight={<ProfileTabs activeTab="all-play" />}
      groups={groups}
      loadGames={loadGames}
      renderGames={(games) => <AllPlayGamesTable games={games} />}
      loadingLabel="Running the score-offs..."
    />
  );
}
