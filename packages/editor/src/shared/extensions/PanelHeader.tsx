/**
 * PanelHeader extension — composition built on vibcoder SurfaceHead.
 *
 * Composes `<SurfaceHead>` with a project-specific action cluster (Pin, Help,
 * Close) plus the inline SVG glyphs the chrome layer expects. Lives outside
 * the vendored vibcoder bundle because vibcoder ships SurfaceHead as a primitive
 * but does not provide the pin/help/close action cluster preset.
 *
 * Two exports:
 *   PanelHeader      — full panel header with title + tag + action cluster.
 *   HeaderActions    — standalone action cluster, used by DrillInHeader for
 *                      its own header layout (back arrow + breadcrumb + actions).
 *
 * Slot mapping:
 *   icon (ReactNode) → vibcoder SurfaceHead `tag` slot (left-of-title decorator)
 *   title (string)   → vibcoder SurfaceHead `title`
 *   children         → rendered into actions cluster BEFORE pin/help/close
 *                      (legacy order: extra content e.g. draft chip sits
 *                      between title and action buttons)
 *   pin/help/close   → rendered as 24×24 icon buttons in actions cluster.
 *                      Each button only renders when its callback is provided.
 *   isPinned         → wires Pin button aria-pressed + filled-glyph visual.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SurfaceHead as VibcoderSurfaceHead } from "@/editor/shared/vibcoder";

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
  color: "var(--buildrick-text-muted, var(--bd-fg-secondary))",
};

const actionsContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  marginRight: 2,
};

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
            ? "var(--buildrick-accent, var(--bd-accent))"
            : "var(--buildrick-text-muted, var(--bd-fg-secondary))",
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

export interface PanelHeaderProps {
  /** Optional icon rendered before the title (16×16 node) */
  icon?: React.ReactNode;
  /** Panel title (e.g., "Build", "Layers", "Pages") */
  title: string;
  /** Optional subtitle / meta line (e.g., "42 blocks · 6 categories") */
  subtitle?: string;
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
  subtitle,
  isPinned = false,
  onPinToggle,
  onHelpClick,
  onClose,
  children,
  className,
}) => {
  const hasActions = onPinToggle || onHelpClick || onClose || children;

  return (
    <VibcoderSurfaceHead
      title={title}
      meta={subtitle}
      tag={icon}
      className={className}
    >
      {hasActions && (
        <>
          {children}
          <HeaderActions
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={onHelpClick}
            onClose={onClose}
          />
        </>
      )}
    </VibcoderSurfaceHead>
  );
};

export default PanelHeader;
