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
 * Aquibra Brand Color Palette
 * References CSS variables from Canvas.css - the single source of truth
 * Updated: Blue palette (#2563EB) - Phase 4 Canvas Styling Audit
 */
export const BRAND_PURPLE = {
  // Core shades - now reference CSS variables (Blue palette)
  DEFAULT: "var(--aqb-primary)", // #2563EB - Main brand blue
  light: "var(--aqb-primary-light)", // #3B82F6 - Hover states
  dark: "var(--aqb-primary-dark)", // #1D4ED8 - Active/pressed states
  subtle: "var(--aqb-primary-subtle)", // #DBEAFE - Very light tint

  // Alpha variations for glows and overlays (using blue)
  alpha10: "var(--aqb-accent-blue-alpha)", // rgba(37, 99, 235, 0.15)
  alpha15: "rgba(37, 99, 235, 0.15)",
  alpha20: "rgba(37, 99, 235, 0.2)",
  alpha30: "rgba(37, 99, 235, 0.3)",
  alpha40: "rgba(37, 99, 235, 0.4)",
} as const;

/**
 * Selection & Interaction Colors
 * Used for element selection, resize handles, and focus states
 * References CSS variables for consistency with Canvas.css
 */
export const SELECTION_COLORS = {
  // Selection outline and handles - reference CSS vars
  outline: "var(--aqb-selection-color)",
  outlineHover: "var(--aqb-primary-light)",
  handle: "var(--aqb-selection-color)",
  handleHover: "var(--aqb-primary-light)",
  handleGradient: "var(--aqb-handle-gradient)",

  // Glow effects - reference CSS vars
  glow: "var(--aqb-selection-glow)",
  glowStrong: "var(--aqb-selection-glow-strong)",
  glowSubtle: "0 0 0 2px rgba(37, 99, 235, 0.3)",

  // Multi-select
  multiSelectOutline: "rgba(37, 99, 235, 0.4)",
  multiSelectFill: "var(--aqb-accent-blue-alpha)",
} as const;

/**
 * Canvas Surface Colors
 * Background colors for canvas and content areas
 */
export const CANVAS_SURFACE = {
  // Canvas wrapper (outer area)
  wrapper: "#F8FAFC",
  wrapperGradient: "linear-gradient(180deg, #FAFAFB 0%, #F1F5F9 100%)",

  // Canvas content (white editing area)
  content: "#FFFFFF",
  contentBorder: "#E4E4E7",

  // Grid/pattern overlay
  gridDot: "#E2E8F0",
  gridLine: "rgba(37, 99, 235, 0.08)", // Blue grid lines
} as const;

/**
 * Text colors for canvas content
 * Designed for light backgrounds (WCAG AA compliant)
 */
export const CANVAS_TEXT = {
  heading: "#18181B", // Near black for headings
  body: "#27272A", // Dark gray for body text
  secondary: "#52525B", // Medium gray for secondary
  muted: "#71717A", // Light gray for muted text
  placeholder: "#A1A1AA", // Placeholder text
} as const;

// ============================================
// COLORS (Legacy - for backward compatibility)
// ============================================

export const CANVAS_COLORS = {
  // Background
  bgPanel: "#1e1e2e",
  bgPanelSecondary: "#181825",
  bgInput: "var(--aqb-bg-input, #181825)",
  bgHover: BRAND_PURPLE.alpha15,

  // Text
  textPrimary: "#cdd6f4",
  textSecondary: "var(--aqb-text-secondary, #a6adc8)",
  textMuted: "#6c7086",

  // Borders
  border: "rgba(255,255,255,0.1)",
  borderLight: "rgba(255,255,255,0.06)",
  borderInput: "var(--aqb-border, #313244)",

  // Accent - NOW USING PURPLE!
  primary: BRAND_PURPLE.DEFAULT,
  primaryLight: BRAND_PURPLE.light,
  primaryDark: BRAND_PURPLE.dark,
  primaryGradient: `linear-gradient(135deg, ${BRAND_PURPLE.DEFAULT} 0%, ${BRAND_PURPLE.light} 100%)`,
  accentGradient: `linear-gradient(135deg, ${BRAND_PURPLE.dark} 0%, ${BRAND_PURPLE.DEFAULT} 100%)`,

  // Selection
  selection: SELECTION_COLORS.outline,
  selectionGlow: SELECTION_COLORS.glow,

  // Indicators
  margin: "#10B981", // Emerald green
  padding: "var(--aqb-primary-dark)", // Blue for padding indicator

  // Badges
  badgeTag: "#10B981",
  badgeId: "var(--aqb-primary)", // Blue badge for IDs
  badgeClass: "#F59E0B",
  badgeData: "#3B82F6",
  badgeCustom: "#94A3B8",

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  errorBg: "rgba(239, 68, 68, 0.15)",
  errorBorder: "rgba(239, 68, 68, 0.3)",
} as const;

// ============================================
// ANIMATION TOKENS
// ============================================

export const ANIMATION = {
  // Durations
  duration: {
    instant: "50ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
  },

  // Easing functions
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "ease-out",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  // Presets
  transition: {
    fast: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    colors: "background-color 150ms ease, border-color 150ms ease, color 150ms ease",
    transform: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// ============================================
// SHADOW TOKENS
// ============================================

export const SHADOWS = {
  // Elevation shadows
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 12px rgba(0, 0, 0, 0.08)",
  lg: "0 8px 25px rgba(0, 0, 0, 0.12)",
  xl: "0 12px 32px rgba(0, 0, 0, 0.15)",

  // Blue glow shadows (matches primary brand color)
  glowSm: "0 2px 8px rgba(37, 99, 235, 0.2)",
  glowMd: "0 4px 14px rgba(37, 99, 235, 0.3)",
  glowLg: "0 8px 25px rgba(37, 99, 235, 0.4)",

  // Selection shadows
  selection: SELECTION_COLORS.glow,
  selectionStrong: SELECTION_COLORS.glowStrong,

  // Hover lift shadow
  hoverLift: "0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(37, 99, 235, 0.1)",
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
  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
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
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  overflow: "hidden",
  zIndex: 100,
};

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: CANVAS_COLORS.textMuted,
};

export const GROUP_HEADER_STYLE: React.CSSProperties = {
  fontSize: 11,
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

export const ZOOM_PRESETS = [10, 25, 50, 75, 100, 125, 150, 200, 300] as const;

export const ZOOM_LIMITS = {
  min: 10,
  max: 300,
  step: 10,
} as const;
