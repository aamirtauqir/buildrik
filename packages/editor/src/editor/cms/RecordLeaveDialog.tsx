/**
 * RecordLeaveDialog — leaving a CMS record with unsaved edits for a PAGE
 * picked in the Pages drawer over the workspace (design-2l9 122:44151 ask,
 * 125:35603 the page already on the canvas, 126:36130 saving, 122:44343 save failed, 125:35409 queued, 126:36751 the
 * page was removed). One dialog that follows the real save: it stays up while
 * "Save and leave" runs and says what happened; the page opens only after a
 * confirmed save (RecordSheet decides, this only draws).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal } from "@/editor/chrome-ui";

export type RecordLeavePhase = "ask" | "saving" | "failed" | "queued" | "refused" | "removed";

export interface RecordLeaveDialogProps {
  phase: RecordLeavePhase | null;
  /** "Blog record “Studio launch”". */
  recordLabel: string;
  /** The collection, for "Your Blog record draft is still here". */
  collectionName: string;
  /** The page asked for ("About"). */
  to: string;
  /** The page on the canvas now ("Home") — it stays unchanged. */
  current: string | null;
  /** The page asked for is the one already on the canvas (125:35603). */
  toIsCurrent?: boolean;
  /** The server's refusal (a published record broke the collection's rules). */
  reason?: string | null;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onSaveAndLeave: () => void;
  onRetry: () => void;
  canSave: boolean;
  keepRef?: React.Ref<HTMLButtonElement>;
}

const NOTE = "tw:m-0 tw:mt-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
/* 122:44151 stacks the three answers full width, the safe one filled. */
const STACK_BTN = "tw:h-8 tw:w-full tw:justify-center tw:text-[13px]";

export function RecordLeaveDialog({
  phase,
  recordLabel,
  collectionName,
  to,
  current,
  toIsCurrent = false,
  reason,
  onKeepEditing,
  onDiscard,
  onSaveAndLeave,
  onRetry,
  canSave,
  keepRef,
}: RecordLeaveDialogProps) {
  if (phase === null) return null;
  const keep = (
    <Button ref={keepRef} variant="primary" className={phase === "ask" ? STACK_BTN : undefined} onClick={onKeepEditing} data-testid="cms-leave-keep">
      Keep editing
    </Button>
  );
  const copy: Record<RecordLeavePhase, { title: string; body: string; note: string }> = {
    ask: {
      title: "Leave without saving?",
      body: `${recordLabel} has unsaved changes. You asked to open ${to}${toIsCurrent ? " in Editor" : ""}.`,
      note: toIsCurrent
        ? `${to} is still the remembered canvas page. Returning to it leaves this record form.`
        : `Only this record’s draft is affected.${current ? ` Your ${current} page remains unchanged.` : ""}`,
    },
    saving: {
      title: "Leave without saving?",
      body: `${recordLabel} · Saving…`,
      note: `After a confirmed save: Open ${to}. Keep editing cancels navigation; the save will continue.`,
    },
    failed: {
      title: "Leave without saving?",
      body: `Couldn’t save ${recordLabel}. Your changes are kept; ${to} has not been opened.`,
      note: "The server could not save this record. Retry uses the same record and draft.",
    },
    queued: {
      title: "Leave without saving?",
      body: `${recordLabel} is queued. We haven’t received confirmation from the server, so ${to} has not been opened.`,
      note: "Offline — this record will save when you reconnect. Waiting is not confirmation.",
    },
    refused: {
      title: "Leave without saving?",
      body: `Couldn’t save ${recordLabel}. Your changes are kept; ${to} has not been opened.`,
      note: reason ?? "Fix the record, then save again.",
    },
    removed: {
      title: `${to} is no longer available`,
      body: `The page you asked to open was removed. Your ${collectionName} record draft is still here.`,
      note: "No different page has been opened. Return to this record before choosing another destination.",
    },
  };
  const { title, body, note } = copy[phase];
  return (
    <Modal
      open
      onClose={onKeepEditing}
      title={title}
      kind="form"
      width="sm"
      testId="cms-leave"
      footer={
        phase === "ask" ? (
          <div className="tw:flex tw:w-full tw:flex-col tw:gap-2">
            {keep}
            <Button variant="secondary" className={STACK_BTN} onClick={onDiscard} data-testid="cms-leave-discard">
              Discard changes
            </Button>
            <Button variant="secondary" className={STACK_BTN} disabled={!canSave} onClick={onSaveAndLeave} data-testid="cms-leave-save">
              Save and leave
            </Button>
          </div>
        ) : phase === "failed" ? (
          <>
            {keep}
            <Button variant="secondary" onClick={onRetry} data-testid="cms-leave-retry">
              Retry save
            </Button>
          </>
        ) : (
          keep
        )
      }
    >
      <p className="tw:m-0" data-testid="cms-leave-body">
        {body}
      </p>
      <p className={NOTE} data-testid="cms-leave-note">
        {note}
      </p>
    </Modal>
  );
}
