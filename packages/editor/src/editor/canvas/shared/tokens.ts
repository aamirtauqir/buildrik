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
 *   background: tokens.colors.primary  // Returns 'var(--buildrick-accent)'
 *
 * @license BSD-3-Clause
 */

/**
 * Color tokens referencing CSS variables
 * All values are CSS var() references, not hardcoded colors
 */
export const colors = {
  // Primary brand colors
  primary: "var(--buildrick-accent)",
  primaryLight: "var(--buildrick-accent-subtle)",
  primaryDark: "var(--buildrick-accent-pressed)",
  primarySubtle: "var(--buildrick-accent-tint)",

  // Legacy (aliased to primary)
  secondary: "var(--buildrick-text-muted)",
  accent: "var(--buildrick-accent)",

  // Selection
  selection: "var(--buildrick-selection-color)",

  // Accent blue (same as primary in current theme)
  accentBlue: "var(--buildrick-accent)",
  accentBlueAlpha: "var(--buildrick-accent-tint)",
  accentBlueHover: "var(--buildrick-accent-hover)",

  // Canvas content colors (light theme)
  background: "var(--buildrick-bg)",
  text: "var(--buildrick-text)",
  textMuted: "var(--buildrick-text-muted)",
  border: "var(--buildrick-border)",

  // Canvas wrapper
  canvasWrapper: "var(--buildrick-canvas-wrapper)",
  canvasContent: "var(--buildrick-canvas-content)",

  // UI Text colors (dark theme panels)
  textPrimary: "var(--buildrick-text-primary)",
  textSecondary: "var(--buildrick-text-secondary)",
  textTertiary: "var(--buildrick-text-tertiary)",

  // UI Surfaces (dark theme panels)
  surface1: "var(--buildrick-surface-1)",
  surface2: "var(--buildrick-surface-2)",
  surface3: "var(--buildrick-surface-3)",
  surface4: "var(--buildrick-surface-4)",

  // Borders
  borderSubtle: "var(--buildrick-border-subtle)",
  borderDefault: "var(--buildrick-border-default)",
  borderStrong: "var(--buildrick-border-strong)",

  // Drop feedback
  dropValidBorder: "var(--buildrick-drop-valid-border)",
  dropValidBg: "var(--buildrick-drop-valid-bg)",
  dropInvalidBorder: "var(--buildrick-drop-invalid-border)",
  dropInvalidBg: "var(--buildrick-drop-invalid-bg)",

  // Badge colors
  badgeTag: "var(--buildrick-badge-tag)",
  badgeId: "var(--buildrick-badge-id)",
  badgeClass: "var(--buildrick-badge-class)",
  badgeData: "var(--buildrick-badge-data)",
  badgeDefault: "var(--buildrick-badge-default)",

  // Feedback colors
  success: "var(--buildrick-success)",
  successBg: "var(--buildrick-success-bg)",
  error: "var(--buildrick-error)",
  errorBg: "var(--buildrick-error-bg)",
  warning: "var(--buildrick-warning)",
  warningBg: "var(--buildrick-warning-bg)",
  info: "var(--buildrick-info)",
  infoBg: "var(--buildrick-info-bg)",

  // Toolbar colors
  toolbarBg: "var(--buildrick-toolbar-bg)",
  toolbarBgHover: "var(--buildrick-toolbar-bg-hover)",
  toolbarBorder: "var(--buildrick-toolbar-border)",
  toolbarText: "var(--buildrick-toolbar-text)",
  toolbarTextHover: "var(--buildrick-toolbar-text-hover)",
  toolbarTextMuted: "var(--buildrick-toolbar-text-muted)",
  toolbarTextActive: "var(--buildrick-toolbar-text-active)",

  // Guide colors
  guideColor: "var(--buildrick-guide-color)",
  guideColorAlt: "var(--buildrick-guide-color-alt)",

  // Spacing indicator colors
  spacingMargin: "var(--buildrick-spacing-margin)",
  spacingPadding: "var(--buildrick-spacing-padding)",
} as const;

/**
 * Typography tokens
 * Consistent scale for all UI text
 */
export const typography = {
  // Font families
  fontFamily: "var(--buildrick-font-family)",
  headingFont: "var(--buildrick-heading-font)",
  monoFont: "var(--buildrick-design-font-mono)",

  // Font sizes (UX-compliant scale)
  fontXs: "var(--buildrick-text-xs)", // 10px - hints, very small
  fontSm: "var(--buildrick-text-sm)", // 11px - labels
  fontMd: "var(--buildrick-text-base)", // 13px - body, inputs
  fontLg: "var(--buildrick-text-md)", // 14px - section headers
  fontXl: "var(--buildrick-text-lg)", // 16px - titles, headings

  // Font weights
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,

  // Line height
  lineHeight: "var(--buildrick-leading-normal)",

  // Semantic presets for consistent usage
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
  },
  value: {
    fontSize: "13px",
    fontWeight: 400,
    color: "var(--buildrick-text-primary)",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: "var(--buildrick-text-primary)",
  },
} as const;

/**
 * Spacing tokens
 * Aligned with UX plan: 8px/12px as primary values
 */
export const spacing = {
  xs: "var(--buildrick-design-space-1)", // 4px
  sm: "var(--buildrick-design-space-2)", // 8px - small gaps
  md: "var(--buildrick-design-space-3)", // 12px - medium gaps
  lg: "var(--buildrick-design-space-4)", // 16px
  xl: "var(--buildrick-design-space-6)", // 24px
} as const;

/**
 * Border radius tokens
 * Standard: 6px for most UI elements (consistent visual language)
 */
export const radius = {
  xs: "var(--buildrick-radius-xs)", // 3px - subtle
  sm: "var(--buildrick-design-radius-sm)", // 5px - inputs, badges
  default: "6px", // 6px - standard UI elements
  md: "var(--buildrick-design-radius-md)", // 8px - cards, panels
  lg: "var(--buildrick-design-radius-lg)", // 12px - modals
  xl: "var(--buildrick-design-radius-xl)", // 16px - large panels
  full: "var(--buildrick-design-radius-full)", // 9999px - pills, circles
} as const;

/**
 * Shadow tokens
 */
export const shadows = {
  sm: "var(--buildrick-design-shadow-sm)",
  md: "var(--buildrick-design-shadow-md)",
  lg: "var(--buildrick-design-shadow-lg)",
  accent: "var(--buildrick-shadow-accent)",
  hover: "var(--buildrick-shadow-hover)",
} as const;

/**
 * Selection-specific tokens
 */
export const selection = {
  color: "var(--buildrick-selection-color)",
  glow: "var(--buildrick-selection-glow)",
  glowStrong: "var(--buildrick-selection-glow-strong)",
  outline: "var(--buildrick-selection-outline)",
  handleGradient: "var(--buildrick-handle-gradient)",
} as const;

/**
 * Transition tokens
 */
export const transitions = {
  fast: "var(--buildrick-transition-fast)", // 150ms ease
  normal: "var(--buildrick-transition-normal)", // 200ms ease
  slow: "var(--buildrick-transition-slow)", // 300ms ease
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
