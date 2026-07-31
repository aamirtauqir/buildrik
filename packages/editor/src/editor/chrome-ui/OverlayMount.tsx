/**
 * OverlayMount — portal + scrim + focus trap.
 *
 * The ONLY component in the library allowed to touch document.body (Gate 22).
 * Everything that floats above the canvas — modals, the command palette,
 * confirmations — mounts through here, so scrim behaviour, escape handling and
 * focus restoration are written once instead of per surface.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "./focus";

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
  labelledBy?: string;
}

export function OverlayMount({
  open, onClose, children, align = "center", dismissOnScrimClick = true, labelledBy,
}: OverlayMountProps) {
  const ref = useFocusTrap(open, onClose);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={["tw:fixed tw:inset-0 tw:z-50 tw:bg-[var(--bk-alpha-ink-40)] tw:flex tw:justify-center", SCRIM_ALIGN_CLASS[align]]
        .filter(Boolean)
        .join(" ")}
      onMouseDown={(e) => {
        if (dismissOnScrimClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ display: "contents" }}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
