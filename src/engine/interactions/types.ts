/**
 * Interaction Types
 * Type definitions for element interactions and triggers
 *
 * @module engine/interactions/types
 * @license BSD-3-Clause
 */

// =============================================================================
// TRIGGER TYPES
// =============================================================================

/** Trigger events that can start an interaction */
export type InteractionTrigger =
  | "hover"
  | "click"
  | "focus"
  | "blur"
  | "page-load"
  | "page-scroll"
  | "page-leave"
  | "scroll-into-view"
  | "while-scrolling"
  | "scroll-out"
  | "mouse-over"
  | "mouse-move"
  | "mouse-out";

/** Animation preset names */
export type AnimationPreset =
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleIn"
  | "scaleOut"
  | "rotateIn"
  | "rotateOut"
  | "bounceIn"
  | "bounceOut"
  | "flipX"
  | "flipY"
  | "pulse"
  | "shake"
  | "blur"
  | "glow"
  | "custom";

/** Easing function names */
export type EasingFunction =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInQuart"
  | "easeOutQuart"
  | "spring"
  | "bounce";

// =============================================================================
// ANIMATION CONFIG
// =============================================================================

/** Animation configuration for an interaction */
export interface InteractionAnimationConfig {
  /** Animation preset or "custom" */
  preset: AnimationPreset;
  /** Duration in milliseconds */
  duration: number;
  /** Delay before animation starts (ms) */
  delay: number;
  /** Easing function */
  easing: EasingFunction;
  /** Custom CSS properties for "custom" preset */
  customProperties?: Record<string, string | number>;
  /** Target element (self, parent, sibling, or selector) */
  target?: "self" | "parent" | string;
  /** Whether to reverse on trigger end (e.g., hover out) */
  reverse?: boolean;
  /** Loop count (-1 for infinite) */
  loop?: number;
}

// =============================================================================
// INTERACTION
// =============================================================================

/** Single interaction definition */
export interface Interaction {
  /** Unique identifier */
  id: string;
  /** Trigger event type */
  trigger: InteractionTrigger;
  /** Animation configuration */
  animation: InteractionAnimationConfig;
  /** Whether interaction is enabled */
  enabled: boolean;
  /** Optional name for UI display */
  name?: string;
}

/** Data stored on an element */
export interface ElementInteractionsData {
  interactions: Interaction[];
}

// =============================================================================
// EVENT DATA
// =============================================================================

/** Event data for interaction changes */
export interface InteractionEventData {
  elementId: string;
  interaction: Interaction;
}

/** Event data for interaction update */
export interface InteractionUpdateEventData extends InteractionEventData {
  previousInteraction: Interaction;
}

// =============================================================================
// TRIGGER GROUPS (for UI organization)
// =============================================================================

export interface TriggerGroup {
  label: string;
  triggers: InteractionTrigger[];
}

export const TRIGGER_GROUPS: TriggerGroup[] = [
  {
    label: "Mouse",
    triggers: ["hover", "click", "mouse-over", "mouse-move", "mouse-out"],
  },
  {
    label: "Focus",
    triggers: ["focus", "blur"],
  },
  {
    label: "Page",
    triggers: ["page-load", "page-scroll", "page-leave"],
  },
  {
    label: "Scroll",
    triggers: ["scroll-into-view", "while-scrolling", "scroll-out"],
  },
];

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULT_ANIMATION_CONFIG: InteractionAnimationConfig = {
  preset: "fadeIn",
  duration: 300,
  delay: 0,
  easing: "easeOut",
  target: "self",
  reverse: false,
  loop: 1,
};

export const DEFAULT_INTERACTION: Omit<Interaction, "id"> = {
  trigger: "hover",
  animation: DEFAULT_ANIMATION_CONFIG,
  enabled: true,
};
