/**
 * Canvas Constants
 * Centralized colors, styles, and configurations for Canvas components
 * @license BSD-3-Clause
 */

import type React from "react";

// ============================================
// DESIGN TOKENS - SINGLE SOURCE OF TRUTH
// ============================================

/**
 * Buildrik Brand Accent Palette
 * References the generated --bk-* accent ramp (themes/tokens.generated.css).
 * Renamed from BRAND_PURPLE 2026-04-26 — name was a pre-cobalt-era leftover;
 * values were already pointing at accent vars.
 */
const BRAND_ACCENT = {
  // Core shades — resolve via the generated accent ramp
  DEFAULT: "var(--bk-accent)", // #1A56DB — Main accent
  light: "var(--bk-accent-subtle)", // Faint accent background
  dark: "var(--bk-accent-pressed)", // Active/pressed states
  subtle: "var(--bk-accent-tint)", // Very light accent tint

  // Alpha variations for glows and overlays — accent alpha ramp
  alpha10: "var(--bk-accent-tint)",
  alpha15: "var(--bk-alpha-accent-15)",
  alpha20: "var(--bk-alpha-accent-15)",
  alpha30: "var(--bk-alpha-accent-30)",
  alpha40: "var(--bk-alpha-accent-30)",
} as const;

/**
 * Selection & Interaction Colors
 * Used for element selection, resize handles, and focus states
 * References CSS variables for consistency with Canvas.css
 */
export const SELECTION_COLORS = {
  // Selection outline and handles - reference CSS vars
  outline: "var(--bk-accent)",
  outlineHover: "var(--bk-accent-subtle)",
  handle: "var(--bk-accent)",
  handleHover: "var(--bk-accent-subtle)",
  handleGradient: "var(--bk-accent)",

  // Glow effects - reference CSS vars
  glow: "var(--bk-shadow-focus)",
  glowStrong: "var(--bk-shadow-focus)",
  glowSubtle: "var(--bk-shadow-focus)",

  // Multi-select
  multiSelectOutline: "var(--bk-alpha-accent-30)",
  multiSelectFill: "var(--bk-accent-tint)",
} as const;
// ============================================
// COLORS (Legacy - for backward compatibility)
// ============================================

export const CANVAS_COLORS = {
  /* Background / text / borders were the 2026-04 dark theme's, kept after the
     theme unification flipped the editor to light: `#1e1e2e` panels with
     `#cdd6f4` text. Every floating thing on the canvas that reads these — the
     element context menu and its submenus, smart suggestions, the canvas
     dropdowns and inputs — was a black panel in a white editor, and board
     1176:4866 draws the same menu white. Repointed at the light tokens here,
     which is one edit for twenty-six call sites. */
  bgPanel: "var(--bk-bg-card)",
  bgPanelSecondary: "var(--bk-bg-subtle)",
  bgInput: "var(--bk-bg-card)",
  bgHover: BRAND_ACCENT.alpha15,

  // Text
  textPrimary: "var(--bk-ink)",
  textSecondary: "var(--bk-ink-soft)",
  textMuted: "var(--bk-ink-muted)",

  // Borders
  border: "var(--bk-border)",
  borderLight: "var(--bk-border)",
  borderInput: "var(--bk-border)",

  // Accent — cobalt accent ramp via BRAND_ACCENT
  primary: BRAND_ACCENT.DEFAULT,
  primaryLight: BRAND_ACCENT.light,
  primaryDark: BRAND_ACCENT.dark,
  primaryGradient: `linear-gradient(135deg, ${BRAND_ACCENT.DEFAULT} 0%, ${BRAND_ACCENT.light} 100%)`,
  accentGradient: `linear-gradient(135deg, ${BRAND_ACCENT.dark} 0%, ${BRAND_ACCENT.DEFAULT} 100%)`,

  // Selection
  selection: SELECTION_COLORS.outline,
  selectionGlow: SELECTION_COLORS.glow,

  // Backward-compatible aliases for engine/canvas/ consumers
  SELECTION: "#0D99FF",
  HOVER: "#0D99FF33",

  // Indicators
  margin: "#10B981", // Emerald green
  padding: "var(--bk-accent-pressed)", // Blue for padding indicator

  // Badges
  badgeTag: "#10B981",
  badgeId: "var(--bk-accent)", // Blue badge for IDs
  badgeClass: "#F59E0B",
  badgeData: "var(--bk-accent)",
  badgeCustom: "var(--bk-ink-muted)",

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "var(--bk-accent)",
  errorBg: "rgba(239, 68, 68, 0.15)",
  errorBorder: "rgba(239, 68, 68, 0.3)",
} as const;

