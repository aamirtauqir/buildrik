/**
 * useQueuedSaveLock — design-2l9 126:35760: after "Keep editing" on a leave
 * whose save was queued (offline), the record holds that submitted revision:
 * the fields are read-only, Save reads "Save pending" and Cancel is
 * unavailable, until the queued save is answered.
 *
 * The release is real, never timed: the retry queue announces every change to
 * its pending set (`onCmsSyncError` fires on a drain as well as a failure),
 * and the lock re-reads whether this record's save is still owed. A conflict
 * answer releases it to the sheet's conflict choice instead of "saved".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { isCmsConflictPending, isCmsEntrySaveOwed, onCmsSyncError } from "@/services/cmsSync";

export function useQueuedSaveLock(
  recordId: string | null,
  /** "landed": the server has the revision. "conflict": it answered that
   *  another device changed the record. */
  onRelease: (how: "landed" | "conflict") => void,
): { locked: boolean; lock: () => void } {
  const [locked, setLocked] = React.useState(false);
  const releaseRef = React.useRef(onRelease);
  releaseRef.current = onRelease;
  React.useEffect(() => {
    if (!locked || !recordId) return;
    let timer = 0;
    const check = () => {
      if (isCmsConflictPending("entry", recordId)) {
        setLocked(false);
        releaseRef.current("conflict");
      } else if (!isCmsEntrySaveOwed(recordId)) {
        setLocked(false);
        releaseRef.current("landed");
      }
    };
    /* The queue announces a drain before the replay's in-flight entry is
       cleared, so read on the next task, not inside the announcement. */
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, 0);
    };
    later();
    const off = onCmsSyncError(later);
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [locked, recordId]);
  const lock = React.useCallback(() => {
    if (recordId) setLocked(true);
  }, [recordId]);
  return { locked, lock };
}
