/**
 * Runs the accordion runtime (`engine/export/accordionRuntime.ts`) against the
 * canvas's own DOM, so each item shows the Open / Closed the Inspector saved
 * for it (board 13). Mirrors `useSliderRuntime.ts`.
 *
 * Canvas delta, intentional: `interactive: false` — a click on a header
 * selects it, as a click on anything on the canvas does; toggling is the
 * published page's job. Re-runs whenever the canvas HTML changes.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { initAccordionRuntime } from "@/engine/export/accordionRuntime";

export function useAccordionRuntime({
  canvasRef,
  content,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  content: string;
}) {
  React.useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    return initAccordionRuntime(root, { interactive: false });
  }, [canvasRef, content]);
}
