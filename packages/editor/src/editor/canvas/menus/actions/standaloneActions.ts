/**
 * Standalone Actions — the rows that sit outside a submenu. The element rows
 * are the element-action registry's (`fromElementAction`); Group / Ungroup are
 * selection operations and stay here.
 * @license BSD-3-Clause
 */

import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";
import { ELEMENT_ACTIONS, type ElementActionId } from "@/editor/shared/elementActions";

/**
 * A canvas menu row for a registry action — same handler, same visibility,
 * same enabled rule. `rowId` keeps the canvas menu's own row id where it
 * predates the registry ("copy-styles", "lock-element").
 */
export function fromElementAction(id: ElementActionId, group: string, rowId: string = id): ContextAction {
  const action = ELEMENT_ACTIONS[id];
  return {
    id: rowId,
    /* Only the Inspector renders a computed label (apply-style-to-page). */
    label: typeof action.label === "string" ? action.label : action.id,
    icon: action.icon,
    group,
    shortcut: action.shortcut,
    isVisible: action.isVisible,
    isEnabled: action.isEnabled ? (ctx) => action.isEnabled!(ctx) === true : undefined,
    handler: action.run,
  };
}

export const standaloneActions: ContextAction[] = [
  // v3 IA (Q8): doors to existing surfaces at the element, board 4428:43928.
  fromElementAction("replace-with-block", "standalone"),
  fromElementAction("improve-with-ai", "standalone"),
  fromElementAction("bind-to-cms", "standalone"),
  fromElementAction("add-interaction", "standalone"),
  fromElementAction("save-as-component", "standalone"),
  // ── Group / Ungroup ──────────────────────────────────────────────────────────
  {
    id: "group-elements",
    label: "Group",
    icon: "box",
    group: "standalone",
    shortcut: "Cmd+G",
    // Group the current multi-selection (≥2 elements sharing a parent).
    isVisible: ({ composer }) => composer.selection.getSelectedIds().length >= 2,
    handler: ({ composer }) => {
      const ids = composer.selection.getSelectedIds();
      if (ids.length < 2) return;
      runTransaction(composer, "group-elements", () => {
        const group = composer.elements.groupElements(ids);
        if (group) composer.selection.select(group as never);
      });
    },
  },
  {
    id: "ungroup-elements",
    label: "Ungroup",
    icon: "box-select",
    group: "standalone",
    shortcut: "Cmd+Shift+G",
    isVisible: ({ element }) => {
      const type = element.getType?.();
      // Show Ungroup for containers that wrap other elements
      return type === "container" && (element.getChildren?.()?.length ?? 0) > 0;
    },
    handler: ({ composer, element }) => {
      runTransaction(composer, "ungroup-elements", () => {
        composer.elements.ungroupElement(element.getId());
        composer.selection.clear();
      });
    },
  },
  // ── Lock / Unlock ────────────────────────────────────────────────────────────
  fromElementAction("lock", "standalone", "lock-element"),
  fromElementAction("unlock", "standalone", "unlock-element"),
];
