/**
 * OverlayMount — portal + scrim + focus trap.
 *
 * Everything that floats above the canvas — modals, the command palette,
 * confirmations — mounts through here, so scrim behaviour, escape handling and
 * focus restoration are written once instead of per surface.
 *
 * Mounts into the shared overlay root (Gate 22), NOT document.body directly:
 * one container means one stacking context for every floating surface.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "./focus";
import { getOverlayRoot } from "./OverlayRoot";

/* center/top each supply their own align-items — same-property values can't
   be additive (Tailwind utilities of equal specificity have no
   className-order-to-cascade-order guarantee, see Row/PanelFrame precedent). */
const SCRIM_ALIGN_CLASS: Record<"center" | "top", string> = {
  center: "tw:items-center",
  top: "tw:items-start tw:pt-[12vh]",
};

export interface OverlayMountProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Align to the top instead of centring — the command palette pattern. */
  align?: "center" | "top";
  /** Clicking the scrim closes by default; destructive flows can opt out. */
  dismissOnScrimClick?: boolean;
  /**
   * Board 183:16 — a form with unsaved input does not close on a stray scrim
   * click. The frame pulses once instead: "losing a filled form to a stray
   * click is the cheapest possible way to lose trust."
   */
  dirty?: boolean;
  labelledBy?: string;
}

export function OverlayMount({
  open, onClose, children, align = "center", dismissOnScrimClick = true, dirty = false, labelledBy,
}: OverlayMountProps) {
  const ref = useFocusTrap(open, onClose);
  const [pulse, setPulse] = React.useState(false);
  React.useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 400);
    return () => clearTimeout(t);
  }, [pulse]);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={["tw:fixed tw:inset-0 tw:z-50 tw:bg-[var(--bk-alpha-ink-40)] tw:flex tw:justify-center", SCRIM_ALIGN_CLASS[align]]
        .filter(Boolean)
        .join(" ")}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (dirty) {
          setPulse(true);
          return;
        }
        if (dismissOnScrimClick) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        data-dirty={dirty ? "true" : undefined}
        className={pulse ? "bk-overlay-pulse" : undefined}
        style={pulse ? undefined : { display: "contents" }}
      >
        {children}
      </div>
    </div>,
    getOverlayRoot(),
  );
}
