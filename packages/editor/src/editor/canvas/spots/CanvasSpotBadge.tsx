/**
 * Canvas Spot Badge
 * Element badges showing tags, IDs, classes
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import type { ElementBadge } from "../../../shared/types/canvas";
import "./CanvasSpotBadge.css";

export interface CanvasSpotBadgeProps {
  composer: Composer | null;
  elementId: string;
  badge: ElementBadge;
  onRemove?: (elementId: string) => void;
}

export const CanvasSpotBadge: React.FC<CanvasSpotBadgeProps> = ({
  composer,
  elementId,
  badge,
  onRemove,
}) => {
  const [visible] = React.useState(badge.visible);
  const elementRef = React.useRef<HTMLElement | null>(null);
  const badgeRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!composer || !badge.visible) return;

    const element = composer.elements.getElement(elementId);
    if (!element) return;

    // Find DOM element
    const updatePosition = () => {
      const domElement = document.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement;
      if (domElement) {
        elementRef.current = domElement;
        const rect = domElement.getBoundingClientRect();
        const canvasRect = domElement.closest(".aqb-canvas")?.getBoundingClientRect();

        if (canvasRect && badgeRef.current) {
          const badgeWidth = badgeRef.current.offsetWidth || 60;
          const badgeHeight = badgeRef.current.offsetHeight || 24;

          let x = 0;
          let y = 0;

          switch (badge.position) {
            case "top-left":
              x = rect.left - canvasRect.left;
              y = rect.top - canvasRect.top - badgeHeight - 4;
              break;
            case "top-right":
              x = rect.right - canvasRect.left - badgeWidth;
              y = rect.top - canvasRect.top - badgeHeight - 4;
              break;
            case "bottom-left":
              x = rect.left - canvasRect.left;
              y = rect.bottom - canvasRect.top + 4;
              break;
            case "bottom-right":
              x = rect.right - canvasRect.left - badgeWidth;
              y = rect.bottom - canvasRect.top + 4;
              break;
          }

          setPosition({ x, y });
        }
      }
    };

    updatePosition();

    // Update on scroll/resize - passive for scroll performance
    const handleUpdate = () => updatePosition();
    window.addEventListener("scroll", handleUpdate, { capture: true, passive: true });
    window.addEventListener("resize", handleUpdate, { passive: true });

    // Watch for element changes
    const handleElementUpdated = () => {
      updatePosition();
    };
    composer.on(EVENTS.ELEMENT_UPDATED, handleElementUpdated);

    return () => {
      window.removeEventListener("scroll", handleUpdate, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", handleUpdate);
      composer.off(EVENTS.ELEMENT_UPDATED, handleElementUpdated);
    };
  }, [composer, elementId, badge.visible, badge.position]);

  if (!visible) return null;

  const badgeColors: Record<string, string> = {
    tag: "#00d4aa",
    id: "#7c3aed",
    class: "#f59e0b",
    data: "#3b82f6",
    custom: badge.color || "#94a3b8",
  };

  const color = badgeColors[badge.type] || "#94a3b8";

  return (
    <div
      ref={badgeRef}
      className={`aqb-canvas-spot-badge aqb-canvas-spot-badge--${badge.type}`}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: color,
        zIndex: 1001,
      }}
    >
      <span className="aqb-canvas-spot-badge-content">{badge.content}</span>
      {onRemove && (
        <button
          className="aqb-canvas-spot-badge-close"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(elementId);
          }}
          aria-label="Remove badge"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CanvasSpotBadge;
