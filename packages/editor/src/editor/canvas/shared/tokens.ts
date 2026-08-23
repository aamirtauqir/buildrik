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
 *   background: tokens.colors.primary  // Returns 'var(--bk-accent)'
 *
 * @license BSD-3-Clause
 */

/**
 * Color tokens referencing CSS variables
 * All values are CSS var() references, not hardcoded colors
 */
export const colors = {
  // Primary brand colors
  primary: "var(--bk-accent)",
  primaryLight: "var(--bk-accent-subtle)",
  primaryDark: "var(--bk-accent-pressed)",
  primarySubtle: "var(--bk-accent-tint)",

  // Legacy (aliased to primary)
  secondary: "var(--bk-ink-muted)",
  accent: "var(--bk-accent)",

  // Selection
  selection: "var(--bk-accent)",

  // Accent blue (same as primary in current theme)
  accentBlue: "var(--bk-accent)",
  accentBlueAlpha: "var(--bk-accent-tint)",
  accentBlueHover: "var(--bk-accent-hover)",

  // Canvas content colors (light theme)
  background: "var(--bk-bg-app)",
  text: "var(--bk-ink)",
  textMuted: "var(--bk-ink-muted)",
  border: "var(--bk-border)",

  // Canvas wrapper
  canvasWrapper: "var(--bk-bg-subtle)",
  canvasContent: "var(--bk-bg-card)",

  // UI Text colors (dark theme panels)
  textPrimary: "var(--bk-ink)",
  textSecondary: "var(--bk-ink-soft)",
  textTertiary: "var(--bk-ink-muted)",

  // UI Surfaces (dark theme panels)
  surface1: "var(--bk-bg-panel)",
  surface2: "var(--bk-bg-subtle)",
  surface3: "var(--bk-bg-subtle)",
  surface4: "var(--bk-gray-200)",

  // Borders
  borderSubtle: "var(--bk-border)",
  borderDefault: "var(--bk-border-medium)",
  borderStrong: "var(--bk-border-strong)",

  // Drop feedback
  dropValidBorder: "var(--bk-success)",
  dropValidBg: "var(--bk-success-tint)",
  dropInvalidBorder: "var(--bk-error)",
  dropInvalidBg: "var(--bk-error-tint)",

  // Badge colors
  badgeTag: "var(--bk-ink-muted)",
  badgeId: "var(--bk-ink-muted)",
  badgeClass: "var(--bk-ink-muted)",
  badgeData: "var(--bk-ink-muted)",
  badgeDefault: "var(--bk-ink-muted)",

  // Feedback colors
  success: "var(--bk-success)",
  successBg: "var(--bk-success-tint)",
  error: "var(--bk-error)",
  errorBg: "var(--bk-error-tint)",
  warning: "var(--bk-warning)",
  warningBg: "var(--bk-warning-tint)",
  info: "var(--bk-accent)",
  infoBg: "var(--bk-accent-tint)",

  // Toolbar colors
  toolbarBg: "var(--bk-bg-panel)",
  toolbarBgHover: "var(--bk-bg-subtle)",
  toolbarBorder: "var(--bk-border)",
  toolbarText: "var(--bk-ink)",
  toolbarTextHover: "var(--bk-ink)",
  toolbarTextMuted: "var(--bk-ink-muted)",
  toolbarTextActive: "var(--bk-accent)",

  // Guide colors
  guideColor: "var(--bk-accent)",
  guideColorAlt: "var(--bk-alpha-accent-30)",

  // Spacing indicator colors
  spacingMargin: "var(--bk-space-16)",
  spacingPadding: "var(--bk-space-16)",
} as const;

/**
 * Typography tokens
 * Consistent scale for all UI text
 */
export const typography = {
  // Font families
  fontFamily: "var(--bk-font-ui)",
  headingFont: "var(--bk-font-ui)",
  monoFont: "var(--bk-font-mono)",

  // Font sizes (UX-compliant scale)
  fontXs: "var(--bk-text-11)", // 10px - hints, very small
  fontSm: "var(--bk-text-12)", // 11px - labels
  fontMd: "var(--bk-text-13)", // 13px - body, inputs
  fontLg: "var(--bk-text-13)", // 14px - section headers
  fontXl: "var(--bk-text-16)", // 16px - titles, headings

  // Font weights
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,

  // Line height
  lineHeight: "var(--bk-leading-normal)",

  // Semantic presets for consistent usage
  label: {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--bk-ink-soft)",
  },
  value: {
    fontSize: "13px",
    fontWeight: 400,
    color: "var(--bk-ink)",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: "var(--bk-ink)",
  },
} as const;

/**
 * Spacing tokens
 * Aligned with UX plan: 8px/12px as primary values
 */
export const spacing = {
  xs: "var(--bk-space-4)", // 4px
  sm: "var(--bk-space-8)", // 8px - small gaps
  md: "var(--bk-space-12)", // 12px - medium gaps
  lg: "var(--bk-space-16)", // 16px
  xl: "var(--bk-space-24)", // 24px
} as const;

/**
 * Border radius tokens
 * Standard: 6px for most UI elements (consistent visual language)
 */
export const radius = {
  xs: "var(--bk-radius-sm)", // 3px - subtle
  sm: "var(--bk-radius-sm)", // 5px - inputs, badges
  default: "6px", // 6px - standard UI elements
  md: "var(--bk-radius-lg)", // 8px - cards, panels
  lg: "var(--bk-radius-lg)", // 12px - modals
  xl: "var(--bk-radius-lg)", // 16px - large panels
  full: "var(--bk-radius-full)", // 9999px - pills, circles
} as const;

/**
 * Shadow tokens
 */
export const shadows = {
  sm: "var(--bk-shadow-raised)",
  md: "var(--bk-shadow-drag)",
  lg: "var(--bk-shadow-overlay)",
  accent: "var(--bk-shadow-drag)",
  hover: "var(--bk-shadow-drag)",
} as const;

/**
 * Selection-specific tokens
 */
export const selection = {
  color: "var(--bk-accent)",
  glow: "var(--bk-shadow-focus)",
  glowStrong: "var(--bk-shadow-focus)",
  outline: "var(--bk-accent)",
  handleGradient: "var(--bk-accent)",
} as const;

/**
 * Transition tokens
 */
export const transitions = {
  fast: "var(--bk-transition-fast)", // 150ms ease
  normal: "var(--bk-transition-base)", // 200ms ease
  slow: "var(--bk-transition-base)", // 300ms ease
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
