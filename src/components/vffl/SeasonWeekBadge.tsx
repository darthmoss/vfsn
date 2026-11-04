interface SeasonWeekBadgeProps {
  seasonYear: number;
  week: number;
  label?: string;
  title?: string;
}

export default function SeasonWeekBadge({
  seasonYear,
  week,
  label = "Weekly League Hub",
  title = "VFFL GameDay Central",
}: SeasonWeekBadgeProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="inline-flex items-center gap-3 px-4 py-2 rounded-[12px] border border-[var(--vfsn-border)] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-colors duration-300"
        style={{
          backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          color: "var(--nav-text, var(--vfsn-text))",
        }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
          style={{ backgroundColor: "var(--nav-highlight, var(--vfsn-accent-1))" }}
        />
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-extrabold uppercase tracking-[0.18em]"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            Season {seasonYear}
          </span>
          <span className="opacity-30 font-light">|</span>
          <span
            className="text-sm font-black uppercase tracking-wider"
            style={{ color: "var(--nav-text, var(--vfsn-text))" }}
          >
            Week {week}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex flex-col">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">
          {label}
        </span>
        <h1 className="text-xl font-black tracking-tight uppercase">
          {title}
        </h1>
      </div>
    </div>
  );
}

