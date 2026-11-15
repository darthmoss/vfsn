import type { ReactNode } from "react";
import StandingsTable from "@/components/vffl/StandingsTable";
import PowerRankingsTable from "@/components/vffl/PowerRankingsTable";
import WeeklyPropsGrid from "@/components/vffl/WeeklyPropsGrid";
import type {
  DivisionRecapBundle,
  WeeklyRecapRow,
} from "@/app/vffl/weekly-recaps/mockData";

interface WeeklyRecapArticleProps {
  recapRow: WeeklyRecapRow | null;
  divisions: DivisionRecapBundle[];
  seasonYear: number;
  week: number;
}

const LEADING_NON_NAME_WORDS = new Set([
  "Quarterback",
  "Kicker",
  "Defense",
  "Veteran",
  "Rookie",
  "Superstar",
  "Vintage",
  "Leaving",
  "Starting",
  "Benched",
  "Benching",
  "Plugged",
  "Plugging",
  "Adding",
  "Add",
  "Even",
  "While",
  "Behind",
  "Despite",
  "Although",
  "Meanwhile",
  "However",
  "Thankfully",
  "Fortunately",
  "Unfortunately",
  "Conversely",
  "Sadly",
  "Because",
  "When",
  "After",
  "Before",
  "With",
  "Without",
]);

const CITATION_REGEX =
  /\b((?:[A-Z0-9][A-Za-z0-9.'’-]*)(?:\s+(?:[A-Z0-9][A-Za-z0-9.'’-]*|D\/ST|Jr\.|Sr\.|II|III|IV|V)){1,3})\s+\((\d+(?:\.\d{1,2})?)\)/g;

/**
 * Parses a narrative paragraph and converts `Player Name (FPTS)` citations
 * into inline broadcast pills styled with VFSN theme variables.
 */
function renderParagraphWithCitationPills(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CITATION_REGEX.lastIndex = 0;

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const fullMatch = match[0];
    const rawName = match[1];
    const rawScore = match[2];
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart));
    }

    // Strip leading sentence-starter role/verb words if captured at the start of a clause
    const nameTokens = rawName.split(/\s+/);
    const strippedLeadTokens: string[] = [];
    while (
      nameTokens.length > 1 &&
      LEADING_NON_NAME_WORDS.has(nameTokens[0].replace(/[^A-Za-z]/g, ""))
    ) {
      strippedLeadTokens.push(nameTokens.shift()!);
    }

    if (strippedLeadTokens.length > 0) {
      nodes.push(`${strippedLeadTokens.join(" ")} `);
    }

    const cleanPlayerName = nameTokens.join(" ");
    const numericScore = Number.parseFloat(rawScore);
    const isStud = !Number.isNaN(numericScore) && numericScore >= 15;
    const isDud = !Number.isNaN(numericScore) && numericScore < 8;

    nodes.push(
      <span
        key={`cite-${matchStart}-${cleanPlayerName}`}
        className={`not-prose inline-flex items-baseline gap-1.5 px-2 py-0.5 mx-0.5 rounded-md border border-[var(--vfsn-border)] text-[13px] leading-snug align-baseline whitespace-nowrap transition-colors ${
          isDud ? "opacity-75" : ""
        }`}
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
          borderLeft: isStud
            ? "2px solid var(--nav-highlight, var(--vfsn-accent-1))"
            : undefined,
        }}
      >
        <span className="font-bold tracking-tight">{cleanPlayerName}</span>
        <span
          className="font-black tabular-nums text-xs"
          style={{
            color: isStud
              ? "var(--nav-highlight, var(--vfsn-accent-1))"
              : "var(--nav-text, var(--vfsn-text))",
            opacity: isDud ? 0.75 : 1,
          }}
        >
          {rawScore}
        </span>
      </span>
    );

    lastIndex = matchStart + fullMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function normalizeParagraphs(
  input: string[] | string | undefined | null
): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((p) => p.trim()).filter(Boolean);
  }
  return input
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function formatMatchupScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "0.00";
  return score.toFixed(2);
}

