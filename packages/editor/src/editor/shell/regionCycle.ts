/**
 * regionCycle — F6 / ⇧F6 region navigation (Figma keyboard board 58:2):
 * "cycles between regions, 1 → 7 → back"; conditional regions drop out of the
 * cycle when hidden (page tabs on a one-page site, the drawer when closed).
 *
 * Pure DOM helpers — the shortcut wiring lives in useEditorShortcuts.
 *
 * @license BSD-3-Clause
 */

/** Board order 1→7. Selectors resolve against the live shell. */
export const REGION_SELECTORS: readonly string[] = [
  '[role="banner"]', // 1 topbar
  ".ls-rail", // 2 rail
  ".ls-panel:not(.ls-panel--closed)", // 3 drawer (drops out when closed)
  '[role="tablist"][aria-label="Site pages"]', // 4 page tabs (drops out on 1-page sites)
  "#layout-canvas", // 5 canvas
  ".bdi-panel", // 6 inspector (drops out with no selection)
  '[role="contentinfo"]', // 7 footer
];

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null || el === document.activeElement;
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
export function focusRegion(region: HTMLElement): void {
  const target = region.querySelector<HTMLElement>(FOCUSABLE);
  if (target) {
    target.focus();
    return;
  }
  if (!region.hasAttribute("tabindex")) region.setAttribute("tabindex", "-1");
  region.focus();
}

/** The region that currently contains focus, or null. */
export function activeRegionIndex(regions: HTMLElement[]): number {
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
