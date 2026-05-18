/**
 * Animations Engine Index
 *
 * Only GSAPEngine remains (live consumer: InteractionRuntime).
 *
 * ScrollTriggerEngine + TimelineManager deleted 2026-05-18 — 778 LOC of
 * unused infrastructure flagged in the animation feature audit
 * (memory project_animation_audit_20260518.md). Both had zero non-self
 * consumers across the editor tree.
 *
 * @module engine/animations
 * @license BSD-3-Clause
 */

export { GSAPEngine, gsapEngine } from "./GSAPEngine";
export type { TimelineStep, GSAPAnimationConfig, AnimationInstance } from "./GSAPEngine";
