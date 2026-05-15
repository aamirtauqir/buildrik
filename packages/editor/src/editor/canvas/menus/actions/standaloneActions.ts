/**
 * Standalone Actions
 * Actions that appear at the bottom of the context menu
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../../shared/constants/events";
import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";

export const standaloneActions: ContextAction[] = [
  {
    id: "save-as-component",
    label: "Save as component",
    icon: "package",
    group: "standalone",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer, element }) => {
      // Selection-aware: include all multi-selected ids when present, fall
      // back to the right-clicked element. Bindings are extracted up-front
      // so the modal can render the "Pre-fill bindings from DS" hint with
      // an accurate count without re-walking the element tree.
      const selectedIds = composer.selection?.getSelectedIds?.() ?? [];
      const selectionIds = selectedIds.length > 0 ? selectedIds : [element.getId()];
      const extractedBindings = composer.designSystem.tokenBindingResolver.resolveForElements(
        selectionIds,
        composer.elements.getAllElements(),
      );
      composer.emit(EVENTS.COMPONENT_SAVE_AS_REQUESTED, {
        selectionIds,
        extractedBindings,
      });
    },
  },
  {
    id: "reveal-in-layers",
    label: "Reveal in Layers",
    icon: "eye",
    group: "standalone",
    handler: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit?.("layers:reveal", element);
    },
  },
  {
    id: "select-parent",
    label: "Select Parent",
    icon: "arrow-up",
    group: "standalone",
    shortcut: "Alt+Up",
    isVisible: ({ element }) => Boolean(element.getParent()),
    handler: ({ composer, element }) => {
      const parent = element.getParent();
      if (parent) {
        composer.selection.select(parent as never);
      }
    },
  },
  // ── Group / Ungroup ──────────────────────────────────────────────────────────
  {
    id: "group-elements",
    label: "Group",
    icon: "box",
    group: "standalone",
    shortcut: "Ctrl+G",
    isVisible: ({ elementStack }) => Boolean(elementStack && elementStack.length >= 2),
    handler: ({ composer, elementStack }) => {
      if (!elementStack || elementStack.length < 2) return;
      runTransaction(composer, "group-elements", () => {
        composer.emit?.("elements:group", { ids: elementStack });
      });
    },
  },
  {
    id: "ungroup-elements",
    label: "Ungroup",
    icon: "box-select",
    group: "standalone",
    shortcut: "Ctrl+Shift+G",
    isVisible: ({ element }) => {
      const type = element.getType?.();
      // Show Ungroup for containers that wrap other elements
      return type === "container";
    },
    handler: ({ composer, element }) => {
      runTransaction(composer, "ungroup-elements", () => {
        composer.emit?.("elements:ungroup", { id: element.getId() });
      });
    },
  },
  // ── Lock / Unlock ────────────────────────────────────────────────────────────
  {
    id: "lock-element",
    label: "Lock",
    icon: "lock",
    group: "standalone",
    isVisible: ({ element, isRoot }) => !isRoot && !element.isLocked(),
    handler: ({ composer, element }) => {
      runTransaction(composer, "lock-element", () => {
        element.setLocked(true);
      });
    },
  },
  {
    id: "unlock-element",
    label: "Unlock",
    icon: "unlock",
    group: "standalone",
    isVisible: ({ element, isRoot }) => !isRoot && element.isLocked(),
    handler: ({ composer, element }) => {
      runTransaction(composer, "unlock-element", () => {
        element.setLocked(false);
      });
    },
  },
];
