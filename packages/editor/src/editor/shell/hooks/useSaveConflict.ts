/**
 * useSaveConflict — is a save conflict pending, and the way back into its
 * dialog (Inspector v4 board 29, Q4). The Inspector goes read-only while it
 * is pending and says so ("This site changed elsewhere — resolve to keep
 * editing · Resolve").
 *
 * W1 STUB with the final shape: never pending. Lane L2-D2 reads
 * `isSaveConflictPending()` + SAVE_CONFLICT_EVENT / SAVE_CONFLICT_CLEARED_EVENT
 * from services/BuildrikSyncProvider, and `resolve` re-dispatches
 * SAVE_CONFLICT_EVENT with the held token so AquibraStudio's existing
 * listener reopens ConflictModal (AquibraStudio is not edited).
 *
 * @license BSD-3-Clause
 */

export interface SaveConflict {
  pending: boolean;
  /** Reopen the conflict dialog. */
  resolve: () => void;
}

const NOT_PENDING: SaveConflict = { pending: false, resolve: () => undefined };

export function useSaveConflict(): SaveConflict {
  return NOT_PENDING;
}
