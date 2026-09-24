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
import { IconButton } from "./Icon";

export type ModalKind = "question" | "flow" | "form";

/* Shared with ModalParts.tsx — "They render into the same classes, so both
   forms look identical and neither can drift from the other" (ModalParts'
   own header comment). Exported here so both compose one source of truth
   instead of two copies of the same restyle. */
export const MODAL_FRAME_BASE_CLASS =
  "tw:z-[60] tw:flex tw:flex-col tw:bg-[var(--bk-bg-elevated)] tw:rounded-[var(--bk-radius-card)] tw:[box-shadow:var(--bk-shadow-overlay)] " +
  "tw:max-h-[80vh] tw:max-w-[calc(100vw-32px)] tw:[font-family:var(--bk-font-ui)]";
/* The dialog boards (7564:185450 delete folder, 6752:59256 New page, and
   every confirm since the 2026-09-20 DS pass): pad 24, gap 16, radius 12
   (radius/card), a 20/30 semibold title, 14/20 ink body, and the action row
   right-aligned INSIDE the padding — no footer strip, no rule above it. */
export const MODAL_HEAD_CLASS = "tw:flex tw:flex-col tw:gap-1 tw:pt-6 tw:px-6 tw:pb-4";
/* The head's ✕: 32 square, centred 36 in from the top-right corner. */
const MODAL_CLOSE_CLASS = "tw:absolute tw:top-5 tw:right-5 tw:text-[var(--bk-ink-muted)] tw:hover:text-[var(--bk-ink)]";
export const MODAL_TITLE_CLASS =
  "tw:text-[length:var(--bk-text-20)] tw:leading-[var(--bk-leading-30)] tw:tracking-[-0.24px] tw:font-semibold tw:text-[var(--bk-ink)]";
export const MODAL_SUBTITLE_CLASS = "tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-muted)]";
export const MODAL_BODY_CLASS =
  "tw:px-6 tw:pt-0 tw:pb-4 tw:overflow-auto tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]";
/* Buttons are Button md: 32 high, 16 inset, radius 8, 13/20 medium
   (dialog/footer 7401:1280). Descendant, not child: a footer that wraps its
   buttons in its own flex row still gets them — the delete confirm once
   shipped flowbite's 40 because the selector only reached direct children. */
export const MODAL_FOOT_CLASS =
  "tw:flex tw:items-center tw:justify-end tw:gap-2 tw:pt-0 tw:pb-6 tw:px-6 " +
  "tw:[&_button]:h-8 tw:[&_button]:min-h-0 tw:[&_button]:px-4 tw:[&_button]:py-1.5 " +
  "tw:[&_button]:rounded-lg tw:[&_button]:text-[13px] tw:[&_button]:font-medium";

/** width/dialog-md 560 is the default; New page draws width/dialog-lg 640. */
export type ModalWidth = "md" | "lg" | "xl";
const WIDTH_CLASS: Record<ModalWidth, string> = {
  md: "tw:w-[var(--bk-size-dialog-md)]",
  lg: "tw:w-[var(--bk-size-dialog-lg)]",
  xl: "tw:w-[720px]",
};

const KIND_WIDTH: Record<ModalKind, ModalWidth> = {
  question: "md",
  form: "md",
  flow: "xl",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  kind?: ModalKind;
  /** Overrides the kind's width — "lg" (640) for the New page dialog. */
  width?: ModalWidth;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissOnScrimClick?: boolean;
  /** Board 183:16 — a form with unsaved input pulses instead of closing. */
  dirty?: boolean;
  /**
   * Conformance anchor. Every measured element in this editor is addressed by
   * `data-testid` — recipes may not name a CSS class (lib.mjs `validateRecipe`)
   * — and this primitive was the one overlay with no anchor at all, so no
   * modal board could be measured without wrapping the thing under test.
   * Stamps the frame; the foot gets `modal-foot-<testId>`.
   *
   * The foot's PREFIX, and the fact that the attribute value STARTS with the
   * template literal, are both load-bearing rather than cosmetic.
   * `check-anchors` can only see a derived id through the literal text before
   * the interpolation (lib.mjs `anchorForm`, which matches
   * ``data-testid={`…${``), so neither `${testId}-foot` nor
   * ``testId ? `modal-foot-${testId}` : undefined`` greps as anything, and
   * every recipe naming the foot was reported as an anchor that does not
   * exist. Two surfaces hit that on the same afternoon. Hence the fallback
   * name: the foot is always anchored, so the attribute never has to be
   * written conditionally.
   */
  testId?: string;
  /** A ✕ at the head's right edge (6752:59256 New page draws one). */
  closeButton?: boolean;
}

export function Modal({
  open, onClose, title, subtitle, kind = "question", width, children, footer, dismissOnScrimClick, dirty, testId, closeButton,
}: ModalProps) {
  const titleId = React.useId();
  return (
    <OverlayMount open={open} onClose={onClose} labelledBy={titleId} dismissOnScrimClick={dismissOnScrimClick} dirty={dirty}>
      <div className={[MODAL_FRAME_BASE_CLASS, WIDTH_CLASS[width ?? KIND_WIDTH[kind]], closeButton ? "tw:relative" : ""].join(" ")} data-testid={testId}>
        <div className={MODAL_HEAD_CLASS}>
          <span className={MODAL_TITLE_CLASS} id={titleId}>
            {title}
          </span>
          {subtitle ? <span className={MODAL_SUBTITLE_CLASS}>{subtitle}</span> : null}
        </div>
        {children ? <div className={MODAL_BODY_CLASS}>{children}</div> : null}
        {footer ? (
          <div className={MODAL_FOOT_CLASS} data-testid={`modal-foot-${testId ?? "modal"}`}>
            {footer}
          </div>
        ) : null}
        {/* Last in the DOM so the dialog's first focus lands on its field,
            not on the ✕; placed top-right by position. */}
        {closeButton ? (
          <IconButton label="Close" onClick={onClose} className={MODAL_CLOSE_CLASS} data-testid={`modal-close-${testId ?? "modal"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </IconButton>
        ) : null}
      </div>
    </OverlayMount>
  );
}
