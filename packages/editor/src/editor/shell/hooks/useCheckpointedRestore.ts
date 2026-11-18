/**
 * useCheckpointedRestore — the one rule for restoring a history entry: save a
 * "Before restoring" version first, so the restore has a way back.
 *
 * Time-travel and the History panel's Session list both restore an entry, and
 * only Time-travel saved the version (R1 H-1). Each caller passes its own
 * `apply` (the Session list crossfades the canvas; Time-travel does not).
 *
 * If the version fails to save, restoring anyway would overwrite the current
 * state with no copy of it (DQ-011) — so stop and say so; the user can still
 * choose to. A null result is not a failure: it means nothing changed since the
 * newest auto-version, which already is the way back.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { useToast } from "@/editor/chrome-ui";

export function useCheckpointedRestore(
  composer: Composer | null | undefined,
  apply: (entryId: string) => void,
): (entryId: string) => Promise<void> {
  const { addToast } = useToast();
  return React.useCallback(
    async (entryId: string) => {
      if (!composer) return;
      try {
        await composer.versions?.autoCheckpoint?.("Before restoring");
      } catch (error) {
        addToast({
          tone: "error",
          title: "Couldn't save a version first",
          description: `Nothing was restored, so your current work is untouched (${
            error instanceof Error ? error.message : String(error)
          }).`,
          action: { label: "Restore anyway", onClick: () => apply(entryId) },
        });
        return;
      }
      apply(entryId);
    },
    [composer, apply, addToast],
  );
}
