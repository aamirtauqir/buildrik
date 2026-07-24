/**
 * Best-effort site thumbnail capture.
 *
 * At publish time the editor already exports each page to standalone HTML. We
 * render the home page into a hidden, detached iframe at desktop width, snapshot
 * it with html2canvas, and POST the PNG to the dashboard, which stores it on the
 * site (Site.thumbnail). The sites grid + template detail then show a real
 * preview instead of the generated cover.
 *
 * Everything here is best-effort and MUST NOT disrupt publishing:
 *  - fired fire-and-forget from the publish flow (never awaited),
 *  - the whole body is wrapped so a capture failure is swallowed,
 *  - html2canvas runs with allowTaint:false + useCORS, so a cross-origin image
 *    without CORS headers is simply skipped (the canvas stays untainted and
 *    toBlob won't throw) rather than aborting the shot.
 *
 * If capture fails, the site keeps whatever thumbnail it had (often none), and
 * the dashboard falls back to its deterministic generated cover. No user-facing
 * error, by design.
 *
 * @license BSD-3-Clause
 */

import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

const RENDER_WIDTH = 1280;             // desktop render width
const ASPECT = 10 / 16;                // 16:10 card ratio
const RENDER_HEIGHT = Math.round(RENDER_WIDTH * ASPECT);
const OUTPUT_SCALE = 0.5;              // stored at 640×400 — enough for a card
const SETTLE_MS = 700;                 // let the doc lay out + fonts/images settle

export async function captureAndUploadThumbnail(siteId: string, pageHtml: string): Promise<void> {
  if (typeof document === "undefined" || !siteId || !pageHtml) return;

  let frame: HTMLIFrameElement | null = null;
  try {
    frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = [
      "position:fixed",
      "left:-100000px",
      "top:0",
      `width:${RENDER_WIDTH}px`,
      `height:${RENDER_HEIGHT}px`,
      "border:0",
      "visibility:hidden",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(frame);

    const doc = frame.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(pageHtml);
    doc.close();

    // Give the exported document a chance to lay out and pull in fonts/images.
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

    const target = doc.body;
    if (!target) return;

    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(target, {
      width: RENDER_WIDTH,
      height: RENDER_HEIGHT,
      windowWidth: RENDER_WIDTH,
      windowHeight: RENDER_HEIGHT,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: false,
      scale: OUTPUT_SCALE,
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;

    await fetch(`${DASHBOARD_URL}/api/site-thumbnail/${siteId}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "image/png" },
      body: blob,
    });
  } catch {
    // Swallow — a thumbnail is a nice-to-have, never a publish blocker.
  } finally {
    if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
  }
}
