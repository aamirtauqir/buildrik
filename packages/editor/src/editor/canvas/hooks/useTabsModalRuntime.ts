/**
 * Runs the Tabs and Modal runtimes (`engine/export/tabsRuntime.ts`,
 * `modalRuntime.ts`) on the canvas's own DOM — the same functions the
 * published page runs (design-2l9 B-21 / B-17).
 *
 * Canvas delta, intentional: `interactive: false` — a click selects. Each
 * Tabs block shows its initial pair and each dialog stays closed, EXCEPT the
 * panel or dialog holding the selection (or the dialog whose trigger is
 * selected), revealed while selected so it can be edited (C18: "Editor reveal
 * … temporary"). Nothing is written to the elements.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { initTabsRuntime } from "@/engine/export/tabsRuntime";
import { initModalRuntime } from "@/engine/export/modalRuntime";

export function useTabsModalRuntime({
  canvasRef,
  content,
  selectedId,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  content: string;
  selectedId: string | null;
}) {
  React.useEffect(() => {
    const root = canvasRef.current;
    if (!root) return;
    const reveal = selectedId ? root.querySelector(`[data-buildrick-id="${CSS.escape(selectedId)}"]`) : null;
    const stopTabs = initTabsRuntime(root, { interactive: false, reveal });
    const stopModal = initModalRuntime(root, { interactive: false, reveal });
    return () => {
      stopTabs();
      stopModal();
    };
  }, [canvasRef, content, selectedId]);
}
