/**
 * useClickOutside - Shared hook for detecting clicks outside an element
 * Consolidates duplicate click-outside logic across dropdown components
 * @license BSD-3-Clause
 */

import * as React from "react";

interface UseClickOutsideOptions {
  /** Whether the listener is active */
  enabled?: boolean;
  /** Additional elements to exclude from click detection */
  excludeRefs?: React.RefObject<HTMLElement | null>[];
  /** Also fire callback on Escape keypress */
  closeOnEscape?: boolean;
}

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, excludeRefs = [], closeOnEscape = false } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (ref.current && ref.current.contains(target)) return;

      for (const excludeRef of excludeRefs) {
        if (excludeRef.current && excludeRef.current.contains(target)) return;
      }

      callback();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") callback();
    };

    document.addEventListener("mousedown", handleClickOutside);
    if (closeOnEscape) document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeOnEscape) document.removeEventListener("keydown", handleEscape);
    };
  }, [ref, callback, enabled, excludeRefs, closeOnEscape]);
}

export default useClickOutside;
