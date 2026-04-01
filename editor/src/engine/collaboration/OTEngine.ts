/**
 * OTEngine
 * Operational Transformation engine for conflict resolution
 * @license BSD-3-Clause
 */

import type { ConnectionQuality, ConnectionQualityStats } from "../../shared/types/collaboration";
import type { Composer } from "../Composer";
import { EventEmitter } from "../EventEmitter";
import type { Patch } from "../utils/JsonPatch";
import type { OTOperation, OTState, TransformResult } from "./OTTypes";

/**
 * OT Engine for handling concurrent operations
 * Uses JSON Patch path-based transformation
 */
export class OTEngine extends EventEmitter {
  private composer: Composer;
  private state: OTState;
  private userId: string = "";
  /** Pending operations with timing */
  private pendingWithTiming: Map<string, { sentAt: number; retries: number }> = new Map();
  /** ACK timeout in milliseconds */
  private static ACK_TIMEOUT = 30000;
  /** Cleanup interval handle */
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  /** Latency measurements for averaging */
  private latencyHistory: number[] = [];
  /** Maximum latency samples to keep */
  private static MAX_LATENCY_SAMPLES = 10;
  /** Last successful ACK timestamp */
  private lastAckTime = 0;

  constructor(composer: Composer) {
    super();
    this.composer = composer;
    this.state = {
      lastApplied: null,
      pendingOps: [],
      localSeq: 0,
    };
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Start periodic cleanup of stale pending operations
   */
  private startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupStalePendingOps();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Clean up pending operations that have timed out
   */
  private cleanupStalePendingOps(): void {
    const now = Date.now();
    const staleKeys: string[] = [];

    this.pendingWithTiming.forEach((timing, key) => {
      if (now - timing.sentAt > OTEngine.ACK_TIMEOUT) {
        staleKeys.push(key);
      }
    });

    for (const key of staleKeys) {
      const timing = this.pendingWithTiming.get(key);
      this.pendingWithTiming.delete(key);

      // Parse key to get userId and seq
      const [userId, seqStr] = key.split(":");
      const seq = parseInt(seqStr, 10);

      // Remove from pending ops
      this.state.pendingOps = this.state.pendingOps.filter(
        (op) => !(op.id.userId === userId && op.id.seq === seq)
      );

      // Emit warning event
      this.emit("operation:timeout", {
        opKey: key,
        sentAt: timing?.sentAt,
        duration: now - (timing?.sentAt || 0),
      });
    }

    if (staleKeys.length > 0) {
      this.emit("pending:cleanup", { count: staleKeys.length });
    }
  }

  /**
   * Stop cleanup interval (call on destroy)
   */
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Check if two operation IDs match
   */
  private isMatchingOpId(
    a: import("./OTTypes").OperationId | null,
    b: import("./OTTypes").OperationId | null
  ): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.userId === b.userId && a.seq === b.seq;
  }

  /**
   * Check for divergence between remote operation's parent and expected state
   * Emits 'divergence:detected' event if states have diverged
   */
  private checkDivergence(remoteOp: OTOperation): void {
    const remoteParent = remoteOp.parentId;
    const expectedParent = this.state.lastApplied;

    // Both null means both are at initial state - no divergence
    if (remoteParent === null && expectedParent === null) {
      return;
    }

    // Check if parent IDs match
    if (!this.isMatchingOpId(remoteParent, expectedParent)) {
      // Determine severity based on pending operations count
      let severity: "minor" | "moderate" | "severe";
      const pendingCount = this.state.pendingOps.length;

      if (pendingCount === 0) {
        severity = "minor";
      } else if (pendingCount <= 3) {
        severity = "moderate";
      } else {
        severity = "severe";
      }

      this.emit("divergence:detected", {
        remote: remoteOp,
        expected: expectedParent,
        actual: remoteParent,
        severity,
        pendingCount,
      });
    }
  }

  /**
   * Initialize with user ID
   */
  initialize(userId: string): void {
    this.userId = userId;
    this.state.localSeq = 0;
    this.state.pendingOps = [];
  }

