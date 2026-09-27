/**
 * Escape closes the right-column panel (Publish · Review · History) and the
 * inspector returns — owner ruling 2026-09-24. Not while something inside is
 * open (a modal, popover, menu or listbox takes that Escape first) and not
 * while typing in a field. While open it owns Escape outright: the canvas
 * selection behind it survives the keystroke (P-6).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { hasOpenEscapeSurface } from "@/shared/utils/openEscapeSurface";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Marks the document while a column panel owns Escape, so the engine's
 *  "deselect" shortcut — which runs before this listener — stands down (P-6).
 *  A count, not a flag: the column, Issues and AI hooks can overlap. */
const OWNER_ATTR = "data-bk-escape-owner";

function claimEscape(): () => void {
  const body = document.body;
  body.setAttribute(OWNER_ATTR, String(Number(body.getAttribute(OWNER_ATTR) ?? 0) + 1));
  return () => {
    const left = Number(body.getAttribute(OWNER_ATTR) ?? 1) - 1;
    if (left > 0) body.setAttribute(OWNER_ATTR, String(left));
    else body.removeAttribute(OWNER_ATTR);
  };
}

export function useColumnPanelEscape(active: boolean, onClose: () => void): void {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    if (!active) return;
    const release = claimEscape();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isTyping(e.target)) return;
      if (hasOpenEscapeSurface()) return;
      closeRef.current();
    };
    /* Capture: an open menu's own Escape handler removes it from the DOM
       before a bubbling listener runs (measured live — Escape over the
       Review ⋯ closed the menu AND the panel). Reading the DOM first is what
       lets the inner overlay take this Escape. */
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      release();
    };
  }, [active]);
}
