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
import { ToastInput } from "@/editor/chrome-ui";
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

/** Labels that represent destructive operations where undo is especially useful */
const DESTRUCTIVE_LABELS = new Set([
  "delete-element",
  "context-delete",
  "cut-element",
  "batch-style",
]);

export function useHistoryFeedback(
  composer: Composer | null,
  addToast: (input: ToastInput) => string
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
      const isDestructive = DESTRUCTIVE_LABELS.has(data.entry.label?.toLowerCase() ?? "");
      addToast({
        title: "↩ Undo",
        description: action,
        tone: "info",
        duration: isDestructive ? 4000 : 2500,
        ...(isDestructive && {
          action: { label: "Redo", onClick: () => composer.history.redo() },
        }),
      });
    };

    const handleRedo = (data: { entry: { label?: string } }) => {
      const action = formatLabel(data.entry.label);
      const isDestructive = DESTRUCTIVE_LABELS.has(data.entry.label?.toLowerCase() ?? "");
      addToast({
        title: "↪ Redo",
        description: action,
        tone: "info",
        duration: isDestructive ? 4000 : 2500,
        ...(isDestructive && {
          action: { label: "Undo", onClick: () => composer.history.undo() },
        }),
      });
    };

    /* Board 814:7027's sixth variant. ⌘Z with an empty stack did nothing and
       said nothing — indistinguishable from an undo that failed. Grey, no
       reverse action: there is nothing to reverse. */
    const handleNoop = (data: { direction: "undo" | "redo" }) => {
      addToast({
        description: data.direction === "undo" ? "Nothing to undo" : "Nothing to redo",
        tone: "neutral",
        duration: 2000,
      });
    };

    /* Pressing Delete deleted the element and said NOTHING, while the canvas
       toolbar's Delete — the same intent, a different implementation — showed
       "Heading deleted" for five seconds with an Undo action. Walked live
       2026-08-24: four seconds after a keyboard delete the only toasts on
       screen were "Saved" and the empty-inspector hint. The quieter path is
       the one most people use.

       The seam is the COMMAND, not `element:deleted`. That event fires once
       PER ELEMENT, so a three-element delete would stack three toasts; a
       command fires once per user action. It also cannot double up with the
       toolbar, which calls `elements.removeElement` directly and never enters
       the command centre. */
    let pending: { ids: string[]; name: string; children: number } | null = null;

    /* Read the selection BEFORE the command runs — afterwards the elements are
       gone and there is nothing left to name. */
    const handleCommandBefore = (data: { id?: string }) => {
      if (data?.id !== "delete") {
        pending = null;
        return;
      }
      const ids = composer.selection?.getSelectedIds?.() ?? [];
      const first = ids[0] ? composer.elements.getElement(ids[0]) : null;
      const type = first?.getType?.() ?? "element";
      pending = {
        ids,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        children: first?.getChildren?.()?.length ?? 0,
      };
    };

    /* COMMAND_RUN fires whether or not the command changed anything —
       `CommandCenter.run` emits it after `command.run()` regardless of the
       return value. A first version of this toasted on the id alone, so Delete
       with nothing selected claimed "Element deleted" AND offered an Undo that
       would have reverted the previous real edit. Codex caught it. Count what
       actually disappeared instead of trusting that the command did something —
       the same rule this walk applies to everything else. */
    const handleCommandRun = (data: { id?: string }) => {
      if (data?.id !== "delete" || !pending) return;
      const { ids, name, children } = pending;
      pending = null;

      const gone = ids.filter((id) => !composer.elements.getElement(id));
      if (gone.length === 0) return;

      const description =
        gone.length > 1
          ? `${gone.length} elements deleted`
          : children > 0
            ? `${name} (${children} ${children === 1 ? "child" : "children"}) deleted`
            : `${name} deleted`;

      addToast({
        description,
        tone: "info",
        duration: 5000,
        action: { label: "Undo", onClick: () => composer.history.undo() },
      });
    };

    composer.on(EVENTS.HISTORY_UNDO, handleUndo);
    composer.on(EVENTS.HISTORY_REDO, handleRedo);
    composer.on(EVENTS.HISTORY_NOOP, handleNoop);
    composer.on(EVENTS.COMMAND_BEFORE, handleCommandBefore);
    composer.on(EVENTS.COMMAND_RUN, handleCommandRun);

    return () => {
      composer.off(EVENTS.HISTORY_UNDO, handleUndo);
      composer.off(EVENTS.HISTORY_REDO, handleRedo);
      composer.off(EVENTS.HISTORY_NOOP, handleNoop);
      composer.off(EVENTS.COMMAND_BEFORE, handleCommandBefore);
      composer.off(EVENTS.COMMAND_RUN, handleCommandRun);
    };
  }, [composer, addToast]);
}
