/**
 * UnsavedSettingsDialog — the guard on every way out of a dirty settings
 * screen (`‹ Back to Editor`, Escape, any nav row, a door, a screen's own
 * link). Three phases, one 480 dialog (2L9 page 06):
 *
 *   ask     B8-S06 238:11495 / B8-GUARD 248:20642 — "Leave without saving?",
 *           naming the screen and where the user was going. Discard changes ·
 *           Save and leave · Keep editing (primary).
 *   saving  B8-SAVING 248:20853 — "Saving {Screen} settings…", the
 *           destination, and one way back: "Stay in {Screen}". A save cannot
 *           be called off; Stay drops the destination and the result lands on
 *           the screen.
 *   failed  GAP-ST-E 277:28233 — "Couldn't save {Screen}": the user has not
 *           left; Keep editing (primary) · Retry save and leave, which saves
 *           again and goes to the same destination.
 *
 * Keep editing is the safe answer in every phase: it is the primary, it takes
 * focus, and Escape and the scrim give it — a stray key must never throw the
 * edits away. Screen and destination names come from the nav, never from the
 * board's sample copy.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_OUTLINE,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
} from "@/editor/media/components/libraryModal";

export type UnsavedGuardPhase = "ask" | "saving" | "failed";

/** Where the guarded move was going: another settings screen, a door, or out of Settings. */
export type UnsavedGuardDestination = { kind: "screen"; name: string } | { kind: "leave" };

export interface UnsavedSettingsDialogProps {
  open: boolean;
  phase: UnsavedGuardPhase;
  /** The dirty screen's title — "General", "Security headers". */
  screenName: string;
  destination: UnsavedGuardDestination;
  /** Keep editing (ask, failed) · Stay in {Screen} (saving). Also Escape and the scrim. */
  onKeepEditing(): void;
  onDiscard(): void;
  /** Save and leave (ask) · Retry save and leave (failed). */
  onSaveAndLeave(): void;
}

/* The board's 16/600 title (238:11495), 24 in — the library title is 20/30,
   and two sizes on one plain element resolve by stylesheet order, so this is
   its own string rather than an override. */
const TITLE =
  "tw:m-0 tw:px-6 tw:pt-6 tw:pb-4 tw:text-[length:var(--bk-text-16)] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]";
/* ModalBody sets 14; the board's body is 13 (same trap — not appended to a 14). */
const BODY = `${LIBRARY_MODAL_BODY} tw:text-[length:var(--bk-text-13)]`;
const NOTE = "tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

function copyFor(phase: UnsavedGuardPhase, screenName: string, destination: UnsavedGuardDestination) {
  const leaving = destination.kind === "leave";
  const where = leaving ? "the editor" : destination.name;
  if (phase === "saving") {
    return {
      title: `Saving ${screenName} settings…`,
      body: `Your destination is ${where}. Wait for the save result; if it fails, your changes stay here.`,
      note: null,
    };
  }
  if (phase === "failed") {
    return {
      title: `Couldn’t save ${screenName}`,
      body: "Your changes are still here. You have not left this screen.",
      note: `Requested destination: ${leaving ? "the editor" : destination.name}. Retry uses this same destination.`,
    };
  }
  return {
    title: "Leave without saving?",
    body: leaving
      ? `Your ${screenName} changes are unsaved. Save them before you go, or discard them.`
      : `Your ${screenName} changes are unsaved. Continue to ${destination.name} after saving or discarding them.`,
    note: null,
  };
}

export function UnsavedSettingsDialog({
  open,
  phase,
  screenName,
  destination,
  onKeepEditing,
  onDiscard,
  onSaveAndLeave,
}: UnsavedSettingsDialogProps) {
  /* The safe button takes focus on open and on every phase change. */
  const keepRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    keepRef.current?.focus();
    const id = window.setTimeout(() => keepRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open, phase]);
  const copy = copyFor(phase, screenName, destination);
  return (
    <ModalRoot open={open} onClose={onKeepEditing}>
      <ModalContent size="confirm" srTitle={copy.title} data-testid="set-unsaved" data-phase={phase}>
        <h2 className={TITLE} data-testid="set-unsaved-title">
          {copy.title}
        </h2>
        <ModalBody>
          <p className={BODY} data-testid="set-unsaved-body">
            {copy.body}
          </p>
          {copy.note ? (
            <p className={NOTE} data-testid="set-unsaved-note">
              {copy.note}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-unsaved-foot">
          {phase === "ask" ? (
            <>
              <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_OUTLINE} onClick={onDiscard} data-testid="set-unsaved-discard">
                Discard changes
              </Button>
              <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_OUTLINE} onClick={onSaveAndLeave} data-testid="set-unsaved-save">
                Save and leave
              </Button>
              <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} ref={keepRef} onClick={onKeepEditing} data-testid="set-unsaved-keep">
                Keep editing
              </Button>
            </>
          ) : phase === "saving" ? (
            <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_OUTLINE} ref={keepRef} onClick={onKeepEditing} data-testid="set-unsaved-keep">
              {`Stay in ${screenName}`}
            </Button>
          ) : (
            <>
              <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} ref={keepRef} onClick={onKeepEditing} data-testid="set-unsaved-keep">
                Keep editing
              </Button>
              <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_OUTLINE} onClick={onSaveAndLeave} data-testid="set-unsaved-save">
                Retry save and leave
              </Button>
            </>
          )}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
