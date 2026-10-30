/**
 * useJustDetached — the component an element was detached from this
 * session, while it is still a plain (non-instance) element (2L9 B4-IC06
 * 241:19230: "Hero card · local group" / "Detached · content and styles
 * retained"). Fed only by the engine's own INSTANCE_DETACHED event; an Undo
 * that makes it an instance again hides it (the instance check), and it is
 * never saved — a reload forgets it, as the board's state is "just now".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { InstanceDetachedPayload } from "@/shared/types/components";

const detached = new Map<string, string>();
const listeners = new Set<() => void>();
let version = 0;

/** Record every detach the composer announces. Mount once (ProInspector). */
export function useRecordDetaches(composer: Composer | null | undefined): void {
  React.useEffect(() => {
    if (!composer) return;
    const onDetached = (e?: InstanceDetachedPayload) => {
      if (!e?.instanceId) return;
      detached.set(e.instanceId, e.componentName);
      version += 1;
      listeners.forEach((l) => l());
    };
    composer.on(EVENTS.INSTANCE_DETACHED, onDetached);
    return () => {
      composer.off(EVENTS.INSTANCE_DETACHED, onDetached);
    };
  }, [composer]);
}

export function useJustDetached(composer: Composer | null | undefined, elementId: string): string | null {
  React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  const name = detached.get(elementId);
  if (!name || !composer) return null;
  return composer.components?.getInstanceByElementId?.(elementId) ? null : name;
}
