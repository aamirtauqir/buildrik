/**
 * Vibcoder Modal — Phase 3 canary organism.
 *
 * Engine: @radix-ui/react-dialog (focus trap, scroll lock, click-outside, Esc,
 * ARIA roles + states).
 *
 * Skin: bd-modal CSS classes from src/themes/components/organisms/modal.css.
 *
 * Sibling exports (Contract C):
 *   Modal              root state owner (open + onOpenChange)
 *   ModalTrigger       opens the modal (asChild per E1)
 *   ModalContent       modal panel (portals through OverlayMount per E3)
 *   ModalClose         close button (asChild per E1)
 *   ModalTitle         accessible title (Radix wires aria-labelledby)
 *   ModalDescription   accessible description (Radix wires aria-describedby)
 *   ModalFooter        footer slot for action buttons
 *
 * Variants discovered via vibcoder-variants.mjs organisms/modal:
 *   bd-modal: sizes = lg (460px), xl (560px) — default = no modifier (380px)
 *   bd-modal__title    accessible title (used inside __head in source HTML)
 *   bd-modal__subtitle accessible description (used inside __head in source HTML)
 *   bd-modal__foot     footer slot (NOTE: source class is `__foot` not `__footer`)
 *
 * CSS↔Radix DOM alignment note (Phase 3 finding for M5):
 *   Source modal.css structures the panel as
 *     .bd-modal > .bd-modal__head (icon + title + subtitle) + .bd-modal__body
 *     + .bd-modal__foot
 *   Radix.Dialog renders .bd-modal as a single flat container. P5 (2026-07-25)
 *   closed the gap with OPT-IN wrappers: ModalHead (.bd-modal__head — icon +
 *   title + subtitle with padding + border-bottom) and ModalBody
 *   (.bd-modal__body). Existing flat consumers are unchanged; wrap title/desc
 *   in ModalHead + content in ModalBody for full source-CSS parity.
 *
 * E1: ModalTrigger + ModalClose accept asChild
 * E2: NO Radix types in public API — DialogProps not re-exported
 * E3: ModalContent uses useOverlayContainer() for portal target
 * E5: Galleries use <DemoTrigger>, never open={true} literal
 *
 * @license BSD-3-Clause
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useOverlayContainer } from "./OverlayMount";

// Vibcoder-shaped public API — no Radix types leaked (E2)

export type ModalSize = "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}

export interface ModalTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface ModalContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  children: ReactNode;
  /** Optional size modifier — default (omitted) = 380px panel. */
  size?: ModalSize;
}

export interface ModalCloseProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export interface ModalDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Root — controlled only (B). NO defaultOpen (B).
export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}
Modal.displayName = "Modal";

// Trigger — asChild boundary per E1
export const ModalTrigger = forwardRef<HTMLButtonElement, ModalTriggerProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Trigger
      ref={ref}
      asChild={asChild}
      className={className}
      {...rest}
    >
      {children}
    </RadixDialog.Trigger>
  ),
);
ModalTrigger.displayName = "ModalTrigger";

// Visually-hidden span style — sr-only equivalent without adding a new
// @radix-ui/react-visually-hidden dependency. Used by ModalContent's
// default DialogTitle fallback.
const srOnlyStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

// Content — portals through OverlayMount per E3.
//
// A `RadixDialog.Title` MUST exist for screen reader users (Radix logs a
// dev-time error otherwise). Callers usually render a visible `<ModalTitle>`
// child. When they don't — e.g., the modal renders only a confirm prompt or
// a richly-styled custom heading — we still emit a hidden Title so Radix's
// a11y contract is satisfied. Callers can override via `srTitle`.
export const ModalContent = forwardRef<
  HTMLDivElement,
  ModalContentProps & { srTitle?: string }
>(({ children, size, className, srTitle = "Dialog", ...rest }, ref) => {
  const container = useOverlayContainer();
  const classes = [
    "bd-modal",
    size && `bd-modal--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <RadixDialog.Portal container={container ?? undefined}>
      <RadixDialog.Overlay className="bd-modal-backdrop" />
      <RadixDialog.Content ref={ref} className={classes} {...rest}>
        {/* Default sr-only Title so Radix never warns. A visible ModalTitle
            child takes precedence — Radix wires aria-labelledby to the first
            Title in DOM order, which will be this one only when the caller
            didn't supply their own. */}
        <RadixDialog.Title style={srOnlyStyle}>{srTitle}</RadixDialog.Title>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
ModalContent.displayName = "ModalContent";

// Close — asChild per E1
export const ModalClose = forwardRef<HTMLButtonElement, ModalCloseProps>(
  ({ asChild, children, className, ...rest }, ref) => (
    <RadixDialog.Close
      ref={ref}
      asChild={asChild}
      className={className}
      {...rest}
    >
      {children}
    </RadixDialog.Close>
  ),
);
ModalClose.displayName = "ModalClose";

// Title — Radix wires aria-labelledby on Content automatically
export const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__title", className].filter(Boolean).join(" ");
    return (
      <RadixDialog.Title ref={ref} className={classes} {...rest}>
        {children}
      </RadixDialog.Title>
    );
  },
);
ModalTitle.displayName = "ModalTitle";

// Description — Radix wires aria-describedby on Content automatically
// Maps to bd-modal__subtitle (the canonical descriptive text class in modal.css).
export const ModalDescription = forwardRef<
  HTMLParagraphElement,
  ModalDescriptionProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-modal__subtitle", className].filter(Boolean).join(" ");
  return (
    <RadixDialog.Description ref={ref} className={classes} {...rest}>
      {children}
    </RadixDialog.Description>
  );
});
ModalDescription.displayName = "ModalDescription";

// Footer — pure layout slot (maps to bd-modal__foot per source CSS)
/** Opt-in header wrapper — .bd-modal__head padding + divider (P5/F18). */
export const ModalHead = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__head", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ModalHead.displayName = "ModalHead";

/** Opt-in body wrapper — .bd-modal__body padding (P5/F18). */
export const ModalBody = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__body", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ModalBody.displayName = "ModalBody";

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-modal__foot", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ModalFooter.displayName = "ModalFooter";
