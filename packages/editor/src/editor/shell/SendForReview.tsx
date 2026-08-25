/**
 * Send for review — the invited editor's version of Publish.
 *
 * An address invites the client and produces a signable link; no address keeps
 * the request internal. Both are real paths, so an empty field is not an error.
 *
 * The site is frozen at send: every page is rendered with the same export
 * engine publish uses, so the client reviews the version that was sent, not
 * whatever the draft has drifted to since. A render failure does not block the
 * send — the link works with or without a preview.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FormField, Popover, Button, Textarea, TextInput, Tooltip } from "@/editor/chrome-ui";
import type { Composer } from "../../engine";
import { submitForReview, type ReviewStatus } from "../../services/ReviewService";
import { exportPublishPages } from "./exportPublishPages";

export interface SendForReviewProps {
  composer: Composer | null;
  /** Viewers cannot send — the control stays visible with the reason attached. */
  disabledReason?: string;
  /** Refresh the topbar's review pill once a send lands. */
  onSent?: () => void;
  /**
   * The review round's current truth (F4). When a new round lands after our
   * send — the `at` timestamp moves, even on a pending→pending re-send — the
   * terminal "Sent ✓" unlocks into "Send again". Without this the control
   * wedged until a full reload (finding D4).
   */
  /* Narrowed from `ReviewStatus` to the one field this control actually reads.
     The round view passes a `CurrentRound`, which carries the same timestamp
     under `revision` but none of the pill fields — and inventing a pill state
     just to satisfy a type would have been a lie in the data. */
  reviewStatus?: Pick<ReviewStatus, "at"> | null;
  /** Overrides the idle trigger's label. The round view reuses this control to
   *  invite a client to a round that has none, where "Send for review" would
   *  read as a second send beside the re-send button. */
  idleLabel?: string;
}

type SendState = "idle" | "sending" | "sent" | "again" | "error";

const INVITE_FAILED =
  "tw:flex tw:flex-col tw:gap-1.5 tw:rounded-lg tw:border tw:border-[var(--bk-error)] " +
  "tw:bg-[var(--bk-error-bg)] tw:px-3 tw:py-2";

const LABEL: Record<SendState, string> = {
  idle: "Send for review",
  sending: "Sending…",
  sent: "Sent for review ✓",
  again: "Send again",
  error: "Retry send",
};

export const SendForReview: React.FC<SendForReviewProps> = ({
  composer,
  disabledReason,
  onSent,
  reviewStatus,
  idleLabel,
}) => {
  const [state, setState] = React.useState<SendState>("idle");
  /** The round landed but its invite mail did not. */
  const [inviteFailed, setInviteFailed] = React.useState(false);
  const [reviewUrl, setReviewUrl] = React.useState<string | null>(null);
  const [linkCopied, setLinkCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [note, setNote] = React.useState("");
  /** Round timestamp as of send-start — a different `at` means OUR send landed. */
  const atBeforeSendRef = React.useRef<string | null>(null);

  // F4 (decision 4A): status-driven unlock, with a short minimum display of
  // the confirmation so "Sent ✓" registers before flipping to "Send again".
  React.useEffect(() => {
    if (state !== "sent") return;
    const seenAt = reviewStatus?.at ? String(reviewStatus.at) : null;
    if (seenAt === null || seenAt === atBeforeSendRef.current) return;
    const id = window.setTimeout(() => setState("again"), 1500);
    return () => window.clearTimeout(id);
  }, [state, reviewStatus?.at]);

  const send = React.useCallback(async () => {
    atBeforeSendRef.current = reviewStatus?.at ? String(reviewStatus.at) : null;
    setState("sending");
    try {
      let snapshotPages;
      if (composer) {
        try {
          snapshotPages = await exportPublishPages(composer);
        } catch (e) {
          console.warn("[review] snapshot render failed; sending without preview", e);
        }
      }
      const outcome = await submitForReview(
        note.trim() || undefined,
        summary.trim() || undefined,
        email.trim() || undefined,
        snapshotPages,
      );
      /* The round is created either way — a mail failure must never fail the
         submit. But "Sent for review ✓" over an invite that never left the
         server is the same lie the 2026-08-25 pass spent a day removing, and
         it is the failure most likely to hit a real pilot invite: an unset
         SMTP_HOST throws straight into the server's catch. */
      setInviteFailed(outcome?.inviteEmailSent === false);
      setReviewUrl(outcome?.reviewUrl ?? null);
      setState("sent");
      setOpen(outcome?.inviteEmailSent === false);
      onSent?.();
    } catch {
      setState("error");
    }
  }, [composer, note, summary, email, onSent, reviewStatus?.at]);

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Send for review"
      trigger={
        disabledReason ? (
          /*
           * A viewer's trigger stays focusable so the reason is reachable by
           * keyboard: aria-disabled + tooltip, no onClick (native disabled
           * would hide the why). sending/sent below keep native disabled —
           * those are busy states, and busy must stay un-clickable.
           */
          <Tooltip
            content={disabledReason}
            placement="bottom-end"
            arrow={false}
            className="tw:max-w-[280px] tw:whitespace-normal"
          >
            <Button size="xs" aria-disabled="true" onClick={() => {}}>
              {state === "idle" && idleLabel ? idleLabel : LABEL[state]}
            </Button>
          </Tooltip>
        ) : (
          <Button
            size="xs"
            onClick={() => state !== "sent" && setOpen((v) => !v)}
            disabled={state === "sending" || state === "sent"}
          >
            {state === "idle" && idleLabel ? idleLabel : LABEL[state]}
          </Button>
        )
      }
    >
      <div className="bk-send-review">
        <FormField label="Client email" hint="Leave blank to keep this internal.">
          {(wiring) => (
            <TextInput
              {...wiring}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={320}
            />
          )}
        </FormField>
        <FormField label="What changed?">
          {(wiring) => (
            <TextInput
              {...wiring}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. hero copy, 2 images"
              maxLength={500}
            />
          )}
        </FormField>
        <FormField label="Note to the reviewer" hint="Optional.">
          {(wiring) => (
            <Textarea
              className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
              {...wiring}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
            />
          )}
        </FormField>
        {state === "error" ? (
          <p className="bk-send-review__error" role="alert">
            Couldn&apos;t send — try again.
          </p>
        ) : null}
        {inviteFailed ? (
          <div className={INVITE_FAILED} role="alert">
            <span className="tw:text-[13px] tw:text-[var(--bk-error)]">
              The round was created, but the invite email didn&apos;t go out.
            </span>
            <span className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">
              Nothing is lost — send your client the link yourself.
            </span>
            {reviewUrl ? (
              <Button
                color="light"
                size="xs"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(reviewUrl)
                    .then(() => setLinkCopied(true))
                    .catch(() => setLinkCopied(false));
                }}
              >
                {linkCopied ? "Link copied ✓" : "Copy the review link"}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="bk-send-review__actions">
          <Button color="light" size="xs" onClick={() => setOpen(false)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
            Cancel
          </Button>
          <Button size="xs" disabled={state === "sending"} onClick={() => void send()} aria-busy={state === "sending" || undefined}>
            Send
          </Button>
        </div>
      </div>
    </Popover>
  );
};

export default SendForReview;
