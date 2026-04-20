/**
 * Layout dimension constants — Editor chrome SSOT.
 *
 * Every chrome dimension literal (rail width, sidebar width, panel heights,
 * row heights, etc.) must come from here. Raw `44` / `60` / `240` / `320`
 * literals in layout properties are banned by ESLint rule
 * `no-magic-layout-literals` (scoped to chrome paths, WARN baseline).
 *
 * Values match DESIGN.md §Layout and §Sidebar Panel System. Where DESIGN.md
 * and live CSS drift (see notes inline), DESIGN.md wins — current CSS is the
 * pre-migration state that Week 3 PanelShell will converge.
 *
 * @license BSD-3-Clause
 */

// ============================================================================
// HORIZONTAL — rails and panels
// ============================================================================

/** Left icon rail width. Canonical across DESIGN.md + CSS + prior layout.ts. */
export const RAIL_W = 60;

/** Left sidebar panel width in NAV mode (Layers, Pages, Components, Settings, History). */
export const SIDEBAR_W = 240;

/**
 * Left sidebar panel width in AUTHORING mode (Add, Templates, Media, Build).
 * Drift note: live CSS currently uses 280 via `--layout-drawer-width` fallback
 * in LayoutShell.css:27. DESIGN.md §Layout says 320 for authoring. Week 3
 * PanelShell migration converges to 320.
 */
export const SIDEBAR_WIDE = 320;

/** Right inspector panel width. Matches DESIGN.md §Layout and LayoutShell.css. */
export const INSPECTOR_W = 320;

// ============================================================================
// VERTICAL — bars, headers, footers
// ============================================================================

/**
 * Top bar height. Canonical per DESIGN.md §Layout ("Topbar height: 56px —
 * canonical. All other chrome heights flow from this rhythm.").
 * Drift note: LayoutShell.css:32 currently ships 52px via
 * `--layout-topbar-height` fallback. Week 3 PanelShell converges to 56.
 */
export const TOPBAR_H = 56;

/** Panel header height. Per DESIGN.md §Layout "matches sidebar contract". */
export const HEADER_H = 44;

/** Panel toolbar height. Per DESIGN.md §Sidebar Panel System. */
export const TOOLBAR_H = 36;

/** Panel footer height. Matches DESIGN.md + LayoutShell.css. */
export const FOOTER_H = 40;

// ============================================================================
// ROW DENSITY — sidebar + inspector rows
// ============================================================================

/** Dense list row (layers, typography menus). Per DESIGN.md §Sidebar Panel System. */
export const ROW_SM = 28;

/** Standard list row (default sidebar rows). */
export const ROW_MD = 32;

/** Card-style row (template cards, media thumbnails). */
export const ROW_LG = 48;

// DESIGN.md forbids 40px rows — "never 40" is load-bearing. Any layout
// property rendering a 40px row is a design bug. The gate 14 regex catches
// raw `40` in layout-property context (height/width/padding/margin/etc).

// ============================================================================
// LEGACY OBJECT — kept for backwards compatibility; unused as of 2026-04-20
// ============================================================================

/**
 * Pre-Week-1 object export. No current consumers (grep-verified 2026-04-20).
 * Superseded by the named exports above. Will be removed when code migrates.
 */
export const LAYOUT = {
  RAIL_WIDTH: RAIL_W,
  DRAWER_WIDTH: 280, // legacy value — see SIDEBAR_WIDE drift note
  DRAWER_WIDTH_NARROW: SIDEBAR_W,
  INSPECTOR_WIDTH: INSPECTOR_W,
  HEADER_HEIGHT: 52, // legacy value — see TOPBAR_H drift note
} as const;
