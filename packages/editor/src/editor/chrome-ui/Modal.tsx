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
  "tw:z-[60] tw:flex tw:flex-col tw:bg-[var(--bk-bg-elevated)] tw:rounded-xl tw:[box-shadow:var(--bk-shadow-overlay)] " +
  "tw:max-h-[80vh] tw:max-w-[calc(100vw-32px)] tw:[font-family:var(--bk-font-ui)]";
/* 16/14, not 20 — measured on 1164:4713, 1175:4827, 1205:4804 (media),
   1170:4713/4749 (content), 1172:4840 (brand) and 184:24 (publish). */
export const MODAL_HEAD_CLASS = "tw:flex tw:flex-col tw:gap-1 tw:pt-4 tw:px-4 tw:pb-3";
export const MODAL_TITLE_CLASS = "tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:text-[var(--bk-ink)]";
export const MODAL_SUBTITLE_CLASS = "tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]";
export const MODAL_BODY_CLASS = "tw:px-4 tw:pt-0 tw:pb-4 tw:overflow-auto tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-soft)]";
/* The footer caps its buttons at 28: every one of those boards draws 28-29,
   and flowbite's default is 40. Two classes deep so a `tw:` utility on the
   button cannot lose to it on source order (CLAUDE.md §Chrome). */
export const MODAL_FOOT_CLASS =
  "tw:flex tw:items-center tw:justify-end tw:gap-2 tw:py-3 tw:px-4 tw:border-t tw:border-[var(--bk-border)] " +
  "tw:[&>button]:h-7 tw:[&>button]:min-h-0 tw:[&>div>button]:h-7 tw:[&>div>button]:min-h-0";

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
