/**
 * The canvas renders the site's own HTML inside the editor document, so its
 * links and forms are live: one click to select a link element followed the
 * href and navigated the editor away (L-1 — /edit/S2 → /services, a 404, no
 * prompt, the editor gone). This cancels, in the capture phase, every way the
 * page content can navigate: a click on or in a link (Enter on a focused link
 * arrives as that same click), a middle-click, and a form submit. Only the
 * default action is cancelled — the events still propagate, so selection,
 * inline editing and the context menu see them.
 *
 * A callback ref, not a ref object (I-2): showing the device frame
 * (DeviceFramePreview) remounts the canvas frame, and an effect keyed on a ref
 * object stayed attached to the detached node — links navigated again. Every
 * node this ref is given is guarded; the one it replaces is released.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

function isInLink(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("a[href], area[href]") !== null;
}

const onActivate = (e: Event) => {
  if (isInLink(e.target)) e.preventDefault();
};
const onSubmit = (e: Event) => e.preventDefault();

export function useCanvasNavigationGuard(): (node: HTMLElement | null) => void {
  const guarded = React.useRef<HTMLElement | null>(null);
  return React.useCallback((node: HTMLElement | null) => {
    const previous = guarded.current;
    if (previous) {
      previous.removeEventListener("click", onActivate, true);
      previous.removeEventListener("auxclick", onActivate, true);
      previous.removeEventListener("submit", onSubmit, true);
    }
    guarded.current = node;
    if (!node) return;
    node.addEventListener("click", onActivate, true);
    node.addEventListener("auxclick", onActivate, true);
    node.addEventListener("submit", onSubmit, true);
  }, []);
}
