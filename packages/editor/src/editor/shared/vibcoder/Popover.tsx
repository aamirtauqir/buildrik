/**
 * Vibcoder Popover wrapper — floating surface molecule.
 * Renders the bd-popover composite from
 * src/themes/components/molecules/popover.css.
 *
 * Phase 2 SCOPE — Popover IS the rendered SURFACE. NOT a trigger anchor.
 *
 * Contract D (trigger wiring) — implementer choice DOCUMENTED:
 *   Popover does NOT wrap a trigger element in Phase 2. The caller renders
 *   their trigger button separately (e.g., next to the Popover or as a
 *   sibling node) and decides positioning with their own `style={{ top,
 *   left }}` or wrapper div. We deliberately ship NO asChild /
 *   cloneElement / render-prop / ref-forwarding API here — Phase 3
 *   organisms (CommandPalette, Inspector menus) will add a separate
 *   PopoverTrigger or asChild API once floating-ui is integrated for
 *   anchor/offset/flip/shift positioning. This keeps Phase 2 honest: a
 *   passive controlled surface, no positioning logic, no implicit
 *   anchoring.
 *
 * Slots (from CSS):
 *   .bd-popover               base surface (background, border, shadow)
 *   .bd-popover--with-arrow   adds the ::before triangle pointer
 *
 * Sibling exports (Contract C):
 *   Popover       the surface itself; renders nothing when open=false
 *   PopoverArrow  optional explicit arrow node when callers want to
 *                 position it inside the surface; the CSS `::before`
 *                 pseudo-element gated by `--with-arrow` covers the
 *                 default (top-center) case, so PopoverArrow is mostly
 *                 useful when callers need a custom position later
 *
 * Contract B (always-controlled state) — Phase 2 mandate:
 *   open          REQUIRED — caller controls visibility. NO defaultOpen.
 *                 NO internal useState.
 *   onOpenChange  REQUIRED — wrapper does NOT call this directly in
 *                 Phase 2 (no outside-click / Esc handling here yet — that
 *                 lives in Phase 3 organisms). The contract is required at
 *                 the type level so callers can't ship a Popover that
 *                 silently drops dismiss-intent when Phase 3 wires it.
 *
 * Render policy:
 *   open=false → return null (no DOM, no role attrs, no class merging)
 *   open=true  → renders a <div role="dialog" className="bd-popover">
 *
 * forwardRef on the surface <div> — measurement consumers (anchor +
 * offset calculations, scroll-into-view) need it.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export interface PopoverProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role"> {
  /** REQUIRED — caller controls visibility. NO defaultOpen. */
  open: boolean;
  /**
   * REQUIRED — invoked when the surface requests dismissal (Phase 3 will
   * wire outside-click / Esc handling). Required at the type level so
   * callers can't ship a Popover that silently drops dismiss intent.
   */
  onOpenChange: (open: boolean) => void;
  /** Toggles the --with-arrow CSS variant (top-center triangle pointer). */
  withArrow?: boolean;
  children: ReactNode;
}

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      open,
      onOpenChange: _onOpenChange,
      withArrow,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    if (!open) return null;
    const classes = [
      "bd-popover",
      withArrow && "bd-popover--with-arrow",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} role="dialog" className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Popover.displayName = "Popover";

export type PopoverArrowProps = HTMLAttributes<HTMLSpanElement>;

export const PopoverArrow = forwardRef<HTMLSpanElement, PopoverArrowProps>(
  ({ className, ...rest }, ref) => {
    // The default arrow is the CSS `::before` pseudo-element on
    // .bd-popover--with-arrow. PopoverArrow is an explicit wrapper for
    // callers who need to position the arrow themselves (e.g., bottom-
    // anchored popovers when Phase 3 floating-ui integration lands).
    const classes = ["bd-popover__arrow", className].filter(Boolean).join(" ");
    return <span ref={ref} aria-hidden="true" className={classes} {...rest} />;
  },
);
PopoverArrow.displayName = "PopoverArrow";
