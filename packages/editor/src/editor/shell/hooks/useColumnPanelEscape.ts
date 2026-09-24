/**
 * Escape closes the right-column panel (Publish · Review · History) and the
 * inspector returns — owner ruling 2026-09-24. Not while something inside is
 * open (a modal, popover, menu or listbox takes that Escape first) and not
 * while typing in a field.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

const OPEN_OVERLAY = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useColumnPanelEscape(active: boolean, onClose: () => void): void {
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  React.useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isTyping(e.target)) return;
      if (document.querySelector(OPEN_OVERLAY)) return;
      closeRef.current();
    };
    /* Capture: an open menu's own Escape handler removes it from the DOM
       before a bubbling listener runs (measured live — Escape over the
       Review ⋯ closed the menu AND the panel). Reading the DOM first is what
       lets the inner overlay take this Escape. */
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [active]);
}
