/**
 * SessionExpiredModal — signed out mid-session with unsaved work (2L9 B7-G03
 * `225:3353`), and the persistent banner it leaves behind (B7-G04 `225:3888`).
 *
 * The truths this surface tells, verified against the code:
 *  · Unsaved work lives in THIS TAB. It is also "in this browser" only when
 *    a failed save kept a copy (`bk-unsaved-v1-<site>`) — said only then.
 *  · Signing in from another same-origin tab restores the cookie; every tRPC
 *    call sends credentials fresh, so "Try saving again" then succeeds with
 *    no reload and no state loss.
 *  · Sign in opens a NEW tab — a same-tab redirect would destroy the very
 *    work this surface exists to protect.
 *
 * The count is the history stack since the last save — the honest
 * approximation of "your N changes" (there is no per-change save marker).
 * The labels list it used to show folds into that count: the board draws a
 * number, not a list (L-F code-ahead disposition).
 *
 * Keep editing (and Escape / the scrim, which map to it) leaves the G04
 * banner in the global slot — "changes aren't saving" stays on screen while
 * edits keep queueing — and the next save that lands clears it, saying
 * "Signed in again — N changes saved" (B7-G05 `225:4416`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalRoot, ModalTitle, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { readUnsaved } from "@/services/unsavedRecovery";
import type { SaveOutcome } from "../hooks/useSaveCallback";
import { BANNER_ID, clearGlobalBanner, showSessionExpiredBanner } from "../globalBanners";
import { DIALOG_ACTION, DIALOG_ACTIONS, DIALOG_BODY, DIALOG_FRAME, DIALOG_TITLE } from "./recoveryDialog";

export interface SessionExpiredModalProps {
  open: boolean;
  composer: Composer | null;
  /** Watermark for "changes since the last successful save". */
  lastSavedAt: number | null;
  onRetry: () => Promise<SaveOutcome>;
  onKeepEditing: () => void;
}

/** Changes on the history stack since the watermark. */
function changesSince(composer: Composer | null, lastSavedAt: number | null): number {
  if (!composer) return 0;
  try {
    const stack = composer.history.getHistoryStack();
    return (lastSavedAt ? stack.filter((e) => e.timestamp > lastSavedAt) : stack).length;
  } catch {
    return 0;
  }
}

function signIn(): void {
  window.open(`${DASHBOARD_URL}/auth?reason=session-expired`, "_blank", "noopener");
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  open,
  composer,
  lastSavedAt,
  onRetry,
  onKeepEditing,
}) => {
  const [retrying, setRetrying] = React.useState(false);
  const [retryFailed, setRetryFailed] = React.useState(false);
  const count = React.useMemo(() => (open ? changesSince(composer, lastSavedAt) : 0), [open, composer, lastSavedAt]);
  const siteId = getSiteIdFromUrl();
  const keptInBrowser = open && siteId !== null && readUnsaved(siteId) !== null;

  const { addToast } = useToast();
  /* The changes held when the session expired, until a save lands. */
  const heldRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (open && heldRef.current === null) heldRef.current = count;
  }, [open, count]);

  /* A save that lands means the session is back: the G04 banner goes, and
     G05 says what went through. */
  const savedAtRef = React.useRef(lastSavedAt);
  React.useEffect(() => {
    clearGlobalBanner(BANNER_ID.sessionExpired);
    const advanced = lastSavedAt !== null && lastSavedAt !== savedAtRef.current;
    savedAtRef.current = lastSavedAt;
    const held = heldRef.current;
    if (!advanced || held === null) return;
    heldRef.current = null;
    addToast({
      tone: "success",
      description:
        held > 0 ? `Signed in again — ${held} ${held === 1 ? "change" : "changes"} saved` : "Signed in again — your changes are saved",
    });
  }, [lastSavedAt, addToast]);

  const keepEditing = () => {
    showSessionExpiredBanner(signIn);
    onKeepEditing();
  };

  const retry = async () => {
    setRetrying(true);
    setRetryFailed(false);
    try {
      const outcome = await onRetry();
      // Success closes via the parent's saveState watcher; a still-dead
      // session lands back here with the inline hint.
      if (outcome !== "saved") setRetryFailed(true);
    } finally {
      setRetrying(false);
    }
  };

  const changes = count > 0 ? `Your ${count} ${count === 1 ? "change is" : "changes are"}` : "Your changes are";
  const where = keptInBrowser ? "in this tab and in this browser" : "in this tab";

  /* 2L9 B7-G03 225:3353: 480 × 176 in the recovery dialogs' layout. */
  return (
    <ModalRoot open={open} onOpenChange={(o) => !o && keepEditing()}>
      <ModalContent size="confirm" srTitle="Sign in again to save">
        <div className={DIALOG_FRAME} data-testid="session-expired-dialog">
          <ModalTitle inset={false} className={DIALOG_TITLE}>
            Sign in again to save
          </ModalTitle>
          <p className={DIALOG_BODY} data-testid="session-expired-body">
            Your session expired. {changes} kept {where}. Sign in again to save {count === 1 ? "it" : "them"}.
          </p>
          {retryFailed && (
            <p role="alert" className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-error-text)]">
              Still signed out — finish signing in first, then try again.
            </p>
          )}
          <div className={DIALOG_ACTIONS}>
            <Button color="light" size="sm" className={DIALOG_ACTION} onClick={keepEditing}>
              Keep editing
            </Button>
            <Button color="light" size="sm" className={DIALOG_ACTION} disabled={retrying} onClick={retry}>
              {retrying ? "Saving…" : "Try saving again"}
            </Button>
            <Button size="sm" className={`${DIALOG_ACTION} tw:px-6`} onClick={signIn}>
              Sign in ↗
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};
