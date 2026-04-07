/**
 * Aquibra Breakpoint Types
 * Responsive design breakpoint definitions
 *
 * @module types/breakpoints
 * @license BSD-3-Clause
 */

/**
 * Available breakpoint identifiers
 * - desktop: Default styles (1024px+)
 * - tablet: Tablet styles (768-1023px)
 * - mobile: Mobile styles (0-767px)
 */
export type BreakpointId = "desktop" | "tablet" | "mobile";

/**
 * Breakpoint configuration
 */
export interface BreakpointConfig {
  /** Unique breakpoint identifier */
  id: BreakpointId;
  /** Display name */
  name: string;
  /** Minimum width in pixels (inclusive) */
  minWidth: number;
  /** Maximum width in pixels (inclusive, undefined for no max) */
  maxWidth?: number;
  /** Icon for UI display */
  icon?: string;
  /** Sort order (lower = wider screens) */
  order: number;
}

/**
 * Styles organized by breakpoint
 * Desktop styles are the base, tablet and mobile override
 */
export interface BreakpointStyles {
  /** Desktop styles (base, 1024px+) */
  desktop?: Record<string, string>;
  /** Tablet styles (768-1023px) */
  tablet?: Record<string, string>;
  /** Mobile styles (0-767px) */
  mobile?: Record<string, string>;
}

/**
 * Element data with responsive styles
 */
export interface ResponsiveElementStyles {
  /** Element ID */
  elementId: string;
  /** Styles per breakpoint */
  breakpointStyles: BreakpointStyles;
}

/**
 * Media query string for a breakpoint
 */
export interface BreakpointMediaQuery {
  /** Breakpoint ID */
  breakpoint: BreakpointId;
  /** CSS media query string */
  query: string;
}
