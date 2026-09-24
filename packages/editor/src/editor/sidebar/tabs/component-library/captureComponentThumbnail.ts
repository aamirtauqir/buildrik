/**
 * captureComponentThumbnail — the master preview on board 4418:142876
 * ("Master preview · Menu card") needs a picture of the master. Components
 * saved with none, so the screen said "No Preview" for every one (G2-122).
 *
 * On create (and on "Update from selection…") the canvas node that became the
 * master is snapshotted with html2canvas — the same library the site
 * thumbnail uses (shell/captureThumbnail.ts) — into a small JPEG data URL and
 * stored on the component. Best-effort: a failed capture leaves the component
 * without a thumbnail and says nothing, as the site capture does.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";

/** Stored width; the preview card is 256 wide, so 2× for a sharp image. */
const THUMB_WIDTH = 512;

export async function captureComponentThumbnail(
  composer: Composer,
  componentId: string,
  elementId: string,
): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    const { default: html2canvas } = await import("html2canvas");
    // Looked up after the import: creating a master re-renders the canvas,
    // and a node read before that is detached by the time it is drawn.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const node = document.querySelector<HTMLElement>(`[data-buildrick-id="${CSS.escape(elementId)}"]`);
    if (!node || !node.offsetWidth || !node.offsetHeight) return;
    const canvas = await html2canvas(node, {
      backgroundColor: "white",
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale: THUMB_WIDTH / node.offsetWidth,
    });
    const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
    await composer.components.updateComponentMetadata(componentId, { thumbnail });
  } catch {
    // Best-effort by design — the preview falls back to its empty state.
  }
}
