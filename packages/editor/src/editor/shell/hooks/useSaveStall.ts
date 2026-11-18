/**
 * useSaveStall — "Not saving" (design decision 4, CEO D3 / D8): the document
 * has changed for more than 30 s and no save has been attempted.
 *
 * Read from the engine's change counter, NOT from `project:changed`: the case
 * this exists for is an open transaction (a gesture that never closed), which
 * suppresses `project:changed` — and with it autosave — while every edit
 * still bumps the counter. The age shown is of the oldest change no save has
 * picked up.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { trackEvent } from "@/shared/utils/errorTracking";

export const STALL_AFTER_MS = 30_000;
const POLL_MS = 5_000;

/** Milliseconds the oldest unsaved change has waited, once past the
 *  threshold; null while saving is keeping up. */
export function useSaveStall(composer: Composer | null, saveStatus: string | undefined): number | null {
  const [stalledFor, setStalledFor] = React.useState<number | null>(null);
  const acked = React.useRef(0);
  const firstUnsavedAt = React.useRef<number | null>(null);
  const reported = React.useRef(false);

  /* A save attempt picks up everything changed so far. */
  React.useEffect(() => {
    if (!composer || saveStatus !== "saving") return;
    acked.current = composer.getChangeSeq();
    firstUnsavedAt.current = null;
    reported.current = false;
    setStalledFor(null);
  }, [composer, saveStatus]);

  React.useEffect(() => {
    if (!composer) return;
    acked.current = composer.getChangeSeq();
    const tick = () => {
      const now = Date.now();
      /* Clean (just loaded, just saved) is never stalled, whatever the counter. */
      if (!composer.isDirty() || composer.getChangeSeq() <= acked.current) {
        if (!composer.isDirty()) acked.current = composer.getChangeSeq();
        firstUnsavedAt.current = null;
        reported.current = false;
        setStalledFor(null);
        return;
      }
      firstUnsavedAt.current ??= now;
      const waited = now - firstUnsavedAt.current;
      if (waited < STALL_AFTER_MS) {
        setStalledFor(null);
        return;
      }
      setStalledFor(waited);
      if (!reported.current) {
        reported.current = true;
        trackEvent("autosave.stalled", { transactionOpen: composer.isTransactionActive() });
      }
    };
    const timer = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(timer);
  }, [composer]);

  return stalledFor;
}
