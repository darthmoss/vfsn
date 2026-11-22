const SKELETON_STYLE = {
  backgroundColor: "var(--nav-background, var(--vfsn-surface))",
};

const CARD =
  "rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)]";

export default function ManagerProfilesLoading() {
  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* Header Skeleton */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
          <div className="h-9 w-72 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <span
            className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--nav-highlight, var(--vfsn-accent-1))",
              borderTopColor: "transparent",
            }}
          />
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-80">
            Loading Manager Profile...
          </span>
          <div
            className="h-14 w-[280px] rounded-[12px] border border-[var(--vfsn-border)] animate-pulse"
            style={SKELETON_STYLE}
          />
        </div>
      </header>

      {/* Side-by-Side Hero & Extreme Games Skeleton */}
      <div className="w-full grid grid-cols-2 gap-8 items-stretch">
        <section
          className={`${CARD} w-full flex flex-col gap-4`}
          style={SKELETON_STYLE}
        >
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        </section>

        <section
          className={`${CARD} w-full flex flex-col gap-4`}
          style={SKELETON_STYLE}
        >
          <div className="h-10 w-64 rounded-lg bg-white/5 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />
          ))}
        </section>
      </div>

      {/* Side-by-Side Rivalry Ledger & Luck Card Skeletons */}
      <div className="w-full grid grid-cols-2 gap-8 items-start">
        <section className={`${CARD} w-full flex flex-col gap-3`} style={SKELETON_STYLE}>
          <div className="flex flex-row items-center justify-between gap-6">
            <div className="h-8 w-56 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-10 w-64 rounded-lg bg-white/5 animate-pulse" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />
          ))}
        </section>

        <section className={`${CARD} w-full flex flex-col gap-3`} style={SKELETON_STYLE}>
          <div className="h-8 w-56 rounded-lg bg-white/5 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-white/5 animate-pulse" />
          ))}
        </section>
      </div>
    </div>
  );
}
