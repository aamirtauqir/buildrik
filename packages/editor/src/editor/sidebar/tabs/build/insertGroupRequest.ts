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
