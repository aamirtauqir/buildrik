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
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  /** Name the action: "Delete 3 pages", not "Confirm". */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel, cancelLabel = "Cancel", destructive, busy,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      kind="question"
      dismissOnScrimClick={!destructive}
      footer={
        <>
          <Button kind="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button kind={destructive ? "destructive" : "primary"} size="sm" loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
