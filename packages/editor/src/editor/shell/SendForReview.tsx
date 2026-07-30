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
import { FormField, Input, Popover, Textarea } from "@/editor/ui";
import type { Composer } from "../../engine";
import { submitForReview, type ReviewStatus } from "../../services/ReviewService";
import { exportPublishPages } from "./exportPublishPages";
import { Button, Tooltip } from "flowbite-react";

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
  reviewStatus?: ReviewStatus | null;
}

type SendState = "idle" | "sending" | "sent" | "again" | "error";

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
}) => {
  const [state, setState] = React.useState<SendState>("idle");
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
      await submitForReview(
        note.trim() || undefined,
        summary.trim() || undefined,
        email.trim() || undefined,
        snapshotPages,
      );
      setState("sent");
      setOpen(false);
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
              {LABEL[state]}
            </Button>
          </Tooltip>
        ) : (
          <Button
            size="xs"
            onClick={() => state !== "sent" && setOpen((v) => !v)}
            disabled={state === "sending" || state === "sent"}
          >
            {LABEL[state]}
          </Button>
        )
      }
    >
      <div className="bk-send-review">
        <FormField label="Client email" hint="Leave blank to keep this internal.">
          {(wiring) => (
            <Input
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
            <Input
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
            <Textarea {...wiring} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} />
          )}
        </FormField>
        {state === "error" ? (
          <p className="bk-send-review__error" role="alert">
            Couldn&apos;t send — try again.
          </p>
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
