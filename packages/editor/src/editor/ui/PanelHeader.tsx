/**
 * PanelHeader — Figma 16:6.
 * The 44px bar at the top of every drawer panel: title left, actions right.
 * @license BSD-3-Clause
 */
import React from "react";

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
      <span className="bk-panel-header__actions">
        {actions}
        {onPinToggle ? (
          <button
            type="button"
            className="bk-btn bk-btn--ghost bk-btn--sm"
            onClick={onPinToggle}
            aria-pressed={Boolean(isPinned)}
            aria-label={isPinned ? `Unpin ${title}` : `Pin ${title}`}
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
            aria-label={`Close ${title}`}
          >
            ✕
          </button>
        ) : null}
      </span>
    </div>
  );
}
