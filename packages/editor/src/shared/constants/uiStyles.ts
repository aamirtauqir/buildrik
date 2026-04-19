/**
 * Shared UI Styles - Single Source of Truth
 * Used by ALL panels: Sidebar, Inspector, Canvas overlays
 *
 * @description This module provides a unified design token system for consistent
 * typography, colors, spacing, and component styles across the entire application.
 * All values reference CSS variables defined in Canvas.css for theming support.
 *
 * @example
 * import { UI } from '@/constants/uiStyles';
 *
 * <div style={{ ...UI.text.md, color: UI.color.primary }}>
 *   Body text
 * </div>
 *
 * @license BSD-3-Clause
 */

import type { CSSProperties } from "react";

/**
 * Typography styles using CSS variables for consistent font sizing
 */
export const TEXT_STYLES = {
  xs: {
    fontSize: "var(--buildrick-font-xs)",
    fontWeight: "var(--buildrick-weight-medium)",
    lineHeight: 1.4,
  } as CSSProperties,
  sm: {
    fontSize: "var(--buildrick-font-sm)",
    fontWeight: "var(--buildrick-weight-medium)",
    lineHeight: 1.4,
  } as CSSProperties,
  md: {
    fontSize: "var(--buildrick-font-md)",
    fontWeight: "var(--buildrick-weight-normal)",
    lineHeight: 1.5,
  } as CSSProperties,
  lg: {
    fontSize: "var(--buildrick-font-lg)",
    fontWeight: "var(--buildrick-weight-medium)",
    lineHeight: 1.4,
  } as CSSProperties,
  xl: {
    fontSize: "var(--buildrick-font-xl)",
    fontWeight: "var(--buildrick-weight-semibold)",
    lineHeight: 1.3,
  } as CSSProperties,
};

/**
 * Color tokens referencing CSS variables
 */
export const COLOR = {
  primary: "var(--buildrick-text-primary)",
  secondary: "var(--buildrick-text-secondary)",
  tertiary: "var(--buildrick-text-tertiary)",
  muted: "var(--buildrick-text-muted)",
  accent: "var(--buildrick-accent)",
  accentLight: "var(--buildrick-accent-tint)",
};

/**
 * Surface/background colors for different elevation levels
 */
export const SURFACE = {
  level1: "var(--buildrick-surface-1)",
  level2: "var(--buildrick-surface-2)",
  level3: "var(--buildrick-surface-3)",
  level4: "var(--buildrick-surface-4)",
};

/**
 * Spacing scale in pixels (for inline styles that need numbers)
 */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/**
 * Card component styles with states
 */
export const CARD_STYLES = {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 8px",
    background: "var(--buildrick-surface-3)",
    border: "1px solid transparent",
    borderRadius: "var(--buildrick-design-radius-md)",
    cursor: "pointer",
    transition: "var(--buildrick-transition-fast)",
    minHeight: 64,
  } as CSSProperties,
  hover: {
    background: "var(--buildrick-surface-4)",
    borderColor: "var(--buildrick-accent-hover)",
    boxShadow: "var(--buildrick-design-shadow-md)",
    transform: "translateY(-2px)",
  } as CSSProperties,
  selected: {
    border: "2px solid var(--buildrick-accent)",
    boxShadow: "0 0 0 4px var(--buildrick-accent-tint)",
  } as CSSProperties,
};

/**
 * Tab component styles
 */
export const TAB_STYLES = {
  bar: {
    display: "flex",
    gap: 4,
    padding: "8px 8px 0",
    background: "var(--buildrick-surface-2)",
    borderBottom: "1px solid var(--buildrick-border-subtle)",
  } as CSSProperties,
  button: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 12px",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    borderRadius: "6px 6px 0 0",
    cursor: "pointer",
    fontSize: "var(--buildrick-font-md)",
    fontWeight: 500,
    color: "var(--buildrick-text-tertiary)",
    transition: "var(--buildrick-transition-fast)",
  } as CSSProperties,
  active: {
    color: "var(--buildrick-text-primary)",
    borderBottomColor: "var(--buildrick-accent)",
    background: "var(--buildrick-surface-3)",
  } as CSSProperties,
};

/**
 * Accordion/Category header styles
 */
export const ACCORDION_STYLES = {
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: "var(--buildrick-surface-3)",
    border: "none",
    borderLeft: "2px solid transparent",
    borderRadius: "var(--buildrick-design-radius-md)",
    cursor: "pointer",
    fontSize: "var(--buildrick-font-lg)",
    fontWeight: 500,
    color: "var(--buildrick-text-primary)",
    transition: "var(--buildrick-transition-fast)",
  } as CSSProperties,
  headerOpen: {
    background: "var(--buildrick-surface-4)",
    borderLeftColor: "var(--buildrick-accent)",
  } as CSSProperties,
  content: {
    padding: "8px 4px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  } as CSSProperties,
};

/**
 * Badge styles (count pills, labels)
 */
export const BADGE_STYLES = {
  base: {
    fontSize: "var(--buildrick-font-xs)",
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: 10,
    background: "var(--buildrick-accent-tint)",
    color: "var(--buildrick-accent)",
  } as CSSProperties,
  count: {
    fontSize: "var(--buildrick-font-xs)",
    fontWeight: 500,
    padding: "2px 6px",
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.1)",
    color: "var(--buildrick-text-secondary)",
  } as CSSProperties,
};

/**
 * Label styles for form fields and sections
 */
export const LABEL_STYLES = {
  base: {
    fontSize: "var(--buildrick-font-sm)",
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as CSSProperties,
  section: {
    fontSize: "var(--buildrick-font-xs)",
    fontWeight: 600,
    color: "var(--buildrick-text-tertiary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: 8,
  } as CSSProperties,
};

/**
 * Input field styles
 */
export const INPUT_STYLES = {
  base: {
    fontSize: "var(--buildrick-font-md)",
    padding: "8px 10px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid var(--buildrick-border-default)",
    borderRadius: "var(--buildrick-design-radius-sm)",
    color: "var(--buildrick-text-primary)",
    transition: "var(--buildrick-transition-fast)",
  } as CSSProperties,
  focus: {
    borderColor: "var(--buildrick-accent)",
    outline: "none",
    boxShadow: "0 0 0 2px var(--buildrick-accent-tint)",
  } as CSSProperties,
};

/**
 * Animation keyframes CSS string (inject in component)
 */
export const UI_ANIMATIONS = `
  @keyframes fadeInCard {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInSlide {
    from {
      opacity: 0;
      transform: translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

/**
 * Unified UI object for convenient imports
 * @example import { UI } from '@/constants/uiStyles';
 */
export const UI = {
  text: TEXT_STYLES,
  color: COLOR,
  surface: SURFACE,
  space: SPACE,
  card: CARD_STYLES,
  tab: TAB_STYLES,
  accordion: ACCORDION_STYLES,
  badge: BADGE_STYLES,
  label: LABEL_STYLES,
  input: INPUT_STYLES,
  animations: UI_ANIMATIONS,
} as const;

/**
 * Helper to merge base + hover/active styles
 */
export function mergeStyles(
  base: CSSProperties,
  ...additional: (CSSProperties | undefined | null | false)[]
): CSSProperties {
  return additional.reduce<CSSProperties>((acc, style) => (style ? { ...acc, ...style } : acc), {
    ...base,
  });
}

export default UI;
