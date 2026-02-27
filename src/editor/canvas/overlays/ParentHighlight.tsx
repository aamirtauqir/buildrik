/**
 * Parent Highlight Component
 * Shows a subtle highlight on the parent element when child is selected
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_INDEX } from "../../../shared/constants/canvas";
import { ParentHighlightBox, ParentHighlightBadge } from "../styled";

export interface ParentHighlightProps {
  composer: Composer;
  childElementId: string;
  canvasRef: React.RefObject<HTMLDivElement>;
}

interface ParentRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const ParentHighlight: React.FC<ParentHighlightProps> = ({
  composer,
  childElementId,
  canvasRef,
}) => {
  const [parentRect, setParentRect] = React.useState<ParentRect | null>(null);
  const [parentName, setParentName] = React.useState<string>("");

  // Get parent element and track its position
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const element = composer.elements.getElement(childElementId);
    const parent = element?.getParent();
    if (!parent) {
      setParentRect(null);
      return;
    }

    const parentId = parent.getId?.() || "";
    const parentType = parent.getType?.() || parent.getTagName?.()?.toLowerCase() || "element";
    setParentName(parentType.charAt(0).toUpperCase() + parentType.slice(1));

    const updateRect = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parentEl = canvas.querySelector(`[data-aqb-id="${parentId}"]`) as HTMLElement;
      if (!parentEl) {
        setParentRect(null);
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const elRect = parentEl.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      setParentRect({
        left: elRect.left - canvasRect.left + scrollLeft,
        top: elRect.top - canvasRect.top + scrollTop,
        width: elRect.width,
        height: elRect.height,
      });
    };

    updateRect();

    // Observe for changes
    const observer = new ResizeObserver(updateRect);
    const parentEl = canvasRef.current.querySelector(`[data-aqb-id="${parentId}"]`);
    if (parentEl) observer.observe(parentEl);

    window.addEventListener("scroll", updateRect, { capture: true, passive: true });
    window.addEventListener("resize", updateRect, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateRect, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", updateRect);
    };
  }, [composer, childElementId, canvasRef]);

  if (!parentRect) return null;

  return (
    <ParentHighlightBox
      className="aqb-parent-highlight"
      style={{
        left: parentRect.left - 2,
        top: parentRect.top - 2,
        width: parentRect.width + 4,
        height: parentRect.height + 4,
        zIndex: Z_INDEX.selectionBox - 1,
      }}
    >
      <ParentHighlightBadge>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7-7 7 7" />
        </svg>
        Parent: {parentName}
      </ParentHighlightBadge>
    </ParentHighlightBox>
  );
};

export default ParentHighlight;
