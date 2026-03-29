/**
 * Animation Type Definitions
 * Types for CSS animations and transitions
 *
 * @module types/animations
 * @license BSD-3-Clause
 */

// ============================================
// Animation Configuration
// ============================================

/**
 * Animation trigger types
 * - load: Animation plays when element appears on page
 * - scroll: Animation plays when element enters viewport
 * - hover: Animation plays on mouse hover
 * - click: Animation plays on click
 */
export type AnimationTrigger = "load" | "scroll" | "hover" | "click";

/**
 * Animation direction values
 */
export type AnimationDirection = "normal" | "reverse" | "alternate" | "alternate-reverse";

/**
 * Animation fill mode values
 */
export type AnimationFillMode = "none" | "forwards" | "backwards" | "both";

/**
 * Configuration for an element animation
 */
export interface AnimationConfig {
  /** Animation name/type (e.g., 'fadeIn', 'bounceIn') */
  type: string;
  /** Duration in milliseconds */
  duration: number;
  /** Delay before animation starts in milliseconds */
  delay: number;
  /** CSS easing function */
  easing: string;
  /** Animation direction */
  direction: AnimationDirection;
  /** Number of iterations (use -1 for infinite) */
  iterations: number;
  /** What triggers the animation */
  trigger: AnimationTrigger;
  /** Scroll offset in pixels (for scroll trigger) */
  scrollOffset?: number;
  /** Fill mode for animation */
  fillMode?: AnimationFillMode;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION: AnimationConfig = {
  type: "fadeIn",
  duration: 1000,
  delay: 0,
  easing: "ease",
  direction: "normal",
  iterations: 1,
  trigger: "load",
  scrollOffset: 100,
  fillMode: "forwards",
};

// ============================================
// Animation Preset Types
// ============================================

/**
 * Animation category types
 */
export type AnimationCategory = "entrance" | "attention" | "exit";

/**
 * Animation preset definition
 */
export interface AnimationPreset {
  /** Animation value/name */
  value: string;
  /** Display label */
  label: string;
  /** Category */
  category: AnimationCategory;
  /** CSS keyframes definition */
  keyframes?: string;
}

/**
 * Animation easing preset
 */
export interface EasingPreset {
  /** CSS easing value */
  value: string;
  /** Display label */
  label: string;
}

// ============================================
// Animation Utilities
// ============================================

/**
 * Generates CSS animation property string from config
 * Uses aqb- prefixed keyframe names to match AnimationPresets.ts
 */
export function generateAnimationCSS(config: AnimationConfig): string {
  const iterations = config.iterations === -1 ? "infinite" : config.iterations.toString();
  const fill = config.fillMode || "forwards";
  // Add aqb- prefix to match keyframe names
  const animName = `aqb-${config.type}`;

  return `${animName} ${config.duration}ms ${config.easing} ${config.delay}ms ${iterations} ${config.direction} ${fill}`;
}

/**
 * Parses CSS animation string to config (partial)
 */
export function parseAnimationCSS(css: string): Partial<AnimationConfig> {
  const parts = css.trim().split(/\s+/);
  const config: Partial<AnimationConfig> = {};

  if (parts[0]) config.type = parts[0];

  // Parse duration (e.g., "1000ms" or "1s")
  const durationMatch = parts.find((p) => /^\d+(ms|s)$/.test(p));
  if (durationMatch) {
    const value = parseFloat(durationMatch);
    config.duration = durationMatch.endsWith("s") ? value * 1000 : value;
  }

  return config;
}
