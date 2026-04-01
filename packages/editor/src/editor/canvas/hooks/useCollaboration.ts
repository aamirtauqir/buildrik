/**
 * useCollaboration Hook
 * React hook for managing collaboration state and actions
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback } from "react";
import type { Composer } from "../../../engine/Composer";
import type {
  CollaborationUser,
  CollaborationState,
  CollaborationRoom,
  ConnectionQualityStats,
} from "../../../shared/types/collaboration";

// ============================================================================
// TYPES
// ============================================================================

interface UseCollaborationResult {
  /** All users in the current room */
  users: CollaborationUser[];
  /** The current user */
  currentUser: CollaborationUser | null;
  /** Current room data */
  room: CollaborationRoom | null;
  /** Connection state */
  state: CollaborationState;
  /** Whether connected to a room */
  isConnected: boolean;
  /** Whether current user is the room host */
  isHost: boolean;
  /** Connection quality stats (latency, pending ops) */
  connectionStats: ConnectionQualityStats;
  /** Create a new collaboration room */
  createRoom: (projectId: string, userName: string) => Promise<string>;
  /** Join an existing room */
  joinRoom: (roomId: string, userName: string) => Promise<void>;
  /** Leave the current room */
  leaveRoom: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage collaboration state and actions
 */
const DEFAULT_STATS: ConnectionQualityStats = {
  avgLatency: 0,
  pendingCount: 0,
  lastAckTime: 0,
  quality: "disconnected",
};

export function useCollaboration(composer: Composer | null): UseCollaborationResult {
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [room, setRoom] = useState<CollaborationRoom | null>(null);
  const [state, setState] = useState<CollaborationState>("disconnected");
  const [connectionStats, setConnectionStats] = useState<ConnectionQualityStats>(DEFAULT_STATS);

  // Subscribe to collaboration events
  useEffect(() => {
    if (!composer?.collaboration) return;

    const collab = composer.collaboration;

    const handleUserJoin = (user: CollaborationUser) => {
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== user.id);
        return [...filtered, user];
      });
    };

    const handleUserLeave = (userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleStateChange = (newState: CollaborationState) => {
      setState(newState);
    };

    const handleRoomCreated = (newRoom: CollaborationRoom) => {
      setRoom(newRoom);
      setUsers(newRoom.users);
    };

    const handleRoomLeft = () => {
      setRoom(null);
      setUsers([]);
      setCurrentUser(null);
    };

    collab.on("user:join", handleUserJoin);
    collab.on("user:leave", handleUserLeave);
    collab.on("state:change", handleStateChange);
    collab.on("room:created", handleRoomCreated);
    collab.on("room:left", handleRoomLeft);

    // Initialize with current state
    setState(collab.getState());
    setRoom(collab.getRoom());
    setUsers(collab.getUsers());
    setCurrentUser(collab.getCurrentUser());

    return () => {
      collab.off("user:join", handleUserJoin);
      collab.off("user:leave", handleUserLeave);
      collab.off("state:change", handleStateChange);
      collab.off("room:created", handleRoomCreated);
      collab.off("room:left", handleRoomLeft);
    };
  }, [composer]);

  // Poll connection stats periodically when connected
  useEffect(() => {
    if (!composer?.collaboration || state !== "connected") {
      setConnectionStats(DEFAULT_STATS);
      return;
    }

    const updateStats = () => {
      const otEngine = composer.collaboration.getOTEngine();
      const stats = otEngine.getAckStats();
      setConnectionStats(stats);
    };

    // Update immediately
    updateStats();

    // Poll every 2 seconds
    const intervalId = setInterval(updateStats, 2000);

    return () => clearInterval(intervalId);
  }, [composer, state]);

  // Create a new room
  const createRoom = useCallback(
    async (projectId: string, userName: string): Promise<string> => {
      if (!composer?.collaboration) {
        throw new Error("Collaboration not available");
      }

      const newRoom = await composer.collaboration.createRoom(projectId, userName);
      setRoom(newRoom);
      setCurrentUser(composer.collaboration.getCurrentUser());
      setUsers(composer.collaboration.getUsers());

      return newRoom.id;
    },
    [composer]
  );

  // Join an existing room
  const joinRoom = useCallback(
    async (roomId: string, userName: string): Promise<void> => {
      if (!composer?.collaboration) {
        throw new Error("Collaboration not available");
      }

      await composer.collaboration.joinRoom(roomId, userName);
      setCurrentUser(composer.collaboration.getCurrentUser());
      setUsers(composer.collaboration.getUsers());
      setRoom(composer.collaboration.getRoom());
    },
    [composer]
  );

  // Leave the current room
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!composer?.collaboration) return;

    await composer.collaboration.leaveRoom();
    setUsers([]);
    setCurrentUser(null);
    setRoom(null);
  }, [composer]);

  return {
    users,
    currentUser,
    room,
    state,
    isConnected: state === "connected",
    isHost: room?.host === currentUser?.id,
    connectionStats,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}

export default useCollaboration;
