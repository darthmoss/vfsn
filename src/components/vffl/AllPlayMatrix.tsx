"use client";

import { useState } from "react";
import type {
  MatrixManagerMeta,
  MatrixRecordCell,
} from "@/app/vffl/standings/mockData";

interface AllPlayMatrixProps {
  title: string;
  subtitle: string;
  managers: MatrixManagerMeta[];
  recordsMap: Record<string, MatrixRecordCell>;
}

export default function AllPlayMatrix({
  title,
  subtitle,
  managers,
  recordsMap,
}: AllPlayMatrixProps) {
  const [hoverCell, setHoverCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const [hoveredHeader, setHoveredHeader] = useState<{
    type: "row" | "col" | "corner";
    index: number;
    teamName: string;
    managerName: string;
  } | null>(null);

  const activeRowMgr =
    hoverCell !== null ? managers[hoverCell.row] : undefined;
  const activeColMgr =
    hoverCell !== null ? managers[hoverCell.col] : undefined;
  const activePairRecord =
    activeRowMgr && activeColMgr && activeRowMgr.key !== activeColMgr.key
      ? recordsMap[`${activeRowMgr.key}__${activeColMgr.key}`] ?? {
          wins: 0,
          losses: 0,
          ties: 0,
        }
      : null;

  return (
    <section
      aria-label={title}
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-5 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* Matrix Header */}
      <header className="w-full flex flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--vfsn-border)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-70">
            {subtitle}
          </span>
          <h2
            className="text-lg sm:text-xl font-black uppercase tracking-tight"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            {title}
          </h2>
        </div>

        {/* Live Matchup / Tooltip Readout Pill */}
        <div
          className="px-4 py-2 rounded-xl border border-[var(--vfsn-border)] flex items-center gap-3 min-h-[38px]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
        >
          {hoveredHeader ? (
            <div className="flex items-center gap-2 text-xs">
              <span
                className="font-black uppercase tracking-wider"
                style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
              >
                {hoveredHeader.teamName}
              </span>
              <span className="opacity-40">•</span>
              <span className="font-bold opacity-75">
                {hoveredHeader.managerName}
              </span>
            </div>
          ) : activeRowMgr && activeColMgr && activePairRecord ? (
            <div className="flex items-center gap-2.5 text-xs">
              <span
                className="font-black"
                style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
              >
                {activeRowMgr.teamName}
              </span>
              <span className="opacity-50 font-bold uppercase text-[10px]">
                vs
              </span>
              <span className="font-extrabold">{activeColMgr.teamName}</span>
              <span className="opacity-30">|</span>
              <span
                className="font-black tabular-nums"
                style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
              >
                {activePairRecord.wins}-{activePairRecord.losses}-
                {activePairRecord.ties}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">
              Hover initials for Team Name • Hover cells for Crosshair W-L-T
            </span>
          )}
        </div>
      </header>

      {/* Matrix Scrollable Container */}
      <div
        className="w-full overflow-x-auto rounded-xl border border-[var(--vfsn-border)]"
        onMouseLeave={() => {
          setHoverCell(null);
          setHoveredHeader(null);
        }}
      >
        <table className="w-full text-center border-collapse">
          <thead className="relative z-30">
            <tr className="border-b border-[var(--vfsn-border)]">
              {/* Sticky Top-Left Corner Cell */}
              <th
                className="sticky left-0 z-30 py-3 px-3.5 text-left text-[10px] font-black uppercase tracking-[0.16em] border-r border-[var(--vfsn-border)] min-w-[92px]"
                style={{
                  backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                  color: "var(--nav-text, var(--vfsn-text))",
                }}
              >
                <span className="opacity-65">MGR \ OPP</span>
              </th>

              {/* Column Manager Initials */}
              {managers.map((colMgr, colIdx) => {
                const isColHighlighted = hoverCell?.col === colIdx;
                const isTooltipOpen =
                  hoveredHeader?.type === "col" &&
                  hoveredHeader.index === colIdx;

                return (
                  <th
                    key={`col-${colMgr.key}`}
                    onMouseEnter={() =>
                      setHoveredHeader({
                        type: "col",
                        index: colIdx,
                        teamName: colMgr.teamName,
                        managerName: colMgr.managerName,
                      })
                    }
                    onMouseLeave={() => setHoveredHeader(null)}
                    title={colMgr.teamName}
                    className={`relative py-3 px-2.5 text-xs font-black uppercase tracking-wider border-r last:border-r-0 border-[var(--vfsn-border)] min-w-[68px] transition-colors cursor-default select-none ${
                      isTooltipOpen ? "z-40" : "z-20"
                    }`}
                    style={{
                      backgroundColor: isColHighlighted
                        ? "var(--nav-highlight, var(--vfsn-accent-1))"
                        : "rgba(0, 0, 0, 0.4)",
                      color: isColHighlighted
                        ? "var(--nav-background, var(--vfsn-surface))"
                        : "var(--nav-text, var(--vfsn-text))",
                    }}
                  >
                    <span>{colMgr.initials}</span>

                    {/* Custom Tooltip Popover for Column Initials */}
                    {isTooltipOpen && (
                      <div
                        role="tooltip"
                        className="z-40 absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-1.5 rounded-lg border border-[var(--vfsn-border)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] whitespace-nowrap pointer-events-none flex flex-col items-center gap-0.5"
                        style={{
                          backgroundColor:
                            "var(--nav-background, var(--vfsn-surface))",
                          color: "var(--nav-text, var(--vfsn-text))",
                        }}
                      >
                        <span
                          className="text-[11px] font-black tracking-tight"
                          style={{
                            color:
                              "var(--nav-highlight, var(--vfsn-accent-1))",
                          }}
                        >
                          {colMgr.teamName}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                          #{colMgr.standing} • {colMgr.managerName}
                        </span>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--vfsn-border)]">
            {managers.map((rowMgr, rowIdx) => {
              const isRowHeaderHighlighted = hoverCell?.row === rowIdx;
              const isRowTooltipOpen =
                hoveredHeader?.type === "row" && hoveredHeader.index === rowIdx;

              return (
                <tr key={`row-${rowMgr.key}`}>
                  {/* Sticky First Column: Row Manager Initials */}
                  <th
                    scope="row"
                    onMouseEnter={() => {
                      setHoverCell(null);
                      setHoveredHeader({
                        type: "row",
                        index: rowIdx,
                        teamName: rowMgr.teamName,
                        managerName: rowMgr.managerName,
                      });
                    }}
                    onMouseLeave={() => setHoveredHeader(null)}
                    title={rowMgr.teamName}
                    className={`sticky left-0 py-3 px-3.5 text-left text-xs font-black uppercase tracking-wider border-r border-[var(--vfsn-border)] whitespace-nowrap transition-colors cursor-default select-none ${
                      isRowTooltipOpen ? "z-40" : "z-20"
                    }`}
                    style={{
                      backgroundColor: isRowHeaderHighlighted
                        ? "var(--nav-highlight, var(--vfsn-accent-1))"
                        : "var(--nav-background, var(--vfsn-surface))",
                      color: isRowHeaderHighlighted
                        ? "var(--nav-background, var(--vfsn-surface))"
                        : "var(--nav-text, var(--vfsn-text))",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold opacity-60 tabular-nums">
                        #{rowMgr.standing}
                      </span>
                      <span>{rowMgr.initials}</span>
                    </div>

                    {/* Custom Tooltip Popover for Sticky Row Initials */}
                    {isRowTooltipOpen && (
                      <div
                        role="tooltip"
                        className="z-40 absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg border border-[var(--vfsn-border)] shadow-[0_8px_24px_rgba(0,0,0,0.65)] whitespace-nowrap pointer-events-none flex flex-col items-start gap-0.5"
                        style={{
                          backgroundColor:
                            "var(--nav-background, var(--vfsn-surface))",
                          color: "var(--nav-text, var(--vfsn-text))",
                        }}
                      >
                        <span
                          className="text-[11px] font-black tracking-tight"
                          style={{
                            color:
                              "var(--nav-highlight, var(--vfsn-accent-1))",
                          }}
                        >
                          {rowMgr.teamName}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                          #{rowMgr.standing} • {rowMgr.managerName}
                        </span>
                      </div>
                    )}
                  </th>

                  {/* Head-to-Head All-Play Matrix Cells */}
                  {managers.map((colMgr, colIdx) => {
                    const isDiagonal = rowIdx === colIdx;

                    // Crosshair Highlight Logic:
                    // Highlights row cells from left up to intersection (colIdx <= hoverCell.col)
                    // and column cells from top down to intersection (rowIdx <= hoverCell.row)
                    const isIntersection =
                      hoverCell?.row === rowIdx && hoverCell?.col === colIdx;
                    const isRowCrosshairArm =
                      hoverCell !== null &&
                      hoverCell.row === rowIdx &&
                      colIdx < hoverCell.col;
                    const isColCrosshairArm =
                      hoverCell !== null &&
                      hoverCell.col === colIdx &&
                      rowIdx < hoverCell.row;
                    const isInCrosshair =
                      isRowCrosshairArm || isColCrosshairArm;

                    if (isDiagonal) {
                      return (
                        <td
                          key={`cell-${rowMgr.key}-${colMgr.key}`}
                          onMouseEnter={() => {
                            setHoveredHeader(null);
                            setHoverCell({ row: rowIdx, col: colIdx });
                          }}
                          className="py-3 px-2 text-xs font-bold border-r last:border-r-0 border-[var(--vfsn-border)] select-none transition-colors"
                          style={{
                            backgroundColor: isInCrosshair
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.5)",
                            color: "var(--nav-text, var(--vfsn-text))",
                            opacity: 0.35,
                          }}
                        >
                          —
                        </td>
                      );
                    }

                    const rec = recordsMap[`${rowMgr.key}__${colMgr.key}`] ?? {
                      wins: 0,
                      losses: 0,
                      ties: 0,
                    };
                    const isWinningRecord = rec.wins > rec.losses;
                    const isLosingRecord = rec.losses > rec.wins;

                    return (
                      <td
                        key={`cell-${rowMgr.key}-${colMgr.key}`}
                        onMouseEnter={() => {
                          setHoveredHeader(null);
                          setHoverCell({ row: rowIdx, col: colIdx });
                        }}
                        title={`${rowMgr.teamName} vs ${colMgr.teamName}: ${rec.wins}-${rec.losses}-${rec.ties}`}
                        className="py-3 px-2 text-xs tabular-nums border-r last:border-r-0 border-[var(--vfsn-border)] whitespace-nowrap transition-all duration-100 cursor-crosshair select-none"
                        style={{
                          backgroundColor: isIntersection
                            ? "var(--nav-highlight, var(--vfsn-accent-1))"
                            : isInCrosshair
                              ? "rgba(255, 255, 255, 0.12)"
                              : "rgba(0, 0, 0, 0.22)",
                          color: isIntersection
                            ? "var(--nav-background, var(--vfsn-surface))"
                            : isWinningRecord
                              ? "var(--nav-highlight, var(--vfsn-accent-1))"
                              : "var(--nav-text, var(--vfsn-text))",
                          fontWeight:
                            isIntersection || isWinningRecord ? 900 : 700,
                          opacity:
                            !isIntersection &&
                            !isInCrosshair &&
                            isLosingRecord
                              ? 0.72
                              : 1,
                        }}
                      >
                        {rec.wins}-{rec.losses}-{rec.ties}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
