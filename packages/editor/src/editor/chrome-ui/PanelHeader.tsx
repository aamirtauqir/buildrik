/**
 * PanelHeader — Figma 16:6.
 * The 44px bar at the top of every drawer panel: title left, actions right.
 * @license BSD-3-Clause
 */
import React from "react";
import { IconButton } from "./Icon";

export interface PanelHeaderActionsProps {
  /** Aria-label context: "Expand {label}" / "Close {label}" (e.g. the panel title). */
  label: string;
  /** Overrides the close button's name when the title is NOT what closing
   *  affects. A drill-in surface titles itself after the section it is showing,
   *  so the derived "Close {title}" claims to close the section while the
   *  control closes the whole panel. */
  closeLabel?: string;
  /** Expanded = 700-wide drawer (board 16:6 expand action); announced via aria-pressed. */
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Extra content rendered before the pin/help/close buttons. */
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The pin/help/close action cluster on its own — used by PanelHeader and by
 * headers that lay out their own title area (e.g. the sidebar DrillInHeader).
 */
export function PanelHeaderActions({
  label, closeLabel, isExpanded, onExpandToggle, onHelpClick, onClose, children, className, style,
}: PanelHeaderActionsProps) {
  return (
    <span className={["tw:flex tw:items-center tw:gap-1", className].filter(Boolean).join(" ")} style={style}>
      {children}
      {onExpandToggle ? (
        <IconButton
          label={isExpanded ? `Collapse ${label}` : `Expand ${label}`}
          pressed={Boolean(isExpanded)}
          onClick={onExpandToggle}
        >
          {/* Board 16:6's first action is EXPAND — four corner brackets,
              16 viewBox, stroke 1.33 (the frame's own SVG, founder-confirmed
              2026-08-06; the component's "Pin sits before close" description
              text is stale — the drawn icon wins). Toggles the 320↔700
              drawer width. */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V6" />
            <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" />
            <path d="M10 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V6" />
            <path d="M10 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V10" />
          </svg>
        </IconButton>
      ) : null}
      {onHelpClick ? (
        <IconButton label="Help" onClick={onHelpClick}>
          ?
        </IconButton>
      ) : null}
      {onClose ? (
        <IconButton label={closeLabel ?? `Close ${label}`} onClick={onClose}>
          ✕
        </IconButton>
      ) : null}
    </span>
  );
}

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: React.ReactNode;
  /** Expanded = 700-wide drawer (board 16:6 expand action); announced via aria-pressed. */
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** See PanelHeaderActionsProps.closeLabel. */
  closeLabel?: string;
}

export function PanelHeader({ title, actions, isExpanded, onExpandToggle, onHelpClick, onClose, closeLabel, className, ...rest }: PanelHeaderProps) {
  return (
    <div
      className={[
        // T3 — MEASURED, not read off a PNG (2026-08-04). Figma `148:2`'s header
        // instance `208:411`, title node `I208:411;16:7`: Inter Medium (500),
        // 11px, 16px line-height, 0.88px tracking, ink-soft #4B5563, and the
        // layer's own text is "Content" — Title Case, no transform.
        //
        // So the size, weight, tracking and colour here were already right and
        // stay untouched; the delta was exactly one property. `tw:uppercase`
        // came from molecule `16:6`, whose description still claims "11/600
        // caps with 8% tracking" — wrong on the case AND the weight. Every
        // screen on page `1:3` overrules it (founder decision D2: the screens
        // win). The tracking survives the case change deliberately: the screen
        // keeps 0.88px on Title Case text.
        "tw:flex tw:items-center tw:gap-2 tw:h-11 tw:py-0 tw:pl-4 tw:pr-3 tw:bg-[var(--bk-bg-panel)] tw:border-b tw:border-[var(--bk-border)] " +
          "tw:[font-family:var(--bk-font-ui)] tw:text-[length:var(--bk-text-11)] tw:font-medium tw:tracking-[0.08em] tw:text-[var(--bk-ink-soft)] tw:flex-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="panel-header"
      {...rest}
    >
      {/* The heading is the TITLE, not the bar. `role="heading"` used to sit on
          the container, which was harmless only while the container held
          nothing but the title — the moment PanelFrame's subtitle moved in
          beside it, the heading's accessible name became "SEOSearch & social
          preview", and any action label in here would have joined it. Caught by
          SettingsTab's pending-nav test, which asserted the heading read "SEO". */}
      <span className="tw:flex-1" role="heading" aria-level={2}>
        {title}
      </span>
      <PanelHeaderActions
        label={title}
        closeLabel={closeLabel}
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        {actions}
      </PanelHeaderActions>
    </div>
  );
}
