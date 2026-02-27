/**
 * Alignment Toolbar
 * Floating toolbar for multi-select alignment and distribution
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { AlignmentHandler } from "../../../engine/canvas/AlignmentHandler";
import { canvasTokens } from "../../../styles/tokens";

// ============================================================================
// TYPES
// ============================================================================

interface AlignmentToolbarProps {
  composer: Composer;
  selectedIds: string[];
  onClose?: () => void;
}

// ============================================================================
// STYLES (using design tokens)
// ============================================================================

const { colors, shadows, radius, animation } = canvasTokens;

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 8px",
    background: `linear-gradient(135deg, ${colors.surface.background} 0%, ${colors.surface.backgroundSecondary} 100%)`,
    borderRadius: radius.xl,
    boxShadow: `${shadows.panel}, 0 0 1px ${colors.surface.border}`,
    backdropFilter: "blur(12px)",
    border: `1px solid ${colors.surface.border}`,
  },
  divider: {
    width: 1,
    height: 24,
    background: colors.surface.border,
    margin: "0 4px",
  },
  button: (active: boolean = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    background: active ? colors.primary.alpha30 : "transparent",
    border: "none",
    borderRadius: radius.md,
    color: active ? colors.primary.default : colors.text.secondary,
    fontSize: 14,
    cursor: "pointer",
    transition: `all ${animation.duration.fast}`,
  }),
  buttonHover: {
    background: colors.surface.border,
    color: colors.text.onPrimary,
  },
  groupLabel: {
    fontSize: 9,
    color: colors.text.muted,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    padding: "0 6px",
  },
};

// ============================================================================
// ALIGNMENT BUTTONS CONFIG
// ============================================================================

interface AlignmentButton {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  action: (handler: AlignmentHandler, ids: string[]) => void;
}

const alignmentButtons: AlignmentButton[] = [
  {
    id: "align-left",
    icon: "⫷",
    label: "Align Left",
    shortcut: "Ctrl+Shift+L",
    action: (h, ids) => h.alignHorizontal(ids, "left"),
  },
  {
    id: "align-center-h",
    icon: "⫿",
    label: "Align Center Horizontally",
    shortcut: "Ctrl+Shift+C",
    action: (h, ids) => h.alignHorizontal(ids, "center"),
  },
  {
    id: "align-right",
    icon: "⫸",
    label: "Align Right",
    shortcut: "Ctrl+Shift+R",
    action: (h, ids) => h.alignHorizontal(ids, "right"),
  },
];

const verticalButtons: AlignmentButton[] = [
  {
    id: "align-top",
    icon: "⊤",
    label: "Align Top",
    shortcut: "Ctrl+Shift+T",
    action: (h, ids) => h.alignVertical(ids, "top"),
  },
  {
    id: "align-middle",
    icon: "⊖",
    label: "Align Middle Vertically",
    shortcut: "Ctrl+Shift+M",
    action: (h, ids) => h.alignVertical(ids, "middle"),
  },
  {
    id: "align-bottom",
    icon: "⊥",
    label: "Align Bottom",
    shortcut: "Ctrl+Shift+B",
    action: (h, ids) => h.alignVertical(ids, "bottom"),
  },
];

const distributeButtons: AlignmentButton[] = [
  {
    id: "distribute-h",
    icon: "⋯",
    label: "Distribute Horizontally",
    shortcut: "Ctrl+Shift+H",
    action: (h, ids) => h.distribute(ids, "horizontal"),
  },
  {
    id: "distribute-v",
    icon: "⋮",
    label: "Distribute Vertically",
    shortcut: "Ctrl+Shift+V",
    action: (h, ids) => h.distribute(ids, "vertical"),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({ composer, selectedIds }) => {
  const handlerRef = React.useRef<AlignmentHandler | null>(null);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  // Create handler on mount
  React.useEffect(() => {
    if (composer) {
      handlerRef.current = new AlignmentHandler(composer);
    }
  }, [composer]);

  // Don't show if less than 2 elements selected
  if (selectedIds.length < 2) return null;

  const handleClick = (button: AlignmentButton) => {
    if (!handlerRef.current) return;
    button.action(handlerRef.current, selectedIds);
  };

  const canDistribute = selectedIds.length >= 3;

  const renderButton = (button: AlignmentButton, disabled = false) => (
    <button
      key={button.id}
      style={{
        ...styles.button(false),
        ...(hoveredButton === button.id && !disabled ? styles.buttonHover : {}),
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={() => !disabled && handleClick(button)}
      onMouseEnter={() => !disabled && setHoveredButton(button.id)}
      onMouseLeave={() => setHoveredButton(null)}
      title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ""}${disabled ? " (Need 3+ elements)" : ""}`}
      disabled={disabled}
      aria-label={button.label}
    >
      {button.icon}
    </button>
  );

  return (
    <div style={styles.container}>
      {/* Horizontal alignment */}
      {alignmentButtons.map((btn) => renderButton(btn))}

      <div style={styles.divider} />

      {/* Vertical alignment */}
      {verticalButtons.map((btn) => renderButton(btn))}

      <div style={styles.divider} />

      {/* Distribution */}
      {distributeButtons.map((btn) => renderButton(btn, !canDistribute))}
    </div>
  );
};

export default AlignmentToolbar;
