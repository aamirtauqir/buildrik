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

/* Shared with ModalParts.tsx — "They render into the same classes, so both
   forms look identical and neither can drift from the other" (ModalParts'
   own header comment). Exported here so both compose one source of truth
   instead of two copies of the same restyle. */
export const MODAL_FRAME_BASE_CLASS =
  "tw:z-[60] tw:flex tw:flex-col tw:bg-white tw:rounded-lg tw:[box-shadow:var(--bk-shadow-overlay)] " +
  "tw:max-h-[80vh] tw:max-w-[calc(100vw-32px)] tw:[font-family:var(--bk-font-ui)]";
export const MODAL_HEAD_CLASS = "tw:flex tw:flex-col tw:gap-1 tw:pt-5 tw:px-5 tw:pb-3";
export const MODAL_TITLE_CLASS = "tw:text-base tw:font-semibold tw:text-gray-900";
export const MODAL_SUBTITLE_CLASS = "tw:text-xs tw:text-gray-500";
export const MODAL_BODY_CLASS = "tw:px-5 tw:pt-0 tw:pb-4 tw:overflow-auto tw:text-[13px] tw:text-gray-600";
export const MODAL_FOOT_CLASS =
  "tw:flex tw:items-center tw:justify-end tw:gap-2 tw:py-4 tw:px-5 tw:border-t tw:border-gray-200";

const KIND_WIDTH_CLASS: Record<ModalKind, string> = {
  question: "tw:w-[440px]",
  form: "tw:w-[560px]",
  flow: "tw:w-[720px]",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  kind?: ModalKind;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissOnScrimClick?: boolean;
  /** Board 183:16 — a form with unsaved input pulses instead of closing. */
  dirty?: boolean;
}

export function Modal({
  open, onClose, title, subtitle, kind = "question", children, footer, dismissOnScrimClick, dirty,
}: ModalProps) {
  const titleId = React.useId();
  return (
    <OverlayMount open={open} onClose={onClose} labelledBy={titleId} dismissOnScrimClick={dismissOnScrimClick} dirty={dirty}>
      <div className={[MODAL_FRAME_BASE_CLASS, KIND_WIDTH_CLASS[kind]].join(" ")}>
        <div className={MODAL_HEAD_CLASS}>
          <span className={MODAL_TITLE_CLASS} id={titleId}>
            {title}
          </span>
          {subtitle ? <span className={MODAL_SUBTITLE_CLASS}>{subtitle}</span> : null}
        </div>
        {children ? <div className={MODAL_BODY_CLASS}>{children}</div> : null}
        {footer ? <div className={MODAL_FOOT_CLASS}>{footer}</div> : null}
      </div>
    </OverlayMount>
  );
}
