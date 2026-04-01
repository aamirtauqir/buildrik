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
}

/**
 * Hook that calls a callback when clicking outside specified elements
 * @param ref - Ref to the element to detect clicks outside of
 * @param callback - Function to call when clicking outside
 * @param options - Optional configuration
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, excludeRefs = [] } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check main ref
      if (ref.current && ref.current.contains(target)) {
        return;
      }

      // Check excluded refs
      for (const excludeRef of excludeRefs) {
        if (excludeRef.current && excludeRef.current.contains(target)) {
          return;
        }
      }

      callback();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback, enabled, excludeRefs]);
}

export default useClickOutside;
