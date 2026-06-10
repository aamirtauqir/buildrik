/**
 * Collaboration Engine barrel export
 * @license BSD-3-Clause
 */

export { CollaborationManager } from "./CollaborationManager";
// DB-backed SSE transport (serverless-friendly). A WebSocket transport could be
// added later for lower latency; it implements the same interface.
export { SSETransport } from "./SSETransport";
export { OTEngine } from "./OTEngine";
export type { CollaborationTransport } from "./types";
export type { OTOperation } from "./OTTypes";
// OTTransform not yet defined in OTTypes
