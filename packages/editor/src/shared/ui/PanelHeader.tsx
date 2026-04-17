/**
 * PanelHeader — canonical 48px panel header, used by all 10 sidebar tabs.
 * PRD §9.1: title + pin/help/close actions.
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================
// Icons (inline SVGs — no external dependency)
// ============================================

const PinIcon: React.FC<{ isPinned: boolean }> = ({ isPinned }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill={isPinned ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6l3-3 4 4-1 3 4 4-1 1-4-4-3 1-4-4 2-2z" />
    <path d="M5 11l-2 2" />
  </svg>
);

const HelpIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M6 6.5a2 2 0 1 1 2 2v1" />
    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

// ============================================
// Styles (inline CSS-in-JS — Emotion not used here to keep shared/ leaf-clean)
// ============================================

const headerContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: 44,
  minHeight: 44,
  padding: "0 12px",
  borderBottom: "1px solid var(--ls-border-light, #E2E8F0)",
  background: "var(--ls-bg-panel, #F8FAFC)",
  flexShrink: 0,
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  flex: 1,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: "20px",
  color: "var(--ls-text-primary, #0F172A)",
  letterSpacing: "-0.01em",
};

const actionsContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  marginRight: 2,
};

const iconBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  padding: 0,
  border: "none",
  background: "transparent",
  borderRadius: 4,
  cursor: "pointer",
  color: "var(--ls-text-subtle, #64748B)",
};

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
        style={{
          ...iconBtnStyles,
          color: isPinned
            ? "var(--ls-accent, #2D6DFF)"
            : "var(--ls-text-subtle, #64748B)",
        }}
        title={isPinned ? "Unpin panel" : "Pin panel"}
        aria-label={isPinned ? "Unpin panel" : "Pin panel"}
        aria-pressed={isPinned}
      >
        <PinIcon isPinned={isPinned} />
      </button>
    )}

    {onHelpClick && (
      <button
        onClick={onHelpClick}
        style={iconBtnStyles}
        title="Help"
        aria-label="Help"
      >
        <HelpIcon />
      </button>
    )}

    {onClose && (
      <button
        onClick={onClose}
        style={iconBtnStyles}
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
  /** Optional icon rendered before the title (16×16 node) */
  icon?: React.ReactNode;
  /** Panel title (e.g., "Build", "Layers", "Pages") */
  title: string;
  /** Whether the panel is pinned */
  isPinned?: boolean;
  /** Callback when pin button is clicked */
  onPinToggle?: () => void;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Additional content to render in header (rare — e.g., draft chip) */
  children?: React.ReactNode;
  /** className passthrough */
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  icon,
  title,
  isPinned = false,
  onPinToggle,
  onHelpClick,
  onClose,
  children,
  className,
}) => {
  return (
    <header style={headerContainerStyles} className={className}>
      {icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: 8,
            color: "var(--ls-text-subtle, #64748B)",
            flexShrink: 0,
            width: 16,
            height: 16,
          }}
        >
          {icon}
        </span>
      )}

      <h2 style={titleStyles}>{title}</h2>

      {children && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
            marginRight: 4,
            flexShrink: 0,
          }}
        >
          {children}
        </span>
      )}

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
