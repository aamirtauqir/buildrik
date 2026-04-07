/**
 * Canvas Design Tokens
 * TypeScript references to CSS variables - NOT duplicate values!
 *
 * Why this exists:
 * - Canvas.css is the single source of truth for all values
 * - This file provides TypeScript autocomplete for CSS variable names
 * - Components use these tokens to reference CSS variables
 * - Changing a value in Canvas.css updates everywhere automatically
 *
 * Usage:
 *   // Component style
 *   background: tokens.colors.primary  // Returns 'var(--aqb-primary)'
 *
 * @license BSD-3-Clause
 */

/**
 * Color tokens referencing CSS variables
 * All values are CSS var() references, not hardcoded colors
 */
export const colors = {
  // Primary brand colors
  primary: "var(--aqb-primary)",
  primaryLight: "var(--aqb-primary-light)",
  primaryDark: "var(--aqb-primary-dark)",
  primarySubtle: "var(--aqb-primary-subtle)",

  // Legacy (aliased to primary)
  secondary: "var(--aqb-secondary)",
  accent: "var(--aqb-accent)",

  // Selection
  selection: "var(--aqb-selection-color)",

  // Accent blue (same as primary in current theme)
  accentBlue: "var(--aqb-accent-blue)",
  accentBlueAlpha: "var(--aqb-accent-blue-alpha)",
  accentBlueHover: "var(--aqb-accent-blue-hover)",

  // Canvas content colors (light theme)
  background: "var(--aqb-bg)",
  text: "var(--aqb-text)",
  textMuted: "var(--aqb-text-muted)",
  border: "var(--aqb-border)",

  // Canvas wrapper
  canvasWrapper: "var(--aqb-canvas-wrapper)",
  canvasContent: "var(--aqb-canvas-content)",

  // UI Text colors (dark theme panels)
  textPrimary: "var(--aqb-text-primary)",
  textSecondary: "var(--aqb-text-secondary)",
  textTertiary: "var(--aqb-text-tertiary)",

  // UI Surfaces (dark theme panels)
  surface1: "var(--aqb-surface-1)",
  surface2: "var(--aqb-surface-2)",
  surface3: "var(--aqb-surface-3)",
  surface4: "var(--aqb-surface-4)",

  // Borders
  borderSubtle: "var(--aqb-border-subtle)",
  borderDefault: "var(--aqb-border-default)",
  borderStrong: "var(--aqb-border-strong)",

  // Drop feedback
  dropValidBorder: "var(--aqb-drop-valid-border)",
  dropValidBg: "var(--aqb-drop-valid-bg)",
  dropInvalidBorder: "var(--aqb-drop-invalid-border)",
  dropInvalidBg: "var(--aqb-drop-invalid-bg)",

  // Badge colors
  badgeTag: "var(--aqb-badge-tag)",
  badgeId: "var(--aqb-badge-id)",
  badgeClass: "var(--aqb-badge-class)",
  badgeData: "var(--aqb-badge-data)",
  badgeDefault: "var(--aqb-badge-default)",

  // Feedback colors
  success: "var(--aqb-success)",
  successBg: "var(--aqb-success-bg)",
  error: "var(--aqb-error)",
  errorBg: "var(--aqb-error-bg)",
  warning: "var(--aqb-warning)",
  warningBg: "var(--aqb-warning-bg)",
  info: "var(--aqb-info)",
  infoBg: "var(--aqb-info-bg)",

  // Toolbar colors
  toolbarBg: "var(--aqb-toolbar-bg)",
  toolbarBgHover: "var(--aqb-toolbar-bg-hover)",
  toolbarBorder: "var(--aqb-toolbar-border)",
  toolbarText: "var(--aqb-toolbar-text)",
  toolbarTextHover: "var(--aqb-toolbar-text-hover)",
  toolbarTextMuted: "var(--aqb-toolbar-text-muted)",
  toolbarTextActive: "var(--aqb-toolbar-text-active)",

  // Guide colors
  guideColor: "var(--aqb-guide-color)",
  guideColorAlt: "var(--aqb-guide-color-alt)",

  // Spacing indicator colors
  spacingMargin: "var(--aqb-spacing-margin)",
  spacingPadding: "var(--aqb-spacing-padding)",
} as const;

