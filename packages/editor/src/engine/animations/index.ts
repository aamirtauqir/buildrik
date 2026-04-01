/**
 * Animations Engine Index
 * @module engine/animations
 * @license BSD-3-Clause
 */

export { GSAPEngine, gsapEngine } from "./GSAPEngine";
export type { TimelineStep, GSAPAnimationConfig, AnimationInstance } from "./GSAPEngine";

export { TimelineManager } from "./TimelineManager";
export type { Keyframe, TimelineTrack, TimelineData } from "./TimelineManager";

export { ScrollTriggerEngine, scrollTriggerEngine } from "./ScrollTriggerEngine";
export type { ScrollTriggerConfig, ScrollTriggerInstance } from "./ScrollTriggerEngine";
