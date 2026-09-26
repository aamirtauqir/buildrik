/**
 * Runs the carousel runtime (`engine/export/sliderRuntime.ts`) against the
 * canvas's own DOM so a Slider block's arrows/dots behave the same in the
 * canvas as on the published page — see that module's header for why this
 * can't share a `<script>` with the published copy.
 *
 * Two canvas-specific deltas from the published behaviour, both intentional:
 * - Autoplay is always off here — a looping timer fighting the editor's own
 *   re-renders while you're trying to work on the page is a bad time.
 *   Arrows/dots still work so the slides stay reachable to click on.
 * - The shown slide index survives a re-render. The canvas replaces the
 *   whole subtree via `dangerouslySetInnerHTML` on every content change (a
 *   slide added, a PLAYBACK setting flipped, an unrelated edit elsewhere on
 *   the page), which would otherwise snap every slider back to slide 1 each
 *   time. Persisted in a ref keyed by the slider's own element id — not
 *   component state, so it survives the DOM being torn down and rebuilt
 *   without triggering an extra render.
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
  const indexByKey = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    ensureStyleTag();
    const cleanup = initSliderRuntime(root, {
      autoplay: false,
      getInitialIndex: (key) => indexByKey.current.get(key),
      onIndexChange: (key, index) => indexByKey.current.set(key, index),
    });
    return cleanup;
    // Re-run whenever the rendered content changes (a slide added/removed,
    // or PLAYBACK/CONTROLS attributes edited) — `content` is the canvas's
    // own HTML string, so it changes exactly when the DOM does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, content]);
}
