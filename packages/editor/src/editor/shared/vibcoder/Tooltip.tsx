/**
 * Vibcoder Tooltip wrapper — Radix.Tooltip-backed compound.
 *
 * Bucket B1 upgrade: replaces the Phase 2 passive surface. The bd-tooltip
 * CSS skin (src/themes/components/molecules/popover.css) is now applied
 * to TooltipContent; bd-tooltip--multiline gates the wrap+wide-padding
 * variant.
 *
 * Compound exports:
 *   TooltipProvider — Radix.Tooltip.Provider re-export. Mount once at app
 *                    shell root (delayDuration governs all tooltips).
 *   Tooltip        — Radix.Tooltip.Root (controlled via open + onOpenChange,
 *                    or uncontrolled with defaultOpen)
 *   TooltipTrigger — anchor element; supports asChild
 *   TooltipPortal  — portal escape (Radix's default portal target; see E3 waiver)
 *   TooltipContent — surface with bd-tooltip className; honors multiline
 *   TooltipTitle   — bd-tooltip__title sibling span (visual only, unchanged)
 *   TooltipDesc    — bd-tooltip__desc sibling span (visual only, unchanged)
 *   TooltipKbd     — bd-tooltip__kbd sibling span (visual only, unchanged)
 *
 * E2 contract waiver — Radix types deliberately leak through TooltipContentProps.
 *   Same precedent as Popover (Bucket A T1, commit e0ef916). Positioning props
 *   (side, sideOffset, align, alignOffset, avoidCollisions, collisionBoundary)
 *   ARE the contract; re-typing them as a buildrik subset would lose pixel-
 *   positioning fidelity.
 *
 * E3 portal-discipline waiver — TooltipPortal does NOT route via useOverlayContainer.
 *   Same precedent as Popover. Tooltips are anchored to triggers, not part of
 *   the modal stack — Radix's anchor positioning relies on its default parenting
 *   and fights re-parenting. Z-index for tooltips is local to the bd-tooltip
 *   layer.
 *
 * @license BSD-3-Clause
 */
import * as RadixTooltip from "@radix-ui/react-tooltip";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  children: ReactNode;
}
export const Tooltip = ({ children, ...rest }: TooltipProps) => (
  <RadixTooltip.Root {...rest}>{children}</RadixTooltip.Root>
);
Tooltip.displayName = "Tooltip";

export const TooltipTrigger = RadixTooltip.Trigger;
export const TooltipPortal = RadixTooltip.Portal;

export interface TooltipContentProps
  extends ComponentPropsWithoutRef<typeof RadixTooltip.Content> {
  multiline?: boolean;
}
export const TooltipContent = forwardRef<
  ElementRef<typeof RadixTooltip.Content>,
  TooltipContentProps
>(({ className, multiline, children, ...rest }, ref) => {
  const classes = [
    "bd-tooltip",
    multiline && "bd-tooltip--multiline",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <RadixTooltip.Content ref={ref} className={classes} {...rest}>
      {children}
    </RadixTooltip.Content>
  );
});
TooltipContent.displayName = "TooltipContent";

// Sibling visual-only spans — unchanged from Phase 2 wrapper.
export type TooltipTitleProps = HTMLAttributes<HTMLSpanElement>;
export const TooltipTitle = forwardRef<HTMLSpanElement, TooltipTitleProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-tooltip__title", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
TooltipTitle.displayName = "TooltipTitle";

export type TooltipDescProps = HTMLAttributes<HTMLSpanElement>;
export const TooltipDesc = forwardRef<HTMLSpanElement, TooltipDescProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-tooltip__desc", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
TooltipDesc.displayName = "TooltipDesc";

export type TooltipKbdProps = HTMLAttributes<HTMLSpanElement>;
export const TooltipKbd = forwardRef<HTMLSpanElement, TooltipKbdProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-tooltip__kbd", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
TooltipKbd.displayName = "TooltipKbd";
