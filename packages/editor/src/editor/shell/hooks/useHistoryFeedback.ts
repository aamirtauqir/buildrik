/**
 * useHistoryFeedback — the undo/redo toasts of board 814:7027.
 *
 * Six variants: undo and redo of a delete, a text edit, a move and a style
 * change, each carrying the reverse-action link; and the empty-stack toast,
 * which carries none because there is nothing to reverse.
 *
 * The docblock here used to promise "action verb + target (e.g. 'Deleted
 * Heading')". There is no target: the undo event carries a fixed label and
 * nothing else. Past tense is real; the element's name is not.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants";

/**
 * Board 814:7027 leads with the reason these toasts exist: "shows what was
 * undone/redone so the user has confidence". Every variant it draws is a
 * past-tense sentence about the thing that moved — "Deleted 'Button'",
 * "Moved 'Section' to Column 2", "Fill changed on 'Hero'".
 *
 * This table is keyed on the labels `beginTransaction` actually passes. It
 * used to be keyed on labels the engine has never recorded: 11 of its 17 keys
 * (`context-delete`, `batch-style`, `text-edit`, `drag-drop`, `resize` …) match
 * nothing, while 50 real ones matched nothing here and fell through to the
 * kebab-to-Title-Case fallback. The most common undo in the editor — ⌘Z after
 * the Delete command, whose label is `delete`, not `delete-element` — therefore
 * read "Delete", the internal label with a capital letter, rather than the
 * board's "Deleted …". Same for "Nudge", "Insert Block Drop", "Style Batch".
 *
 * The element's own name is NOT available here: HISTORY_UNDO carries only the
 * label, and the labels are fixed strings, so `'Button'` in the board's copy
 * has no producer. The verb and the object are what the code can honestly say.
 */
const ACTION_DESCRIPTIONS: Record<string, string> = {
  // Add / insert
  "add element": "Added element",
  "added block": "Added block",
  "insert-block-drop": "Added block",
  "insert-block-sidebar": "Added block",
  "insert-component": "Added component",
  "instantiate-component-drop": "Added component",
  "insert-template-drop": "Added template",
  "import-html-to-active-page": "Imported HTML",
  "insert-html-to-element": "Inserted HTML",
  "apply-interpreted-tree": "Applied generated layout",
  "ai-edit": "Applied an AI edit",
  // Remove / duplicate
  delete: "Deleted element",
  "delete-element": "Deleted element",
  "delete-layer": "Deleted layer",
  "delete-layers": "Deleted layers",
  cut: "Cut element",
  duplicate: "Duplicated element",
  "duplicate-element": "Duplicated element",
  "duplicate-layer": "Duplicated layer",
  "clone-element": "Duplicated element",
  paste: "Pasted element",
  "paste-styles": "Pasted styles",
  // Move / order
  "move-element": "Moved element",
  "multi-element-move": "Moved elements",
  "keyboard-move": "Moved element",
  "touch-move-element": "Moved element",
  nudge: "Moved element",
  "move-layer": "Reordered layer",
  "keyboard-reorder": "Reordered layer",
  reorder: "Reordered layer",
  "reorder-section": "Reordered section",
  "move-layer-top": "Brought layer to front",
  "move-layer-bottom": "Sent layer to back",
  // Group / arrange
  "group-elements": "Grouped elements",
  "group-layers": "Grouped layers",
  "ungroup-elements": "Ungrouped elements",
  "align-horizontal": "Aligned horizontally",
  "align-vertical": "Aligned vertically",
  distribute: "Distributed elements",
  "resize-element": "Resized element",
  // Style / content
  "style-change": "Changed style",
  "style-batch": "Changed styles",
  "batch-multi-style": "Changed styles",
  "auto-fix contrast": "Fixed contrast",
  "set design token": "Changed a design token",
  "inline edit": "Edited text",
  "inline-edit": "Edited text",
  "link-change": "Changed link",
  "link-target-change": "Changed link target",
  "animation-change": "Changed animation",
  "interactions-change": "Changed interactions",
  // Media / components
  "replace media": "Replaced media",
  "replace across canvas": "Replaced media across the page",
  "replace across selected pages": "Replaced media across pages",
  "instance-sync": "Synced component instances",
  "variant-change": "Changed variant",
};

/**
 * Destructive undos linger twice as long. This set had the same problem as the
 * table above — `context-delete`, `cut-element` and `batch-style` are not
 * labels this engine records, so the longer linger never once fired for the
 * Delete key, which is the whole reason it exists.
 */
const DESTRUCTIVE_LABELS = new Set([
  "delete",
  "delete-element",
  "delete-layer",
  "delete-layers",
  "cut",
]);

export function useHistoryFeedback(
  composer: Composer | null,
  addToast: (input: ToastInput) => string
) {
  React.useEffect(() => {
    if (!composer) return;

    /** A history label, said the way board 814:7027 says it. */
    const formatLabel = (label?: string): string => {
      if (!label) return "last action";

      const known = ACTION_DESCRIPTIONS[label.toLowerCase()];
      if (known) return known;

      /* Already a sentence — a hand-written transaction label, or
         HistoryManager's own "Restored to: <label>". Kebab-splitting those
         gave "Restored To: Nudge". Leave them alone. */
      if (label.includes(" ")) return label;

      // Unmapped kebab-case, e.g. "some-new-op" -> "Some New Op".
      return label
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    /* Board 814:7027 puts the reverse-action link on EVERY undo/redo toast,
       not only the destructive ones — a misfired ⌘Z deserves a one-click way
       back no matter what it reverted. Destructive labels keep the longer
       linger they had. */
    const handleUndo = (data: { entry: { label?: string } }) => {
      const action = formatLabel(data.entry.label);
      const isDestructive = DESTRUCTIVE_LABELS.has(data.entry.label?.toLowerCase() ?? "");
      addToast({
        title: "↩ Undo",
        description: action,
        tone: "info",
        duration: isDestructive ? 4000 : 2500,
        action: { label: "Redo", onClick: () => composer.history.redo() },
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
        action: { label: "Undo", onClick: () => composer.history.undo() },
      });
    };

    /* Board 814:7027's sixth variant. ⌘Z with an empty stack did nothing and
       said nothing — indistinguishable from an undo that failed. Grey, no
       reverse action: there is nothing to reverse. */
    const handleNoop = (data: { direction: "undo" | "redo"; reason?: string }) => {
      /* "Nothing to undo" is false when the stack has entries and the LAST
         action is what cannot be undone — a binding, say. Undoing the earlier
         edit instead would be an action the user did not ask for, so the
         engine refuses and names why. */
      addToast({
        description: data.reason
          ? `Can't undo ${data.reason} — it isn't recorded in history. Your earlier edits are still there.`
          : data.direction === "undo"
            ? "Nothing to undo"
            : "Nothing to redo",
        tone: "neutral",
        duration: data.reason ? 4000 : 2000,
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
