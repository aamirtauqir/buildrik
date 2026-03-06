/**
 * shared/hooks — Canonical shared React hooks
 * Integration: L2 — hooks physically live here
 *
 * @license BSD-3-Clause
 */

// UI interaction hooks (no external deps)
export { useClickOutside } from "./useClickOutside";
export { useEscapeKey } from "./useEscapeKey";
export { useReducedMotion } from "./useReducedMotion";

// Onboarding
export { useOnboarding } from "./useOnboarding";
export type { OnboardingStep, OnboardingState } from "./useOnboarding";

// Feedback hooks (depend on Composer + events)
export { useSaveIndicator } from "./useSaveIndicator";
export type { SaveStatus, SaveIndicatorState } from "./useSaveIndicator";
export { useElementFlash } from "./useElementFlash";

// Publish hook
export { usePublish } from "./usePublish";
export type {
  UsePublishReturn,
  UsePublishOptions,
  PublishResult,
  PublishState,
} from "./usePublish";