// ============================================
// ANIMATION TOKENS
// ============================================

const ANIMATION = {
  // Durations
  duration: {
    instant: "50ms",
    fast: "150ms",
    normal: "var(--bk-motion-base)",
    slow: "300ms",
    slower: "400ms",
  },

  // Easing functions
  easing: {
    default: "var(--bk-ease-default)",
    smooth: "ease-out",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Presets
  transition: {
    fast: "all 150ms var(--bk-ease-default)",
    normal: "all var(--bk-motion-base) var(--bk-ease-default)",
    slow: "all 300ms var(--bk-ease-default)",
    colors: "background-color 150ms ease, border-color 150ms ease, color 150ms ease",
    transform: "transform var(--bk-motion-base) var(--bk-ease-default)",
  },
} as const;

// ============================================
// SHADOW TOKENS
// ============================================

export const SHADOWS = {
  // Elevation shadows
  sm: "var(--bk-shadow-raised)",
  md: "var(--bk-shadow-drag)",
  lg: "var(--bk-shadow-overlay)",
  xl: "var(--bk-shadow-overlay)",

  // Blue glow shadows (matches primary brand color)
  glowSm: "0 2px 8px var(--bk-alpha-accent-15)",
  glowMd: "0 4px 14px var(--bk-alpha-accent-30)",
  glowLg: "0 8px 25px var(--bk-alpha-accent-30)",

  // Selection shadows
  selection: SELECTION_COLORS.glow,
  selectionStrong: SELECTION_COLORS.glowStrong,

  // Hover lift shadow
  hoverLift: "var(--bk-shadow-drag)",
} as const;

// ============================================
// SHARED STYLES
// ============================================

export const BUTTON_BASE_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "6px 10px",
  background: "transparent",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  transition: "all 0.15s ease",
  fontSize: 13,
};

export const PANEL_STYLE: React.CSSProperties = {
  background: CANVAS_COLORS.bgPanel,
  border: `1px solid ${CANVAS_COLORS.border}`,
  borderRadius: 10,
  boxShadow: "var(--bk-shadow-overlay)",
};

export const INPUT_STYLE: React.CSSProperties = {
  background: CANVAS_COLORS.bgInput,
  border: `1px solid ${CANVAS_COLORS.borderInput}`,
  borderRadius: 6,
  color: CANVAS_COLORS.textPrimary,
  padding: "6px 8px",
  fontSize: 12,
};

export const DROPDOWN_STYLE: React.CSSProperties = {
  position: "absolute",
  background: CANVAS_COLORS.bgPanel,
  border: `1px solid ${CANVAS_COLORS.borderInput}`,
  borderRadius: 6,
  boxShadow: "var(--bk-shadow-drag)",
  overflow: "hidden",
  zIndex: 100,
};

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: CANVAS_COLORS.textMuted,
};

export const GROUP_HEADER_STYLE: React.CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  color: CANVAS_COLORS.textMuted,
  padding: "6px 8px",
};

// ============================================
// Z-INDEX LAYERS - UNIFIED REGISTRY
// Single source of truth for all z-index values
// Updated: Phase 4 Canvas Styling Audit
// ============================================

/**
 * Unified Z-Index Layer System
 * All z-index values MUST come from this registry
 * DO NOT use hardcoded z-index values anywhere else!
 *
 * Layer Groups:
 * - 1-99: Canvas content layers
 * - 100-999: Selection and hover layers
 * - 1000-1999: Overlay layers (selection box, handles)
 * - 2000-2999: Drop feedback layers
 * - 3000-3999: Floating UI (panels, toolbars)
 * - 4000-4999: Context menus
 * - 5000-5999: Modals
 * - 6000+: Tooltips and highest priority
 */
