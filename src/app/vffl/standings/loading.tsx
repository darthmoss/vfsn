export default function StandingsLoading() {
  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* Header Skeleton */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <div
          className="h-12 w-80 rounded-[12px] border border-[var(--vfsn-border)] animate-pulse"
          style={{ backgroundColor: "var(--nav-background, var(--vfsn-surface))" }}
        />
        <div
          className="h-12 w-64 rounded-[12px] border border-[var(--vfsn-border)] animate-pulse"
          style={{ backgroundColor: "var(--nav-background, var(--vfsn-surface))" }}
        />
      </header>

      {/* View Toggle Skeleton */}
      <div className="w-full flex flex-row items-center justify-between gap-6">
        <div
          className="h-12 w-72 rounded-[12px] border border-[var(--vfsn-border)] animate-pulse"
          style={{ backgroundColor: "var(--nav-background, var(--vfsn-surface))" }}
        />
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--nav-highlight, var(--vfsn-accent-1))",
              borderTopColor: "transparent",
            }}
          />
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">
            Loading Standings...
          </span>
        </div>
      </div>

      {/* Standings Card Skeleton */}
      <section
        className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-5"
        style={{ backgroundColor: "var(--nav-background, var(--vfsn-surface))" }}
      >
        <div className="h-10 w-64 rounded-lg bg-white/5 animate-pulse" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="h-12 w-full rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
