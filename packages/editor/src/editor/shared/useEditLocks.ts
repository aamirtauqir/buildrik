/**
 * useEditLocks — the composer's edit locks (`view`, `time-travel`,
 * `not-loaded`) as React state, re-read on `editlock:changed` (Task 1.6).
 *
 * The engine refuses every write while a lock holds; the chrome reads the same
 * set so it can stop OFFERING the edit — no drag that cannot land, no
 * selection toolbar whose buttons do nothing. One subscription shape for every
 * surface, never a per-control flag of its own.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { EditLockReason } from "@/shared/types/state";
import { EVENTS } from "@/shared/constants/events";

const NONE: readonly EditLockReason[] = [];
const REASONS: readonly EditLockReason[] = ["view", "time-travel", "not-loaded"];

export function useEditLocks(composer: Composer | null | undefined): readonly EditLockReason[] {
  const subscribe = React.useCallback(
    (listener: () => void) => {
      /* Partial composers (panel tests, the shell before init) carry no
         emitter or lock set: nothing is locked and nothing will change. */
      if (typeof composer?.on !== "function") return () => undefined;
      composer.on(EVENTS.EDIT_LOCK_CHANGED, listener);
      return () => composer.off(EVENTS.EDIT_LOCK_CHANGED, listener);
    },
    [composer],
  );
  /* The snapshot must be stable between changes: the set's contents as one
     string, turned back into a list below. */
  const key = React.useSyncExternalStore(
    subscribe,
    () => (composer?.editLocks ? [...composer.editLocks].join(",") : ""),
    () => "",
  );
  return React.useMemo(() => {
    if (!key) return NONE;
    const held = key.split(",");
    return REASONS.filter((reason) => held.includes(reason));
  }, [key]);
}
