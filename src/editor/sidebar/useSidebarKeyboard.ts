/**
 * useSidebarKeyboard — Keyboard shortcut handler for sidebar tab switching
 * Shortcuts defined in GROUPED_TABS_CONFIG[].shortcut
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { GROUPED_TABS_CONFIG } from "../../shared/constants/tabs";
import type { GroupedTabId } from "../../shared/constants/tabs";

/**
 * Registers global keyboard shortcuts for tab switching.
 * Skips when user is typing in inputs/textareas/contenteditable.
 */
export function useSidebarKeyboard(onTabChange: (tab: GroupedTabId) => void): void {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const isShift = e.shiftKey;

      for (const tab of GROUPED_TABS_CONFIG) {
        if (!tab.shortcut) continue;

        if (tab.shortcut === "\u21E7A" && key === "A" && isShift) {
          e.preventDefault();
          onTabChange(tab.id);
          return;
        }

        if (tab.shortcut === key && !isShift) {
          e.preventDefault();
          onTabChange(tab.id);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTabChange]);
}
