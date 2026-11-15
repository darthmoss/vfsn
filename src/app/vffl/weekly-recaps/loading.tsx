export default function WeeklyRecapsLoading() {
  return (
    <div className="w-full max-w-[1800px] mx-auto px-[50px] py-8 flex flex-col gap-10 text-[var(--vfsn-text)]">
      {/* Header Skeleton */}
      <header className="w-full flex flex-row items-center justify-between gap-8 pb-6 border-b border-[var(--vfsn-border)]">
        <div
          className="h-12 w-80 rounded-[12px] border border-[var(--vfsn-border)] animate-pulse"
          style={{
            backgroundColor: "var(--nav-background, var(--vfsn-surface))",
          }}
        />
      </header>

      {/* 2-Column Skeleton */}
      <div className="w-full flex flex-col-reverse lg:flex-row items-start gap-10">
        {/* Left Column (75%) Editorial Skeleton */}
        <div className="w-full lg:flex-[3] min-w-0 flex flex-col gap-6">
          <div className="h-8 w-64 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-28 w-full rounded-lg bg-white/5 animate-pulse" />
          <div className="h-28 w-full rounded-lg bg-white/5 animate-pulse" />
          <hr className="border-[var(--vfsn-border)] my-4" />
          <div className="h-8 w-56 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-44 w-full rounded-lg bg-white/5 animate-pulse" />
          <div className="h-44 w-full rounded-lg bg-white/5 animate-pulse" />
        </div>

        {/* Right Column (25%) Sticky TOC Skeleton */}
        <aside className="w-full lg:flex-[1] min-w-0">
          <div
            className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-4"
            style={{
              backgroundColor: "var(--nav-background, var(--vfsn-surface))",
            }}
          >
            <div className="h-6 w-48 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-white/5 animate-pulse" />
            <div className="h-28 w-full rounded-xl bg-white/5 animate-pulse" />
            <div className="h-28 w-full rounded-xl bg-white/5 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-white/5 animate-pulse" />
          </div>
        </aside>
      </div>
    </div>
  );
}
