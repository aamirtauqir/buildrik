/**
 * Vibcoder Footer — editor chrome status bar (layout-only, no engine).
 *
 * Skin: bd-footer CSS classes from src/themes/components/organisms/footer.css.
 *
 * Sibling exports (Contract C):
 *   Footer      — root (.bd-footer) — role="contentinfo"
 *   FooterGroup — flex group (.bd-footer__group)
 *   FooterChip  — meta chip (.bd-footer__chip)
 *   FooterDot   — status dot (.bd-footer__dot)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/footer:
 *   (none — no .bd-X--Y modifier classes)
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `Footer · FooterStatus · FooterActions`. Source CSS
 *   has no `__status` / `__actions` classes — instead `__group`, `__chip`,
 *   `__dot`. Sibling list updated to match actual CSS.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export interface FooterGroupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface FooterChipProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export interface FooterDotProps extends HTMLAttributes<HTMLSpanElement> {
  // pure visual element
}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ children, className, role = "contentinfo", ...rest }, ref) => {
    const classes = ["bd-footer", className].filter(Boolean).join(" ");
    return (
      <footer ref={ref} className={classes} role={role} {...rest}>
        {children}
      </footer>
    );
  },
);
Footer.displayName = "Footer";

export const FooterGroup = forwardRef<HTMLDivElement, FooterGroupProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-footer__group", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
FooterGroup.displayName = "FooterGroup";

export const FooterChip = forwardRef<HTMLSpanElement, FooterChipProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-footer__chip", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
FooterChip.displayName = "FooterChip";

export const FooterDot = forwardRef<HTMLSpanElement, FooterDotProps>(
  ({ className, ...rest }, ref) => {
    const classes = ["bd-footer__dot", className].filter(Boolean).join(" ");
    return <span ref={ref} className={classes} aria-hidden="true" {...rest} />;
  },
);
FooterDot.displayName = "FooterDot";
