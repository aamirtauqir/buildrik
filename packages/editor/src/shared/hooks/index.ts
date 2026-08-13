/**
 * shared/hooks — Canonical shared React hooks
 * Integration: L2 — hooks physically live here
 *
 * @license BSD-3-Clause
 */

// UI interaction hooks (no external deps)
export { useClickOutside } from "./useClickOutside";
export { useEscapeKey } from "./useEscapeKey";
export { useRefetchOnFocus } from "./useRefetchOnFocus";
export { useReducedMotion } from "./useReducedMotion";

// Feedback hooks (depend on Composer + events)
export { useElementFlash } from "./useElementFlash";

// (usePublish removed — the sidebar PublishTab now shares the canonical
//  usePublishJob state machine with the Topbar; see editor/shell/hooks.)

// Form handler hook (composer-backed form registration + submission)
export { useFormHandler } from "./useFormHandler";
export type { UseFormHandlerResult } from "./useFormHandler";

// History tab hooks
export { useHistoryState } from "./useHistoryState";
export type { UseHistoryStateReturn } from "./useHistoryState";
export { useVersionHistory } from "./useVersionHistory";
export type { UseVersionHistoryReturn } from "./useVersionHistory";
export { useAutoMilestone } from "./useAutoMilestone";
export type { MilestoneSuggestion, UseAutoMilestoneReturn } from "./useAutoMilestone";
