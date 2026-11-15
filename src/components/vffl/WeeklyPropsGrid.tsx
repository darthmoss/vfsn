import {
  CANONICAL_PROPS_ORDER,
  type WeeklyPropsRow,
} from "@/app/vffl/weekly-recaps/mockData";

interface WeeklyPropsGridProps {
  propsList: WeeklyPropsRow[];
}

function formatPropValue(
  award: string | null | undefined,
  value: number | null | undefined
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (award === "Armchair Architect") {
    const pct = value <= 1.0001 ? value * 100 : value;
    return `${pct.toFixed(1)}%`;
  }
  if (award === "Overachiever" || award === "Body Bag") {
    return `+${value.toFixed(2)}`;
  }
  return value.toFixed(2);
}

export default function WeeklyPropsGrid({ propsList }: WeeklyPropsGridProps) {
  const orderedProps = [...propsList].sort((a, b) => {
    const idxA = CANONICAL_PROPS_ORDER.indexOf(
      (a.award ?? "") as (typeof CANONICAL_PROPS_ORDER)[number]
    );
    const idxB = CANONICAL_PROPS_ORDER.indexOf(
      (b.award ?? "") as (typeof CANONICAL_PROPS_ORDER)[number]
    );
    const rankA = idxA === -1 ? 99 : idxA;
    const rankB = idxB === -1 ? 99 : idxB;
    return rankA - rankB;
  });

  if (orderedProps.length === 0) {
    return (
      <div
        className="not-prose w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 text-center text-sm font-semibold opacity-70"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        No weekly props recorded for this slate.
      </div>
    );
  }

  return (
    <div className="not-prose w-full grid grid-cols-1 md:grid-cols-3 gap-4">
      {orderedProps.map((prop, idx) => {
        const formattedStat = formatPropValue(prop.award, prop.value);

        return (
          <article
            key={`${prop.award ?? "award"}-${idx}`}
            className="rounded-[12px] border border-[var(--vfsn-border)] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between gap-4 transition-colors duration-300"
            style={{
              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
              color: "var(--nav-text, var(--vfsn-text))",
            }}
          >
            {/* Top Row: Award Title & Definition */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--vfsn-border)]">
              <div className="flex flex-col gap-0.5 min-w-0">
                <h4
                  className="text-sm font-black uppercase tracking-tight truncate m-0"
                  style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                >
                  {prop.award ?? "Weekly Honor"}
                </h4>
                <span className="text-[11px] font-bold opacity-70 leading-snug">
                  {prop.definition ?? "Broadcast Prop Award"}
                </span>
              </div>

              <div className="text-right shrink-0 tabular-nums">
                <div
                  className="text-base font-black tracking-tight leading-none"
                  style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                >
                  {formattedStat}
                </div>
                {prop.supplemental && (
                  <span className="text-[10px] font-bold opacity-65 block mt-1">
                    {prop.supplemental.replace(/\s*PROJ$/i, "")}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Row: Winner Details (Inset Dark Fill) */}
            <div
              className="rounded-lg border border-[var(--vfsn-border)] px-3.5 py-2.5 flex items-center justify-between gap-2"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.22)" }}
            >
              {prop.playerName ? (
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-extrabold truncate"
                    style={{
                      color: "var(--nav-highlight, var(--vfsn-accent-1))",
                    }}
                  >
                    {prop.playerName}
                  </span>
                  <span className="text-[11px] font-bold opacity-80 truncate">
                    {prop.teamName}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-extrabold truncate"
                    style={{
                      color: "var(--nav-highlight, var(--vfsn-accent-1))",
                    }}
                  >
                    {prop.teamName ?? "Unknown Team"}
                  </span>
                </div>
              )}

              {prop.managerName && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--vfsn-border)] opacity-80 shrink-0">
                  {prop.managerName}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
