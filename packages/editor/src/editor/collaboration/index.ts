/**
 * editor/collaboration — Real-time collaboration UI components
 * Integration: L1 — UI components wired, engine collaboration at L1 (CollaborationManager)
 *
 * Public API: PresenceIndicators (also exported as PresenceAvatars), ConnectionQualityIndicator.
 *
 * @license BSD-3-Clause
 */

export { PresenceIndicators } from "./PresenceIndicators";
// PresenceAvatars is an alias for PresenceIndicators (WS-15 naming)
export { PresenceIndicators as PresenceAvatars } from "./PresenceIndicators";
export { ConnectionQualityIndicator } from "./ConnectionQualityIndicator";
