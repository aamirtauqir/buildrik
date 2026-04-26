/**
 * Vibcoder HistoryPanel — version history organism (timeline + diff viewer).
 *
 * Skin: bd-history-panel CSS classes from src/themes/components/organisms/history-panel.css.
 *
 * Sibling exports (Contract C):
 *   HistoryPanel         — root grid (.bd-history-panel)
 *   HistoryPanelTimeline — left-column timeline (.bd-history-panel__timeline)
 *   HistoryPanelDay      — day separator label (.bd-history-panel__day)
 *   HistoryPanelRow      — single history row button (.bd-history-panel__row)
 *                          with `selected` prop (sets aria-selected + .is-selected)
 *   HistoryPanelTag      — version tag chip (.bd-history-panel__tag) with
 *                          optional `published` prop (--published modifier)
 *   HistoryPanelViewer   — right-column diff viewer (.bd-history-panel__viewer)
 *   HistoryPanelDiffLine — single diff line (.bd-history-panel__diff-line) with
 *                          `kind: "add" | "rem"` prop (--add / --rem modifiers)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/history-panel:
 *   bd-history-panel__tag:       variants = published
 *   bd-history-panel__diff-line: variants = add, rem
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `HistoryPanel · HistoryItem`. Source CSS has a
 *   richer two-column structure (timeline + viewer) with day grouping and
 *   diff lines. Sibling list expanded to 7 to mirror the real subclass tree.
 *
 * @license BSD-3-Clause
 */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export interface HistoryPanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface HistoryPanelTimelineProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface HistoryPanelDayProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface HistoryPanelRowProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected state — sets aria-selected="true" + .is-selected. */
  selected?: boolean;
  children?: ReactNode;
}

export interface HistoryPanelTagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Published modifier — applies bd-history-panel__tag--published. */
  published?: boolean;
  children?: ReactNode;
}

export interface HistoryPanelViewerProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export type HistoryPanelDiffKind = "add" | "rem";

export interface HistoryPanelDiffLineProps
  extends HTMLAttributes<HTMLDivElement> {
  /** Diff line kind — "add" or "rem" (omit for context lines). */
  kind?: HistoryPanelDiffKind;
  children?: ReactNode;
}

export const HistoryPanel = forwardRef<HTMLDivElement, HistoryPanelProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-history-panel", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
HistoryPanel.displayName = "HistoryPanel";

export const HistoryPanelTimeline = forwardRef<
  HTMLDivElement,
  HistoryPanelTimelineProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-history-panel__timeline", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
HistoryPanelTimeline.displayName = "HistoryPanelTimeline";

export const HistoryPanelDay = forwardRef<HTMLDivElement, HistoryPanelDayProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-history-panel__day", className]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
HistoryPanelDay.displayName = "HistoryPanelDay";

export const HistoryPanelRow = forwardRef<
  HTMLButtonElement,
  HistoryPanelRowProps
>(({ selected, children, className, type = "button", ...rest }, ref) => {
  const classes = ["bd-history-panel__row", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      aria-selected={selected ? "true" : "false"}
      {...rest}
    >
      {children}
    </button>
  );
});
HistoryPanelRow.displayName = "HistoryPanelRow";

export const HistoryPanelTag = forwardRef<HTMLSpanElement, HistoryPanelTagProps>(
  ({ published, children, className, ...rest }, ref) => {
    const classes = [
      "bd-history-panel__tag",
      published && "bd-history-panel__tag--published",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
HistoryPanelTag.displayName = "HistoryPanelTag";

export const HistoryPanelViewer = forwardRef<
  HTMLDivElement,
  HistoryPanelViewerProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-history-panel__viewer", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
HistoryPanelViewer.displayName = "HistoryPanelViewer";

export const HistoryPanelDiffLine = forwardRef<
  HTMLDivElement,
  HistoryPanelDiffLineProps
>(({ kind, children, className, ...rest }, ref) => {
  const classes = [
    "bd-history-panel__diff-line",
    kind && `bd-history-panel__diff-line--${kind}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
HistoryPanelDiffLine.displayName = "HistoryPanelDiffLine";
