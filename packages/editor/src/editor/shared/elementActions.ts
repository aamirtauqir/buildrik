/**
 * Element actions — ONE registry for what can be done TO a selected element
 * (Inspector v4, R-DD-8). The Inspector's ⋯ menu (board 30), the canvas
 * right-click / ⋯ More menu (board 4428:43928) and the keyboard all run these
 * handlers; the document-changing ones run engine commands
 * (`engine/commands/defaultCommands.ts`), so a chord, a menu row and a
 * palette entry can never disagree about what "Copy style" means.
 *
 * Copy-style used to be implemented three times and Lock written in three
 * places (build plan F-5). A menu row or shortcut that re-implements an action
 * here is a defect (src/editor/AGENTS.md).
 *
 * `shortcut` is DISPLAY text in the canvas menu's form ("Cmd+Alt+C"); the
 * binding itself is the command's.
 *
 * @license BSD-3-Clause
 */

import type { Composer, Element } from "@/engine";
import type { ToastActionPayload, ToastTone } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { BINDABLE_TYPES } from "@/shared/constants/elementCapabilities";
import { findStylePeers } from "@/engine/commands/stylePeers";
import { requestReplaceWithBlock } from "@/editor/sidebar/tabs/build/insertGroupRequest";

/** Toast notification function signature */
export type AddToastFn = (toast: {
  description: string;
  tone?: ToastTone;
  duration?: number;
  action?: ToastActionPayload;
}) => void;

export interface ElementActionContext {
  composer: Composer;
  element: Element;
  isRoot: boolean;
  openAI?: () => void;
  /** Toast function for undo notifications */
  addToast?: AddToastFn;
}

export type ElementActionId =
  | "duplicate"
  | "copy-style"
  | "paste-style"
  | "apply-style-to-page"
  | "reset-style"
  | "save-as-component"
  | "lock"
  | "unlock"
  | "delete"
  | "improve-with-ai"
  | "bind-to-cms"
  | "add-interaction"
  | "replace-with-block";

export interface ElementAction {
  id: ElementActionId;
  label: string | ((ctx: ElementActionContext) => string);
  /** A muted second line under the label (board 30: "on this page (6)"). */
  detail?: (ctx: ElementActionContext) => string;
  /** MenuIcon name (canvas menu). */
  icon: string;
  shortcut?: string;
  /** The engine command the action runs, when it has one. */
  commandId?: string;
  run: (ctx: ElementActionContext) => void;
  isVisible?: (ctx: ElementActionContext) => boolean;
  /** `true`, or the reason it cannot run right now (shown on the row). */
  isEnabled?: (ctx: ElementActionContext) => true | string;
  danger?: boolean;
  /** The action's surface is an Inspector section (canvas-only door into it). */
  opensInspector?: boolean;
}

/** Element types a block can stand in for — the section-shaped ones. */
const SECTION_TYPES = new Set([
  "container", "section", "hero", "features", "header", "footer", "nav", "navbar",
  "cta", "card", "pricing", "columns", "grid", "flex",
]);

/** "H3 headings", "buttons" — what "all like this" means for this element. */
export function peerKindLabel(element: Element): string {
  const type = element.getType();
  if (type === "heading") return `${element.getTagName().toUpperCase()} headings`;
  return `${elementTypeLabel(type).toLowerCase()}s`;
}

/** Save the selection (or `elementId` alone) as a component — bindings are
 *  extracted up-front so the dialog can count the DS pre-fills. */
function requestSaveAsComponent(composer: Composer, elementId: string): void {
  const selectedIds = composer.selection?.getSelectedIds?.() ?? [];
  const selectionIds = selectedIds.length > 0 ? selectedIds : [elementId];
  const extractedBindings = composer.designSystem.tokenBindingResolver.resolveForElements(
    selectionIds,
    composer.elements.getAllElements(),
  );
  composer.emit(EVENTS.COMPONENT_SAVE_AS_REQUESTED, { selectionIds, extractedBindings });
}

const notRoot = ({ isRoot }: ElementActionContext) => !isRoot;