/**
 * Typography tokens
 * Consistent scale for all UI text
 */
export const typography = {
  // Font families
  fontFamily: "var(--aqb-font-family)",
  headingFont: "var(--aqb-heading-font)",
  monoFont: "var(--aqb-font-mono)",

  // Font sizes (UX-compliant scale)
  fontXs: "var(--aqb-text-xs)", // 10px - hints, very small
  fontSm: "var(--aqb-text-sm)", // 11px - labels
  fontMd: "var(--aqb-text-base)", // 13px - body, inputs
  fontLg: "var(--aqb-text-md)", // 14px - section headers
  fontXl: "var(--aqb-text-lg)", // 16px - titles, headings

  // Font weights
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,

  // Line height
  lineHeight: "var(--aqb-leading-normal)",

  // Semantic presets for consistent usage
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--aqb-text-secondary)",
  },
  value: {
    fontSize: "13px",
    fontWeight: 400,
    color: "var(--aqb-text-primary)",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: "var(--aqb-text-primary)",
  },
} as const;

/**
 * Spacing tokens
 * Aligned with UX plan: 8px/12px as primary values
 */
export const spacing = {
  xs: "var(--aqb-space-1)", // 4px
  sm: "var(--aqb-space-2)", // 8px - small gaps
  md: "var(--aqb-space-3)", // 12px - medium gaps
  lg: "var(--aqb-space-4)", // 16px
  xl: "var(--aqb-space-6)", // 24px
} as const;

/**
 * Border radius tokens
 * Standard: 6px for most UI elements (consistent visual language)
 */
export const radius = {
  xs: "var(--aqb-radius-xs)", // 3px - subtle
  sm: "var(--aqb-radius-sm)", // 5px - inputs, badges
  default: "6px", // 6px - standard UI elements
  md: "var(--aqb-radius-md)", // 8px - cards, panels
  lg: "var(--aqb-radius-lg)", // 12px - modals
  xl: "var(--aqb-radius-xl)", // 16px - large panels
  full: "var(--aqb-radius-full)", // 9999px - pills, circles
} as const;

/**
 * Shadow tokens
 */
export const shadows = {
  sm: "var(--aqb-shadow-sm)",
  md: "var(--aqb-shadow-md)",
  lg: "var(--aqb-shadow-lg)",
  accent: "var(--aqb-shadow-accent)",
  hover: "var(--aqb-shadow-hover)",
} as const;

/**
 * Selection-specific tokens
 */
export const selection = {
  color: "var(--aqb-selection-color)",
  glow: "var(--aqb-selection-glow)",
  glowStrong: "var(--aqb-selection-glow-strong)",
  outline: "var(--aqb-selection-outline)",
  handleGradient: "var(--aqb-handle-gradient)",
} as const;

/**
 * Transition tokens
 */
export const transitions = {
  fast: "var(--aqb-transition-fast)", // 150ms ease
  normal: "var(--aqb-transition-normal)", // 200ms ease
  slow: "var(--aqb-transition-slow)", // 300ms ease
} as const;

/**
 * Z-index scale - unified layer system
 * All values match Z_LAYERS from constants/canvas.ts
 */
export const zIndex = {
  // Content layers (1-99)
  canvasContent: 1,
  // Canvas chrome (rulers, guides) - above content but below selection
  rulers: 10,
  guides: 15,
  backdrop: 99,

  // Selection layers (100-999)
  canvasOverlay: 100,
  dropdown: 100,
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

  // Modal layers (4000+)
  modal: 4000,
  tooltip: 5000,
  toast: 5500,
} as const;

/**
 * Size constants (hardcoded, structural)
 */
export const sizes = {
  handleSize: 8,
  edgeThreshold: 8,
  minElementSize: 20,
} as const;

/**
 * Combined tokens export for convenience
 */
export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  selection,
  transitions,
  zIndex,
  sizes,
} as const;

export default tokens;
