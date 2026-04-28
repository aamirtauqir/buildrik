/**
 * Vibcoder Popover wrapper — Radix.Popover-backed compound.
 *
 * Phase 5 T7 upgrade: replaces the Phase 2 passive surface. The bd-popover
 * CSS skin (src/themes/components/molecules/popover.css) is now applied to
 * PopoverContent; bd-popover--with-arrow gates the CSS ::before arrow.
 *
 * Compound exports:
 *   Popover           — Root (controlled via open + onOpenChange)
 *   PopoverTrigger    — anchor element; supports asChild
 *   PopoverPortal     — portal escape (Radix default container; see E3 waiver)
 *   PopoverContent    — surface with bd-popover className; honors withArrow
 *   PopoverArrow      — Radix.Popover.Arrow re-export (closes #93)
 *
 * E2 contract waiver — Radix types deliberately leak through PopoverContentProps:
 *   Modal/Drawer use `Omit<HTMLAttributes<HTMLDivElement>, "role">` to keep Radix
 *   types out of the public API (E2 from Phase 3). Popover deviates because the
 *   positioning props (side, sideOffset, align, alignOffset, avoidCollisions,
 *   collisionBoundary, onPointerDownOutside, onEscapeKeyDown) ARE the contract —
 *   chrome consumers need them to anchor menus correctly. Re-typing every Radix
 *   prop would be lossy. Trade-off: a Radix v2 breaking change ripples to consumers.
 *
 * E3 portal-discipline waiver — PopoverPortal does NOT route via useOverlayContainer:
 *   Modal/Drawer mount into #vibcoder-overlay-root for centralized z-index ordering
 *   (E3 from Phase 3). Popover deliberately uses Radix's default portal target
 *   because popovers are anchored to triggers, not part of the modal stack —
 *   Radix's anchor positioning relies on its default parenting and fights
 *   re-parenting. Z-index for popovers is local to the bd-popover layer, not the
 *   modal stack.
 *
 * @license BSD-3-Clause
 */
import * as RadixPopover from "@radix-ui/react-popover";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}
export const Popover = ({ open, onOpenChange, children }: PopoverProps) => (
  <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </RadixPopover.Root>
);
Popover.displayName = "Popover";

export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverPortal = RadixPopover.Portal;

export interface PopoverContentProps
  extends ComponentPropsWithoutRef<typeof RadixPopover.Content> {
  withArrow?: boolean;
}
export const PopoverContent = forwardRef<
  ElementRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(({ className, withArrow, children, ...rest }, ref) => {
  const classes = [
    "bd-popover",
    withArrow && "bd-popover--with-arrow",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <RadixPopover.Content ref={ref} className={classes} {...rest}>
      {children}
    </RadixPopover.Content>
  );
});
PopoverContent.displayName = "PopoverContent";

export const PopoverArrow = RadixPopover.Arrow;