export const ELEMENT_ACTIONS: Record<ElementActionId, ElementAction> = {
  duplicate: {
    id: "duplicate",
    label: "Duplicate",
    icon: "copy",
    shortcut: "Cmd+D",
    commandId: "duplicate",
    /* The WHOLE selection when the element is part of it, pruned, clones
       selected (P-10) — the same command ⌘D runs. */
    run: ({ composer }) => void composer.commands.run("duplicate"),
  },
  "copy-style": {
    id: "copy-style",
    label: "Copy style",
    icon: "clipboard",
    shortcut: "Cmd+Alt+C",
    commandId: "copy-style",
    run: ({ composer }) => void composer.commands.run("copy-style"),
  },
  "paste-style": {
    id: "paste-style",
    label: "Paste style",
    icon: "clipboard-paste",
    shortcut: "Cmd+Alt+V",
    commandId: "paste-style",
    isEnabled: ({ composer }) =>
      composer.styleClipboard && Object.keys(composer.styleClipboard).length > 0 ? true : "Copy a style first",
    run: ({ composer }) => void composer.commands.run("paste-style"),
  },
  "apply-style-to-page": {
    id: "apply-style-to-page",
    /* DD-6b: one explicit action with a count, instead of a reach mode. */
    label: ({ element }) => `Apply style to all ${peerKindLabel(element)}`,
    detail: ({ composer, element }) => `on this page (${findStylePeers(composer, element).peers.length})`,
    icon: "palette",
    isVisible: notRoot,
    isEnabled: ({ composer, element }) =>
      findStylePeers(composer, element).peers.length > 0 ? true : `No other ${peerKindLabel(element)} on this page`,
    run: ({ composer, element }) => composer.emit(EVENTS.UI_APPLY_STYLE_REQUESTED, { elementId: element.getId() }),
  },
  "reset-style": {
    id: "reset-style",
    label: "Reset style",
    icon: "rotate-ccw",
    commandId: "reset-style",
    run: ({ composer, addToast }) => {
      if (!composer.commands.run("reset-style")) return;
      addToast?.({ description: "Styles reset", action: { label: "Undo", onClick: composer.history.captureUndo() } });
    },
  },
  "save-as-component": {
    id: "save-as-component",
    label: "Save as component…",
    icon: "package",
    isVisible: notRoot,
    run: ({ composer, element }) => requestSaveAsComponent(composer, element.getId()),
  },
  lock: {
    id: "lock",
    label: "Lock",
    icon: "lock",
    commandId: "lock-element",
    isVisible: ({ element, isRoot }) => !isRoot && !element.isLocked(),
    run: ({ composer, element }) => void composer.commands.run("lock-element", { elementId: element.getId() }),
  },
  unlock: {
    id: "unlock",
    label: "Unlock",
    icon: "unlock",
    commandId: "unlock-element",
    isVisible: ({ element, isRoot }) => !isRoot && element.isLocked(),
    run: ({ composer, element }) => void composer.commands.run("unlock-element", { elementId: element.getId() }),
  },
  delete: {
    id: "delete",
    label: "Delete",
    icon: "trash-2",
    shortcut: "Del",
    commandId: "delete",
    danger: true,
    isVisible: notRoot,
    /* The engine's delete: the whole selection, one transaction, decision
       #17's confirm for N > 1; useHistoryFeedback raises the Undo toast. */
    run: ({ composer }) => void composer.commands.run("delete"),
  },

  // ── Canvas-only doors (board 4428:43928) ─────────────────────────────
  "improve-with-ai": {
    id: "improve-with-ai",
    label: "Improve with AI",
    icon: "sparkles",
    /* The Inspector's ✦ chip is its AI door; the canvas row shows only when
       the shell mounted an AI handler. */
    isVisible: ({ openAI }) => Boolean(openAI),
    run: ({ openAI }) => openAI?.(),
  },
  "bind-to-cms": {
    id: "bind-to-cms",
    label: "Bind to CMS field…",
    icon: "database",
    opensInspector: true,
    isVisible: ({ element, isRoot }) => !isRoot && BINDABLE_TYPES.has(element.getType?.() ?? ""),
    /* Binding happens in the Inspector's CMS binding section (Source ·
       Collection · Field) — this reveals it for the element. */
    run: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "cms-binding" });
    },
  },
  "add-interaction": {
    id: "add-interaction",
    label: "Add interaction",
    icon: "zap",
    opensInspector: true,
    isVisible: notRoot,
    run: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "interactions" });
    },
  },
  "replace-with-block": {
    id: "replace-with-block",
    label: "Replace with block…",
    icon: "layout",
    /* Blocks are sections; offering to replace a heading with a hero is noise. */
    isVisible: ({ element, isRoot }) => !isRoot && SECTION_TYPES.has(element.getType?.() ?? ""),
    run: ({ composer, element }) => {
      composer.selection.select(element as never);
      composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" });
      requestReplaceWithBlock(composer, element.getId());
    },
  },
};

/** The Inspector's ⋯ menu, board 30 — nothing else ("---" is a rule).
 *  Lock and Unlock share a slot: only the one that applies is visible. */
export const INSPECTOR_MENU: readonly (ElementActionId | "---")[] = [
  "duplicate",
  "copy-style",
  "paste-style",
  "apply-style-to-page",
  "reset-style",
  "---",
  "save-as-component",
  "lock",
  "unlock",
  "---",
  "delete",
];

export function actionLabel(action: ElementAction, ctx: ElementActionContext): string {
  return typeof action.label === "function" ? action.label(ctx) : action.label;
}