export default function WeeklyRecapArticle({
  recapRow,
  divisions,
  seasonYear,
  week,
}: WeeklyRecapArticleProps) {
  if (!recapRow || !recapRow.recapJson) {
    return (
      <div
        className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-center flex flex-col items-center gap-2"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        <span
          className="text-xs font-extrabold uppercase tracking-[0.16em]"
          style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
        >
          Season {seasonYear} • Week {week}
        </span>
        <h2 className="text-lg font-black uppercase tracking-tight">
          Weekly Recap Not Yet Published
        </h2>
        <p className="text-sm font-medium opacity-70 max-w-xl">
          The H2H columnist breakdown for Season {seasonYear}, Week {week} has
          not been generated yet. Select an earlier completed week from the
          dropdown above.
        </p>
      </div>
    );
  }

  const { recapJson } = recapRow;
  const introParagraphs = normalizeParagraphs(recapJson.intro);
  const outroParagraphs = normalizeParagraphs(recapJson.outro);

  return (
    <article className="prose prose-invert max-w-none w-full text-[var(--vfsn-text)]">
      {/* 1. Intro Section */}
      <section id="recap-intro" className="scroll-mt-24 flex flex-col gap-5">
        <header
          className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1 transition-colors duration-300"
          style={{
            backgroundColor: "var(--nav-background, var(--vfsn-surface))",
            color: "var(--nav-text, var(--vfsn-text))",
            borderLeft: "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
          }}
        >
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            Season {seasonYear} • Week {week} Columnist Feature
          </span>
          <h2
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight m-0"
            style={{ color: "var(--nav-text, var(--vfsn-text))" }}
          >
            Opening Monologue
          </h2>
        </header>

        <div className="flex flex-col gap-5 text-[15px] sm:text-base leading-relaxed font-normal opacity-95">
          {introParagraphs.map((paragraph, idx) => (
            <p key={idx} className="m-0">
              {renderParagraphWithCitationPills(paragraph)}
            </p>
          ))}
        </div>
      </section>

      <hr className="border-[var(--vfsn-border)] my-8" />

      {/* 2. Division Sections (Red Division, then Black Division) */}
      {divisions.map((divBundle) => {
        const {
          divisionKey,
          anchorPrefix,
          recapSection,
          weeklyProps,
          standingsRows,
          teamMatchupsMap,
          powerRankingsRows,
        } = divBundle;

        const matchups = recapSection?.matchups ?? [];
        const propsParagraphs = normalizeParagraphs(
          recapSection?.weeklyPropsCommentary
        );
        const standingsParagraphs = normalizeParagraphs(
          recapSection?.standingsCommentary
        );
        const powerParagraphs = normalizeParagraphs(
          recapSection?.powerRankingsCommentary
        );

        return (
          <section
            key={divisionKey}
            id={`${anchorPrefix}-division`}
            className="scroll-mt-24"
          >
            {/* Division Heading */}
            <header
              className="not-prose mb-8 w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1 transition-colors duration-300"
              style={{
                backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                color: "var(--nav-text, var(--vfsn-text))",
                borderLeft:
                  "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
              }}
            >
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
              >
                Division Breakdown • Week {week}
              </span>
              <h2
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight m-0"
                style={{ color: "var(--nav-text, var(--vfsn-text))" }}
              >
                {divisionKey}
              </h2>
            </header>

            {/* 2A. Matchups / Box Scores Subsection */}
            <div id={`${anchorPrefix}-box-scores`} className="scroll-mt-24">
              <div className="flex flex-col gap-10">
                {matchups.map((m, mIdx) => {
                  const winnerMgr = m.winningManager ?? m.winningMgr;
                  const loserMgr = m.losingManager ?? m.losingMgr;
                  const matchupAnchorId = `${anchorPrefix}-matchup-${
                    m.matchupRank ?? mIdx + 1
                  }`;

                  return (
                    <div
                      key={m.matchupId ?? mIdx}
                      id={matchupAnchorId}
                      className="scroll-mt-24 flex flex-col gap-5"
                    >
                      {/* Matchup Sub-Heading: Themed Container with matchup_title, Winning Team & Score, Losing Team & Score */}
                      <div
                        className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1.5 transition-colors duration-300"
                        style={{
                          backgroundColor:
                            "var(--nav-background, var(--vfsn-surface))",
                          color: "var(--nav-text, var(--vfsn-text))",
                          borderLeft:
                            "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
                        }}
                      >
                        {m.matchupTitle && (
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                            style={{
                              color:
                                "var(--nav-highlight, var(--vfsn-accent-1))",
                            }}
                          >
                            {m.matchupTitle}
                          </span>
                        )}

                        <h3 className="text-lg sm:text-xl font-black tracking-tight m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                          <span
                            style={{
                              color:
                                "var(--nav-highlight, var(--vfsn-accent-1))",
                            }}
                          >
                            {m.winningTeam}{" "}
                            <span className="tabular-nums">
                              ({formatMatchupScore(m.winningScore)})
                            </span>
                          </span>
                          {winnerMgr && (
                            <span className="text-xs font-bold uppercase tracking-wider opacity-65">
                              {winnerMgr}
                            </span>
                          )}
                          <span className="text-xs font-extrabold uppercase tracking-widest opacity-55">
                            def.
                          </span>
                          <span
                            style={{
                              color: "var(--nav-text, var(--vfsn-text))",
                            }}
                            className="opacity-90"
                          >
                            {m.losingTeam}{" "}
                            <span className="tabular-nums">
                              ({formatMatchupScore(m.losingScore)})
                            </span>
                          </span>
                          {loserMgr && (
                            <span className="text-xs font-bold uppercase tracking-wider opacity-65">
                              {loserMgr}
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* 3-Paragraph Matchup Narrative (Unboxed Editorial Flow with Inline Starter Citation Pills) */}
                      <div className="flex flex-col gap-4 text-[15px] sm:text-base leading-relaxed font-normal opacity-95">
                        {m.introParagraph && (
                          <p className="m-0">{m.introParagraph}</p>
                        )}
                        {m.winnerParagraph && (
                          <p className="m-0">
                            {renderParagraphWithCitationPills(m.winnerParagraph)}
                          </p>
                        )}
                        {m.loserParagraph && (
                          <p className="m-0">
                            {renderParagraphWithCitationPills(m.loserParagraph)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-[var(--vfsn-border)] my-8" />

            {/* 2B. Weekly Props Subsection */}
            <div
              id={`${anchorPrefix}-weekly-props`}
              className="scroll-mt-24 flex flex-col gap-6"
            >
              <div
                className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1 transition-colors duration-300"
                style={{
                  backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                  color: "var(--nav-text, var(--vfsn-text))",
                  borderLeft:
                    "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
                }}
              >
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    color: "var(--nav-highlight, var(--vfsn-accent-1))",
                  }}
                >
                  {divisionKey} • Trophy Case
                </span>
                <h3
                  className="text-xl sm:text-2xl font-black uppercase tracking-tight m-0"
                  style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                >
                  Weekly Props
                </h3>
              </div>

              <div className="flex flex-col gap-4 text-[15px] sm:text-base leading-relaxed font-normal opacity-95">
                {propsParagraphs.map((p, idx) => (
                  <p key={idx} className="m-0">
                    {p}
                  </p>
                ))}
              </div>

              <WeeklyPropsGrid propsList={weeklyProps} />
            </div>

            <hr className="border-[var(--vfsn-border)] my-8" />

            {/* 2C. Standings Subsection */}
            <div
              id={`${anchorPrefix}-standings`}
              className="scroll-mt-24 flex flex-col gap-6"
            >
              <div
                className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1 transition-colors duration-300"
                style={{
                  backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                  color: "var(--nav-text, var(--vfsn-text))",
                  borderLeft:
                    "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
                }}
              >
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    color: "var(--nav-highlight, var(--vfsn-accent-1))",
                  }}
                >
                  {divisionKey} • Playoff Race
                </span>
                <h3
                  className="text-xl sm:text-2xl font-black uppercase tracking-tight m-0"
                  style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                >
                  Standings
                </h3>
              </div>

              <div className="flex flex-col gap-4 text-[15px] sm:text-base leading-relaxed font-normal opacity-95">
                {standingsParagraphs.map((p, idx) => (
                  <p key={idx} className="m-0">
                    {p}
                  </p>
                ))}
              </div>

              <div className="not-prose w-full">
                <StandingsTable
                  rows={standingsRows}
                  viewMode="H2H"
                  teamMatchupsMap={teamMatchupsMap}
                  seasonYear={seasonYear}
                  week={week}
                />
              </div>
            </div>

            <hr className="border-[var(--vfsn-border)] my-8" />

            {/* 2D. Power Rankings Subsection */}
            <div
              id={`${anchorPrefix}-power-rankings`}
              className="scroll-mt-24 flex flex-col gap-6"
            >
              <div
                className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1 transition-colors duration-300"
                style={{
                  backgroundColor: "var(--nav-background, var(--vfsn-surface))",
                  color: "var(--nav-text, var(--vfsn-text))",
                  borderLeft:
                    "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
                }}
              >
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
                  style={{
                    color: "var(--nav-highlight, var(--vfsn-accent-1))",
                  }}
                >
                  {divisionKey} • Z-Score Analytics
                </span>
                <h3
                  className="text-xl sm:text-2xl font-black uppercase tracking-tight m-0"
                  style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                >
                  Power Rankings
                </h3>
              </div>

              <div className="flex flex-col gap-4 text-[15px] sm:text-base leading-relaxed font-normal opacity-95">
                {powerParagraphs.map((p, idx) => (
                  <p key={idx} className="m-0">
                    {p}
                  </p>
                ))}
              </div>

              <div className="not-prose w-full">
                <PowerRankingsTable
                  rows={powerRankingsRows}
                  scope="div"
                  time="std"
                  seasonYear={seasonYear}
                  week={week}
                  division={divisionKey}
                />
              </div>
            </div>

            <hr className="border-[var(--vfsn-border)] my-8" />
          </section>
        );
      })}

      {/* 3. Outro Section */}
      <section id="recap-outro" className="scroll-mt-24 flex flex-col gap-5">
        <header
          className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-1 transition-colors duration-300"
          style={{
            backgroundColor: "var(--nav-background, var(--vfsn-surface))",
            color: "var(--nav-text, var(--vfsn-text))",
            borderLeft: "4px solid var(--nav-highlight, var(--vfsn-accent-1))",
          }}
        >
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            Sign-Off • Onward to Week {week + 1}
          </span>
          <h2
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight m-0"
            style={{ color: "var(--nav-text, var(--vfsn-text))" }}
          >
            The Final Word
          </h2>
        </header>

        <div className="flex flex-col gap-5 text-[15px] sm:text-base leading-relaxed font-normal opacity-95">
          {outroParagraphs.map((paragraph, idx) => (
            <p key={idx} className="m-0">
              {renderParagraphWithCitationPills(paragraph)}
            </p>
          ))}
        </div>
      </section>
    </article>
  );
}
