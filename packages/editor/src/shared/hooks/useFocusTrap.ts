/**
 * useFocusTrap — Focus trap + restoration for modals and popovers.
 *
 * - When `active` becomes true: capture currently focused element,
 *   move focus to first focusable inside the container.
 * - While active: Tab and Shift+Tab cycle within the container.
 * - When `active` becomes false: restore focus to originally focused element.
 *
 * Extracted from Modal.tsx — shared across Modal and Popover.
 *
 * @license BSD-3-Clause
 */

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTORS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    restoreRef.current = document.activeElement;
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
    const first = focusables()[0];
    if (first) first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    container.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("keydown", onKeyDown);
      const target = restoreRef.current;
      if (target && typeof (target as HTMLElement).focus === "function") {
        requestAnimationFrame(() => (target as HTMLElement).focus());
      }
      restoreRef.current = null;
    };
  }, [active, containerRef]);
}
