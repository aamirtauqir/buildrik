/**
 * Vibcoder Drawer — slide-out side panel built on Radix.Dialog.
 *
 * Engine: @radix-ui/react-dialog (focus trap, Esc, click-outside via overlay,
 * ARIA roles + states). Drawer sets `modal={false}` because the source CSS
 * notes "canvas stays scrollable" (aria-modal="false") — drawers in this
 * design system coexist with the canvas behind them rather than blocking it.
 *
 * Skin: bd-drawer CSS classes from src/themes/components/organisms/drawer.css.
 * CSS handles slide direction via modifier classes (--left, --bottom). Right is
 * default (no modifier). Top is NOT supported by source CSS.
 *
 * Sibling exports (Contract C):
 *   Drawer · DrawerTrigger · DrawerContent · DrawerClose · DrawerTitle · DrawerDescription
 *
 * Variants discovered via vibcoder-variants.mjs organisms/drawer:
 *   bd-drawer: variants = bottom, left  (right is the default; no modifier)
 *              sizes    = sm (340), md (420), lg (520) — bottom uses fixed height
 *   bd-drawer__title    accessible title
 *   bd-drawer__subtitle accessible description (used inside __head in source HTML)
 *   bd-drawer__foot     footer slot
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan code-block listed `side: "left" | "right" | "top" | "bottom"`. Source
 *   CSS only defines left/right/bottom (no top). Per plan reminder #1
 *   (variants script is source of truth), DrawerSide drops `top`. Right is the
 *   default with no `--right` class — so omit the modifier when side === "right".
 *
 * CSS↔Radix DOM alignment note (Phase 3 finding for M5):
 *   Source drawer.css structures the panel as
 *     .bd-drawer > .bd-drawer__head + .bd-drawer__body + .bd-drawer__foot
 *   Radix.Dialog renders .bd-drawer as a single flat container; vibcoder
 *   DrawerTitle and DrawerDescription render as direct children of DrawerContent
 *   without an intermediate __head wrapper. Same pattern as Modal (M5 may add a
 *   DrawerHead sibling later if chrome consumers need it). Also: source CSS has
 *   no `.bd-drawer__overlay` class — the plan's example references one, but the
 *   actual vendored CSS omits it. Radix.Overlay still renders (it carries
 *   click-outside behavior); we apply no className to it.
 *
 * E1: DrawerTrigger + DrawerClose accept asChild
 * E2: NO Radix types in public API — DialogProps not re-exported
 * E3: DrawerContent uses useOverlayContainer() for portal target
 * E5: Galleries use <DemoTrigger>, never open={true} literal
 *
 * @license BSD-3-Clause
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useOverlayContainer } from "./OverlayMount";

// Vibcoder-shaped public API — no Radix types leaked (E2)

export type DrawerSide = "left" | "right" | "bottom";
export type DrawerSize = "sm" | "md" | "lg";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}

export interface DrawerTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface DrawerContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  children: ReactNode;
  /** Slide direction. Default `right` (no CSS modifier emitted). */
  side?: DrawerSide;
  /** Size modifier — only meaningful for left/right (bottom uses fixed height). */
  size?: DrawerSize;
}

export interface DrawerCloseProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  asChild?: boolean;
  children: ReactNode;
}

export interface DrawerTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export interface DrawerDescriptionProps
  extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

// Root — controlled only (B). NO defaultOpen (B).
export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      {children}
    </RadixDialog.Root>
  );
}
Drawer.displayName = "Drawer";

// Trigger — asChild boundary per E1
export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
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
DrawerTrigger.displayName = "DrawerTrigger";

// Content — portals through OverlayMount per E3. Emits data-side for tests
// and any side-aware consumer styling, plus the modifier class when side is
// not the default ("right").
export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ children, side = "right", size, className, ...rest }, ref) => {
    const container = useOverlayContainer();
    const classes = [
      "bd-drawer",
      side !== "right" && `bd-drawer--${side}`,
      size && `bd-drawer--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <RadixDialog.Portal container={container ?? undefined}>
        <RadixDialog.Content
          ref={ref}
          className={classes}
          data-side={side}
          {...rest}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    );
  },
);
DrawerContent.displayName = "DrawerContent";

// Close — asChild per E1
export const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(
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
DrawerClose.displayName = "DrawerClose";

// Title — Radix wires aria-labelledby on Content automatically
export const DrawerTitle = forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-drawer__title", className].filter(Boolean).join(" ");
    return (
      <RadixDialog.Title ref={ref} className={classes} {...rest}>
        {children}
      </RadixDialog.Title>
    );
  },
);
DrawerTitle.displayName = "DrawerTitle";

// Description — Radix wires aria-describedby on Content automatically.
// Maps to bd-drawer__subtitle per source CSS (descriptive secondary text).
export const DrawerDescription = forwardRef<
  HTMLParagraphElement,
  DrawerDescriptionProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-drawer__subtitle", className].filter(Boolean).join(" ");
  return (
    <RadixDialog.Description ref={ref} className={classes} {...rest}>
      {children}
    </RadixDialog.Description>
  );
});
DrawerDescription.displayName = "DrawerDescription";
