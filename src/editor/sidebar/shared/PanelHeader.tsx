/**
 * PanelHeader - 48px header with title + Pin/Help/Close buttons
 * Used for all left panel tabs in the new design
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PinIcon, HelpIcon, CloseIcon } from "./headerIcons";
import { actionsContainerStyles, titleStyles, headerContainerStyles } from "./headerStyles";

// ============================================
// HeaderActions — shared action buttons (Pin, Help, Close)
// Extracted to avoid duplication between PanelHeader and DrillInHeader
// ============================================

export interface HeaderActionsProps {
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Override container styles (e.g., marginTop for DrillInHeader) */
  style?: React.CSSProperties;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({
  isPinned = false,
  onPinToggle,
  onHelpClick,
  onClose,
  style,
}) => (
  <div style={style ? { ...actionsContainerStyles, ...style } : actionsContainerStyles}>
    {onPinToggle && (
      <button
        onClick={onPinToggle}
        className={`aqb-icon-btn${isPinned ? " aqb-icon-btn--active" : ""}`}
        title={isPinned ? "Unpin panel" : "Pin panel"}
        aria-label={isPinned ? "Unpin panel" : "Pin panel"}
        aria-pressed={isPinned}
      >
        <PinIcon isPinned={isPinned} />
      </button>
    )}

    {onHelpClick && (
      <button onClick={onHelpClick} className="aqb-icon-btn" title="Help" aria-label="Help">
        <HelpIcon />
      </button>
    )}

    {onClose && (
      <button
        onClick={onClose}
        className="aqb-icon-btn"
        title="Close panel"
        aria-label="Close panel"
      >
        <CloseIcon />
      </button>
    )}
  </div>
);

// ============================================
// PanelHeader
// ============================================

export interface PanelHeaderProps {
  /** Panel title (e.g., "Build", "Navigator", "Suggestions") */
  title: string;
  /** Whether the panel is pinned */
  isPinned?: boolean;
  /** Callback when pin button is clicked */
  onPinToggle?: () => void;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Additional content to render in header (rare) */
  children?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  isPinned = false,
  onPinToggle,
  onHelpClick,
  onClose,
  children,
}) => {
  return (
    <header style={headerContainerStyles}>
      <h2 style={titleStyles}>{title}</h2>

      {children}

      <HeaderActions
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
    </header>
  );
};

export default PanelHeader;
