/**
 * The canvas renders the site's own HTML inside the editor document, so its
 * links and forms are live: one click to select a link element followed the
 * href and navigated the editor away (L-1 — /edit/S2 → /services, a 404, no
 * prompt, the editor gone). This cancels, at the canvas root and in the
 * capture phase, every way the page content can navigate: a click on or in a
 * link (Enter on a focused link arrives as that same click), a middle-click,
 * and a form submit. Only the default action is cancelled — the events still
 * propagate, so selection, inline editing and the context menu see them.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

function isInLink(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("a[href], area[href]") !== null;
}

export function useCanvasNavigationGuard(rootRef: React.RefObject<HTMLElement | null>): void {
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onActivate = (e: Event) => {
      if (isInLink(e.target)) e.preventDefault();
    };
    const onSubmit = (e: Event) => e.preventDefault();
    root.addEventListener("click", onActivate, true);
    root.addEventListener("auxclick", onActivate, true);
    root.addEventListener("submit", onSubmit, true);
    return () => {
      root.removeEventListener("click", onActivate, true);
      root.removeEventListener("auxclick", onActivate, true);
      root.removeEventListener("submit", onSubmit, true);
    };
  }, [rootRef]);
}
