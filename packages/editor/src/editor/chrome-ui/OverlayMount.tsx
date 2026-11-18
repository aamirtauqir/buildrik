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

/* center/top each supply their own layout — same-property values can't
   be additive (Tailwind utilities of equal specificity have no
   className-order-to-cascade-order guarantee, see Row/PanelFrame precedent).
   "center" is the 2L9 dialog placement, not the viewport centre: every
   dialog board puts the frame's top at 280 on a 900 window (G03 225:3353,
   G14 225:9180, 165:2184, 223:44891 — C-16 / F-24). A column with a
   31vh spacer above (it shrinks first when a tall dialog would not fit)
   and a growing one below. */
const SCRIM_ALIGN_CLASS: Record<"center" | "top" | "workspace" | "panel", string> = {
  center:
    "tw:flex-col tw:items-center tw:justify-start tw:pb-4 tw:before:content-[''] tw:before:shrink tw:before:basis-[31vh] tw:before:min-h-4 " +
    "tw:after:content-[''] tw:after:grow",
  top: "tw:justify-center tw:items-start tw:pt-[12vh]",
  /* A tall dialog drawn from the top of the workspace, under the 56px topbar
     (design-2l9 187:20616 / 191:31132: frame top 56 on a 900 window). */
  workspace: "tw:justify-center tw:items-start tw:pt-14 tw:pb-4",
  /* A dialog over a full-width panel's content, below its header row
     (design-2l9 CMS Fields 257:51318 / 257:52890: frame top 128 on 900). */
  panel: "tw:justify-center tw:items-start tw:pt-32 tw:pb-4",
};

export interface OverlayMountProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Align to the top instead of centring — the command palette pattern;
   *  "workspace": a tall dialog's top at the workspace's top (56). */
  align?: "center" | "top" | "workspace" | "panel";
  /** Clicking the scrim closes by default; destructive flows can opt out. */
  dismissOnScrimClick?: boolean;
  /**
   * Board 183:16 — a form with unsaved input does not close on a stray scrim
   * click. The frame pulses once instead: "losing a filled form to a stray
   * click is the cheapest possible way to lose trust."
   */
  dirty?: boolean;
  labelledBy?: string;
  /** Direct accessible name when the dialog has no visible heading id to
   *  point `aria-labelledby` at (B-7 / A13-4). */
  ariaLabel?: string;
}

export function OverlayMount({
  open, onClose, children, align = "center", dismissOnScrimClick = true, dirty = false, labelledBy, ariaLabel,
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
      className={["tw:fixed tw:inset-0 tw:z-50 tw:bg-[var(--bk-alpha-ink-50)] tw:flex", SCRIM_ALIGN_CLASS[align]]
        .filter(Boolean)
        .join(" ")}
      data-testid="overlay-scrim"
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
        aria-label={labelledBy ? undefined : ariaLabel}
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
