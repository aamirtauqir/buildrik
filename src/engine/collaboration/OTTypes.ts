/**
 * OT Operation Types
 * Types for Operational Transformation operations
 * @license BSD-3-Clause
 */

import type { Patch } from "../utils/JsonPatch";

/**
 * Unique identifier for an operation
 */
export interface OperationId {
  /** User who created the operation */
  userId: string;
  /** Sequence number from that user */
  seq: number;
  /** Timestamp for ordering */
  timestamp: number;
}

/**
 * An operation that can be transformed and applied
 */
export interface OTOperation {
  /** Unique identifier */
  id: OperationId;
  /** JSON Patch representing the change */
  patch: Patch;
  /** Reverse patch for undo */
  reversePatch: Patch;
  /** Operation this was based on (for transform) */
  parentId: OperationId | null;
  /** Human-readable label */
  label?: string;
}

/**
 * Result of transforming two operations
 */
export interface TransformResult {
  /** Transformed operation A (to apply after B) */
  aPrime: Patch;
  /** Transformed operation B (to apply after A) */
  bPrime: Patch;
}

/**
 * State of the OT engine
 */
export interface OTState {
  /** Last applied operation ID */
  lastApplied: OperationId | null;
  /** Pending local operations not yet acknowledged */
  pendingOps: OTOperation[];
  /** Sequence counter for local operations */
  localSeq: number;
}

/**
 * ACK statistics for connection quality
 */
export interface AckStats {
  /** Number of operations waiting for ACK */
  pending: number;
  /** Average round-trip latency in ms */
  avgLatency: number;
  /** Timestamp of last successful ACK */
  lastAckTime: number;
}

/**
 * Pending operation with timing info
 */
export interface PendingOperation extends OTOperation {
  /** When the operation was sent */
  sentAt: number;
  /** Number of retry attempts */
  retries: number;
}
