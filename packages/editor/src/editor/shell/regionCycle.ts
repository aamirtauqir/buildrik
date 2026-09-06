/**
 * regionCycle — F6 / ⇧F6 region navigation (Figma keyboard board 58:2):
 * "cycles between regions, 1 → 7 → back"; conditional regions drop out of the
 * cycle when hidden (page tabs on a one-page site, the drawer when closed).
 *
 * Pure DOM helpers — the shortcut wiring lives in useEditorShortcuts.
 *
 * @license BSD-3-Clause
 */

/** Board order 1→7, plus the fullpage view that replaces canvas+inspector.
 *  Selectors resolve against the live shell; `visibleRegions` drops whichever
 *  are hidden, so a given mode only ever yields the regions actually on screen. */
const REGION_SELECTORS: readonly string[] = [
  '[role="banner"]', // 1 topbar
  ".ls-rail", // 2 rail
  ".ls-panel:not(.ls-panel--closed)", // 3 drawer (drops out when closed)
  '[role="tablist"][aria-label="Site pages"]', // 4 page tabs (drops out on 1-page sites)
  "#layout-canvas", // 5 canvas (drops out in fullpage mode)
  ".layout-shell__fullpage", // 5b fullpage view — replaces canvas+inspector
  ".bdi-panel", // 6 inspector (drops out with no selection)
  '[role="contentinfo"]', // 7 footer
];

function isVisible(el: HTMLElement): boolean {
  if (el === document.activeElement) return true;
  const style = getComputedStyle(el);
  /* `offsetParent === null` is true for display:none, position:fixed and
     detached nodes — and NOTHING else. Fullpage mode hides the drawer, canvas
     and inspector with `visibility:hidden; position:absolute; width:0; height:0`
     (LayoutShell.css:310-320), all of which keep offsetParent non-null, so F6
     cycled through three regions the user cannot see and never reached the
     fullpage view that replaced them. The closed inspector hides the same way
     (opacity:0 in a 0px column) and caught focus for the same reason.

     Read the zero size from computed style rather than getBoundingClientRect():
     jsdom does no layout and returns an all-zero rect for every element, so a
     rect test drops every region in tests while passing in a browser. */
  if (el.offsetParent === null && style.position !== "fixed") return false;
  if (style.visibility === "hidden" || style.visibility === "collapse") return false;
  /* Guard the empty string: an unset opacity comes back as "" from jsdom's
     getComputedStyle, and Number("") is 0 — which read every region as fully
     transparent and dropped all seven. */
  if (style.opacity !== "" && Number(style.opacity) === 0) return false;
  if (style.width === "0px" && style.height === "0px") return false;
  return true;
}


/** The visible regions, in board order. */
export function visibleRegions(root: ParentNode = document): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const sel of REGION_SELECTORS) {
    const el = root.querySelector<HTMLElement>(sel);
    if (el && isVisible(el)) out.push(el);
  }
  return out;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Focus a region: its first focusable child, or the region itself. */
function focusRegion(region: HTMLElement): void {
  const target = region.querySelector<HTMLElement>(FOCUSABLE);
  if (target) {
    target.focus();
    return;
  }
  if (!region.hasAttribute("tabindex")) region.setAttribute("tabindex", "-1");
  region.focus();
}

/** The region that currently contains focus, or null. */
function activeRegionIndex(regions: HTMLElement[]): number {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return -1;
  return regions.findIndex((r) => r === active || r.contains(active));
}

/** Move focus to the next/previous visible region (wraps). Returns the region
 *  focused, or null when the shell has no regions. */
export function cycleRegion(direction: 1 | -1, root: ParentNode = document): HTMLElement | null {
  const regions = visibleRegions(root);
  if (regions.length === 0) return null;
  const current = activeRegionIndex(regions);
  const next =
    current === -1
      ? direction === 1
        ? 0
        : regions.length - 1
      : (current + direction + regions.length) % regions.length;
  const region = regions[next];
  focusRegion(region);
  return region;
}
