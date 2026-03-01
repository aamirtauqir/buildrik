/**
 * useCanvasContent Hook
 * Generates display content with CMS bindings resolved
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { useCMSPreview } from "./useCMSPreview";

interface UseCanvasContentProps {
  composer: Composer | null;
  content: string;
  // selectedId and dropTargetId removed — overlay layer handles these visually
}

interface UseCanvasContentReturn {
  displayContent: string;
}

/**
 * Hook to generate canvas display content with CMS bindings resolved.
 * Selection and drop-target highlighting are handled by the overlay layer.
 */
export function useCanvasContent({
  composer,
  content,
}: UseCanvasContentProps): UseCanvasContentReturn {
  // First resolve CMS bindings
  const { resolvedContent } = useCMSPreview({ composer, content });

  const displayContent = React.useMemo(() => {
    // SSR guard — editor is browser-only; raw content is acceptable fallback
    if (typeof DOMParser === "undefined") return content;

    const page = composer?.elements.getActivePage();
    const rootId = page?.root?.id;

    if (!content) {
      // Minimal root wrapper — React overlay in Canvas.tsx handles the CTA UI
      return `<div data-aqb-id="${rootId || ""}" class="aqb-empty-canvas-root"></div>`;
    }

    // Use resolvedContent (with CMS bindings applied) for DOM manipulation
    const parser = new DOMParser();
    const doc = parser.parseFromString(resolvedContent, "text/html");

    return doc.body.innerHTML;
  }, [composer, content, resolvedContent]);

  return { displayContent };
}

export default useCanvasContent;
