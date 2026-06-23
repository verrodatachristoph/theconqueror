import type { CSSProperties } from "react";

/** Recharts tooltip box — theme-aware (was white-on-white in dark mode). */
export const CHART_TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--color-line)",
  backgroundColor: "var(--color-surface)",
  color: "var(--color-ink)",
  fontSize: 12,
};

/** Tooltip label/item text colour. */
export const CHART_TOOLTIP_LABEL: CSSProperties = { color: "var(--color-ink)" };
