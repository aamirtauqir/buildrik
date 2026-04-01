/**
 * Element Flash Hook
 * Provides visual feedback when elements are added/modified (Phase 6 - Level 2 Active Feedback)
 *
 * @license BSD-3-Clause
 */

import { useEffect, useCallback } from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";

const FLASH_CLASS = "aqb-element-flash";
const FLASH_DURATION = 500; // ms - matches CSS animation

/**
 * Hook to flash elements when they are created or duplicated
 * Adds visual confirmation that an action took effect
 */
export function useElementFlash(composer: Composer | null): void {
  // Flash a specific element by ID
  const flashElement = useCallback((elementId: string) => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-aqb-id="${elementId}"]`);
      if (el) {
        // Remove class first in case it's already flashing
        el.classList.remove(FLASH_CLASS);

        // Force reflow to restart animation
        void (el as HTMLElement).offsetWidth;

        // Add flash class
        el.classList.add(FLASH_CLASS);

        // Remove after animation completes
        setTimeout(() => {
          el.classList.remove(FLASH_CLASS);
        }, FLASH_DURATION);
      }
    });
  }, []);

  useEffect(() => {
    if (!composer) return;

    // Flash on element created
    const handleElementCreated = (element: { id: string }) => {
      if (element?.id) {
        flashElement(element.id);
      }
    };

    // Flash on element duplicated
    const handleElementDuplicated = (data: { newElement?: { id: string }; id?: string }) => {
      const elementId = data?.newElement?.id || data?.id;
      if (elementId) {
        flashElement(elementId);
      }
    };

    // Subscribe to events
    composer.on(EVENTS.ELEMENT_CREATED, handleElementCreated);
    composer.on(EVENTS.ELEMENT_DUPLICATED, handleElementDuplicated);

    return () => {
      composer.off(EVENTS.ELEMENT_CREATED, handleElementCreated);
      composer.off(EVENTS.ELEMENT_DUPLICATED, handleElementDuplicated);
    };
  }, [composer, flashElement]);
}

export default useElementFlash;