  /**
   * Create a local operation from a patch
   * @param patch - The JSON Patch to apply
   * @param reversePatch - Reverse patch for undo
   * @param label - Optional human-readable label
   */
  createOperation(patch: Patch, reversePatch: Patch, label?: string): OTOperation {
    const op: OTOperation = {
      id: {
        userId: this.userId,
        seq: ++this.state.localSeq,
        timestamp: Date.now(),
      },
      patch,
      reversePatch,
      parentId: this.state.lastApplied,
      label,
    };

    this.state.pendingOps.push(op);

    // Track timing for ACK
    const opKey = `${op.id.userId}:${op.id.seq}`;
    this.pendingWithTiming.set(opKey, { sentAt: Date.now(), retries: 0 });

    // Emit pending event
    this.emit("operation:pending", { id: op.id, timestamp: Date.now() });

    return op;
  }

  /**
   * Apply a remote operation, transforming against pending local ops
   */
  applyRemoteOperation(remoteOp: OTOperation): Patch | null {
    // Skip our own operations
    if (remoteOp.id.userId === this.userId) {
      // Check for divergence before acknowledging own operation
      this.checkDivergence(remoteOp);
      // Calculate latency from pending timing
      const opKey = `${remoteOp.id.userId}:${remoteOp.id.seq}`;
      const timing = this.pendingWithTiming.get(opKey);
      const latency = timing ? Date.now() - timing.sentAt : 0;

      // Clean up pending tracking
      this.pendingWithTiming.delete(opKey);

      // Track latency for stats
      if (latency > 0) {
        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > OTEngine.MAX_LATENCY_SAMPLES) {
          this.latencyHistory.shift();
        }
        this.lastAckTime = Date.now();
      }

      // Acknowledge - remove from pending
      this.state.pendingOps = this.state.pendingOps.filter((op) => op.id.seq !== remoteOp.id.seq);
      this.state.lastApplied = remoteOp.id;

      // Emit acked event with latency
      this.emit("operation:acked", { id: remoteOp.id, latency });

      return null;
    }

    // Check for divergence before transforming
    this.checkDivergence(remoteOp);

    // Transform remote op against all pending local ops
    let transformedPatch = remoteOp.patch;

    for (let i = 0; i < this.state.pendingOps.length; i++) {
      const localOp = this.state.pendingOps[i];
      const result = this.transform(transformedPatch, localOp.patch);
      transformedPatch = result.aPrime;
      // Create new operation object instead of mutating the original
      this.state.pendingOps[i] = {
        ...localOp,
        patch: result.bPrime,
      };
    }

    this.state.lastApplied = remoteOp.id;
    this.emit("operation:transformed", { original: remoteOp, transformed: transformedPatch });

