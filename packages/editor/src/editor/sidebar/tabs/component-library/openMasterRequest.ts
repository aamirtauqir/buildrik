/**
 * openMasterRequest — "Edit master ›" (boards 6881:68947, 6918:74827).
 *
 * The door lives in the inspector; the master's screen lives in the Components
 * panel, which may not be mounted yet. The request is held until the panel's
 * state hook takes it on mount, and an already-mounted panel hears the event.
 * Same shape as build/insertGroupRequest.ts.
 *
 * §13: the door is on an instance, so the request carries it — the master's
 * screen offers "‹ Back to instance" and re-selects it.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";

export interface OpenMasterRequest {
  componentId: string;
  /** The instance the door was opened on. */
  instanceId?: string;
}

const pending = new WeakMap<Composer, OpenMasterRequest>();

export function requestOpenMaster(composer: Composer, componentId: string, instanceId?: string): void {
  const request: OpenMasterRequest = instanceId ? { componentId, instanceId } : { componentId };
  pending.set(composer, request);
  composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" });
  composer.emit(EVENTS.UI_COMPONENTS_OPEN_MASTER, request);
}

export function takePendingMaster(composer: Composer): OpenMasterRequest | undefined {
  const id = pending.get(composer);
  pending.delete(composer);
  return id;
}
