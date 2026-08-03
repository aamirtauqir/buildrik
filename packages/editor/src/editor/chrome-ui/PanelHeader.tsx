/**
 * PanelHeader — Figma 16:6.
 * The 44px bar at the top of every drawer panel: title left, actions right.
 * @license BSD-3-Clause
 */
import React from "react";
import { IconButton } from "./Icon";

export interface PanelHeaderActionsProps {
  /** Aria-label context: "Pin {label}" / "Close {label}" (e.g. the panel title). */
  label: string;
  /** Drawers can be pinned open; the state is announced, not just drawn. */
  isPinned?: boolean;
  onPinToggle?: () => void;
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
  label, isPinned, onPinToggle, onHelpClick, onClose, children, className, style,
}: PanelHeaderActionsProps) {
  return (
    <span className={["tw:flex tw:items-center tw:gap-1", className].filter(Boolean).join(" ")} style={style}>
      {children}
      {onPinToggle ? (
        <IconButton
          label={isPinned ? `Unpin ${label}` : `Pin ${label}`}
          pressed={Boolean(isPinned)}
          onClick={onPinToggle}
        >
          {isPinned ? "📌" : "📍"}
        </IconButton>
      ) : null}
      {onHelpClick ? (
        <IconButton label="Help" onClick={onHelpClick}>
          ?
        </IconButton>
      ) : null}
      {onClose ? (
        <IconButton label={`Close ${label}`} onClick={onClose}>
          ✕
        </IconButton>
      ) : null}
    </span>
  );
}

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: React.ReactNode;
  /** Drawers can be pinned open; the state is announced, not just drawn. */
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export function PanelHeader({ title, actions, isPinned, onPinToggle, onHelpClick, onClose, className, ...rest }: PanelHeaderProps) {
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
        "tw:flex tw:items-center tw:gap-2 tw:h-11 tw:py-0 tw:pl-4 tw:pr-3 tw:bg-white tw:border-b tw:border-gray-200 " +
          "tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:font-medium tw:tracking-[0.08em] tw:text-gray-600 tw:flex-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        {actions}
      </PanelHeaderActions>
    </div>
  );
}
