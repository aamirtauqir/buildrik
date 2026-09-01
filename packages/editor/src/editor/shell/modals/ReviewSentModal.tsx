/**
 * Send-for-review outcome — Figma boards 129:2 (sending), 129:223 (sent),
 * 129:451 (email failed), page 1:3 of g4GzQFqzNYz5sosz1QtZXC.
 *
 * The link was created and the user never saw it. `SendForReview` captured
 * `reviewUrl` into state and then ran `setOpen(inviteEmailSent === false)`, so
 * on the SUCCESS path the popover simply closed — the round existed, the link
 * existed, and the only way to reach it was to fail. All three boards draw the
 * link with Copy and Open; the shipped surface drew it only when the mail
 * bounced.
 *
 * Board geometry (each modal centred on 1440x900):
 *   sending  modal/Sending      440x168 @ 500,366 — spinner + one line
 *   sent     modal/Sent         560x268 @ 440,316 — link row, Emailed-to, 1 button
 *   error    modal/Email failed 560x300 @ 440,300 — link row, reassurance, 2 buttons
 * 440 and 560 are `question` and `form` in ModalParts' own size map, so the
 * boards and the design system already agree on these widths.
 *
 * Sample data on the boards ("Bella Cucina", "v3", "sara@bellacucina.com",
 * "9fA2…") is not conformed to literally — the SHAPE is the contract.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalRoot, ModalContent, ModalTitle, Spinner, TYPE_BODY_CLASS, TYPE_HINT_CLASS } from "@/editor/chrome-ui";

export type ReviewSendState = "sending" | "sent" | "email-failed";

export interface ReviewSentModalProps {
  state: ReviewSendState | null;
  /** The review link. Absent only if the server returned none. */
  reviewUrl?: string | null;
  /** Who the invite went to, for the "Emailed to …" line. */
  invitedEmail?: string | null;
  /** Version label for "Review link created for {v}". */
  versionLabel?: string | null;
  onClose: () => void;
  /** Error state offers a retry of the email. */
  onResend?: () => void;
}

/* The ramp, not hand-picked sizes — `gate:design-debt-ratchet` caught a 17px
   title here, and it was right to: a one-off size is how a type scale rots. */
const SUB = `tw:m-0 ${TYPE_BODY_CLASS} tw:text-[var(--bk-ink-soft)]`;
const FOOT = `tw:m-0 ${TYPE_HINT_CLASS}`;
/* Board: link row 512x40 inside a 560 modal with 24 padding — 512 is what is
   left, so the row fills the body rather than carrying a width of its own. */
const LINK_ROW =
  "tw:flex tw:h-10 tw:items-center tw:gap-2 tw:rounded-md tw:border tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-bg-subtle)] tw:px-3";
const LINK_TEXT =
  `tw:flex-1 tw:min-w-0 tw:truncate ${TYPE_BODY_CLASS} tw:[font-family:var(--bk-font-mono)]`;

export const ReviewSentModal: React.FC<ReviewSentModalProps> = ({
  state, reviewUrl, invitedEmail, versionLabel, onClose, onResend,
}) => {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => { setCopied(false); }, [state]);

  const copy = React.useCallback(() => {
    if (!reviewUrl) return;
    void navigator.clipboard?.writeText(reviewUrl)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }, [reviewUrl]);

  if (!state) return null;

  /* Copy and Open only mean anything with a URL behind them. Rendering them
     dead would repeat the defect this modal exists to fix. */
  const linkRow = reviewUrl ? (
    <div className={LINK_ROW}>
      <span className={LINK_TEXT} title={reviewUrl}>{reviewUrl}</span>
      <Button color="light" size="xs" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</Button>
      <Button color="light" size="xs" onClick={() => window.open(reviewUrl, "_blank", "noopener,noreferrer")}>
        Open
      </Button>
    </div>
  ) : null;

  if (state === "sending") {
    return (
      <ModalRoot open onOpenChange={() => { /* busy: not dismissible */ }}>
        <ModalContent size="question" srTitle="Creating review link">
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:px-6 tw:py-8">
            <Spinner size="md" />
            <p className={SUB}>Creating review link…</p>
          </div>
        </ModalContent>
      </ModalRoot>
    );
  }

  const failed = state === "email-failed";
  return (
    <ModalRoot open onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent size="form" srTitle={failed ? "Email failed" : "Sent"}>
        <div className="tw:flex tw:flex-col tw:gap-3 tw:p-6">
          <ModalTitle inset={false}>{failed ? "We couldn't send the email." : "Sent ✓"}</ModalTitle>
          <p className={SUB}>
            {failed
              ? "The review link was created and still works — send it yourself."
              : `Review link created${versionLabel ? ` for ${versionLabel}` : ""}.`}
          </p>
          {linkRow}
          <p className={FOOT}>
            {failed
              ? "Nothing was lost. The link exists whether or not the mail lands."
              : invitedEmail
                ? `Emailed to ${invitedEmail}`
                : "No email was sent — share the link yourself."}
          </p>
          <div className="tw:mt-2 tw:flex tw:justify-end tw:gap-2">
            {failed && onResend ? (
              <Button color="light" size="xs" onClick={onResend}>Try email again</Button>
            ) : null}
            <Button size="xs" onClick={onClose}>Done</Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};

export default ReviewSentModal;
