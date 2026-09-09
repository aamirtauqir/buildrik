/**
 * ConfirmDialog — a Modal with the destructive-confirmation rules baked in.
 *
 * The confirm button NAMES the action ("Delete 3 pages"), never "Confirm" —
 * the Figma board carries that note because a user who skims the title and
 * reads only the button must still know what is about to happen. Scrim-click
 * dismissal is off for destructive dialogs so a stray click cannot delete.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Modal } from "./Modal";
import { Button } from "flowbite-react";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  /** Name the action: "Delete 3 pages", not "Confirm". */
  confirmLabel: string;
  cancelLabel?: string;
  /**
   * What kind of consequence the confirm carries.
   *
   * `destructive` is red — the thing is gone. `warning` is
   * `--bk-warning` (`var(--bk-yellow-500)`) — consequential and reversible, which is a real
   * and separate category here: board 184:24's rollback confirm spends its
   * whole body saying "nothing is deleted or rewritten" and then draws an
   * amber button, because re-publishing an older version over a live site is
   * a decision, not a deletion. Measured off that board, not eyeballed.
   *
   * Both keep the scrim click from dismissing: an accidental click outside
   * should not silently drop a dialog the user was asked to decide.
   *
   * Replaces the `destructive` boolean — one prop for one concern rather
   * than a boolean per tone.
   */
  tone?: "default" | "warning" | "destructive";
  busy?: boolean;
  /** Forwarded to Modal, which stamps `<testId>` on the frame and
   *  `<testId>-foot` on the footer; the confirm button takes `<testId>-confirm`
   *  so a recipe can drive the dialog to its own result state. Confirms are
   *  otherwise unaddressable:
   *  they carry no id of their own, and a conformance recipe may only target
   *  by data-testid. */
  testId?: string;
  /**
   * Board 183:60 — `Modal · success-then-close`. When the confirmed action has
   * nothing to wait for, the dialog does not simply vanish: it says what it
   * did, then closes itself. The sibling boards of this family (183:31
   * submitting, 183:43 error) are `blocked:sync-delete` in boards.json for the
   * mirror of the same reason — a synchronous delete has no pending or failing
   * state, but it does have a result worth reporting, and a toast fired from
   * somewhere else is not that report.
   *
   * Absent, the dialog behaves as it always did and the caller closes it.
   */
  success?: { title: string; message: string };
}

/** Long enough to read "3 pages deleted.", short enough not to be a step. */
const SUCCESS_CLOSE_MS = 1400;

/* Board 183:60's card: a 40 success disc, the result at 13/20 ink, then
   "Closing…" at 11/16 muted, centred on a 392 column — the modal's 440 less
   24 a side, so this block adds 8 to MODAL_BODY_CLASS's 16 rather than
   restating the padding and drifting from it. */
const SUCCESS_BODY = "tw:px-2 tw:pt-4 tw:pb-6 tw:text-center";
/* `--bk-success-text`, not `--bk-success`: board 183:67 fixes the mark at
   16/600 white, and white on `var(--bk-green-500)` is 3.39 — under the 4.5 a 16px face needs
   (WCAG large-text relief starts at 18.66px bold). `var(--bk-green-600)` carries the same
   green at 5.36. The board's own disc is an exported SVG asset, so its fill is
   not a value this can conform to either way. */
const SUCCESS_DISC =
  "tw:mx-auto tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-[var(--bk-success-text)]";
const SUCCESS_MARK = "tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-white";
const SUCCESS_MESSAGE = "tw:m-0 tw:mt-4 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const SUCCESS_CLOSING = "tw:m-0 tw:mt-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel, cancelLabel = "Cancel", tone = "default", busy, testId, success,
}: ConfirmDialogProps) {
  const [done, setDone] = React.useState(false);

  /* Through a ref because callers pass an inline arrow: a plain dependency
     would restart the close timer on every parent render, and a dialog that
     re-arms its own countdown never reaches zero. */
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    if (!open) setDone(false);
  }, [open]);

  React.useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => closeRef.current(), SUCCESS_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [done]);

  if (open && done && success) {
    return (
      <Modal
        open
        onClose={onClose}
        title={success.title}
        testId={testId}
        kind="question"
        dismissOnScrimClick={false}
      >
        <div className={SUCCESS_BODY} role="status">
          <span className={SUCCESS_DISC} aria-hidden="true">
            <span className={SUCCESS_MARK} data-testid="confirm-success-mark">
              ✓
            </span>
          </span>
          <p className={SUCCESS_MESSAGE} data-testid="confirm-success-message">
            {success.message}
          </p>
          <p className={SUCCESS_CLOSING} data-testid="confirm-success-closing">
            Closing…
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      testId={testId}
      kind="question"
      dismissOnScrimClick={tone === "default"}
      footer={
        <>
          <Button
            color="light"
            size="xs"
            onClick={onClose}
            className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
          >
            {cancelLabel}
          </Button>
          <Button
            color={tone === "destructive" ? "red" : undefined}
            className={
              tone === "warning"
                ? "tw:bg-[var(--bk-warning)] tw:hover:bg-[var(--bk-warning)] tw:text-white tw:border-transparent"
                : undefined
            }
            size="xs"
            disabled={busy}
            aria-busy={busy || undefined}
            data-testid={testId ? `${testId}-confirm` : undefined}
            onClick={() => {
              onConfirm();
              if (success) setDone(true);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
