/**
 * useClickOutside Hook
 * Handles click outside and escape key to close modals/dropdowns
 * @license BSD-3-Clause
 */

import * as React from "react";

/**
 * Hook to handle clicking outside an element and pressing Escape
 *
 * @param ref - React ref to the element to detect clicks outside of
 * @param onClose - Callback function when click outside or escape is detected
 * @param enabled - Optional flag to enable/disable the hook (default: true)
 *
 * @example
 * ```tsx
 * const menuRef = useRef<HTMLDivElement>(null);
 * useClickOutside(menuRef, () => setIsOpen(false));
 * ```
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  onClose: () => void,
  enabled: boolean = true
): void {
  React.useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [ref, onClose, enabled]);
}

export default useClickOutside;
