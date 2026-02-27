/**
 * Collaboration Transport Types
 * Interface for collaboration communication transports
 * @license BSD-3-Clause
 */

import type { CollaborationEvent } from "../../shared/types/collaboration";

/**
 * Transport interface for collaboration communication
 * Implementations: WebSocketTransport, MockTransport
 */
export interface CollaborationTransport {
  /**
   * Connect to a collaboration room
   * @param roomId - Room identifier
   * @param userId - Current user identifier
   */
  connect(roomId: string, userId: string): Promise<void>;

  /**
   * Disconnect from the current room
   */
  disconnect(): Promise<void>;

  /**
   * Send an event to other users in the room
   * @param event - Event to broadcast
   */
  send(event: CollaborationEvent): void;

  /**
   * Register handler for incoming messages
   * @param handler - Message handler function
   */
  onMessage(handler: (event: CollaborationEvent) => void): void;

  /**
   * Register handler for disconnection
   * @param handler - Disconnect handler function
   */
  onDisconnect(handler: () => void): void;

  /**
   * Register handler for successful reconnection
   * @param handler - Reconnect handler function
   */
  onReconnect(handler: () => void): void;

  /**
   * Check if currently connected
   */
  isConnected(): boolean;
}
