"use client";

import { useMemo, useState } from "react";
import {
  POSITION_GROUPS,
  buildPlayerOptions,
  compareEdge,
  computeOverall,
  computeRadarValues,
  computeStatLine,
  groupRowsByPlayer,
  type PlayerOption,
  type PlayerStatRow,
  type PositionGroup,
} from "@/app/vffl/who-should-i-start/statConfig";
import OverallRadarCard from "./OverallRadarCard";
import PlayerSelectorCard from "./PlayerSelectorCard";
import StatComparisonRow from "./StatComparisonRow";
import { CARD_CLASS, CARD_STYLE, WSIS_BAND, WSIS_GRID, WSIS_MIDDLE, WSIS_SIDE, WSIS_STACK } from "./theme";

interface ComparisonWorkspaceProps {
  group: PositionGroup;
  rows: PlayerStatRow[];
  initialP1: number | null;
  initialP2: number | null;
}

const EMPTY_ROWS: PlayerStatRow[] = [];

/** Shallow URL sync — updates ?p1 / ?p2 without a server round-trip. */
function syncPlayersToUrl(p1: number | null, p2: number | null) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (p1 !== null) params.set("p1", String(p1));
  else params.delete("p1");
  if (p2 !== null) params.set("p2", String(p2));
  else params.delete("p2");
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

export default function ComparisonWorkspace({
  group,
  rows,
  initialP1,
  initialP2,
}: ComparisonWorkspaceProps) {
  const config = POSITION_GROUPS[group];

  const byPlayer = useMemo(() => groupRowsByPlayer(rows), [rows]);
  const options = useMemo(() => buildPlayerOptions(byPlayer), [byPlayer]);
  const teams = useMemo(
    () => Array.from(new Set(options.map((o) => o.nflAbbrev))).sort(),
    [options]
  );

  const [p1, setP1] = useState<number | null>(() => {
    if (initialP1 !== null && byPlayer.has(initialP1)) return initialP1;
    return options[0]?.playerId ?? null;
  });
  const [p2, setP2] = useState<number | null>(() => {
    const first = initialP1 !== null && byPlayer.has(initialP1) ? initialP1 : options[0]?.playerId;
    if (initialP2 !== null && byPlayer.has(initialP2) && initialP2 !== first) return initialP2;
    return options.find((o) => o.playerId !== first)?.playerId ?? null;
  });
  const [team1, setTeam1] = useState<string | null>(null);
  const [team2, setTeam2] = useState<string | null>(null);

  const optionsA = useMemo(
    () => (team1 ? options.filter((o) => o.nflAbbrev === team1) : options),
    [options, team1]
  );
  const optionsB = useMemo(
    () => (team2 ? options.filter((o) => o.nflAbbrev === team2) : options),
    [options, team2]
  );

  const selectA = (id: number) => {
    setP1(id);
    syncPlayersToUrl(id, p2);
  };
  const selectB = (id: number) => {
    setP2(id);
    syncPlayersToUrl(p1, id);
  };

  /** Filter a side to a team; auto-pick that team's top scorer if the current pick no longer fits. */
  const changeTeam = (side: "A" | "B", team: string | null) => {
    const current = side === "A" ? p1 : p2;
    const blocked = side === "A" ? p2 : p1;
    (side === "A" ? setTeam1 : setTeam2)(team);
    if (!team) return;
    const fits = options.some((o) => o.playerId === current && o.nflAbbrev === team);
    if (fits) return;
    const next = options.find((o) => o.nflAbbrev === team && o.playerId !== blocked);
    if (next) (side === "A" ? selectA : selectB)(next.playerId);
  };

  const rowsA = (p1 !== null && byPlayer.get(p1)) || EMPTY_ROWS;
  const rowsB = (p2 !== null && byPlayer.get(p2)) || EMPTY_ROWS;
  const playerA: PlayerOption | null = options.find((o) => o.playerId === p1) ?? null;
  const playerB: PlayerOption | null = options.find((o) => o.playerId === p2) ?? null;

  const statRows = useMemo(
    () =>
      config.rows.map((def) => {
        const lineA = computeStatLine(rowsA, def);
        const lineB = computeStatLine(rowsB, def);
        return { def, lineA, lineB, edge: compareEdge(lineA, lineB) };
      }),
    [config.rows, rowsA, rowsB]
  );

  const overallA = useMemo(() => computeOverall(rowsA), [rowsA]);
  const overallB = useMemo(() => computeOverall(rowsB), [rowsB]);
  const overallEdge = overallA && overallB ? compareEdge(overallA, overallB) : null;
  const radarA = useMemo(() => computeRadarValues(rowsA, config.radar), [rowsA, config.radar]);
  const radarB = useMemo(() => computeRadarValues(rowsB, config.radar), [rowsB, config.radar]);
  const statWinsA = statRows.filter((s) => s.edge === "A").length;
  const statWinsB = statRows.filter((s) => s.edge === "B").length;

  if (options.length === 0) {
    return (
      <div className={CARD_CLASS} style={CARD_STYLE}>
        <p className="text-sm font-bold uppercase tracking-[0.14em] opacity-70">
          No {config.label} stats on the board yet this season.
        </p>
      </div>
    );
  }

  return (
    <div className={WSIS_BAND}>
      {/* Player Selection & Overall Radar (25 / 50 / 25) */}
      <div className={WSIS_GRID}>
        <div className={WSIS_SIDE}>
          <PlayerSelectorCard
            side="A"
            teams={teams}
            team={team1}
            onTeamChange={(t) => changeTeam("A", t)}
            players={optionsA}
            selected={playerA}
            blockedId={p2}
            overall={overallA}
            isLeader={overallEdge === "A"}
            onSelect={selectA}
          />
        </div>
        <div className={WSIS_MIDDLE}>
          <OverallRadarCard
            axes={config.radar}
            valuesA={radarA}
            valuesB={radarB}
            nameA={playerA?.playerName ?? null}
            nameB={playerB?.playerName ?? null}
            overallA={overallA}
            overallB={overallB}
            overallEdge={overallEdge}
            statWinsA={statWinsA}
            statWinsB={statWinsB}
            statCount={statRows.length}
          />
        </div>
        <div className={WSIS_SIDE}>
          <PlayerSelectorCard
            side="B"
            teams={teams}
            team={team2}
            onTeamChange={(t) => changeTeam("B", t)}
            players={optionsB}
            selected={playerB}
            blockedId={p1}
            overall={overallB}
            isLeader={overallEdge === "B"}
            onSelect={selectB}
          />
        </div>
      </div>

      {/* Stat Comparison Rows (stacked 25 / 50 / 25) */}
      <div className={WSIS_STACK}>
        {statRows.map(({ def, lineA, lineB, edge }) => (
          <StatComparisonRow
            key={`stat-row-${group}-${def.key}`}
            def={def}
            rowsA={rowsA}
            rowsB={rowsB}
            lineA={lineA}
            lineB={lineB}
            edge={edge}
            nameA={playerA?.playerName ?? null}
            nameB={playerB?.playerName ?? null}
          />
        ))}
      </div>
    </div>
  );
}
