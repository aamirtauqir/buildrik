/**
 * Modal compound parts — ModalContent / ModalTitle / ModalFooter / ModalClose.
 *
 * The prop-based <Modal title footer> stays the recommended form. These exist
 * because 29 surfaces already compose their dialogs by hand, and giving them
 * the same part names turns their migration into an import change instead of a
 * rewrite of every dialog in the product.
 *
 * They render into the same classes, so both forms look identical and neither
 * can drift from the other.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { OverlayMount } from "./OverlayMount";
import { IconButton } from "./Icon";
import {
  MODAL_FRAME_BASE_CLASS,
  MODAL_HEAD_CLASS,
  MODAL_TITLE_CLASS,
  MODAL_SUBTITLE_CLASS,
  MODAL_BODY_CLASS,
  MODAL_FOOT_CLASS,
} from "./Modal";

export type ModalSize = "sm" | "md" | "fields" | "table" | "question" | "form" | "lg" | "xl";

const SIZE_WIDTH_CLASS: Record<ModalSize, string> = {
  sm: "tw:w-[360px]",
  /* Board 1172:4840 (Brand review) draws its dialog at 520. */
  md: "tw:w-[520px]",
  /* 1170:4713 collection fields. */
  fields: "tw:w-[500px]",
  /* 1170:4749 records table, 1164:4713 media picker. */
  table: "tw:w-[640px]",
  question: "tw:w-[440px]",
  form: "tw:w-[560px]",
  lg: "tw:w-[720px]",
  xl: "tw:w-[960px]",
};

/** Lets ModalClose inherit the root's close without per-consumer wiring. */
const ModalCloseContext = React.createContext<(() => void) | null>(null);

export interface ModalRootProps {
  open: boolean;
  /** Radix-style callback the existing surfaces already pass. */
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  children: React.ReactNode;
  dismissOnScrimClick?: boolean;
  /** Board 183:16 — a form with unsaved input pulses instead of closing. */
  dirty?: boolean;
}

/** Compound root: owns the portal, scrim and focus trap. */
export function ModalRoot({ open, onOpenChange, onClose, children, dismissOnScrimClick, dirty }: ModalRootProps) {
  const close = React.useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);
  return (
    <OverlayMount open={open} onClose={close} dismissOnScrimClick={dismissOnScrimClick} dirty={dirty}>
      <ModalCloseContext.Provider value={close}>{children}</ModalCloseContext.Provider>
    </OverlayMount>
  );
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ModalSize;
  /** Screen-reader title when the visible heading lives inside the children. */
  srTitle?: string;
}

export const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(function ModalContent(
  { size = "question", srTitle, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[MODAL_FRAME_BASE_CLASS, SIZE_WIDTH_CLASS[size], "tw:relative", className].filter(Boolean).join(" ")}
      aria-label={srTitle}
      {...rest}
    >
      {children}
    </div>
  );
});

/*
  ModalTitle carries the padding the compound form has no header wrapper for.

  `Modal` (the all-in-one) puts its title inside MODAL_HEAD_CLASS, which is
  where its pt-5/px-5/pb-3 comes from. The compound form has no such wrapper,
  so its title had NO padding at all — measured live at x=0 while the body
  beside it was inset 20, which read as "eate Collection". And an unpadded
  title row is only 24px tall, so the body under it began at y=24, beneath the
  close button floating at y=12..44 — in the CMS collection modal the close put
  itself on top of the "Fields" step label.

  pl-5 matches the body inset; pr-12 clears the 32px close at right-3. Left and
  right are separate classes rather than `px-5 pr-12` because two classes on
  one property resolve by stylesheet order, not by writing order.
*/
const MODAL_TITLE_HEAD_CLASS = "tw:pl-5 tw:pr-12 tw:pt-4 tw:pb-3";

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Set false when the caller already wraps the title in its own padded
   * header — three do (MigrationProgressModal, ReviewModal,
   * ReplaceAcrossModal) and would otherwise be inset twice. An explicit prop
   * rather than a `tw:pl-0` override: two classes on one property are
   * resolved by stylesheet order, so the override would not reliably win.
   */
  inset?: boolean;
}

export const ModalTitle = React.forwardRef<HTMLHeadingElement, ModalTitleProps>(
  function ModalTitle({ inset = true, className, children, ...rest }, ref) {
    return (
      <h2 ref={ref} className={[inset ? MODAL_TITLE_HEAD_CLASS : "", MODAL_TITLE_CLASS, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </h2>
    );
  },
);

/*
  The same gap ModalTitle above was fixed for, in its sibling.

  `MODAL_SUBTITLE_CLASS` is `text-xs text-gray-500` and nothing else. The
  all-in-one `Modal` is fine — it renders that class inside MODAL_HEAD_CLASS,
  which brings the px-5. The compound part has no wrapper, so its subtitle sat
  at the modal's left edge while the padded title above it and the body below
  it were both inset 20px. Measured on board 1168:4732 at 1440x900: the title
  starts at x=520 and "These will ship to every visitor exactly as they are
  now." starts at x=502.

  Same escape hatch as ModalTitle, for the same reason: two classes on one
  property resolve by stylesheet order, so a `tw:px-0` override could not be
  relied on. No pr-12 here — unlike the title, the description sits below the
  close button and does not need to clear it.
*/
const MODAL_DESC_INSET_CLASS = "tw:px-5";

export interface ModalDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Set false when the caller already wraps it in its own padded header. */
  inset?: boolean;
}

export const ModalDescription = React.forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  function ModalDescription({ inset = true, className, children, ...rest }, ref) {
    return (
      <p
        ref={ref}
        className={[inset ? MODAL_DESC_INSET_CLASS : "", MODAL_SUBTITLE_CLASS, className]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </p>
    );
  },
);

export const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ModalBody({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={[MODAL_BODY_CLASS, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </div>
    );
  },
);

export const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function ModalFooter({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={[MODAL_FOOT_CLASS, className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </div>
    );
  },
);

export interface ModalCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export const ModalClose = React.forwardRef<HTMLButtonElement, ModalCloseProps>(function ModalClose(
  { label = "Close", className, children, onClick, ...rest },
  ref,
) {
  const close = React.useContext(ModalCloseContext);
  return (
    <IconButton
      ref={ref}
      label={label}
      className={["tw:absolute tw:top-3 tw:right-3", className].filter(Boolean).join(" ")}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) close?.();
      }}
      {...rest}
    >
      {children ?? "✕"}
    </IconButton>
  );
});
