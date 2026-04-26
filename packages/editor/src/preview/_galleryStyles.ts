/**
 * Shared inline styles for vibcoder side-by-side galleries.
 *
 * Galleries are dev-only preview pages and do NOT use Emotion (would pull
 * provider noise into demo bundles). Per CLAUDE.md "no duplicate logic"
 * rule, layout primitives are extracted here once instead of repeating
 * across N gallery files.
 *
 * Override gap or other props at call sites via spread:
 *   `<div style={{ ...flexRow, gap: 8 }}>`
 *
 * @license BSD-3-Clause
 */

export const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

export const flexRow = {
  display: "flex" as const,
  gap: 12,
  alignItems: "center" as const,
  flexWrap: "wrap" as const,
};

export const stack = {
  display: "flex" as const,
  flexDirection: "column" as const,
  gap: 8,
};

export const field = (maxWidth: number) => ({
  display: "block" as const,
  maxWidth,
  marginBottom: 8,
});

export const gridRow = (cols: number, minPx = 120) => ({
  display: "grid" as const,
  gridTemplateColumns: `repeat(${cols}, minmax(${minPx}px, 1fr))`,
  gap: 12,
});
