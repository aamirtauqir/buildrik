/**
 * useSidebarKeyboard — Keyboard shortcut handler for sidebar tab switching
 * Shortcuts defined in GROUPED_TABS_CONFIG[].shortcut
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { GROUPED_TABS_CONFIG } from "../rail/tabsConfig";
import type { GroupedTabId } from "../rail/tabsConfig";
import { isModalOpen } from "@/editor/chrome-ui";

/**
 * Registers global keyboard shortcuts for tab switching.
 * Skips when user is typing in inputs/textareas/contenteditable.
 *
 * @param disabledTabs Tab ids whose letter is closed off (FB-4: "R" opens
 *   Review only when the server's agency review layer is on) — the row is
 *   still in `GROUPED_TABS_CONFIG` (the shortcuts sheet still lists it), only
 *   the binding itself stands down.
 */
export function useSidebarKeyboard(
  onTabChange: (tab: GroupedTabId) => void,
  onAssistant?: () => void,
  disabledTabs?: ReadonlySet<GroupedTabId>,
): void {
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

      /* FB-6: an open `aria-modal` dialog owns the keyboard — a confirm
         dialog's own button isn't an INPUT/TEXTAREA, so without this a bare
         "S" typed while a modal is open still switched the rail tab behind
         it (same F9 rule useEditorShortcuts.ts and the others already
         apply). */
      if (isModalOpen()) return;

      const key = e.key.toUpperCase();
      const isShift = e.shiftKey;

      /* I opens AI — in the inspector column, its one home (G2-127); it is
         not a drawer tab any more, so it is not in the registry. */
      if (key === "I" && !isShift && onAssistant) {
        e.preventDefault();
        onAssistant();
        return;
      }

      for (const tab of GROUPED_TABS_CONFIG) {
        if (!tab.shortcut || disabledTabs?.has(tab.id)) continue;

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
  }, [onTabChange, onAssistant, disabledTabs]);
}
