/**
 * useEscapeKey - Shared hook for handling Escape key press
 * Consolidates duplicate escape key logic across modal/dropdown components
 * @license BSD-3-Clause
 */

import * as React from "react";

interface UseEscapeKeyOptions {
  /** Whether the listener is active */
  enabled?: boolean;
}

/**
 * Hook that calls a callback when the Escape key is pressed
 * @param callback - Function to call when Escape is pressed
 * @param options - Optional configuration
 */
export function useEscapeKey(callback: () => void, options: UseEscapeKeyOptions = {}): void {
  const { enabled = true } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        callback();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [callback, enabled]);
}

export default useEscapeKey;
