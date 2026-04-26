/**
 * Vibcoder LeftPanel — scrollable side panel (layout-only, no engine).
 *
 * Skin: bd-left-panel CSS classes from src/themes/components/organisms/left-panel.css.
 *
 * Sibling exports (Contract C):
 *   LeftPanel        — root (.bd-left-panel)
 *   LeftPanelHead    — head bar (.bd-left-panel__head)
 *   LeftPanelTitle   — title heading (.bd-left-panel__title)
 *   LeftPanelSub     — secondary text (.bd-left-panel__sub)
 *   LeftPanelActions — action group inside head (.bd-left-panel__actions)
 *   LeftPanelBody    — scrollable body (.bd-left-panel__body)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/left-panel:
 *   (none — no .bd-X--Y modifier classes)
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `LeftPanel · LeftPanelHeader · LeftPanelBody`. Source
 *   CSS uses `__head` (not `__header`) plus `__title`, `__sub`, `__actions`.
 *   Sibling list extended to LeftPanelHead/Title/Sub/Actions/Body to map 1:1
 *   to the source CSS subclass shape.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface LeftPanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface LeftPanelHeadProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface LeftPanelTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export interface LeftPanelSubProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export interface LeftPanelActionsProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface LeftPanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const LeftPanel = forwardRef<HTMLDivElement, LeftPanelProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-left-panel", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
LeftPanel.displayName = "LeftPanel";

export const LeftPanelHead = forwardRef<HTMLDivElement, LeftPanelHeadProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-left-panel__head", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
LeftPanelHead.displayName = "LeftPanelHead";

export const LeftPanelTitle = forwardRef<
  HTMLHeadingElement,
  LeftPanelTitleProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-left-panel__title", className].filter(Boolean).join(" ");
  return (
    <h2 ref={ref} className={classes} {...rest}>
      {children}
    </h2>
  );
});
LeftPanelTitle.displayName = "LeftPanelTitle";

export const LeftPanelSub = forwardRef<HTMLSpanElement, LeftPanelSubProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-left-panel__sub", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
LeftPanelSub.displayName = "LeftPanelSub";

export const LeftPanelActions = forwardRef<
  HTMLDivElement,
  LeftPanelActionsProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-left-panel__actions", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
LeftPanelActions.displayName = "LeftPanelActions";

export const LeftPanelBody = forwardRef<HTMLDivElement, LeftPanelBodyProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-left-panel__body", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
LeftPanelBody.displayName = "LeftPanelBody";
