/**
 * Editor view mode, derived from the URL.
 *
 *   ?view=readonly → a read-only VIEW, the way Figma's is: no rail, no drawer,
 *                    no inspector, no owner controls, and a Composer that runs
 *                    no mutating command. Founder call, 2026-08-23. A workspace
 *                    VIEWER is sent here by the dashboard and keeps the chrome
 *                    board 4418:126059 draws (StudioPanels / StudioHeader).
 *
 * The rail is the one Figma-contract rail. `?rail=e3` (4-tool E3 rail) and
 * `?rail=legacy` (11-tab zone rail) were DEV-ONLY comparison hatches; both
 * were deleted with C5 G1-095 (owner Tier-3, 2026-09-24).
 *
 * On the naming: nothing sets this parameter except the dashboard's viewer
 * redirect and the owner's own site menu. A client is sent /share/<token> or
 * /review/<token> — different pages. So the value is `readonly` and the symbol
 * names the mechanism: `Composer.readOnly` is the actual gate, and the UI calls
 * the experience "view mode" (founder, 2026-08-23).
 *
 * @license BSD-3-Clause
 */

export interface EditorViewMode {
  readOnlyView: boolean;
}

export function getEditorViewMode(): EditorViewMode {
  if (typeof window === "undefined") return { readOnlyView: false };
  return { readOnlyView: new URLSearchParams(window.location.search).get("view") === "readonly" };
}
