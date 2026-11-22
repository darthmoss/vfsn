"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { fetchLuckGames } from "@/app/vffl/manager-profiles/actions";
import type {
  ManagerCareerSummaryRow,
  ManagerGameLuckRow,
  ManagerSeasonHistoryRow,
} from "@/app/vffl/manager-profiles/mockData";
import {
  CARD_CLASS,
  CARD_STYLE,
  FIXED_TABLE_STYLE,
  HIGHLIGHT,
  INSET_BG,
  SURFACE,
  TD_CLASS,
  TEXT,
  TH_CLASS,
  dedupeSeasons,
  fmtCount,
  fmtLuck,
  fmtPts,
} from "@/app/vffl/manager-profiles/utils";
import { CardHeader, ExpandButton, InlineLoader } from "./ui";

// Label 12 | Luck 16 | DW 13 | LW 13 | TU 13 | UL 13 | DL 14 | Chevron 6 = 100
const COLS = [12, 16, 13, 13, 13, 13, 14, 6];
const COL_COUNT = COLS.length;
// Year 9 | Week 8 | Opponent Team 27 | PF 14 | PA 14 | Game Luck 12 | Category 16 = 100
const GAME_COLS = [9, 8, 27, 14, 14, 12, 16];

function Colgroup({ cols }: { cols: number[] }) {
  return (
    <colgroup>
      {cols.map((w, i) => (
        <col key={i} style={{ width: `${w}%` }} />
      ))}
    </colgroup>
  );
}

const mix = (pct: number) =>
  `color-mix(in srgb, ${HIGHLIGHT} ${pct}%, transparent)`;

const CATEGORY_STYLES: Record<string, CSSProperties> = {
  "Deserved Win": { backgroundColor: mix(22), borderColor: HIGHLIGHT, color: TEXT },
  "Lucky Win": { backgroundColor: "transparent", borderColor: HIGHLIGHT, borderStyle: "dashed", color: HIGHLIGHT },
  "Toss-Up": { backgroundColor: INSET_BG, borderColor: "var(--vfsn-border)", color: TEXT, opacity: 0.85 },
  "Unlucky Loss": { backgroundColor: "transparent", borderColor: TEXT, borderStyle: "dashed", color: TEXT, opacity: 0.85 },
  "Deserved Loss": { backgroundColor: INSET_BG, borderColor: "var(--vfsn-border)", color: TEXT, opacity: 0.55 },
};

function LuckCategoryPill({ category }: { category: string | null }) {
  if (!category) return <span className="opacity-50">—</span>;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap"
      style={CATEGORY_STYLES[category] ?? CATEGORY_STYLES["Toss-Up"]}
    >
      {category}
    </span>
  );
}

const luckColor = (v: number | null): CSSProperties | undefined =>
  (v ?? 0) > 0 ? { color: HIGHLIGHT } : (v ?? 0) < 0 ? { opacity: 0.75 } : undefined;

interface LuckCounts {
  deservedWins: number | null;
  luckyWins: number | null;
  tossUps: number | null;
  unluckyLosses: number | null;
  deservedLosses: number | null;
}

function CountCells({ r }: { r: LuckCounts }) {
  const cell = `${TD_CLASS} text-center font-bold tabular-nums`;
  return (
    <>
      <td className={cell}>{fmtCount(r.deservedWins)}</td>
      <td className={cell} style={{ color: HIGHLIGHT }}>{fmtCount(r.luckyWins)}</td>
      <td className={cell}>{fmtCount(r.tossUps)}</td>
      <td className={cell}>{fmtCount(r.unluckyLosses)}</td>
      <td className={`${cell} opacity-75`}>{fmtCount(r.deservedLosses)}</td>
    </>
  );
}

const TH_BASE_CLASS =
  "px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] border-b border-[var(--vfsn-border)]";

