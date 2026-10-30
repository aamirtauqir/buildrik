/**
 * RequestChangesDialog — the client's "Request changes" on the review page
 * (2L9 GAP-RV-Desktop-changes 276:30195 → posting 276:30262 → resolving
 * 276:30321, failures 276:30380 / 276:30499).
 *
 * The note is posted first and the round is marked Changes requested only
 * once it lands, so the dialog has two waits and two different failures:
 * a note that never posted (the draft is kept, Try again sends both), and a
 * note that posted while the round stayed open (Retry status only resolves —
 * it never posts the note twice).
 *
 * Presentational: the page owns the mutations and passes the phase in.
 *
 * @license BSD-3-Clause
 */
"use client";

import { Button, Modal } from "@/components/dashboard/primitives";

export type RequestChangesPhase = "ask" | "posting" | "resolving" | "round-failed" | "note-failed";

const BODY = "text-[13px] leading-5 text-[#111827]";
const QUOTE = "whitespace-pre-wrap text-[13px] leading-5 text-[#111827]";
const MUTED = "mt-1 text-[13px] leading-5 text-[#4B5563]";

export function RequestChangesDialog({
  phase,
  round,
  draft,
  onDraft,
  onCancel,
  onSubmit,
  onCheckStatus,
  onRetryStatus,
  onKeepEditing,
}: {
  phase: RequestChangesPhase | null;
  round: number;
  draft: string;
  onDraft: (value: string) => void;
  /** Cancel, Keep editing's way back to the field, Back to review. */
  onCancel: () => void;
  /** Post the note (if any), then mark the round — Request changes / Try again. */
  onSubmit: () => void;
  /** Re-read what the server holds while a step is pending. */
  onCheckStatus: () => void;
  /** Mark the round again without posting the note again. */
  onRetryStatus: () => void;
  /** Back to the note field with the draft. */
  onKeepEditing: () => void;
}) {
  const quoted = `“${draft.trim()}”`;
  const title =
    phase === "posting"
      ? "Posting your note…"
      : phase === "resolving"
        ? "Requesting changes…"
        : phase === "round-failed"
          ? "Your note was posted; the round is still open"
          : phase === "note-failed"
            ? "Your note wasn’t posted"
            : `Request changes to Round ${round}?`;
  const waiting = phase === "posting" || phase === "resolving";

  const footer =
    phase === "ask" ? (
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} data-testid="rc-submit">
          Request changes
        </Button>
      </div>
    ) : waiting ? (
      <div className="flex justify-start">
        <Button variant="ghost" onClick={onCheckStatus} data-testid="rc-check">
          Check status
        </Button>
      </div>
    ) : phase === "round-failed" ? (
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          Back to review
        </Button>
        <Button onClick={onRetryStatus} data-testid="rc-retry-status">
          Retry status
        </Button>
      </div>
    ) : (
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onKeepEditing} data-testid="rc-keep-editing">
          Keep editing
        </Button>
        <Button onClick={onSubmit} data-testid="rc-try-again">
          Try again
        </Button>
      </div>
    );

  return (
    <Modal open={phase !== null} onClose={waiting ? () => undefined : onCancel} title={title} width={480} footer={footer}>
      {phase === "ask" ? (
        <>
          <p className={BODY}>Your note will be posted before this round is marked Changes requested.</p>
          <textarea
            value={draft}
            onChange={(e) => onDraft(e.target.value)}
            aria-label="Your note"
            maxLength={2000}
            className="mt-3 h-[88px] w-full resize-none rounded-md border border-[#D1D5DB] px-3 py-2 text-[13px] text-[#111827] outline-none focus:border-[#1A56DB]"
          />
        </>
      ) : phase === "posting" ? (
        <>
          <p className={QUOTE}>{draft.trim()}</p>
          <p className={MUTED}>Your draft is kept until the comment is confirmed.</p>
        </>
      ) : phase === "resolving" ? (
        <>
          <p className={BODY}>{draft.trim() ? `Your note was posted: ${quoted}` : "No note was added."}</p>
          <p className={MUTED}>{`Waiting to mark Round ${round} as Changes requested.`}</p>
        </>
      ) : phase === "round-failed" ? (
        <>
          {draft.trim() ? <p className={QUOTE}>{quoted}</p> : null}
          <p className={MUTED}>Retry only updates the round status. It won’t post your note again.</p>
        </>
      ) : phase === "note-failed" ? (
        <>
          <p className={QUOTE}>{quoted}</p>
          <p className={MUTED}>{`Draft kept. Round ${round} is still open.`}</p>
        </>
      ) : null}
    </Modal>
  );
}
