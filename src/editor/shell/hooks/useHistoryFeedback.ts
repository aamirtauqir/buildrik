/**
 * useHistoryFeedback
 * Listens to history events (undo/redo) and triggers descriptive toasts
 *
 * P1-8 Enhancement: Improved toast messages with clearer action descriptions
 * - Shows action verb + target (e.g., "Deleted Heading" instead of just "Delete")
 * - Uses consistent past tense for clarity
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants";

/** Map of action labels to user-friendly descriptions */
const ACTION_DESCRIPTIONS: Record<string, string> = {
  // Element operations
  "create-element": "Created element",
  "delete-element": "Deleted element",
  "duplicate-element": "Duplicated element",
  "cut-element": "Cut element",
  "move-element": "Moved element",
  "move-layer": "Reordered layer",
  "wrap-element": "Wrapped element",
  // Style operations
  "style-change": "Changed style",
  "batch-style": "Changed styles",
  "element-style-changed": "Changed element style",
  // Content operations
  "content-change": "Edited content",
  "text-edit": "Edited text",
  // Quick actions
  "quick-add-block": "Added block",
  "context-delete": "Deleted element",
  // History labels from transactions
  resize: "Resized element",
  "drag-drop": "Moved element",
  paste: "Pasted element",
};

export function useHistoryFeedback(
  composer: Composer | null,
  addToast: (params: {
    title: string;
    message: string;
    variant: "info" | "success" | "warning" | "error";
    duration?: number;
  }) => void
) {
  React.useEffect(() => {
    if (!composer) return;

    /**
     * Format a history label into a user-friendly message
     * P1-8: Enhanced to provide clearer context about what was undone/redone
     */
    const formatLabel = (label?: string): string => {
      if (!label) return "last action";

      // Check for known action descriptions first
      const knownAction = ACTION_DESCRIPTIONS[label.toLowerCase()];
      if (knownAction) return knownAction;

      // Convert kebab-case to Title Case (e.g. "quick-add-block" -> "Quick Add Block")
      const formatted = label
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Add context if it looks like an element type was included
      // e.g., "Delete Heading" -> "Deleted heading"
      if (formatted.startsWith("Delete ")) {
        return `Deleted ${formatted.slice(7).toLowerCase()}`;
      }
      if (formatted.startsWith("Create ")) {
        return `Created ${formatted.slice(7).toLowerCase()}`;
      }
      if (formatted.startsWith("Style ")) {
        return `Styled ${formatted.slice(6).toLowerCase()}`;
      }

      return formatted;
    };

    const handleUndo = (data: { entry: { label?: string } }) => {
      const action = formatLabel(data.entry.label);
      addToast({
        title: "↩ Undo",
        message: action,
        variant: "info",
        duration: 2500,
      });
    };

    const handleRedo = (data: { entry: { label?: string } }) => {
      const action = formatLabel(data.entry.label);
      addToast({
        title: "↪ Redo",
        message: action,
        variant: "info",
        duration: 2500,
      });
    };

    composer.on(EVENTS.HISTORY_UNDO, handleUndo);
    composer.on(EVENTS.HISTORY_REDO, handleRedo);

    return () => {
      composer.off(EVENTS.HISTORY_UNDO, handleUndo);
      composer.off(EVENTS.HISTORY_REDO, handleRedo);
    };
  }, [composer, addToast]);
}
