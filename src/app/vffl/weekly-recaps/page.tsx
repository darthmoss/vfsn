export default function WeeklyRecapsPage() {
  return (
    <div className="bg-[var(--vfsn-surface)] border border-[var(--vfsn-border)] rounded-xl overflow-hidden">
      
      {/* Replicated .team-card-header */}
      <div className="px-5 py-4 bg-white/[0.03] border-b border-[var(--vfsn-border)] flex justify-between items-center">
        <h1 className="text-[1.1rem] font-bold text-[var(--vfsn-text)] m-0 flex-1">
          Current Week: Weekly Recaps
        </h1>
        {/* Placeholder for future action buttons, like your CSV Export */}
      </div>

      {/* Main Content Area */}
      <div className="p-5">
        <p className="text-sm font-medium opacity-60">
          Data integration and tables are currently under construction.
        </p>
      </div>

    </div>
  );
}