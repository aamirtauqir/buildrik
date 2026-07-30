/**
 * Modal — Figma component set 19:79 (Kind: question | flow | form).
 *
 * Destructive confirmations name the action in the button ("Delete 3 pages"),
 * never "Confirm" — the Figma board carries that note for a reason: a user who
 * skims the title and reads only the button must still know what happens.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { OverlayMount } from "./OverlayMount";

export type ModalKind = "question" | "flow" | "form";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  kind?: ModalKind;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissOnScrimClick?: boolean;
}

/**
 * Is ANY modal dialog holding the keyboard right now?
 *
 * The F9 rule, exported from the modal owner so every window-level keyboard
 * handler can honour it: an open `aria-modal` dialog owns the keyboard —
 * global shortcuts (C, ?, ⌘K, ⌘S, undo) and capture-phase Esc handlers must
 * stand down, or they fire behind the dialog (live-reproduced: C mounted the
 * comment layer under the shortcuts modal; Esc killed comment mode and left
 * the modal open).
 */
export function isModalOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}

export function Modal({
  open, onClose, title, subtitle, kind = "question", children, footer, dismissOnScrimClick,
}: ModalProps) {
  const titleId = React.useId();
  return (
    <OverlayMount open={open} onClose={onClose} labelledBy={titleId} dismissOnScrimClick={dismissOnScrimClick}>
      <div className={`bk-modal bk-modal--${kind}`}>
        <div className="bk-modal__head">
          <span className="bk-modal__title" id={titleId}>
            {title}
          </span>
          {subtitle ? <span className="bk-modal__subtitle">{subtitle}</span> : null}
        </div>
        {children ? <div className="bk-modal__body">{children}</div> : null}
        {footer ? <div className="bk-modal__foot">{footer}</div> : null}
      </div>
    </OverlayMount>
  );
}
