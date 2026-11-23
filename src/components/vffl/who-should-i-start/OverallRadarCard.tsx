"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type {
  EdgeResult,
  OverallLine,
  RadarAxisDef,
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
  sideColor,
} from "./theme";

interface OverallRadarCardProps {
  axes: RadarAxisDef[];
  valuesA: number[];
  valuesB: number[];
  nameA: string | null;
  nameB: string | null;
  overallA: OverallLine | null;
  overallB: OverallLine | null;
  overallEdge: EdgeResult;
  statWinsA: number;
  statWinsB: number;
  statCount: number;
}

const pts = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OverallRadarCard({
  axes,
  valuesA,
  valuesB,
  nameA,
  nameB,
  overallA,
  overallB,
  overallEdge,
  statWinsA,
  statWinsB,
  statCount,
}: OverallRadarCardProps) {
  const labelA = nameA ?? "Player A";
  const labelB = nameB ?? "Player B";
  const data = axes.map((a, i) => ({
    axis: a.axis,
    label: a.label,
    a: Number((valuesA[i] ?? 0).toFixed(2)),
    b: Number((valuesB[i] ?? 0).toFixed(2)),
  }));
  const minVal = Math.min(0, ...data.flatMap((d) => [d.a, d.b]));
  const axisLabel = (axis: unknown) =>
    axes.find((a) => a.axis === axis)?.label ?? String(axis);

  const leaderSide = overallEdge === "A" || overallEdge === "B" ? overallEdge : null;
  const leaderName = leaderSide === "A" ? labelA : leaderSide === "B" ? labelB : null;
  const leaderColor = leaderSide ? sideColor(leaderSide) : TEXT;
  const margin =
    overallA && overallB ? Math.abs(overallA.avgFpts - overallB.avgFpts) : null;
  const leaderWins = leaderSide === "A" ? statWinsA : statWinsB;

  return (
    <section
      aria-label="Overall Comparison"
      className={`${CARD_CLASS} ${SEGMENT_CLASS.MID} h-full flex flex-col gap-6`}
      style={{ color: TEXT }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-[0.12em]">
          Tale of the Tape
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
          Fpts / G by Category
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-[120px_1fr_120px] items-center gap-4">
        {/* Player A Stat Edges */}
        <div
          className="order-2 md:order-1 rounded-xl border p-4 flex flex-col items-center text-center gap-1"
          style={{ backgroundColor: INSET_BG, borderColor: BORDER }}
        >
          <span
            className="text-4xl font-black tabular-nums leading-none"
            style={{ color: PLAYER_A_COLOR }}
          >
            {statWinsA}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60">
            of {statCount} Edges
          </span>
        </div>

        {/* Radar Chart */}
        <div className="order-1 md:order-2 col-span-2 md:col-span-1 w-full h-[340px] min-w-0">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 520, height: 340 }}>
            <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid stroke={BORDER} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ ...CHART_TICK, fontSize: 12, fontWeight: 900 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[minVal, "auto"]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name={labelA}
                dataKey="a"
                stroke={PLAYER_A_COLOR}
                fill={PLAYER_A_COLOR}
                fillOpacity={0.3}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
              <Radar
                name={labelB}
                dataKey="b"
                stroke={PLAYER_B_COLOR}
                fill={PLAYER_B_COLOR}
                fillOpacity={0.18}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={{ color: TEXT, fontWeight: 900 }}
                itemStyle={{ color: TEXT }}
                labelFormatter={axisLabel}
                formatter={(value) => (typeof value === "number" ? pts(value) : String(value ?? "—"))}
              />
              <Legend
                wrapperStyle={{ color: TEXT, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Player B Stat Edges */}
        <div
          className="order-3 md:order-3 rounded-xl border p-4 flex flex-col items-center text-center gap-1"
          style={{ backgroundColor: INSET_BG, borderColor: BORDER }}
        >
          <span
            className="text-4xl font-black tabular-nums leading-none"
            style={{ color: PLAYER_B_COLOR }}
          >
            {statWinsB}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60">
            of {statCount} Edges
          </span>
        </div>
      </div>

      {/* Overall Advantage Callout */}
      <div
        className="rounded-xl border p-5 flex flex-col gap-3"
        style={{ backgroundColor: INSET_BG, borderColor: leaderSide ? leaderColor : BORDER }}
      >
        <span className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
          Overall Advantage
        </span>
        {!overallA || !overallB ? (
          <span className="text-sm font-bold uppercase tracking-wider opacity-70">
            Lock in both players to crown a starter.
          </span>
        ) : leaderName ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <span
                className="text-2xl font-black uppercase tracking-tight break-words"
                style={{ color: leaderColor }}
              >
                Start {leaderName}
              </span>
              <span className="text-xl font-black tabular-nums" style={{ color: leaderColor }}>
                +{pts(margin ?? 0)} / G
              </span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-extrabold uppercase tracking-[0.12em] opacity-80 tabular-nums">
              <span>
                <span style={{ color: PLAYER_A_COLOR }}>{labelA}</span> {pts(overallA.avgFpts)} / G
              </span>
              <span>
                <span style={{ color: PLAYER_B_COLOR }}>{labelB}</span> {pts(overallB.avgFpts)} / G
              </span>
              <span>
                Wins {leaderWins} of {statCount} stat battles
              </span>
            </div>
          </>
        ) : (
          <span className="text-2xl font-black uppercase tracking-tight">
            Dead Heat — {pts(overallA.avgFpts)} / G apiece
          </span>
        )}
      </div>
    </section>
  );
}
