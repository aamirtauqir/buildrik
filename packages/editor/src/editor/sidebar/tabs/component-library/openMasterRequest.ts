/**
 * openMasterRequest — "Edit master ›" (boards 6881:68947, 6918:74827).
 *
 * The door lives in the inspector; the master's screen lives in the Components
 * panel, which may not be mounted yet. The request is held until the panel's
 * state hook takes it on mount, and an already-mounted panel hears the event.
 * Same shape as build/insertGroupRequest.ts.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

const pending = new WeakMap<Composer, string>();

export function requestOpenMaster(composer: Composer, componentId: string): void {
  pending.set(composer, componentId);
  composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" });
  composer.emit(EVENTS.UI_COMPONENTS_OPEN_MASTER, { componentId });
}

export function takePendingMaster(composer: Composer): string | undefined {
  const id = pending.get(composer);
  pending.delete(composer);
  return id;
}
