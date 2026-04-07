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
  /** Left icon rail width in pixels — 60px (2026-04-07 redesign) */
  RAIL_WIDTH: 60,
  /** Default drawer panel width in pixels (Add, Media) */
  DRAWER_WIDTH: 280,
  /** Narrow drawer width for structure tabs (Layers, Pages, Components) */
  DRAWER_WIDTH_NARROW: 200,
  /** Right inspector panel width in pixels */
  INSPECTOR_WIDTH: 280,
  /** Top header bar height in pixels */
  HEADER_HEIGHT: 52,
} as const;
