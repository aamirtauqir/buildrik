/**
 * CollaborationManager
 * Manages real-time collaboration sessions, rooms, and user presence
 * @license BSD-3-Clause
 */

import type {
  CollaborationUser,
  CollaborationRoom,
  CollaborationState,
  CollaborationEvent,
  CursorPosition,
  JoinEventPayload,
  LeaveEventPayload,
  CursorEventPayload,
  SelectionEventPayload,
  EditingEventPayload,
  UserEditingState,
  SyncResponsePayload,
  ElementLock,
  LockEventPayload,
} from "../../shared/types/collaboration";
import type { Composer } from "../Composer";
import { EventEmitter } from "../EventEmitter";
import { OTEngine } from "./OTEngine";
import type { OTOperation } from "./OTTypes";
import type { CollaborationTransport } from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_COLORS = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#22d3ee", // cyan
  "#818cf8", // indigo
  "#e879f9", // pink
  "#fb7185", // rose
];

// ============================================================================
// COLLABORATION MANAGER
// ============================================================================

/**
 * Manages collaboration sessions and user presence
 */
export class CollaborationManager extends EventEmitter {
  private composer: Composer;
  private state: CollaborationState = "disconnected";
  private room: CollaborationRoom | null = null;
  private currentUser: CollaborationUser | null = null;
  private transport: CollaborationTransport | null = null;
  private colorIndex = 0;
  private otEngine: OTEngine;
  /** Tracks which users are editing which elements */
  private editingStates: Map<string, UserEditingState> = new Map();
  /** Timeout for clearing stale editing states (3 seconds) */
  private static EDITING_TIMEOUT = 3000;
  /** Element locks - soft locks for visual indicators (elementId -> lock info) */
  private elementLocks: Map<string, ElementLock> = new Map();
  /** Timeout for auto-releasing stale locks (5 seconds) */
  private static LOCK_TIMEOUT = 5000;
  /** Interval for periodic cleanup (10 seconds) */
  private static CLEANUP_INTERVAL = 10000;
  /** Cleanup interval handle */
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(composer: Composer) {
    super();
    this.composer = composer;
    this.otEngine = new OTEngine(composer);
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of stale editing states and locks
   */
  private startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupEditingStates();
      this.cleanupStaleLocks();
    }, CollaborationManager.CLEANUP_INTERVAL);
  }

  /**
   * Stop cleanup interval
   */
  private stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get the composer instance (for OT operations in Sprint #14)
   */
  getComposer(): Composer {
    return this.composer;
  }

  // ============================================================================
  // ROOM LIFECYCLE
  // ============================================================================

  /**
   * Create a new collaboration room
   */
  async createRoom(projectId: string, userName: string): Promise<CollaborationRoom> {
    const roomId = this.generateRoomId();
    const userId = this.generateUserId();

    this.currentUser = {
      id: userId,
      name: userName,
      color: this.assignUserColor(),
      lastActive: Date.now(),
    };

    this.room = {
      id: roomId,
      projectId,
      users: [this.currentUser],
      createdAt: Date.now(),
      host: userId,
    };

    await this.connectToRoom(roomId, userId);

    this.emit("room:created", this.room);
    return this.room;
  }

  /**
   * Join an existing collaboration room
   */
  async joinRoom(roomId: string, userName: string): Promise<void> {
    const userId = this.generateUserId();

    this.currentUser = {
      id: userId,
      name: userName,
      color: this.assignUserColor(),
      lastActive: Date.now(),
    };

    await this.connectToRoom(roomId, userId);

    // Send join event to others
    this.broadcast({
      type: "join",
      userId,
      timestamp: Date.now(),
      payload: { user: this.currentUser } as JoinEventPayload,
    });

    // Request state sync from host
    this.broadcast({
      type: "sync_request",
      userId,
      timestamp: Date.now(),
      payload: {},
    });
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.room || !this.currentUser) return;

    // Send leave event to others
    this.broadcast({
      type: "leave",
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: { userId: this.currentUser.id } as LeaveEventPayload,
    });

    await this.transport?.disconnect();

    const roomId = this.room.id;
    this.room = null;
    this.currentUser = null;
    this.editingStates.clear();
    this.setState("disconnected");

    this.emit("room:left", { roomId });
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get all users in the current room
   */
  getUsers(): CollaborationUser[] {
    return this.room?.users ?? [];
  }

  /**
   * Get the current user
   */
  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  /**
   * Check if current user is the room host
   */
  isHost(): boolean {
    return this.room?.host === this.currentUser?.id;
  }

  // ============================================================================
  // CURSOR & SELECTION
  // ============================================================================

  /**
   * Update cursor position and broadcast to others
   */
  updateCursor(position: CursorPosition): void {
    if (!this.currentUser) return;

    this.currentUser.cursor = position;
    this.currentUser.lastActive = Date.now();

    this.broadcast({
      type: "cursor",
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: { position } as CursorEventPayload,
    });
  }

  /**
   * Update selection and broadcast to others
   */
  updateSelection(elementIds: string[]): void {
    if (!this.currentUser) return;

    this.currentUser.selection = elementIds;
    this.currentUser.lastActive = Date.now();

    this.broadcast({
      type: "selection",
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: { elementIds } as SelectionEventPayload,
    });
  }

  /**
   * Notify that current user is editing an element
   */
  notifyEditing(elementId: string): void {
    if (!this.currentUser) return;

    const state: UserEditingState = {
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userColor: this.currentUser.color,
      elementId,
      lastEditTime: Date.now(),
    };

    // Store locally
    this.editingStates.set(`${this.currentUser.id}:${elementId}`, state);

    // Broadcast to others
    this.broadcast({
      type: "editing",
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: { elementId, timestamp: Date.now() } as EditingEventPayload,
    });

    this.emit("editing:update", state);
  }

  /**
   * Get users currently editing a specific element (excluding current user)
   */
  getEditorsForElement(elementId: string): UserEditingState[] {
    const now = Date.now();
    const editors: UserEditingState[] = [];

    this.editingStates.forEach((state) => {
      if (
        state.elementId === elementId &&
        state.userId !== this.currentUser?.id &&
        now - state.lastEditTime < CollaborationManager.EDITING_TIMEOUT
      ) {
        editors.push(state);
      }
    });

    return editors;
  }

  /**
   * Clear stale editing states
   */
  private cleanupEditingStates(): void {
    const now = Date.now();
    this.editingStates.forEach((state, key) => {
      if (now - state.lastEditTime > CollaborationManager.EDITING_TIMEOUT) {
        this.editingStates.delete(key);
        this.emit("editing:cleared", { userId: state.userId, elementId: state.elementId });
      }
    });
  }

  // ============================================================================
  // ELEMENT LOCKING (Soft Locks)
  // ============================================================================

  /**
   * Acquire a soft lock on an element (visual indicator only)
   * Broadcasts to other users that you're editing this element
   */
  acquireLock(elementId: string): void {
    if (!this.currentUser) return;

    const lock: ElementLock = {
      elementId,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userColor: this.currentUser.color,
      lockedAt: Date.now(),
    };

    this.elementLocks.set(elementId, lock);

    this.broadcast({
      type: "lock",
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: { elementId, action: "acquire" } as LockEventPayload,
    });

    this.emit("lock:acquired", lock);
  }

  /**
   * Release a lock on an element
   */
  releaseLock(elementId: string): void {
    if (!this.currentUser) return;

    const lock = this.elementLocks.get(elementId);
    if (lock && lock.userId === this.currentUser.id) {
      this.elementLocks.delete(elementId);

      this.broadcast({
        type: "lock",
        userId: this.currentUser.id,
        timestamp: Date.now(),
        payload: { elementId, action: "release" } as LockEventPayload,
      });

      this.emit("lock:released", { elementId, userId: this.currentUser.id });
    }
  }

  /**
   * Release all locks held by current user
   */
  releaseAllLocks(): void {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;
    const locksToRelease: string[] = [];

    this.elementLocks.forEach((lock, elementId) => {
      if (lock.userId === userId) {
        locksToRelease.push(elementId);
      }
    });

    for (const elementId of locksToRelease) {
      this.releaseLock(elementId);
    }
  }

  /**
   * Get lock info for an element (if locked by another user)
   */
  getLock(elementId: string): ElementLock | null {
    const lock = this.elementLocks.get(elementId);
    if (!lock) return null;
    // Don't return if it's our own lock
    if (lock.userId === this.currentUser?.id) return null;
    // Check if lock is stale
    if (Date.now() - lock.lockedAt > CollaborationManager.LOCK_TIMEOUT) {
      this.elementLocks.delete(elementId);
      return null;
    }
    return lock;
  }

  /**
   * Get all active locks (excluding current user's locks)
   */
  getAllLocks(): ElementLock[] {
    const now = Date.now();
    const locks: ElementLock[] = [];

    this.elementLocks.forEach((lock) => {
      if (
        lock.userId !== this.currentUser?.id &&
        now - lock.lockedAt < CollaborationManager.LOCK_TIMEOUT
      ) {
        locks.push(lock);
      }
    });

    return locks;
  }

  /**
   * Clean up stale locks
   */
  private cleanupStaleLocks(): void {
    const now = Date.now();
    const staleKeys: string[] = [];

    this.elementLocks.forEach((lock, elementId) => {
      if (now - lock.lockedAt > CollaborationManager.LOCK_TIMEOUT) {
        staleKeys.push(elementId);
      }
    });

    for (const elementId of staleKeys) {
      const lock = this.elementLocks.get(elementId);
      this.elementLocks.delete(elementId);
      if (lock) {
        this.emit("lock:expired", { elementId, userId: lock.userId });
      }
    }
  }

  /**
   * Broadcast a local operation to other users
   */
  broadcastOperation(operation: OTOperation): void {
    if (!this.currentUser) return;

    this.broadcast({
      type: "operation",
      userId: this.currentUser.id,
      timestamp: Date.now(),
      payload: operation,
    });
  }

  /**
   * Get the OT engine instance
   */
  getOTEngine(): OTEngine {
    return this.otEngine;
  }

  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Get current connection state
   */
  getState(): CollaborationState {
    return this.state;
  }

  /**
   * Get current room
   */
  getRoom(): CollaborationRoom | null {
    return this.room;
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.state === "connected" && this.room !== null;
  }

  // ============================================================================
  // TRANSPORT
  // ============================================================================

  /**
   * Set the transport layer for communication
   */
  setTransport(transport: CollaborationTransport): void {
    this.transport = transport;

    transport.onMessage((event) => this.handleTransportMessage(event));
    transport.onDisconnect(() => this.handleDisconnect());
    transport.onReconnect(() => this.handleReconnect());
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async connectToRoom(roomId: string, userId: string): Promise<void> {
    if (!this.transport) {
      throw new Error("No transport configured. Call setTransport() first.");
    }

    this.setState("connecting");

    try {
      await this.transport.connect(roomId, userId);
      this.setState("connected");
      this.otEngine.initialize(userId);
    } catch (error) {
      this.setState("disconnected");
      throw error;
    }
  }

  private handleTransportMessage(event: CollaborationEvent): void {
    // Ignore own events
    if (event.userId === this.currentUser?.id) return;

    switch (event.type) {
      case "join":
        this.handleUserJoin(event.payload as JoinEventPayload);
        break;
      case "leave":
        this.handleUserLeave(event.payload as LeaveEventPayload);
        break;
      case "cursor":
        this.handleCursorUpdate(event.userId, event.payload as CursorEventPayload);
        break;
      case "selection":
        this.handleSelectionUpdate(event.userId, event.payload as SelectionEventPayload);
        break;
      case "editing":
        this.handleEditingUpdate(event.userId, event.payload as EditingEventPayload);
        break;
      case "lock":
        this.handleLockUpdate(event.userId, event.payload as LockEventPayload);
        break;
      case "operation": {
        const transformedPatch = this.otEngine.applyRemoteOperation(event.payload as OTOperation);
        if (transformedPatch) {
          this.emit("operation:apply", transformedPatch);
        }
        break;
      }
      case "sync_request":
        this.handleSyncRequest(event);
        break;
      case "sync_response":
        this.handleSyncResponse(event);
        break;
    }
  }

  private handleUserJoin(payload: JoinEventPayload): void {
    if (!this.room) return;

    const existingIndex = this.room.users.findIndex((u) => u.id === payload.user.id);
    if (existingIndex >= 0) {
      this.room.users[existingIndex] = payload.user;
    } else {
      this.room.users.push(payload.user);
    }

    this.emit("user:join", payload.user);
  }

  private handleUserLeave(payload: LeaveEventPayload): void {
    if (!this.room) return;

    this.room.users = this.room.users.filter((u) => u.id !== payload.userId);

    // Clean up editing states and locks for the leaving user
    this.cleanupEditingStatesForUser(payload.userId);
    this.cleanupLocksForUser(payload.userId);

    this.emit("user:leave", payload.userId);
  }

  /**
   * Clean up all editing states for a specific user (e.g., when they disconnect)
   */
  private cleanupEditingStatesForUser(userId: string): void {
    const keysToDelete: string[] = [];

    this.editingStates.forEach((state, key) => {
      if (state.userId === userId) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      const state = this.editingStates.get(key);
      this.editingStates.delete(key);
      if (state) {
        this.emit("editing:cleared", { userId: state.userId, elementId: state.elementId });
      }
    }
  }

  private handleCursorUpdate(userId: string, payload: CursorEventPayload): void {
    const user = this.room?.users.find((u) => u.id === userId);
    if (user) {
      user.cursor = payload.position;
      user.lastActive = Date.now();
      this.emit("cursor:update", { userId, position: payload.position });
    }
  }

  private handleSelectionUpdate(userId: string, payload: SelectionEventPayload): void {
    const user = this.room?.users.find((u) => u.id === userId);
    if (user) {
      user.selection = payload.elementIds;
      user.lastActive = Date.now();
      this.emit("selection:update", { userId, elementIds: payload.elementIds });
    }
  }

  private handleEditingUpdate(userId: string, payload: EditingEventPayload): void {
    const user = this.room?.users.find((u) => u.id === userId);
    if (!user) return;

    const state: UserEditingState = {
      userId,
      userName: user.name,
      userColor: user.color,
      elementId: payload.elementId,
      lastEditTime: payload.timestamp,
    };

    this.editingStates.set(`${userId}:${payload.elementId}`, state);
    this.emit("editing:update", state);

    // Schedule cleanup
    setTimeout(() => this.cleanupEditingStates(), CollaborationManager.EDITING_TIMEOUT + 100);
  }

  /**
   * Handle lock event from remote user
   */
  private handleLockUpdate(userId: string, payload: LockEventPayload): void {
    const user = this.room?.users.find((u) => u.id === userId);
    if (!user) return;

    if (payload.action === "acquire") {
      const lock: ElementLock = {
        elementId: payload.elementId,
        userId,
        userName: user.name,
        userColor: user.color,
        lockedAt: Date.now(),
      };
      this.elementLocks.set(payload.elementId, lock);
      this.emit("lock:acquired", lock);
    } else if (payload.action === "release") {
      this.elementLocks.delete(payload.elementId);
      this.emit("lock:released", { elementId: payload.elementId, userId });
    }
  }

  /**
   * Clean up all locks for a specific user (e.g., when they disconnect)
   */
  private cleanupLocksForUser(userId: string): void {
    const locksToRemove: string[] = [];

    this.elementLocks.forEach((lock, elementId) => {
      if (lock.userId === userId) {
        locksToRemove.push(elementId);
      }
    });

    for (const elementId of locksToRemove) {
      this.elementLocks.delete(elementId);
      this.emit("lock:released", { elementId, userId });
    }
  }

  /**
   * Handle sync request from a new user joining
   * Only the host responds with the current project state
   */
  private handleSyncRequest(_event: CollaborationEvent): void {
    if (!this.isHost()) return;

    const project = this.composer.exportProject();
    const version = this.otEngine.getVersion();

    this.transport?.send({
      type: "sync_response",
      userId: this.currentUser?.id || "",
      timestamp: Date.now(),
      payload: { project, version } as SyncResponsePayload,
    });
  }

  /**
   * Handle sync response from host
   * Applies the received project state
   */
  private handleSyncResponse(event: CollaborationEvent): void {
    const { project, version } = event.payload as SyncResponsePayload;

    // Import the project state
    this.composer.importProject(project);

    // Sync OT version
    this.otEngine.setVersion(version);

    this.emit("sync:complete", { version });
  }

  private handleDisconnect(): void {
    this.setState("disconnected");

    // Clear all editing states on disconnect
    this.editingStates.forEach((state) => {
      this.emit("editing:cleared", { userId: state.userId, elementId: state.elementId });
    });
    this.editingStates.clear();

    // Clear all locks on disconnect
    this.elementLocks.forEach((lock) => {
      this.emit("lock:released", { elementId: lock.elementId, userId: lock.userId });
    });
    this.elementLocks.clear();

    this.emit("connection:lost");
  }

  private handleReconnect(): void {
    this.setState("connected");
    this.emit("connection:restored");
  }

  private broadcast(event: CollaborationEvent): void {
    this.transport?.send(event);
  }

  private setState(state: CollaborationState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit("state:change", state);
    }
  }

  private assignUserColor(): string {
    const color = USER_COLORS[this.colorIndex % USER_COLORS.length];
    this.colorIndex++;
    return color;
  }

  private generateRoomId(): string {
    return `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.stopCleanupInterval();
    this.otEngine.destroy();
    this.editingStates.clear();
    this.elementLocks.clear();
    this.leaveRoom().catch(() => {});
    this.transport = null;
    this.removeAllListeners();
  }
}

export default CollaborationManager;
