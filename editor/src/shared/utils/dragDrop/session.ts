/**
 * Drag & Drop Session Management
 * Session state tracking and management
 *
 * @module utils/dragDrop/session
 * @license BSD-3-Clause
 */

import type { Point } from "../../types";
import { stopAutoScroll } from "./autoScroll";
import { generateDragSessionId } from "./dragData";
import type { DragData, DragSession } from "./types";

// =============================================================================
// SESSION STORAGE
// =============================================================================

/**
 * Session storage using Map for concurrent drag support
 * Fixes BUG-001: Global drag session race condition
 */
const activeSessions = new Map<string, DragSession>();
let primarySessionId: string | null = null;

// =============================================================================
// SESSION CREATION
// =============================================================================

/**
 * Create new drag session
 * Now supports concurrent sessions without race conditions
 */
export function createDragSession(
  data: DragData,
  startPosition: Point,
  options: Partial<DragSession> = {}
): DragSession {
  const sessionId = data.sessionId || generateDragSessionId();

  // Clean up any existing session with same ID to prevent leaks
  if (activeSessions.has(sessionId)) {
    endDragSessionById(sessionId);
  }

  const session: DragSession = {
    id: sessionId,
    state: "idle",
    data,
    startPosition,
    currentPosition: { ...startPosition },
    delta: { x: 0, y: 0 },
    dropTarget: null,
    dropPosition: null,
    isValidDrop: false,
    ghostElement: null,
    autoScrollTimer: null,
    isKeyboardDrag: false,
    isTouchDrag: false,
    constraints: {
      axis: "none",
      minDistance: 5,
    },
    startTime: Date.now(),
    metadata: {},
    ...options,
  };

  activeSessions.set(sessionId, session);
  primarySessionId = sessionId;
  return session;
}

// =============================================================================
// SESSION RETRIEVAL
// =============================================================================

/**
 * Get current drag session (primary/most recent)
 */
export function getCurrentDragSession(): DragSession | null {
  if (!primarySessionId) return null;
  return activeSessions.get(primarySessionId) || null;
}

/**
 * Get drag session by ID
 */
export function getDragSessionById(sessionId: string): DragSession | null {
  return activeSessions.get(sessionId) || null;
}

// =============================================================================
// SESSION UPDATE
// =============================================================================

/**
 * Update drag session
 */
export function updateDragSession(
  updates: Partial<DragSession>,
  sessionId?: string
): DragSession | null {
  const targetId = sessionId || primarySessionId;
  if (!targetId) return null;

  const session = activeSessions.get(targetId);
  if (!session) return null;

  Object.assign(session, updates);

  if (updates.currentPosition) {
    session.delta = {
      x: updates.currentPosition.x - session.startPosition.x,
      y: updates.currentPosition.y - session.startPosition.y,
    };
  }

  return session;
}

// =============================================================================
// SESSION CLEANUP
// =============================================================================

/**
 * End drag session by ID
 */
export function endDragSessionById(sessionId: string): DragSession | null {
  const session = activeSessions.get(sessionId);

  if (session) {
    // Cleanup ghost element
    if (session.ghostElement) {
      try {
        session.ghostElement.remove();
      } catch {
        // Element may already be removed
      }
      session.ghostElement = null;
    }
    // Cleanup auto-scroll timer
    if (session.autoScrollTimer) {
      stopAutoScroll(session.autoScrollTimer);
      session.autoScrollTimer = null;
    }

    activeSessions.delete(sessionId);

    // Update primary session if this was it
    if (primarySessionId === sessionId) {
      primarySessionId = activeSessions.size > 0 ? Array.from(activeSessions.keys())[0] : null;
    }
  }

  return session || null;
}

/**
 * End drag session (primary/current)
 */
export function endDragSession(): DragSession | null {
  if (!primarySessionId) return null;
  return endDragSessionById(primarySessionId);
}

/**
 * End all active drag sessions (cleanup)
 */
export function endAllDragSessions(): void {
  for (const sessionId of Array.from(activeSessions.keys())) {
    endDragSessionById(sessionId);
  }
  primarySessionId = null;
}

// =============================================================================
// SESSION QUERIES
// =============================================================================

/**
 * Get count of active sessions (for debugging)
 */
export function getActiveDragSessionCount(): number {
  return activeSessions.size;
}

/**
 * Check if drag is in progress
 */
export function isDragging(): boolean {
  const session = getCurrentDragSession();
  return (
    session !== null &&
    (session.state === "dragging" ||
      session.state === "over-valid" ||
      session.state === "over-invalid")
  );
}

/**
 * Check if a specific session is dragging
 */
export function isSessionDragging(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  return (
    session !== null &&
    session !== undefined &&
    (session.state === "dragging" ||
      session.state === "over-valid" ||
      session.state === "over-invalid")
  );
}
