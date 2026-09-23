/**
 * Selection Label Component
 * Shows the element name and a "select parent" button at the top-left of the
 * selection. Its ancestor dropdown is gone (G2-026): the path lives in Layers,
 * and ← selects the parent.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_INDEX } from "../../../shared/constants/canvas";
import { canvasTokens } from "../../../styles/tokens";
import { getElementNameFromType, getTypeIcon } from "../utils/elementInfo";
import { Button } from "@/editor/chrome-ui";

export interface SelectionLabelProps {
  composer: Composer;
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelectParent: () => void;
}

interface ElementPosition {
  left: number;
  top: number;
  width: number;
}

/* NOTE: Local getElementName and getTypeIcon functions REMOVED
   Now using shared utilities from ../utils/elementInfo.ts
   This ensures a single source of truth for element naming across the app */

export const SelectionLabel: React.FC<SelectionLabelProps> = ({
  composer,
  elementId,
  canvasRef,
  onSelectParent,
}) => {
  const [position, setPosition] = React.useState<ElementPosition | null>(null);

  // Get element info
  const element = composer.elements.getElement(elementId);
  const elementType = element?.getType?.() || "element";
  const elementTagName = element?.getTagName?.()?.toLowerCase();
  const elementName = getElementNameFromType(elementType, elementTagName);

  // Track element position
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const updatePosition = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const el = canvas.querySelector(`[data-buildrick-id="${elementId}"]`) as HTMLElement;
      if (!el) return;

      const canvasRect = canvas.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      setPosition({
        left: elRect.left - canvasRect.left + scrollLeft,
        top: elRect.top - canvasRect.top + scrollTop,
        width: elRect.width,
      });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    const el = canvasRef.current.querySelector(`[data-buildrick-id="${elementId}"]`);
    if (el) observer.observe(el);

    window.addEventListener("scroll", updatePosition, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [elementId, canvasRef]);

  if (!position || !element) return null;

  // Parent info
  const parent = element.getParent();
  const parentType = parent?.getType?.() || "";
  const parentName = parent
    ? getElementNameFromType(parentType, parent.getTagName?.()?.toLowerCase())
    : null;

  // Position label above element, constrained to canvas
  const labelTop = Math.max(4, position.top - 32);
  const labelLeft = Math.max(4, position.left);

  return (
    <div
     
      style={{
        position: "absolute",
        left: labelLeft,
        top: labelTop,
        zIndex: Z_INDEX.floatingToolbar,
        pointerEvents: "auto",
      }}
    >
      {/* Main label bar */}
      <div style={labelBarStyles}>
        {/* Parent button */}
        {parent && (
          <Button
            onClick={onSelectParent}
            style={parentBtnStyles}
            /* px-0: 24 wide against flowbite's 40 of horizontal padding, which
               clamps the content box to zero and hides the svg below. */
            className="tw:px-0"
            title={`Go to parent: ${parentName} (←)`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </Button>
        )}

        <span style={nameStyles}>
          <span style={{ opacity: 0.7, marginRight: 4 }}>{getTypeIcon(elementType)}</span>
          {elementName}
        </span>
      </div>
    </div>
  );
};

// Styles - using canvasTokens for consistency
const labelBarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  background: canvasTokens.colors.surface.background,
  borderRadius: canvasTokens.radius.md,
  padding: "2px 4px",
  boxShadow: canvasTokens.shadows.panel,
};

const parentBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  background: canvasTokens.colors.primary.alpha20,
  border: "none",
  borderRadius: 4,
  color: canvasTokens.colors.primary.light,
  cursor: "pointer",
  transition: "background 0.15s",
};

const nameStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  color: canvasTokens.colors.text.primary,
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: "nowrap",
};
