/**
 * Collaboration Types
 * Types for real-time collaboration features
 * @license BSD-3-Clause
 */

import type { ProjectData } from "./index";

// ============================================================================
// USER & CURSOR
// ============================================================================

/**
 * Position of a user's cursor on the canvas
 */
export interface CursorPosition {
  elementId: string | null;
  x: number;
  y: number;
}

/**
 * A user participating in a collaboration session
 */
export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: CursorPosition;
  selection?: string[];
  lastActive: number;
}

// ============================================================================
// ROOM
// ============================================================================

/**
 * A collaboration room where users work together
 */
export interface CollaborationRoom {
  id: string;
  projectId: string;
  users: CollaborationUser[];
  createdAt: number;
  host: string;
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Types of collaboration events
 */
export type CollaborationEventType =
  | "join"
  | "leave"
  | "cursor"
  | "selection"
  | "operation"
  | "editing"
  | "lock"
  | "ping"
  | "pong"
  | "sync_request"
  | "sync_response";

/**
 * A collaboration event sent between users
 */
export interface CollaborationEvent {
  type: CollaborationEventType;
  userId: string;
  timestamp: number;
  payload: unknown;
}

/**
 * Join event payload
 */
export interface JoinEventPayload {
  user: CollaborationUser;
  room: CollaborationRoom;
}

/**
 * Leave event payload
 */
export interface LeaveEventPayload {
  userId: string;
}

/**
 * Cursor event payload
 */
export interface CursorEventPayload {
  position: CursorPosition;
}

/**
 * Selection event payload
 */
export interface SelectionEventPayload {
  elementIds: string[];
}

/**
 * Editing event payload - tracks which element a user is actively editing
 */
export interface EditingEventPayload {
  elementId: string;
  timestamp: number;
}

/**
 * Editing state for a user on a specific element
 */
export interface UserEditingState {
  userId: string;
  userName: string;
  userColor: string;
  elementId: string;
  lastEditTime: number;
}

/**
 * Element lock information (soft lock - visual indicator only)
 */
export interface ElementLock {
  elementId: string;
  userId: string;
  userName: string;
  userColor: string;
  lockedAt: number;
}

/**
 * Lock event payload - broadcast when user starts/stops editing
 */
export interface LockEventPayload {
  elementId: string;
  action: "acquire" | "release";
}

/**
 * Sync request payload - signals a new user needs state
 */
export interface SyncRequestPayload {
  // Empty - just signals need for sync
}

/**
 * Sync response payload - host sends full project state
 */
export interface SyncResponsePayload {
  project: ProjectData; // Full project export
  version: number; // OT version number
}

// ============================================================================
// STATE
// ============================================================================

/**
 * Connection state of the collaboration session
 */
export type CollaborationState = "disconnected" | "connecting" | "connected" | "reconnecting";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for collaboration features
 */
export interface CollaborationConfig {
  /** WebSocket server URL */
  serverUrl?: string;
  /** Enable collaboration features */
  enabled?: boolean;
  /** Reconnection attempts before giving up */
  reconnectAttempts?: number;
  /** Delay between reconnection attempts (ms) */
  reconnectDelay?: number;
  /** Heartbeat interval (ms) */
  heartbeatInterval?: number;
}

/**
 * Connection quality levels
 */
export type ConnectionQuality = "excellent" | "good" | "poor" | "disconnected";

/**
 * Connection quality stats for UI display
 */
export interface ConnectionQualityStats {
  /** Average round-trip latency in ms */
  avgLatency: number;
  /** Number of operations pending ACK */
  pendingCount: number;
  /** Timestamp of last successful ACK */
  lastAckTime: number;
  /** Quality classification */
  quality: ConnectionQuality;
}
