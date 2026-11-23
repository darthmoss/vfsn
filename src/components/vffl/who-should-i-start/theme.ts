import type { CSSProperties } from "react";

// -----------------------------------------------------------------------------
// Theme Tokens (no hardcoded hex values — charts included)
// -----------------------------------------------------------------------------
export const PLAYER_A_COLOR = "var(--vfsn-accent-1)";
export const PLAYER_B_COLOR = "var(--vfsn-accent-2)";
export const SURFACE = "var(--nav-background, var(--vfsn-surface))";
export const TEXT = "var(--nav-text, var(--vfsn-text))";
export const BORDER = "var(--vfsn-border)";
export const INSET_BG = "rgba(0, 0, 0, 0.2)";

/** Tailwind replica of the VFFL `.config-card` spec. */
export const CARD_CLASS =
  "rounded-[12px] border border-[var(--vfsn-border)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-colors duration-300";
export const CARD_STYLE: CSSProperties = {
  backgroundColor: SURFACE,
  color: TEXT,
};

/**
 * 25 / 50 / 25 desktop split with zero gutters (columns AND rows). Every row
 * fuses into one seamless band on desktop; stacks with spacing below `lg`.
 */
export const WSIS_GRID =
  "grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-6 lg:gap-0 items-stretch";

/** Outer desktop shell that owns the border, radius, shadow and background. */
export const WSIS_BAND =
  "w-full flex flex-col gap-6 lg:gap-0 lg:rounded-[12px] lg:border lg:border-[var(--vfsn-border)] lg:shadow-[0_4px_20px_rgba(0,0,0,0.25)] lg:bg-[var(--nav-background,var(--vfsn-surface))]";

/** Row stacks inside the band. */
export const WSIS_STACK = "w-full flex flex-col gap-6 lg:gap-0";

/**
 * Card overrides inside the band: standalone `.config-card` on mobile,
 * transparent / borderless / square on desktop so the band reads as one surface.
 */
const SEGMENT_CARD =
  "bg-[var(--nav-background,var(--vfsn-surface))] lg:bg-transparent lg:rounded-none lg:border-0 lg:shadow-none";
export const SEGMENT_CLASS = {
  A: SEGMENT_CARD,
  MID: SEGMENT_CARD,
  B: SEGMENT_CARD,
} as const;

/** Side columns. `min-w-0` prevents chart/content blowout. */
export const WSIS_SIDE = "min-w-0 flex flex-col";
/** Middle column renders after both players on mobile. */
export const WSIS_MIDDLE = "min-w-0 flex flex-col order-last lg:order-none";

export const sideColor = (side: "A" | "B") =>
  side === "A" ? PLAYER_A_COLOR : PLAYER_B_COLOR;

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  color: TEXT,
  fontSize: 12,
  fontWeight: 700,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
};
export const CHART_TICK = { fill: "var(--vfsn-text)", fontSize: 11, fontWeight: 700 };
