/**
 * Aquibra Popover Component
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  trigger: React.ReactElement;
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  triggerOn?: "click" | "hover";
  closeOnClickOutside?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  position = "bottom",
  triggerOn = "click",
  closeOnClickOutside = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  // Calculate position on open
  React.useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      let top = 0;
      let left = 0;

      // Base offset
      const gap = 8;

      switch (position) {
        case "bottom":
          top = rect.bottom + scrollY + gap;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case "top":
          top = rect.top + scrollY - gap;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case "left":
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - gap;
          break;
        case "right":
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + gap;
          break;
      }

      setCoords({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true); // Capture scroll

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, position]);

  React.useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  // Styles for the portal content
  const popoverStyles: React.CSSProperties = {
    position: "absolute",
    top: coords.top,
    left: coords.left,
    transform:
      position === "bottom"
        ? "translateX(-50%)"
        : position === "top"
          ? "translateX(-50%) translateY(-100%)"
          : position === "left"
            ? "translateY(-50%) translateX(-100%)"
            : "translateY(-50%)",
    background: "var(--aqb-bg-panel)",
    borderRadius: 8,
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
    border: "1px solid var(--aqb-border)",
    padding: 12,
    zIndex: 9999, // High Z-Index to stay on top
    minWidth: 200,
    animation: "aqb-popover-in 0.15s ease",
  };

  return (
    <>
      <div
        ref={triggerRef}
        style={{ display: "inline-flex" }}
        onClick={
          triggerOn === "click"
            ? (e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }
            : undefined
        }
        onMouseEnter={triggerOn === "hover" ? () => setIsOpen(true) : undefined}
        onMouseLeave={triggerOn === "hover" ? () => setIsOpen(false) : undefined}
      >
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={contentRef}
            className="aqb-popover"
            style={popoverStyles}
            onMouseEnter={triggerOn === "hover" ? () => setIsOpen(true) : undefined}
            onMouseLeave={triggerOn === "hover" ? () => setIsOpen(false) : undefined}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Popover;
