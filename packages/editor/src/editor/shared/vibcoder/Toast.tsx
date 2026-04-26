/**
 * Vibcoder Toast wrapper — single transient notification molecule.
 * Renders the bd-toast composite from
 * src/themes/components/molecules/toast.css.
 *
 * Phase 2 SCOPE — single Toast component only. Queue management
 * (multiple concurrent toasts, stacking, ordering, auto-dismiss timer
 * orchestration) is Phase 3 NotificationCenter organism. The wrapper
 * here ships a controlled-state surface; callers wire the dismiss
 * timer themselves OR the Phase 3 organism wires it.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   title        required structural slot → flat string
 *   description  optional supportive slot → flat string
 *   action       optional decorative slot → ReactNode (caller passes a
 *                  <Button> or set of action links)
 *   tone         optional severity discriminator (info/success/warning/
 *                  error/neutral). 'info' is the default visual.
 *
 * Variant union from `vibcoder-variants.mjs molecules/toast`:
 *   variants: error, info, neutral, success, warning
 *
 * The CSS file also ships .bd-banner + .bd-toast__link as siblings;
 * Banner is OUT OF SCOPE for the Phase 2 task spec (Toast is the named
 * molecule). When a Banner wrapper lands later it will compose .bd-banner
 * directly — Toast does not embed Banner.
 *
 * Contract B (always-controlled state) — Phase 2 mandate:
 *   open          REQUIRED — caller controls visibility. NO defaultOpen.
 *                 NO internal useState. NO auto-dismiss timer here.
 *   onOpenChange  REQUIRED — invoked when the surface requests dismissal.
 *                 In Phase 2 the wrapper never calls this directly (no
 *                 close button rendered, no auto-timer). It's required at
 *                 the type level so callers (or the Phase 3
 *                 NotificationCenter organism) plug their dismiss
 *                 callback in unambiguously.
 *
 * Render policy:
 *   open=false → return null (no DOM, no role attrs, no class merging)
 *   open=true  → renders <div role="status" aria-live="polite">
 *
 * forwardRef on the surface <div> — measurement consumers (NotificationCenter
 * stack-positioning) need it.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export type ToastTone = "info" | "success" | "warning" | "error" | "neutral";

export interface ToastProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "title" | "children" | "role"
  > {
  /** REQUIRED — caller controls visibility. NO defaultOpen. */
  open: boolean;
  /**
   * REQUIRED — invoked when the surface requests dismissal (typically
   * called by an auto-dismiss timer wired by the caller OR the Phase 3
   * NotificationCenter organism). Required at the type level so callers
   * can't ship a Toast that silently drops dismiss intent.
   */
  onOpenChange: (open: boolean) => void;
  /** Severity discriminator. Defaults to 'info' visual when omitted. */
  tone?: ToastTone;
  /** Required headline. */
  title: string;
  /** Optional supportive copy. */
  description?: string;
  /** Optional action slot (typically a <Button>). */
  action?: ReactNode;
  /** Optional leading icon slot (caller passes <Icon name=...>). */
  icon?: ReactNode;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      open,
      onOpenChange: _onOpenChange,
      tone,
      title,
      description,
      action,
      icon,
      className,
      ...rest
    },
    ref,
  ) => {
    if (!open) return null;
    const classes = [
      "bd-toast",
      tone && `bd-toast--${tone}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={classes}
        {...rest}
      >
        {icon && (
          <span className="bd-toast__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="bd-toast__body">
          <div className="bd-toast__title">{title}</div>
          {description && <div className="bd-toast__desc">{description}</div>}
          {action && <div className="bd-toast__actions">{action}</div>}
        </div>
      </div>
    );
  },
);
Toast.displayName = "Toast";
