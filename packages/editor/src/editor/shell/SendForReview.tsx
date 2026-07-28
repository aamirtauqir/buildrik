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
import { Button, FormField, Input, Popover, Textarea } from "@/editor/ui";
import type { Composer } from "../../engine";
import { submitForReview } from "../../services/ReviewService";
import { exportPublishPages } from "./exportPublishPages";

export interface SendForReviewProps {
  composer: Composer | null;
  /** Viewers cannot send — the control stays visible with the reason attached. */
  disabledReason?: string;
  /** Refresh the topbar's review pill once a send lands. */
  onSent?: () => void;
}

type SendState = "idle" | "sending" | "sent" | "error";

const LABEL: Record<SendState, string> = {
  idle: "Send for review",
  sending: "Sending…",
  sent: "Sent for review ✓",
  error: "Retry send",
};

export const SendForReview: React.FC<SendForReviewProps> = ({ composer, disabledReason, onSent }) => {
  const [state, setState] = React.useState<SendState>("idle");
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [note, setNote] = React.useState("");

  const send = React.useCallback(async () => {
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
  }, [composer, note, summary, email, onSent]);

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Send for review"
      trigger={
        <Button
          kind="primary"
          size="sm"
          onClick={() => state !== "sent" && setOpen((v) => !v)}
          disabled={Boolean(disabledReason) || state === "sending" || state === "sent"}
          title={disabledReason}
        >
          {LABEL[state]}
        </Button>
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
          <Button kind="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button kind="primary" size="sm" loading={state === "sending"} onClick={() => void send()}>
            Send
          </Button>
        </div>
      </div>
    </Popover>
  );
};

export default SendForReview;
