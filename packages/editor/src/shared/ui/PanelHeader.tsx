// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled PanelHeader.
/**
 * Adapter shim — translates legacy PanelHeader API to the vibcoder
 * SurfaceHead primitive (header strip molecule).
 *
 * Strategy: bridge. Renders `<VibcoderSurfaceHead title>` internally and
 * builds the right-cluster actions (pin/help/close) inside the SurfaceHead
 * `actions` slot from the legacy on*Click props. The icon prop is rendered
 * as a leading element inside the title via the SurfaceHead `tag` slot
 * (closest semantic match — eyebrow/meta are textual, tag accepts ReactNode).
 *
 * Prop translations (Phase 4 T4.D mapping):
 *   icon (ReactNode)    → rendered into vibcoder SurfaceHead `tag` slot
 *                         (the only ReactNode slot besides actions; sits
 *                         alongside the title in __body). Legacy rendered
 *                         it inline left of the title with 8px gap; the
 *                         tag slot's __tag CSS class is the equivalent
 *                         left-of-title decorator in vibcoder's surface-head.
 *   title (string)      → vibcoder title.
 *   isPinned (boolean)  → wires pin button aria-pressed + legacy filled-icon
 *                         visual (PinIcon takes isPinned). Forwarded into
 *                         the actions cluster.
 *   onPinToggle (cb)    → renders Pin button in actions cluster when set.
 *   onHelpClick (cb)    → renders Help button in actions cluster when set.
 *   onClose (cb)        → renders Close button in actions cluster when set.
 *   children (ReactNode)→ rendered inside the actions cluster, BEFORE the
 *                         pin/help/close buttons (legacy order: extra
 *                         content (e.g. draft chip) sits between title and
 *                         action buttons).
 *   className           → composed onto vibcoder SurfaceHead root.
 *
 * Visual note: vibcoder bd-surface-head renders <header> with a flex body
 * (eyebrow/title/meta/tag stack on left) and an actions cluster on right.
 * Legacy PanelHeader rendered <header> with title left-of-actions in the
 * same flex direction. Class structure differs — bd-surface-head__body /
 * __title / __actions vs the legacy inline-styled spans — but the visual
 * shape is preserved.
 *
 * HeaderActions: retained as an exported sub-component for callers that
 * want the action cluster standalone (e.g. DrillInHeader). Re-implemented
 * here to remove the inline-styled SVG icon definitions and route through
 * the canonical SurfaceHead actions when called inside a PanelHeader.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SurfaceHead as VibcoderSurfaceHead } from "@/editor/shared/vibcoder";

// ============================================
// Action icons (inline SVGs — 16px, no external dependency)
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
// HeaderActions — shared action buttons (Pin, Help, Close)
// Used by PanelHeader and standalone (DrillInHeader, etc.).
// ============================================

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

// ============================================
// PanelHeader — bridge to vibcoder SurfaceHead
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
  const hasActions = onPinToggle || onHelpClick || onClose || children;

  return (
    <VibcoderSurfaceHead
      title={title}
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
