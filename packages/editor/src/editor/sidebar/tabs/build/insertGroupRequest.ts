/**
 * Asking the Add panel to open one of its groups (BLOCKS, from the empty
 * canvas's "Add a block" and the canvas menu's "Replace with block…").
 *
 * Both doors switch to the Add tab and ask for the group in the same tick. If
 * Add was not the open tab, BuildTab has not mounted yet, nothing is
 * listening, and the event is lost — BLOCKS stayed closed (QA, integration
 * 5e0d47902, with Layers open). So the request is also held per composer
 * until a BuildTab mounts and takes it; an already-mounted panel hears the
 * event as before.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { InsertGroupId } from "./catalog/groups";

const pending = new WeakMap<Composer, InsertGroupId>();

export function requestInsertGroup(composer: Composer, group: InsertGroupId): void {
  pending.set(composer, group);
  composer.emit(EVENTS.UI_INSERT_OPEN_GROUP, { group });
}

/** The group asked for before this panel mounted, if any — read once. */
export function takePendingInsertGroup(composer: Composer): InsertGroupId | undefined {
  const group = pending.get(composer);
  pending.delete(composer);
  return group;
}

/* G2-055 (CI-23): "Replace with block…" opens BLOCKS with the element marked;
   the next block inserted while that element is still the selection takes
   its place instead of landing beside it. */
const replaceTargets = new WeakMap<Composer, string>();

export function requestReplaceWithBlock(composer: Composer, elementId: string): void {
  replaceTargets.set(composer, elementId);
  requestInsertGroup(composer, "blocks");
}

/** The element a block insert should replace — only while it is still the one
 *  selected element. Read once: a replace is spent by the insert that uses it. */
export function takeReplaceTarget(composer: Composer): string | undefined {
  const id = replaceTargets.get(composer);
  replaceTargets.delete(composer);
  const selected = composer.selection.getSelectedIds();
  return id && selected.length === 1 && selected[0] === id ? id : undefined;
}

/* G2-117: "Generate a block with AI…" (⌘K, the AI panel's CREATE door) opens
   Add on its Generate screen. Held until the panel mounts, like a group. */
const pendingGenerate = new WeakSet<Composer>();

export function requestGenerateBlock(composer: Composer): void {
  pendingGenerate.add(composer);
  composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" });
  composer.emit(EVENTS.UI_INSERT_OPEN_GENERATE, {});
}

export function takePendingGenerate(composer: Composer): boolean {
  const asked = pendingGenerate.has(composer);
  pendingGenerate.delete(composer);
  return asked;
}

/* ⌘⇧V (board 7063:78846): Add opens its Paste HTML dialog. Held until the
   panel mounts, like Generate. */
const pendingPasteHtml = new WeakSet<Composer>();

export function requestPasteHtml(composer: Composer): void {
  pendingPasteHtml.add(composer);
  composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" });
  composer.emit(EVENTS.UI_INSERT_OPEN_PASTE_HTML, {});
}

export function takePendingPasteHtml(composer: Composer): boolean {
  const asked = pendingPasteHtml.has(composer);
  pendingPasteHtml.delete(composer);
  return asked;
}
