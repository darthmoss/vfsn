import type { ReactNode } from "react";
import { HIGHLIGHT, INSET_BG, TEXT } from "@/app/vffl/manager-profiles/utils";

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

/** Far-right expand control. The parent `<tr>` owns the click handler. */
export function ExpandButton({ open, label }: { open: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={label}
      className="inline-flex w-8 h-8 items-center justify-center rounded-lg border border-[var(--vfsn-border)] cursor-pointer transition-colors"
      style={{ backgroundColor: INSET_BG, color: HIGHLIGHT }}
    >
      <ChevronIcon open={open} />
    </button>
  );
}

export function InlineLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0"
        style={{ borderColor: HIGHLIGHT, borderTopColor: "transparent" }}
      />
      <span className="text-[11px] font-black uppercase tracking-[0.16em] opacity-80">
        {label}
      </span>
    </div>
  );
}

export function ResultBadge({ result }: { result: string | null }) {
  const isWin = result === "W";
  return (
    <span
      className="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-md border text-[11px] font-black tracking-wider"
      style={{
        backgroundColor: isWin ? HIGHLIGHT : INSET_BG,
        color: isWin ? "var(--nav-background, var(--vfsn-surface))" : TEXT,
        borderColor: isWin ? HIGHLIGHT : "var(--vfsn-border)",
        opacity: result === "T" ? 0.75 : 1,
      }}
    >
      {result ?? "—"}
    </span>
  );
}

export function CardHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-row items-end justify-between gap-6 pb-4 mb-2 border-b border-[var(--vfsn-border)]">
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-60">
            {eyebrow}
          </span>
        )}
        <h2
          className="text-lg font-black uppercase tracking-tight"
          style={{ color: HIGHLIGHT }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm font-semibold opacity-60">{message}</p>
  );
}
