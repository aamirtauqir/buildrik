/**
 * The canvas zoom as the DOM sees it.
 *
 * The canvas frame is zoomed with a CSS transform, and the overlays (selection
 * box, hover, label, drop feedback, toolbar) live INSIDE that frame, so their
 * coordinates are in unscaled canvas units while getBoundingClientRect reports
 * screen pixels. Every overlay divided nothing, so at any zoom other than 100%
 * — ⌘1 Fit, the zoom menu, and the fitted page card on load — outlines landed
 * short of and smaller than their elements. Divide screen deltas by this.
 *
 * @license BSD-3-Clause
 */
export function canvasScale(canvas: Element | null | undefined): number {
  if (!canvas) return 1;
  const layoutWidth = (canvas as HTMLElement).offsetWidth;
  const paintedWidth = canvas.getBoundingClientRect().width;
  return layoutWidth > 0 && paintedWidth > 0 ? paintedWidth / layoutWidth : 1;
}
