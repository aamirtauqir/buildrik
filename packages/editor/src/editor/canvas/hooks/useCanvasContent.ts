/**
 * useCanvasContent Hook
 * Generates display content with CMS bindings resolved
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
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
    if (!content) {
      const page = composer?.elements.getActivePage();
      const rootId = page?.root?.id;
      // Minimal root wrapper — React overlay in Canvas.tsx handles the CTA UI
      return `<div data-buildrick-id="${rootId || ""}" class="bd-empty-canvas-root"></div>`;
    }

    // D-7: resolvedContent already IS the innerHTML markup (useCMSPreview
    // either returns content verbatim or re-serializes doc.body.innerHTML
    // after applying bindings) — re-parsing it here was a no-op DOMParser
    // round trip on every render.
    return resolvedContent;
  }, [composer, content, resolvedContent]);

  return { displayContent };
}

export default useCanvasContent;