function HeaderWithTooltip({
  label,
  tooltip,
  alignRight = false,
}: {
  label: string;
  tooltip: string;
  alignRight?: boolean;
}) {
  return (
    <th className={`${TH_BASE_CLASS} text-center`}>
      <div className="inline-flex items-center justify-center gap-1.5">
        <span className="opacity-70">{label}</span>
        <div
          tabIndex={0}
          className="group relative inline-flex items-center justify-center cursor-help focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-full border border-[var(--vfsn-border)] inline-flex items-center justify-center text-[9px] font-black leading-none opacity-65 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
            style={{ backgroundColor: INSET_BG, color: HIGHLIGHT }}
          >
            i
          </span>
          <div
            role="tooltip"
            className={`pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 z-40 absolute top-full mt-2 w-56 p-3 rounded-xl border border-[var(--vfsn-border)] shadow-[0_8px_28px_rgba(0,0,0,0.65)] text-left normal-case tracking-normal ${
              alignRight ? "right-0" : "left-1/2 -translate-x-1/2"
            }`}
            style={{ backgroundColor: SURFACE, color: TEXT }}
          >
            <div
              className="text-[10px] font-black uppercase tracking-[0.14em] pb-1 mb-1 border-b border-[var(--vfsn-border)]"
              style={{ color: HIGHLIGHT }}
            >
              {label}
            </div>
            <p className="text-xs font-semibold leading-snug opacity-90">
              {tooltip}
            </p>
          </div>
        </div>
      </div>
    </th>
  );
}

