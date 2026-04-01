/**
 * Layout dimension constants — Single Source of Truth
 * These values mirror CSS variables in editor/rail/LayoutShell.css.
 * When changing dimensions, update BOTH this file AND the CSS variables.
 *
 * CSS vars: --layout-rail-width, --layout-drawer-width, --layout-inspector-width
 *
 * @license BSD-3-Clause
 */
export const LAYOUT = {
  /** Left icon rail width in pixels — PRD §8: 56px */
  RAIL_WIDTH: 56,
  /** Sliding drawer panel width in pixels (normal mode = 280px) — PRD §9.3 */
  DRAWER_WIDTH: 280,
  /** Drawer width presets for size modes */
  DRAWER_WIDTH_COMPACT: 280,
  DRAWER_WIDTH_NORMAL: 320,
  DRAWER_WIDTH_EXTENDED: 400,
  /** Right inspector panel width in pixels — PRD §11: 280px */
  INSPECTOR_WIDTH: 280,
  /** Top header bar height in pixels — PRD §7: 52px */
  HEADER_HEIGHT: 52,
} as const;

/** Drawer width CSS strings keyed by size mode — use in inline styles / CSS var injection */
export const DRAWER_SIZE_WIDTHS: Record<"compact" | "normal" | "extended", string> = {
  compact: `${LAYOUT.DRAWER_WIDTH_COMPACT}px`,
  normal: `${LAYOUT.DRAWER_WIDTH_NORMAL}px`,
  extended: `${LAYOUT.DRAWER_WIDTH_EXTENDED}px`,
};
