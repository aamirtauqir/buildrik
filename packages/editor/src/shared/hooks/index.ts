/**
 * shared/hooks — Canonical shared React hooks
 * Integration: L2 — hooks physically live here
 *
 * @license BSD-3-Clause
 */

// UI interaction hooks (no external deps)
export { useClickOutside } from "./useClickOutside";
export { useEscapeKey } from "./useEscapeKey";
export { useFocusTrap } from "./useFocusTrap";
export { useReducedMotion } from "./useReducedMotion";

// Feedback hooks (depend on Composer + events)
export { useSaveIndicator } from "./useSaveIndicator";
export type { SaveStatus, SaveIndicatorState } from "./useSaveIndicator";
export { useElementFlash } from "./useElementFlash";

// Publish hook
export { usePublish } from "./usePublish";

// Form handler hook (composer-backed form registration + submission)
export { useFormHandler } from "./useFormHandler";
export type { UseFormHandlerResult } from "./useFormHandler";
export type {
  UsePublishReturn,
  UsePublishOptions,
  PublishResult,
  PublishState,
} from "./usePublish";
