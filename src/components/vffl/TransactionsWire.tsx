import { vfflVwTransactions } from "@/db/schema";
import type { InferSelectModel } from "@/app/vffl/current-week/mockData";

export type TransactionsWireData = InferSelectModel<typeof vfflVwTransactions>;

interface TransactionsWireProps {
  transactions: TransactionsWireData[];
}

function formatPlayerWithPos(
  playerNames: string | null,
  playerPositions: string | null
): string {
  if (!playerNames) return "—";
  const names = playerNames.split(",").map((s) => s.trim());
  const positions = playerPositions
    ? playerPositions.split(",").map((s) => s.trim())
    : [];

  return names
    .map((name, idx) => {
      const pos = positions[idx];
      return pos ? `${name} - ${pos}` : name;
    })
    .join(", ");
}

function AddedArrowIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M7 17L17 7m0 0H8m9 0v9"
      />
    </svg>
  );
}

function DroppedArrowIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        d="M7 7l10 10m0 0V8m0 9H8"
      />
    </svg>
  );
}

export default function TransactionsWire({
  transactions,
}: TransactionsWireProps) {
  const sortedTransactions = [...transactions].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <section
      className="w-full rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col gap-4 transition-colors duration-300"
      style={{
        backgroundColor: "var(--nav-background, var(--vfsn-surface))",
        color: "var(--nav-text, var(--vfsn-text))",
      }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--vfsn-border)]">
        <div>
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.16em] block"
            style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
          >
            League Activity • Most Recent First
          </span>
          <h2 className="text-base font-black uppercase tracking-tight">
            Transactions
          </h2>
        </div>
        <span className="text-xs font-extrabold opacity-75">
          {sortedTransactions.length} Moves
        </span>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-[var(--vfsn-border)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="border-b border-[var(--vfsn-border)] text-[10px] font-extrabold uppercase tracking-[0.14em]"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                color: "var(--nav-text, var(--vfsn-text))",
              }}
            >
              <th className="py-3 px-3">Team Name</th>
              <th className="py-3 px-3">Added</th>
              <th className="py-3 px-3">Dropped</th>
              <th className="py-3 px-3 text-right">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--vfsn-border)] text-xs">
            {sortedTransactions.map((tx, idx) => {
              const addedFormatted = formatPlayerWithPos(
                tx.playersAdded,
                tx.playersAddedPos
              );
              const droppedFormatted = formatPlayerWithPos(
                tx.playersDropped,
                tx.playersDroppedPos
              );

              return (
                <tr
                  key={tx.groupId ?? `tx-${idx}`}
                  className="transition-colors hover:bg-white/[0.04]"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
                >
                  {/* 1. Team Name */}
                  <td className="py-3 px-3 align-top">
                    <div
                      className="font-bold leading-tight"
                      style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                    >
                      {tx.teamName ?? "Unknown Team"}
                    </div>
                    <div className="text-[10px] font-semibold opacity-75">
                      {tx.managerName}
                    </div>
                  </td>

                  {/* 2. Added (Player - POS) */}
                  <td className="py-3 px-3 align-top">
                    <div
                      className="inline-flex items-center gap-1.5 font-bold"
                      style={{ color: "var(--nav-highlight, var(--vfsn-accent-1))" }}
                    >
                      <AddedArrowIcon />
                      <span>{addedFormatted}</span>
                    </div>
                  </td>

                  {/* 3. Dropped (Player - POS) */}
                  <td className="py-3 px-3 align-top">
                    <div
                      className="inline-flex items-center gap-1.5 font-medium opacity-85"
                      style={{ color: "var(--nav-text, var(--vfsn-text))" }}
                    >
                      <DroppedArrowIcon />
                      <span>{droppedFormatted}</span>
                    </div>
                  </td>

                  {/* 4. Transaction Type */}
                  <td className="py-3 px-3 align-top text-right">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border border-[var(--vfsn-border)]"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0.25)",
                        color: "var(--nav-text, var(--vfsn-accent-2))",
                      }}
                    >
                      {tx.transactionType ?? "MOVE"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
