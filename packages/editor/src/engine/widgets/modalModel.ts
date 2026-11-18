/**
 * Modal model — the trigger↔dialog link and the dialog's behaviour
 * (design-2l9 C07 `245:39899`, C10 `245:41419`, C18 `252:46927`, B-17;
 * docs/design-2l9/engine-modal.md).
 *
 * Attributes on the elements: the dialog's `data-modal-key` and behaviour
 * (`data-modal-escape`, `data-modal-backdrop`, `data-modal-initial`), the
 * trigger's `data-modal-target`. A modal saved before keys (a `.modal-trigger`
 * and the `.modal-overlay` after it) is read by position until
 * `ensureModalLink` writes them. Each write is one history step. The published
 * behaviour is `export/modalRuntime.ts`.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { generateId } from "@/shared/utils/helpers/id";

export interface DialogBehavior {
  escape: boolean;
  backdrop: boolean;
  initial: "closed" | "open";
}

export interface ModalState {
  dialogId: string;
  key: string | null;
  triggerIds: string[];
  behavior: DialogBehavior;
  /** The dialog is a direct child of the page root (C07). */
  atPageRoot: boolean;
  /** Saved before keys: linked by position until `ensureModalLink`. */
  legacy: boolean;
}

const isDialog = (el: Element | null | undefined): boolean => !!el && el.getAttribute("role") === "dialog";

function wrap<T>(composer: Composer, label: string, fn: () => T): T {
  composer.beginTransaction(label);
  try {
    const out = fn();
    composer.endTransaction();
    return out;
  } catch (e) {
    composer.rollbackTransaction();
    throw e;
  }
}

/** Every element of the active page, in document order. */
function pageOrder(composer: Composer): Element[] {
  const root = composer.elements.getActivePage?.()?.root;
  const top = root ? composer.elements.getElement(root.id) : undefined;
  const out: Element[] = [];
  const walk = (el: Element) => {
    out.push(el);
    el.getChildren().forEach(walk);
  };
  if (top) walk(top);
  return out;
}

/** The dialog a trigger opens: by key, else (legacy) the first un-keyed dialog after it. */
function dialogOfTrigger(composer: Composer, trigger: Element): Element | null {
  const order = pageOrder(composer);
  const key = trigger.getAttribute("data-modal-target");
  if (key) return order.find((e) => isDialog(e) && e.getAttribute("data-modal-key") === key) ?? null;
  if (!(trigger.getAttribute("class") ?? "").split(/\s+/).includes("modal-trigger")) return null;
  const at = order.indexOf(trigger);
  return order.find((e, i) => i > at && isDialog(e) && !e.getAttribute("data-modal-key")) ?? null;
}

/** The dialog an element belongs to: the dialog itself, inside it, or its trigger. */
function dialogOf(composer: Composer, elementId: string): Element | null {
  const el = composer.elements.getElement(elementId);
  for (let up: Element | null = el ?? null; up; up = up.getParent()) if (isDialog(up)) return up;
  return el ? dialogOfTrigger(composer, el) : null;
}

export function readModal(composer: Composer, elementId: string): ModalState | null {
  const dialog = dialogOf(composer, elementId);
  if (!dialog) return null;
  const key = dialog.getAttribute("data-modal-key") ?? null;
  const triggers = pageOrder(composer).filter((e) => !isDialog(e) && dialogOfTrigger(composer, e) === dialog);
  const pageRootId = composer.elements.getActivePage?.()?.root.id;
  return {
    dialogId: dialog.getId(),
    key,
    triggerIds: triggers.map((t) => t.getId()),
    behavior: {
      escape: dialog.getAttribute("data-modal-escape") !== "false",
      backdrop: dialog.getAttribute("data-modal-backdrop") !== "false",
      initial: dialog.getAttribute("data-modal-initial") === "open" ? "open" : "closed",
    },
    atPageRoot: dialog.getParent()?.getId() === pageRootId,
    legacy: !key,
  };
}

/** Writes the key (and every legacy trigger's target) on a modal saved before them. */
export function ensureModalLink(composer: Composer, elementId: string): string | null {
  const state = readModal(composer, elementId);
  if (!state) return null;
  if (state.key && !state.legacy) return state.key;
  return wrap(composer, "Link modal", () => {
    const key = generateId("modal");
    composer.elements.getElement(state.dialogId)?.setAttribute("data-modal-key", key);
    for (const id of state.triggerIds) composer.elements.getElement(id)?.setAttribute("data-modal-target", key);
    return key;
  });
}

/** "Link existing dialog" (C07): the trigger opens this dialog from now on. */
export function linkModal(composer: Composer, triggerId: string, dialogId: string): boolean {
  const trigger = composer.elements.getElement(triggerId);
  const dialog = composer.elements.getElement(dialogId);
  if (!trigger || !dialog || !isDialog(dialog) || isDialog(trigger)) return false;
  wrap(composer, "Link dialog", () => {
    const key = dialog.getAttribute("data-modal-key") || ensureModalLink(composer, dialogId) || generateId("modal");
    if (!dialog.getAttribute("data-modal-key")) dialog.setAttribute("data-modal-key", key);
    trigger.setAttribute("data-modal-target", key);
  });
  return true;
}

/** "Duplicate modal" (C07): copies trigger AND dialog — the dialog stays at
 *  its root — and links the copies with a new key. The original pair is
 *  untouched. */
export function duplicateModal(composer: Composer, triggerId: string): { triggerId: string; dialogId: string } | null {
  const state = readModal(composer, triggerId);
  if (!state || !state.triggerIds.includes(triggerId)) return null;
  return wrap(composer, "Duplicate modal", () => {
    ensureModalLink(composer, triggerId);
    const trigger = composer.elements.duplicateElement(triggerId);
    const dialog = composer.elements.duplicateElement(state.dialogId);
    if (!trigger || !dialog) throw new Error("Duplicate modal: copy failed");
    const key = generateId("modal");
    dialog.setAttribute("data-modal-key", key);
    trigger.setAttribute("data-modal-target", key);
    return { triggerId: trigger.getId(), dialogId: dialog.getId() };
  });
}

/** C18 "Dialog behavior": Close on Escape, Close on backdrop click, Initial state. */
export function setDialogBehavior(composer: Composer, elementId: string, next: Partial<DialogBehavior>): void {
  const state = readModal(composer, elementId);
  const dialog = state ? composer.elements.getElement(state.dialogId) : undefined;
  if (!state || !dialog) return;
  wrap(composer, "Dialog behavior", () => {
    if (next.escape !== undefined) dialog.setAttribute("data-modal-escape", String(next.escape));
    if (next.backdrop !== undefined) dialog.setAttribute("data-modal-backdrop", String(next.backdrop));
    if (next.initial !== undefined) dialog.setAttribute("data-modal-initial", next.initial);
  });
}
