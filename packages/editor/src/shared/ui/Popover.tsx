// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Popover surface.
/**
 * Adapter shim — translates legacy Popover API to render the vibcoder
 * `<Popover>` surface (bd-popover skin) inside the existing legacy behavior
 * shell (positioning, outside-click, Escape, focus trap).
 *
 * Hybrid scope explanation:
 *   Phase 3 vibcoder Popover is intentionally a PASSIVE controlled surface
 *   (NO Radix.Popover backing, NO outside-click, NO Escape, NO focus trap,
 *   NO positioning) — see `editor/shared/vibcoder/Popover.tsx` Contract D
 *   docstring. The behavior (anchor calculation, Esc, click-outside,
 *   focus-trap-on-open) MUST stay in the shim until Phase 5 organisms wire
 *   floating-ui + a Radix-backed Popover. This shim swaps only the rendered
 *   surface element so consumers get the canonical bd-popover CSS skin
 *   today, without losing any behavior.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   trigger          → rendered as the anchor wrapper (no change)
 *   content          → passed as children to vibcoder <Popover>
 *   position         → drives the absolute coords math (no change)
 *   triggerOn        → click | hover (no change — drives mouse handlers)
 *   closeOnClickOutside → drives the document mousedown listener (no change)
 *
 * Untranslatable: none. The legacy public API is preserved 1:1.
 *
 * Focus trap migration note: useFocusTrap hook is STILL USED here. Vibcoder
 * Popover provides no focus trap of its own (Phase 3 deferred this to
 * Phase 5 floating-ui integration). T7 useFocusTrap deletion is contingent
 * on this hook becoming dead — Modal (T5) was one call site, Popover (T6)
 * is the OTHER. T7 will keep the hook alive while Popover still relies on
 * it. Phase 5 floating-ui adoption (or a Radix.Popover-backed vibcoder
 * Popover replacement) is the trigger to retire useFocusTrap.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Popover as VibcoderPopover } from "@/editor/shared/vibcoder";
import { useFocusTrap } from "../hooks/useFocusTrap";

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

  useFocusTrap(contentRef, isOpen);

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

  // Escape to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Positioning style — applied to the portaled wrapper that holds the
  // vibcoder Popover surface. The vibcoder surface itself renders the
  // bd-popover class (background, border, shadow, padding) so we no longer
  // hand-roll those tokens here.
  const wrapperStyle: React.CSSProperties = {
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
    zIndex: 9999, // Stay on top of any in-panel overlay
    minWidth: 200,
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
      {createPortal(
        <div
          ref={contentRef}
          style={wrapperStyle}
          onMouseEnter={triggerOn === "hover" ? () => setIsOpen(true) : undefined}
          onMouseLeave={triggerOn === "hover" ? () => setIsOpen(false) : undefined}
        >
          <VibcoderPopover
            open={isOpen}
            onOpenChange={(next) => {
              if (!next) setIsOpen(false);
            }}
          >
            {content}
          </VibcoderPopover>
        </div>,
        document.body,
      )}
    </>
  );
};

export default Popover;
