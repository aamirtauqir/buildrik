/**
 * Aquibra Breakpoint Constants
 * Responsive design breakpoint definitions
 *
 * @module constants/breakpoints
 * @license BSD-3-Clause
 */

import type { BreakpointConfig, BreakpointId } from "../types/breakpoints";
import type { DeviceType } from "../types/state";

/**
 * Breakpoint definitions
 * Desktop-first approach: desktop is base, tablet/mobile override
 */
export const BREAKPOINTS: Record<BreakpointId, BreakpointConfig> = {
  desktop: {
    id: "desktop",
    name: "Desktop",
    minWidth: 1024,
    maxWidth: undefined,
    icon: "desktop",
    order: 0,
  },
  tablet: {
    id: "tablet",
    name: "Tablet",
    minWidth: 768,
    maxWidth: 1023,
    icon: "tablet",
    order: 1,
  },
  mobile: {
    id: "mobile",
    name: "Mobile",
    minWidth: 0,
    maxWidth: 767,
    icon: "mobile",
    order: 2,
  },
} as const;

/**
 * Ordered list of breakpoints (widest to narrowest)
 */
export const BREAKPOINT_ORDER: BreakpointId[] = ["desktop", "tablet", "mobile"];

/**
 * CSS media queries for each breakpoint
 * Desktop-first: base styles apply to desktop, media queries handle smaller
 */
export const BREAKPOINT_QUERIES: Record<BreakpointId, string | null> = {
  /** Desktop: no media query (base styles) */
  desktop: null,
  /** Tablet: max-width 1023px */
  tablet: "(max-width: 1023px)",
  /** Mobile: max-width 767px */
  mobile: "(max-width: 767px)",
} as const;

/**
 * Get media query string for a breakpoint
 * Returns null for desktop (base styles)
 */
export function getBreakpointQuery(breakpoint: BreakpointId): string | null {
  return BREAKPOINT_QUERIES[breakpoint];
}

/**
 * Get breakpoint config by ID
 */
export function getBreakpointConfig(breakpoint: BreakpointId): BreakpointConfig {
  return BREAKPOINTS[breakpoint];
}

/**
 * Check if a breakpoint ID is valid
 */
export function isValidBreakpoint(id: string): id is BreakpointId {
  return id in BREAKPOINTS;
}

/**
 * Get breakpoint for a given viewport width
 */
export function getBreakpointForWidth(width: number): BreakpointId {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

// ============================================================================
// DEVICE PREVIEW SIZES
// Used for canvas device previews (distinct from responsive breakpoints)
// ============================================================================

/**
 * The one device-size table (G2-013). The canvas frame, the engine viewport
 * and the legacy device presets all read it; they used to carry three tables
 * that disagreed on Desktop (100 % / 1280 / 1920). Desktop fills the column,
 * floored at BREAKPOINTS.desktop.minWidth; Wide is a fixed 1920.
 */
export const DEVICE_PREVIEW_SIZES = {
  wide: { label: "Wide", width: 1920, height: "100%" },
  desktop: { label: "Desktop", width: "100%", height: "100%" },
  tablet: { label: "Tablet", width: 768, height: 1024 },
  mobile: { label: "Mobile", width: 375, height: 812 },
} as const satisfies Record<DeviceType, { label: string; width: number | "100%"; height: number | "100%" }>;
