/**
 * Runs the carousel runtime (`engine/export/sliderRuntime.ts`) against the
 * canvas's own DOM so a Slider block behaves the same in the canvas as on
 * the published page (autoplay, arrows, dots) — see that module's header for
 * why this can't share a `<script>` with the published copy.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { initSliderRuntime, SLIDER_RUNTIME_CSS } from "@/engine/export/sliderRuntime";

const STYLE_ID = "bk-slider-runtime-css";

function ensureStyleTag() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = SLIDER_RUNTIME_CSS;
  document.head.appendChild(style);
}

export function useSliderRuntime({
  canvasRef,
  content,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  content: string;
}) {
  React.useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    ensureStyleTag();
    const cleanup = initSliderRuntime(root);
    return cleanup;
    // Re-run whenever the rendered content changes (a slide added/removed,
    // or PLAYBACK/CONTROLS attributes edited) — `content` is the canvas's
    // own HTML string, so it changes exactly when the DOM does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, content]);
}
