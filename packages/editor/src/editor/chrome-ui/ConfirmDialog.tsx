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
   * `--bk-warning` (#C27803) — consequential and reversible, which is a real
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
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel, cancelLabel = "Cancel", tone = "default", busy,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
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
            onClick={onConfirm}
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
