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
      // SHOW_IN_LAYERS is the event the shell actually listens for: it switches
      // the left panel to Layers, opens the drawer, then asks the tree to
      // scroll. Selecting alone only highlights a row that may not be on
      // screen — or in a panel that is not even open.
      composer.emit(EVENTS.SHOW_IN_LAYERS, {});
    },
  },
  {
    id: "select-parent",
    label: "Select Parent",
    icon: "arrow-up",
    group: "standalone",
    /* The key this binds is Left (useCanvasKeyboard), which the breadcrumb
       prints as "← Parent". Board 1176:4866 shows a glyph in this column, and
       the word "Left" read as a direction rather than a key. */
    shortcut: "←",
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
