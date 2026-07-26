/**
 * Focus trap for overlay surfaces.
 *
 * Three things every overlay must do and most hand-rolled ones forget:
 * move focus in on open, keep Tab inside while open, and put focus back where
 * it was on close. Without the third one, closing a modal drops the user at the
 * top of the document and keyboard navigation restarts from nothing.
 *
 * @license BSD-3-Clause
 */
import React from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean, onEscape?: () => void) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!active) return;
    const container = ref.current;
    const previous = document.activeElement as HTMLElement | null;

    /**
     * Do NOT filter on offsetParent: it is null for anything inside a
     * position:fixed ancestor, which is every overlay this hook exists for, so
     * the trap would see an empty list and give up. Filter on what actually
     * makes an element unreachable instead.
     */
    const focusables = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true",
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previous?.focus?.();
    };
  }, [active, onEscape]);

  return ref;
}