    return transformedPatch;
  }

  /**
   * Transform two concurrent patches
   * Uses path-based conflict resolution with array index adjustment
   */
  transform(patchA: Patch, patchB: Patch): TransformResult {
    // A = remote (already committed), B = local (pending)
    // Remote ops always win, but we need to adjust local ops' paths
    const aPrime: Patch = [];
    const bPrime: Patch = [];

    // Remote operations (A) are already committed - include all of them
    for (const opA of patchA) {
      aPrime.push({ ...opA });
    }

    // Transform local operations (B) against remote operations (A)
    for (const opB of patchB) {
      let transformedOp = { ...opB };
      let shouldInclude = true;

      for (const opA of patchA) {
        // Check for exact path conflict - remote wins
        if (opA.path === opB.path) {
          if (opA.op === "remove" || opA.op === "replace") {
            // Remote removed/replaced this exact path - skip local op
            shouldInclude = false;
            break;
          }
        }

        // Check if local op is on a child of removed parent
        if (opA.op === "remove" && this.isChildPath(opB.path, opA.path)) {
          shouldInclude = false;
          break;
        }

        // Adjust array indices when remote op affects array
        const adjustedPath = this.adjustPathForArrayOp(transformedOp.path, opA);
        if (adjustedPath === null) {
          // Path became invalid (element was removed)
          shouldInclude = false;
          break;
        }
        transformedOp = { ...transformedOp, path: adjustedPath };
      }

      if (shouldInclude) {
        bPrime.push(transformedOp);
      }
    }

    return { aPrime, bPrime };
  }

  /**
   * Adjust a path when a remote array operation occurred
   * Returns null if the path is no longer valid (element was removed)
   */
  private adjustPathForArrayOp(
    path: string,
    remoteOp: { op: string; path: string; value?: unknown }
  ): string | null {
    const pathSegments = path.split("/").filter(Boolean);
    const remoteSegments = remoteOp.path.split("/").filter(Boolean);

    // Check if remote op is on an array (path ends with numeric index)
    const remoteLastSegment = remoteSegments[remoteSegments.length - 1];
    const remoteIndex = parseInt(remoteLastSegment, 10);

    if (isNaN(remoteIndex)) {
      // Remote op is not on an array element - no adjustment needed
      return path;
    }

    // Get the array path (without the index)
    const remoteArrayPath = "/" + remoteSegments.slice(0, -1).join("/");
    const localArrayPath = "/" + pathSegments.slice(0, remoteSegments.length - 1).join("/");

    // Check if both ops are on the same array
    if (localArrayPath !== remoteArrayPath) {
      return path;
    }

    // Get local index at the same depth
    const localIndexSegment = pathSegments[remoteSegments.length - 1];
    const localIndex = parseInt(localIndexSegment, 10);

    if (isNaN(localIndex)) {
      return path;
    }

    // Adjust based on remote operation type
    if (remoteOp.op === "remove") {
      if (localIndex === remoteIndex) {
        // Local op targets the removed element - invalidate
        return null;
      }
      if (localIndex > remoteIndex) {
        // Shift index down
        pathSegments[remoteSegments.length - 1] = String(localIndex - 1);
        return "/" + pathSegments.join("/");
      }
    } else if (remoteOp.op === "add") {
      if (localIndex >= remoteIndex) {
        // Shift index up
        pathSegments[remoteSegments.length - 1] = String(localIndex + 1);
        return "/" + pathSegments.join("/");
      }
    }

    return path;
  }

  /**
   * Check if pathA is a child of pathB
   */
  private isChildPath(pathA: string, pathB: string): boolean {
    return pathA.startsWith(pathB + "/");
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.state.pendingOps.length;
  }

  /**
   * Get ACK statistics with connection quality classification
   */
  getAckStats(): ConnectionQualityStats {
    const pending = this.state.pendingOps.length;

    // Calculate average latency
    const avgLatency =
      this.latencyHistory.length > 0
        ? Math.round(this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length)
        : 0;

    // Determine quality based on latency and ACK recency
    const timeSinceLastAck = this.lastAckTime > 0 ? Date.now() - this.lastAckTime : Infinity;
    let quality: ConnectionQuality;

    if (timeSinceLastAck > 10000) {
      // No ACK in 10+ seconds
      quality = "disconnected";
    } else if (avgLatency < 100) {
      quality = "excellent";
    } else if (avgLatency < 300) {
      quality = "good";
    } else {
      quality = "poor";
    }

    return {
      avgLatency,
      pendingCount: pending,
      lastAckTime: this.lastAckTime,
      quality,
    };
  }

  /**
   * Get the current version (sequence number)
   */
  getVersion(): number {
    return this.state.localSeq;
  }

  /**
   * Set the version (for sync purposes)
   */
  setVersion(version: number): void {
    this.state.localSeq = version;
  }

  /**
   * Get the composer instance (for future extension)
   */
  getComposer(): Composer {
    return this.composer;
  }

  /**
   * Clear state on disconnect
   */
  reset(): void {
    this.state = {
      lastApplied: null,
      pendingOps: [],
      localSeq: 0,
    };
    // Clear pending timing and latency history
    this.pendingWithTiming.clear();
    this.latencyHistory = [];
    this.lastAckTime = 0;
  }
}

export default OTEngine;
