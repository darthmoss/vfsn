"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatStat,
  type EdgeResult,
  type PlayerStatRow,
  type StatLine,
  type StatRowDef,
  val,
} from "@/app/vffl/who-should-i-start/statConfig";
import {
  BORDER,
  CARD_CLASS,
  CHART_TICK,
  CHART_TOOLTIP_STYLE,
  INSET_BG,
  SEGMENT_CLASS,
  PLAYER_A_COLOR,
  PLAYER_B_COLOR,
  TEXT,
  WSIS_GRID,
  WSIS_MIDDLE,
  WSIS_SIDE,
  sideColor,
} from "./theme";

interface StatComparisonRowProps {
  def: StatRowDef;
  rowsA: PlayerStatRow[];
  rowsB: PlayerStatRow[];
  lineA: StatLine | null;
  lineB: StatLine | null;
  edge: EdgeResult;
  nameA: string | null;
  nameB: string | null;
}

const DASH = "—";

function StatCard({
  side,
  def,
  line,
  isWinner,
}: {
  side: "A" | "B";
  def: StatRowDef;
  line: StatLine | null;
  isWinner: boolean;
}) {
  const accent = sideColor(side);
  const alignEnd = side === "B";
  const totalLabel = def.mode === "rate" ? "Season" : "Total";
  const metrics = [
    { label: totalLabel, value: line ? formatStat(line.total, def.format) : DASH, primary: true },
    { label: "Total Pts", value: line?.totalPts != null ? formatStat(line.totalPts, "points") : DASH },
    { label: "Avg / G", value: line ? formatStat(line.avg, def.format, { perGame: true }) : DASH },
    { label: "Avg / G Pts", value: line?.avgPts != null ? formatStat(line.avgPts, "points") : DASH },
  ];

  return (
    <div
      className={`${CARD_CLASS} ${SEGMENT_CLASS[side]} h-full flex flex-col gap-4 ${alignEnd ? "lg:items-end lg:text-right" : ""}`}
      style={{ color: TEXT }}
    >
      <div className={`w-full flex items-center justify-between gap-2 ${alignEnd ? "lg:flex-row-reverse" : ""}`}>
        <span className="text-xs font-black uppercase tracking-[0.16em]">{def.label}</span>
        {isWinner && (
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ backgroundColor: accent, color: "var(--vfsn-surface)" }}
          >
            Edge
          </span>
        )}
      </div>

      <dl className="w-full grid grid-cols-2 gap-x-4 gap-y-3">
        {metrics.map((m) => (
          <div key={`${side}-${def.key}-${m.label}`} className="flex flex-col gap-0.5 min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-60">{m.label}</dt>
            <dd
              className={`${m.primary ? "text-2xl" : "text-base"} font-black tabular-nums truncate`}
              style={m.primary ? { color: accent } : undefined}
            >
              {m.value}
            </dd>
          </div>
        ))}
      </dl>

      {line && line.extras.length > 0 && (
        <div
          className={`w-full flex flex-wrap gap-2 ${alignEnd ? "lg:justify-end" : ""}`}
        >
          {line.extras.map((x) => (
            <span
              key={`${side}-${def.key}-extra-${x.label}`}
              className="px-2.5 py-1 rounded-md border border-[var(--vfsn-border)] text-[11px] font-extrabold uppercase tracking-[0.1em] tabular-nums"
              style={{ backgroundColor: INSET_BG }}
            >
              {x.display} <span className="opacity-60">{x.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatComparisonRow({
  def,
  rowsA,
  rowsB,
  lineA,
  lineB,
  edge,
  nameA,
  nameB,
}: StatComparisonRowProps) {
  const labelA = nameA ?? "Player A";
  const labelB = nameB ?? "Player B";

  const weeklyA = new Map(rowsA.map((r) => [r.week ?? 0, val(r, def.value)]));
  const weeklyB = new Map(rowsB.map((r) => [r.week ?? 0, val(r, def.value)]));
  const weeks = Array.from(new Set([...weeklyA.keys(), ...weeklyB.keys()]))
    .filter((w) => w > 0)
    .sort((a, b) => a - b);
  const data = weeks.map((w) => ({
    week: `W${w}`,
    a: weeklyA.get(w) ?? null,
    b: weeklyB.get(w) ?? null,
  }));

  const fmtTick = (v: number) =>
    def.format === "pct" ? `${Math.round(v * 100)}%` : v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const fmtValue = (v: unknown) =>
    typeof v === "number" ? formatStat(v, def.format, { perGame: true }) : DASH;

  const winnerSide = edge === "A" || edge === "B" ? edge : null;
  const winnerName = winnerSide === "A" ? labelA : winnerSide === "B" ? labelB : null;
  const winnerLine = winnerSide === "A" ? lineA : lineB;
  const loserLine = winnerSide === "A" ? lineB : lineA;
  const usesPoints = def.points !== undefined;
  const marginText =
    winnerLine && loserLine
      ? usesPoints && winnerLine.avgPts !== null && loserLine.avgPts !== null
        ? `+${formatStat(winnerLine.avgPts - loserLine.avgPts, "points")} Pts / G`
        : def.mode === "rate"
          ? `${formatStat(winnerLine.total, def.format)} vs ${formatStat(loserLine.total, def.format)}`
          : `${formatStat(winnerLine.avg, def.format, { perGame: true })} vs ${formatStat(loserLine.avg, def.format, { perGame: true })} / G`
      : null;

  return (
    <div className={WSIS_GRID}>
      <div className={WSIS_SIDE}>
        <StatCard side="A" def={def} line={lineA} isWinner={edge === "A"} />
      </div>

      <div className={WSIS_MIDDLE}>
        <div
          className={`${CARD_CLASS} ${SEGMENT_CLASS.MID} h-full flex flex-col gap-4`}
          style={{ color: TEXT }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.14em]">{def.label}</h3>
            {winnerName ? (
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[11px] font-black uppercase tracking-[0.12em] tabular-nums"
                style={{ borderColor: sideColor(winnerSide!), color: sideColor(winnerSide!), backgroundColor: INSET_BG }}
              >
                Edge: {winnerName}
                {marginText && <span className="opacity-80">· {marginText}</span>}
              </span>
            ) : edge === "EVEN" ? (
              <span className="px-3 py-1 rounded-lg border border-[var(--vfsn-border)] text-[11px] font-black uppercase tracking-[0.12em]">
                Dead Even
              </span>
            ) : null}
          </div>

          <div className="w-full h-[200px]">
            {data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs font-bold uppercase tracking-[0.14em] opacity-60">
                No weekly data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 200 }}>
                <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={BORDER} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={CHART_TICK} stroke={BORDER} tickLine={false} />
                  <YAxis tick={CHART_TICK} stroke={BORDER} tickLine={false} tickFormatter={fmtTick} width={48} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelStyle={{ color: TEXT, fontWeight: 900 }}
                    itemStyle={{ color: TEXT }}
                    cursor={{ stroke: BORDER }}
                    formatter={(value) => fmtValue(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="a"
                    name={labelA}
                    stroke={PLAYER_A_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: PLAYER_A_COLOR, stroke: PLAYER_A_COLOR }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="b"
                    name={labelB}
                    stroke={PLAYER_B_COLOR}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: PLAYER_B_COLOR, stroke: PLAYER_B_COLOR }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={WSIS_SIDE}>
        <StatCard side="B" def={def} line={lineB} isWinner={edge === "B"} />
      </div>
    </div>
  );
}
