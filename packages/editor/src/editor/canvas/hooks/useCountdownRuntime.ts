/**
 * Runs the countdown runtime (`engine/export/countdownRuntime.ts`) against the
 * canvas's own DOM, so a Countdown with an end time ticks in the editor as it
 * will on the published page (board 11). Mirrors `useSliderRuntime.ts`.
 *
 * Canvas delta, intentional: "When done → Hide" dims the element instead of
 * removing it (`editor: true`), so a finished countdown stays selectable.
 * Re-runs whenever the canvas HTML changes — the canvas replaces its whole
 * subtree then, so the previous timers are cleared and the new DOM starts
 * fresh from the element's attributes.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { initCountdownRuntime } from "@/engine/export/countdownRuntime";

export function useCountdownRuntime({
  canvasRef,
  content,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  content: string;
}) {
  React.useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    return initCountdownRuntime(root, { editor: true });
  }, [canvasRef, content]);
}