function LuckGamesTable({ games }: { games: ManagerGameLuckRow[] }) {
  if (games.length === 0) {
    return <p className="text-xs font-bold opacity-60">No games found.</p>;
  }
  return (
    <table style={FIXED_TABLE_STYLE} className="text-[13px]">
      <Colgroup cols={GAME_COLS} />
      <thead>
        <tr>
          <th className={`${TH_CLASS} text-left`}>Year</th>
          <th className={`${TH_CLASS} text-left`}>Week</th>
          <th className={`${TH_CLASS} text-left`}>Opponent Team</th>
          <th className={`${TH_CLASS} text-right`}>Points For</th>
          <th className={`${TH_CLASS} text-right`}>Points Against</th>
          <th className={`${TH_CLASS} text-right`}>Game Luck</th>
          <th className={`${TH_CLASS} text-center`}>Luck Category</th>
        </tr>
      </thead>
      <tbody>
        {games.map((g, idx) => (
          <tr key={`${g.seasonYear}-${g.week}-${g.opponentId ?? idx}-${idx}`}>
            <td className={`${TD_CLASS} py-2.5 font-bold tabular-nums opacity-80`}>{g.seasonYear}</td>
            <td className={`${TD_CLASS} py-2.5 font-bold tabular-nums`}>{g.week}</td>
            <td className={`${TD_CLASS} py-2.5 font-semibold truncate`}>
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
            <td
              className={`${TD_CLASS} py-2.5 text-right font-black tabular-nums`}
              style={luckColor(g.gameLuck)}
            >
              {fmtLuck(g.gameLuck, 3)}
            </td>
            <td className={`${TD_CLASS} py-2.5 text-center`}>
              <LuckCategoryPill category={g.luckCategory} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function LuckBreakdownTable({
  managerId,
  career,
  seasons,
}: {
  managerId: number;
  career: ManagerCareerSummaryRow;
  seasons: ManagerSeasonHistoryRow[];
}) {
  const [careerOpen, setCareerOpen] = useState(true);
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());
  const [cache, setCache] = useState<Record<number, ManagerGameLuckRow[]>>({});
  const [loading, setLoading] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const sortedSeasons = dedupeSeasons(seasons);

  const handleYear = async (year: number) => {
    const willOpen = !openYears.has(year);
    setOpenYears((prev) => {
      const n = new Set(prev);
      if (n.has(year)) n.delete(year);
      else n.add(year);
      return n;
    });
    if (!willOpen || cache[year] || loading.has(year)) return;

    setLoading((prev) => new Set(prev).add(year));
    setFailed((prev) => {
      const n = new Set(prev);
      n.delete(year);
      return n;
    });
    try {
      const games = await fetchLuckGames(managerId, year);
      setCache((prev) => ({ ...prev, [year]: games }));
    } catch (err) {
      console.error("Failed to load luck games:", err);
      setFailed((prev) => new Set(prev).add(year));
    } finally {
      setLoading((prev) => {
        const n = new Set(prev);
        n.delete(year);
        return n;
      });
    }
  };

  return (
    <section className={`${CARD_CLASS} w-full`} style={CARD_STYLE}>
      <CardHeader
        eyebrow="Actual Result vs. Weekly All-Play Expectation"
        title="Luck Breakdown"
      />

      {/* Luck Methodology Callout */}
      <div
        className="mb-4 px-4 py-3 rounded-lg border border-[var(--vfsn-border)] flex flex-row items-start gap-2.5 text-xs"
        style={{ backgroundColor: INSET_BG }}
      >
        <span
          aria-hidden="true"
          className="mt-0.5 w-4 h-4 rounded-full border border-[var(--vfsn-border)] inline-flex items-center justify-center text-[10px] font-black shrink-0"
          style={{ color: HIGHLIGHT }}
        >
          i
        </span>
        <p className="font-semibold leading-relaxed opacity-90">
          <span className="font-black uppercase tracking-[0.1em]" style={{ color: HIGHLIGHT }}>
            What is Luck?{" "}
          </span>
          Luck measures whether your schedule helped or hurt you. Each week compares your actual result (1 for a win, 0.5 for a tie, 0 for a loss) against the share of division teams you outscored. Winning with a low score gives you positive luck; losing with a high score gives you negative luck. Season and Career totals add up those weekly scores.
        </p>
      </div>

      <table style={FIXED_TABLE_STYLE} className="text-sm">
        <Colgroup cols={COLS} />
        <thead>
          <tr>
            <th className={TH_CLASS} aria-label="Span" />
            <th className={`${TH_CLASS} text-center`}>Luck Score</th>
            <HeaderWithTooltip
              label="Deserved Wins"
              tooltip="Won while posting a Top 3 weekly score in your division (#1–#3)."
            />
            <HeaderWithTooltip
              label="Lucky Wins"
              tooltip="Won despite posting a Bottom 3 weekly score in your division (#8–#10)."
            />
            <HeaderWithTooltip
              label="Toss-Ups"
              tooltip="Posted a middle-of-the-pack weekly division score (#4–#7), or finished in a tie."
            />
            <HeaderWithTooltip
              label="Unlucky Losses"
              tooltip="Lost despite posting a Top 3 weekly score in your division (#1–#3)."
              alignRight
            />
            <HeaderWithTooltip
              label="Deserved Losses"
              tooltip="Lost while posting a Bottom 3 weekly score in your division (#8–#10)."
              alignRight
            />
            <th className={TH_CLASS} aria-label="Expand" />
          </tr>
        </thead>
        <tbody>
          {/* Level 1: Career */}
          <tr
            onClick={() => setCareerOpen((p) => !p)}
            className="cursor-pointer transition-colors hover:bg-white/[0.03]"
          >
            <td className={`${TD_CLASS} font-black uppercase tracking-[0.12em]`}>Career</td>
            <td
              className={`${TD_CLASS} text-center text-xl font-black tabular-nums`}
              style={luckColor(career.careerLuckScore)}
            >
              {fmtLuck(career.careerLuckScore)}
            </td>
            <CountCells r={career} />
            <td className={`${TD_CLASS} text-right`}>
              <ExpandButton open={careerOpen} label="Toggle season luck breakdown" />
            </td>
          </tr>

          {/* Level 2: Seasons */}
          {careerOpen && (
            <tr>
              <td colSpan={COL_COUNT} className="p-0 border-b border-[var(--vfsn-border)]">
                <div style={{ backgroundColor: INSET_BG }}>
                  <table style={FIXED_TABLE_STYLE} className="text-sm">
                    <Colgroup cols={COLS} />
                    <tbody>
                      {sortedSeasons.length === 0 && (
                        <tr>
                          <td colSpan={COL_COUNT} className={`${TD_CLASS} pl-10 opacity-60`}>
                            No seasons on record.
                          </td>
                        </tr>
                      )}
                      {sortedSeasons.map((s) => {
                        const year = s.seasonYear;
                        const open = openYears.has(year);
                        return (
                          <Fragment key={year}>
                            <tr
                              onClick={() => handleYear(year)}
                              className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                            >
                              <td className={`${TD_CLASS} pl-10 font-black tabular-nums`}>{year}</td>
                              <td
                                className={`${TD_CLASS} text-center font-black tabular-nums`}
                                style={luckColor(s.seasonLuckScore)}
                              >
                                {fmtLuck(s.seasonLuckScore)}
                              </td>
                              <CountCells r={s} />
                              <td className={`${TD_CLASS} text-right`}>
                                <ExpandButton open={open} label={`Toggle ${year} games`} />
                              </td>
                            </tr>

                            {/* Level 3: Games (lazy) */}
                            {open && (
                              <tr>
                                <td
                                  colSpan={COL_COUNT}
                                  className="px-10 py-4 border-b border-[var(--vfsn-border)]"
                                  style={{ backgroundColor: INSET_BG }}
                                >
                                  {loading.has(year) ? (
                                    <InlineLoader label="Checking the dice..." />
                                  ) : failed.has(year) ? (
                                    <p className="text-xs font-bold opacity-70">
                                      Couldn&apos;t load games. Collapse and retry.
                                    </p>
                                  ) : (
                                    <LuckGamesTable games={cache[year] ?? []} />
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
        </tbody>
      </table>
    </section>
  );
}
