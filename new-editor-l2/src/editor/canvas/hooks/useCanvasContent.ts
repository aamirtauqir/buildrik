/**
 * useCanvasContent Hook
 * Generates display content with selection/drop states injected
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { useCMSPreview } from "./useCMSPreview";

interface UseCanvasContentProps {
  composer: Composer | null;
  content: string;
  selectedId: string | null;
  dropTargetId: string | null;
}

interface UseCanvasContentReturn {
  displayContent: string;
}

/**
 * Hook to generate canvas display content with selection states
 */
export function useCanvasContent({
  composer,
  content,
  selectedId,
  dropTargetId,
}: UseCanvasContentProps): UseCanvasContentReturn {
  // First resolve CMS bindings
  const { resolvedContent } = useCMSPreview({ composer, content });

  const displayContent = React.useMemo(() => {
    const page = composer?.elements.getActivePage();
    const rootId = page?.root?.id;

    if (!content) {
      // Minimal root wrapper — React overlay in Canvas.tsx handles the CTA UI
      return `<div data-aqb-id="${rootId || ""}" class="aqb-empty-canvas-root"></div>`;
    }

    // Use resolvedContent (with CMS bindings applied) for DOM manipulation
    const parser = new DOMParser();
    const doc = parser.parseFromString(resolvedContent, "text/html");

    // Clean up any previous selection/drop states
    doc
      .querySelectorAll("[data-selected], [data-aqb-selected], .aqb-selected, [data-drop-target]")
      .forEach((el) => {
        el.removeAttribute("data-selected");
        el.removeAttribute("data-aqb-selected");
        el.removeAttribute("data-drop-target");
        el.classList.remove("aqb-selected");
      });

    // Apply current selection state
    if (selectedId) {
      const selected = doc.querySelector(`[data-aqb-id="${selectedId}"]`);
      if (selected) {
        // Set data-selected to match CSS expectations for X-Ray mode hiding
        selected.setAttribute("data-selected", "true");
        selected.classList.add("aqb-selected");
      }
    }

    // Apply drop target state
    if (dropTargetId) {
      const dropTarget = doc.querySelector(`[data-aqb-id="${dropTargetId}"]`);
      if (dropTarget) {
        dropTarget.setAttribute("data-drop-target", "true");
      }
    }

    return doc.body.innerHTML;
  }, [composer, content, resolvedContent, selectedId, dropTargetId]);

  return { displayContent };
}

export default useCanvasContent;
