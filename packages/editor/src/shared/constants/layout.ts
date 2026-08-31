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
//
// There are no width constants here any more, and that is the point.
//
// `RAIL_W = 60`, `SIDEBAR_WIDE = 320` and `INSPECTOR_W = 300` were each a
// SECOND copy of a number the generated token file already carried
// (`--bk-size-rail` / `--bk-size-drawer` / `--bk-size-inspector`). Two of them
// had no product consumer at all — only `layout.test.ts` asserting their own
// values back at them, which is the same shape as the `SIDEBAR_W = 240` that
// was deleted on 2026-08-03 for that exact reason.
//
// `SIDEBAR_WIDE` was worse than unused: it was the one the shipping drawer
// actually read, via an inline `style={{width}}` in LeftSidebar, so editing
// `figma-tokens.json` and regenerating moved nothing on screen while
// `gate:tokens-generated` guarded the copy nobody rendered. The drawer now
// takes its width from `--bk-size-drawer` in CSS, so the token is load-bearing
// and there is exactly one place to change it.
//
// Layout dimensions belong in the tokens. Read them with `var(--bk-size-*)`.

// ============================================================================
// VERTICAL — bars, headers, footers
// ============================================================================

/**
 * Top bar height. Canonical per DESIGN.md §Layout ("Topbar height: 56px —
 * canonical. All other chrome heights flow from this rhythm.").
 * chrome-ssot Stage 1/3 landed 2026-04-26: LayoutShell.css and
 * design-system/layout.css both ship 56 now. No drift.
 */
export const TOPBAR_H = 56;

/** Panel header height. Per DESIGN.md §Layout "matches sidebar contract". */
export const HEADER_H = 44;

/** Panel toolbar height. Per DESIGN.md §Sidebar Panel System. */
export const TOOLBAR_H = 36;

/** Status-bar footer height. Figma 32-2 footer = 32 (was 40; converged with
 *  LayoutShell.css `--layout-footer-height` = `--buildrick-size-footer`). */
export const FOOTER_H = 32;

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