export const Z_LAYERS = {
  // Content layers (1-99)
  canvasContent: 1,
  // Canvas chrome (rulers, guides) - above content but below selection
  rulers: 10,
  guides: 15,

  // Selection layers (100-999)
  selectionOutline: 100,
  hoverOverlay: 150,

  // Overlay layers (1000-1999)
  selectionBox: 1000,
  selectionHandle: 1001,
  selectionBadge: 1002,
  pointerBadge: 1003,
  badge: 1004,
  alignmentToolbar: 1050,

  // Drop feedback layers (2000-2999)
  dropFeedback: 2000,
  dropPositionLine: 2001,
  dropSlot: 2002,
  dropBadge: 2003,
  dropBreadcrumb: 2004,
  dropDestinationLabel: 2005,
  dropDepthBadge: 2006,

  // Floating UI layers (3000-3999)
  floatingPanel: 3000,
  floatingToolbar: 3001,
  contextMenu: 3500,

  // Modal layers (4000-4999)
  modal: 4000,
  modalOverlay: 4001,

  // Highest priority (5000+)
  tooltip: 5000,
  toast: 5500,
} as const;

/** @deprecated Use Z_LAYERS instead - kept for backward compatibility */
export const Z_INDEX = {
  // Base layers
  backdrop: 99,
  canvasOverlay: Z_LAYERS.selectionOutline,
  dropdown: Z_LAYERS.selectionOutline,

  // Selection & interaction layers
  selectionBox: Z_LAYERS.selectionBox,
  selectionHandle: Z_LAYERS.selectionHandle,
  selectionBadge: Z_LAYERS.selectionBadge,
  pointerBadge: Z_LAYERS.pointerBadge,
  badge: Z_LAYERS.badge,

  // Floating UI layers
  floatingPanel: Z_LAYERS.floatingPanel,
  floatingToolbar: Z_LAYERS.floatingToolbar,

  // Top-level overlays
  contextMenu: Z_LAYERS.contextMenu,
  modal: Z_LAYERS.modal,
  tooltip: Z_LAYERS.tooltip,
} as const;

// ============================================
// SIZES
// ============================================

export const SIZES = {
  handleSize: 8,
  edgeThreshold: 8,
  minElementSize: 20,
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 10,
    round: 50,
  },
  padding: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
} as const;

// ============================================
// DEVICE PRESETS
// ============================================

export const DEVICE_PRESETS = [
  { id: "desktop", name: "Desktop", width: 1920, icon: "🖥️" },
  { id: "tablet", name: "Tablet", width: 768, icon: "📱" },
  { id: "mobile", name: "Mobile", width: 375, icon: "📲" },
] as const;

// ============================================
// ZOOM PRESETS
// ============================================

/* Board 817:4723 states the range as 10%–400% and gives 400% its own state
   card ("Max zoom · sub-pixel work"). The list stopped at 300, so the top of
   the documented range could not be reached from the UI at all — the engine
   clamp (THRESHOLDS.ZOOM_MAX) was never the limit, this array was. 10 stays
   as the floor: it is the min-zoom state and the disabled bound for Zoom out. */
export const ZOOM_PRESETS = [10, 25, 50, 75, 100, 150, 200, 400] as const;

export const ZOOM_LIMITS = {
  min: 10,
  /* 400, per board 817:4723's stated range and its "Max zoom" state card. The
     preset list moved first and this did not, which the SSOT test in
     __tests__/canvas.test.ts caught — it asserts the two agree in both
     directions. */
  max: 400,
  step: 10,
} as const;

// ============================================
// SNAP CONFIGURATION
// ============================================

export const DEFAULT_SNAP_CONFIG = {
  snapToGrid: false,
  gridSize: 10,
  snapToElements: true,
  snapThreshold: 5,
  snapToGuides: true,
  rotationSnapAngles: [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, -15, -30, -45, -60, -75, -90, -105,
    -120, -135, -150, -165,
  ],
};
