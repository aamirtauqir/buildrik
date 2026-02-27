/**
 * Aquibra Breakpoint Constants
 * Responsive design breakpoint definitions
 *
 * @module constants/breakpoints
 * @license BSD-3-Clause
 */

import type { BreakpointConfig, BreakpointId } from "../types/breakpoints";

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
 * Device preview dimensions for canvas display
 * These are fixed dimensions for simulating device viewports
 */
export const DEVICE_BREAKPOINTS = {
  desktop: {
    width: "100%",
    height: "100%",
    label: "Desktop",
    icon: "desktop",
  },
  tablet: {
    width: 768,
    height: 1024,
    label: "Tablet",
    icon: "tablet",
  },
  mobile: {
    width: 375,
    height: 812,
    label: "Mobile",
    icon: "mobile",
  },
  watch: {
    width: 196,
    height: 230,
    label: "Watch",
    icon: "watch",
  },
} as const;

export type DevicePreviewType = keyof typeof DEVICE_BREAKPOINTS;

/**
 * Get device preview dimensions
 */
export function getDevicePreviewSize(device: DevicePreviewType): {
  width: string | number;
  height: string | number;
} {
  return {
    width: DEVICE_BREAKPOINTS[device].width,
    height: DEVICE_BREAKPOINTS[device].height,
  };
}
