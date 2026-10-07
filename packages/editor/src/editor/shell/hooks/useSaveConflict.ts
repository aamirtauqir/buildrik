/**
 * useSaveConflict — is a save conflict pending, and the way back into its
 * dialog (Inspector v4 board 29, Q4). The Inspector goes read-only while it
 * is pending and says so ("This site changed elsewhere — resolve to keep
 * editing · Resolve").
 *
 * The sync provider owns the conflict: it holds the server token from the
 * refused save until Overwrite or a fresh load, and announces both ends on
 * `window`. `resolve` re-sends SAVE_CONFLICT_EVENT with the held token (and
 * whether it is a brand-format refusal), so
 * AquibraStudio's existing listener reopens ConflictModal (AquibraStudio is
 * not edited).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  getPendingConflictToken,
  isBrandFormatConflict,
  isSaveConflictPending,
  SAVE_CONFLICT_CLEARED_EVENT,
  SAVE_CONFLICT_EVENT,
} from "@/services/BuildrikSyncProvider";

export interface SaveConflict {
  pending: boolean;
  /** Reopen the conflict dialog. */
  resolve: () => void;
}

const reopen = () => {
  const token = getPendingConflictToken();
  if (token === null) return;
  window.dispatchEvent(
    new CustomEvent(SAVE_CONFLICT_EVENT, { detail: { serverLastEditedAt: token, brandFormat: isBrandFormatConflict() } }),
  );
};

export function useSaveConflict(): SaveConflict {
  const [pending, setPending] = React.useState(isSaveConflictPending);

  React.useEffect(() => {
    /* Read the provider on every signal, not the event's direction: a stale
       raise after an Overwrite must not turn the line back on. */
    const sync = () => setPending(isSaveConflictPending());
    sync();
    window.addEventListener(SAVE_CONFLICT_EVENT, sync);
    window.addEventListener(SAVE_CONFLICT_CLEARED_EVENT, sync);
    return () => {
      window.removeEventListener(SAVE_CONFLICT_EVENT, sync);
      window.removeEventListener(SAVE_CONFLICT_CLEARED_EVENT, sync);
    };
  }, []);

  return React.useMemo(() => ({ pending, resolve: reopen }), [pending]);
}
