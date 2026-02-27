/**
 * Aquibra Tooltip Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  /** Keyboard shortcut hint (e.g., "⌘Z" or "⌘⇧Z") */
  shortcut?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 500,
  shortcut,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = React.useId();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords(calculatePosition(rect, position));
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Handle ESC key to dismiss tooltip (WCAG 2.1.1)
  React.useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideTooltip();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-describedby={isVisible ? tooltipId : undefined}
        style={{ display: "inline-flex" }}
      >
        {children}
      </div>
      {isVisible && (
        <div
          role="tooltip"
          id={tooltipId}
          className="aqb-tooltip"
          style={{
            position: "fixed",
            left: coords.x,
            top: coords.y,
            transform: getTransform(position),
            background: "var(--aqb-bg-panel-secondary)",
            color: "var(--aqb-text-primary)",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 3000,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            animation: "aqb-tooltip-in 0.15s ease",
          }}
        >
          {content}
          {shortcut && (
            <span
              style={{
                marginLeft: 8,
                opacity: 0.7,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 11,
              }}
            >
              ({shortcut})
            </span>
          )}
        </div>
      )}
    </>
  );
};

function calculatePosition(rect: DOMRect, position: TooltipProps["position"]) {
  const gap = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const candidates = {
    top: { x: rect.left + rect.width / 2, y: rect.top - gap },
    bottom: { x: rect.left + rect.width / 2, y: rect.bottom + gap },
    left: { x: rect.left - gap, y: rect.top + rect.height / 2 },
    right: { x: rect.right + gap, y: rect.top + rect.height / 2 },
  };

  const fitsTop = rect.top > 48;
  const fitsBottom = viewportHeight - rect.bottom > 48;
  const fitsLeft = rect.left > 48;
  const fitsRight = viewportWidth - rect.right > 48;

  if (position === "top" && fitsTop) return candidates.top;
  if (position === "bottom" && fitsBottom) return candidates.bottom;
  if (position === "left" && fitsLeft) return candidates.left;
  if (position === "right" && fitsRight) return candidates.right;

  // Fallback preference order: bottom, top, right, left
  if (fitsBottom) return candidates.bottom;
  if (fitsTop) return candidates.top;
  if (fitsRight) return candidates.right;
  if (fitsLeft) return candidates.left;

  return candidates[position ?? "top"] || { x: rect.left, y: rect.top };
}

function getTransform(position: TooltipProps["position"]) {
  switch (position) {
    case "top":
      return "translate(-50%, -100%)";
    case "bottom":
      return "translate(-50%, 0)";
    case "left":
      return "translate(-100%, -50%)";
    case "right":
      return "translate(0, -50%)";
    default:
      return "";
  }
}

export default Tooltip;
