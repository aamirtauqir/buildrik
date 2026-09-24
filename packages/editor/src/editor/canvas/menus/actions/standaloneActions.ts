/**
 * Standalone Actions
 * Actions that appear at the bottom of the context menu
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../../shared/constants/events";
import { runTransaction } from "../../../../shared/utils/helpers";
import type { ContextAction } from "../contextMenuRegistry";
import { requestReplaceWithBlock } from "@/editor/sidebar/tabs/build/insertGroupRequest";

/** Element types a block can stand in for — the section-shaped ones. */
const SECTION_TYPES = new Set([
  "container", "section", "hero", "features", "header", "footer", "nav", "navbar",
  "cta", "card", "pricing", "columns", "grid", "flex",
]);
/** Element types the CMS can feed a field into. */
const BINDABLE_TYPES = new Set(["text", "heading", "paragraph", "image", "button", "link"]);

export const standaloneActions: ContextAction[] = [
  // ── v3 IA (docs/plans/2026-09-14-editor-v3-ia.md Q8): the features a designer
  // looks for AT the element — board "Canvas · selected · Hero · ⋯ menu"
  // (4428:43928) — instead of a rail hunt. Each row is a door to an existing
  // surface, never a second implementation of it.
  {
    id: "replace-with-block",
    label: "Replace with block…",
    icon: "layout",
    group: "standalone",
    // Blocks are sections; offering to replace a heading with a hero is noise.
    isVisible: ({ element, isRoot }) => !isRoot && SECTION_TYPES.has(element.getType?.() ?? ""),
    handler: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" });
      requestReplaceWithBlock(composer, element.getId());
    },
  },
  {
    id: "improve-with-ai",
    label: "Improve with AI",
    icon: "sparkles",
    group: "standalone",
    // Same door the inspector's ✦ chip uses; hidden when the shell mounted the
    // menu without an AI handler rather than showing a row that does nothing.
    isVisible: ({ openAI }) => Boolean(openAI),
    handler: ({ openAI }) => openAI?.(),
  },
  {
    id: "bind-to-cms",
    label: "Bind to CMS field…",
    icon: "database",
    group: "standalone",
    isVisible: ({ element, isRoot }) => !isRoot && BINDABLE_TYPES.has(element.getType?.() ?? ""),
    handler: ({ composer, element }) => {
      // The CMS panel binds the CURRENT selection (Content › record › field);
      // select first so the panel opens on the right element.
      composer.selection.select(element as never);
      composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "content" });
    },
  },
  {
    id: "add-interaction",
    label: "Add interaction",
    icon: "zap",
    group: "standalone",
    isVisible: ({ isRoot }) => !isRoot,
    handler: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "interactions" });
    },
  },
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
