/**
 * Interactions Section Types and Constants
 * @license BSD-3-Clause
 */

import { GSAPEngine } from "../../../../engine/animations";
import type { AnimationConfig } from "../../../../shared/types/animations";

// ============================================================================
// TYPES
// ============================================================================

export type InteractionTrigger =
  // Element triggers
  | "hover"
  | "click"
  | "active"
  | "focus"
  | "blur"
  // Page triggers
  | "page-load"
  | "page-scroll"
  | "page-leave"
  // Scroll triggers
  | "scroll-into-view"
  | "while-scrolling"
  | "scroll-out"
  // Mouse triggers
  | "mouse-over"
  | "mouse-move"
  | "mouse-out";

export interface Interaction {
  id: string;
  trigger: InteractionTrigger;
  animation: AnimationConfig;
  enabled: boolean;
}

export interface InteractionsSectionProps {
  /** Current interactions for the element */
  interactions: Interaction[];
  /** Handler for interactions change */
  onInteractionsChange: (interactions: Interaction[]) => void;
  /** Preview an interaction */
  onPreview?: (interaction: Interaction) => void;
  /** Open timeline editor */
  onOpenTimeline?: (interaction: Interaction) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRIGGER_GROUPS = {
  element: [
    { value: "hover", label: "On Hover", icon: "👆" },
    { value: "click", label: "On Click", icon: "🖱" },
    { value: "active", label: "While Pressed", icon: "👇" },
    { value: "focus", label: "On Focus", icon: "🎯" },
    { value: "blur", label: "On Blur", icon: "💨" },
  ],
  page: [
    { value: "page-load", label: "Page Load", icon: "📄" },
    { value: "page-scroll", label: "Page Scroll", icon: "📜" },
    { value: "page-leave", label: "Page Leave", icon: "👋" },
  ],
  scroll: [
    { value: "scroll-into-view", label: "Scroll Into View", icon: "👁" },
    { value: "while-scrolling", label: "While Scrolling", icon: "🔄" },
    { value: "scroll-out", label: "Scroll Out", icon: "👁‍🗨" },
  ],
  mouse: [
    { value: "mouse-over", label: "Mouse Over", icon: "🐭" },
    { value: "mouse-move", label: "Mouse Move", icon: "➡️" },
    { value: "mouse-out", label: "Mouse Out", icon: "🚪" },
  ],
};

// Animation preset groups for better organization (L1 → L2 upgrade per plan Feature #168)
export const ANIMATION_PRESET_GROUPS = {
  fade: [
    { value: "fadeIn", label: "Fade In" },
    { value: "fadeOut", label: "Fade Out" },
    { value: "fadeInUp", label: "Fade In Up" },
    { value: "fadeInDown", label: "Fade In Down" },
    { value: "fadeInLeft", label: "Fade In Left" },
    { value: "fadeInRight", label: "Fade In Right" },
  ],
  slide: [
    { value: "slideUp", label: "Slide Up" },
    { value: "slideDown", label: "Slide Down" },
    { value: "slideLeft", label: "Slide Left" },
    { value: "slideRight", label: "Slide Right" },
    { value: "slideInUp", label: "Slide In Up" },
    { value: "slideInDown", label: "Slide In Down" },
  ],
  scale: [
    { value: "scaleUp", label: "Scale Up" },
    { value: "scaleDown", label: "Scale Down" },
    { value: "scaleIn", label: "Scale In" },
    { value: "scaleOut", label: "Scale Out" },
    { value: "zoomIn", label: "Zoom In" },
    { value: "zoomOut", label: "Zoom Out" },
  ],
  rotate: [
    { value: "rotate", label: "Rotate" },
    { value: "rotateIn", label: "Rotate In" },
    { value: "rotateOut", label: "Rotate Out" },
    { value: "flip", label: "Flip" },
    { value: "flipX", label: "Flip X" },
    { value: "flipY", label: "Flip Y" },
  ],
  attention: [
    { value: "shake", label: "Shake" },
    { value: "bounce", label: "Bounce" },
    { value: "pulse", label: "Pulse" },
    { value: "wobble", label: "Wobble" },
    { value: "jello", label: "Jello" },
    { value: "heartBeat", label: "Heartbeat" },
    { value: "flash", label: "Flash" },
    { value: "rubberBand", label: "Rubber Band" },
  ],
  special: [
    { value: "blur", label: "Blur" },
    { value: "glow", label: "Glow" },
    { value: "swing", label: "Swing" },
    { value: "tada", label: "Tada" },
    { value: "hinge", label: "Hinge" },
    { value: "rollIn", label: "Roll In" },
    { value: "rollOut", label: "Roll Out" },
  ],
};

// Flat list for backwards compatibility
export const ANIMATION_PRESETS = [
  ...ANIMATION_PRESET_GROUPS.fade,
  ...ANIMATION_PRESET_GROUPS.slide,
  ...ANIMATION_PRESET_GROUPS.scale,
  ...ANIMATION_PRESET_GROUPS.rotate,
  ...ANIMATION_PRESET_GROUPS.attention,
  ...ANIMATION_PRESET_GROUPS.special,
];

export const EASING_OPTIONS = Object.entries(GSAPEngine.EASINGS).map(([key, value]) => ({
  value,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

// Get trigger display info
export const getTriggerInfo = (trigger: InteractionTrigger) => {
  for (const group of Object.values(TRIGGER_GROUPS)) {
    const found = group.find((t) => t.value === trigger);
    if (found) return found;
  }
  return { value: trigger, label: trigger, icon: "⚡" };
};
