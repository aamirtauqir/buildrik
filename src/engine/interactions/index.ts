/**
 * Interactions Module
 * Element interaction triggers and animations
 *
 * @module engine/interactions
 * @license BSD-3-Clause
 */

// Manager
export { InteractionManager, default } from "./InteractionManager";

// Types
export type {
  InteractionTrigger,
  AnimationPreset,
  EasingFunction,
  InteractionAnimationConfig,
  Interaction,
  ElementInteractionsData,
  InteractionEventData,
  InteractionUpdateEventData,
  TriggerGroup,
} from "./types";

// Constants
export { TRIGGER_GROUPS, DEFAULT_ANIMATION_CONFIG, DEFAULT_INTERACTION } from "./types";
