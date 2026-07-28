/**
 * PanelHeader — Figma 16:6.
 * The 44px bar at the top of every drawer panel: title left, actions right.
 * @license BSD-3-Clause
 */
import React from "react";

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
    <span className={["bk-panel-header__actions", className].filter(Boolean).join(" ")} style={style}>
      {children}
      {onPinToggle ? (
        <button
          type="button"
          className="bk-btn bk-btn--ghost bk-btn--sm"
          onClick={onPinToggle}
          aria-pressed={Boolean(isPinned)}
          aria-label={isPinned ? `Unpin ${label}` : `Pin ${label}`}
        >
          {isPinned ? "📌" : "📍"}
        </button>
      ) : null}
      {onHelpClick ? (
        <button type="button" className="bk-btn bk-btn--ghost bk-btn--sm" onClick={onHelpClick} aria-label="Help">
          ?
        </button>
      ) : null}
      {onClose ? (
        <button
          type="button"
          className="bk-btn bk-btn--ghost bk-btn--sm"
          onClick={onClose}
          aria-label={`Close ${label}`}
        >
          ✕
        </button>
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
      role="heading"
      aria-level={2}
      className={["bk-panel-header", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bk-panel-header__title">{title}</span>
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
