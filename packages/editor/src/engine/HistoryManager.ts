/**
 * Aquibra History Manager
 * Manages undo/redo operations with diff-based snapshots.
 *
 * Uses JSON patches instead of full snapshots for memory efficiency.
 * Stores occasional checkpoints (full snapshots) to limit patch replay depth.
 *
 * Types → historyTypes.ts
 * Formatting → HistoryFormatter.ts
 *
 * Note: Collaboration OT/coalescing logic lives in HistoryCollaboration.ts.
 *       recordForCollaboration/applyRemoteOperation remain here because they need
 *       direct access to private fields (entries, redoStack). Expose via getters
 *       first if moving these to HistoryCollaboration.ts.
 *
 * @module engine/HistoryManager
 * @license BSD-3-Clause
 */

import { EVENTS, THRESHOLDS } from "../shared/constants";
import type { ProjectData } from "../shared/types";
import { deepClone } from "../shared/utils/helpers";
import type { OTOperation } from "./collaboration/OTTypes";
import type { Composer } from "./Composer";
import { buildHistoryDisplayEntries } from "./HistoryFormatter";
import type { HistoryEntry, CheckpointEntry, HistoryConfig } from "./historyTypes";
import { createPatch, applyPatch, reversePatch, isPatchEmpty, type Patch } from "./utils/JsonPatch";

// Re-export public types so consumers keep the same import path
export type { HistoryChange, HistoryDisplayEntry } from "./historyTypes";

export class HistoryManager {
  private composer: Composer;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private config: HistoryConfig;
  private isRecording: boolean = true;
  private pendingRecord: boolean = false;
  private projectChangedHandler: (() => void) | null = null;

  /** Cached current state (to avoid reconstructing on every record) */
  private currentStateCache: ProjectData | null = null;

  /** Count of patches since last checkpoint */
  private patchesSinceCheckpoint: number = 0;

  /** Pending record timeout ID for cleanup */
  private pendingRecordTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Coalesce timeout ID for debouncing rapid changes */
  private coalesceTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Whether the manager has been destroyed */
  private isDestroyed: boolean = false;

  /** Current transaction label awaiting record */
  private currentTransactionLabel: string | undefined;

  /** Labels accumulated during coalesce window */
  private coalescedLabels: string[] = [];

  constructor(composer: Composer) {
    this.composer = composer;
    this.config = {
      maxHistory: THRESHOLDS.HISTORY_MAX_SIZE,
      checkpointInterval: 10,
      coalesceDelay: 500,
    };

    this.setupListeners();
    this.recordCheckpoint("Initial state");
  }

  // ─── Listeners & Coalesce ───────────────────────────────────────────────────

  private setupListeners(): void {
    this.projectChangedHandler = () => {
      if (!this.isRecording || this.isDestroyed) return;

      if (
        this.currentTransactionLabel &&
        !this.coalescedLabels.includes(this.currentTransactionLabel)
      ) {
        this.coalescedLabels.push(this.currentTransactionLabel);
      }

      if (this.pendingRecord) return;
      this.pendingRecord = true;

      if (this.coalesceTimeoutId) {
        clearTimeout(this.coalesceTimeoutId);
        this.coalesceTimeoutId = null;
      }

      this.pendingRecordTimeoutId = setTimeout(() => {
        this.pendingRecordTimeoutId = null;
        this.pendingRecord = false;

        if (!this.isDestroyed && this.isRecording && this.undoStack.length > 0) {
          this.coalesceTimeoutId = setTimeout(() => {
            this.coalesceTimeoutId = null;
            if (!this.isDestroyed && this.isRecording) {
              const combinedLabel = this.getCoalescedLabel();
              this.coalescedLabels = [];
              this.record(combinedLabel);
            }
          }, this.config.coalesceDelay);
        }
      }, 0);
    };

    this.composer.on(EVENTS.PROJECT_CHANGED, this.projectChangedHandler);

    this.composer.on(EVENTS.TRANSACTION_BEGIN, (data: { label?: string }) => {
      if (data?.label) {
        this.currentTransactionLabel = data.label;
      }
    });

    this.composer.on(EVENTS.TRANSACTION_END, (data: { rolledBack?: boolean }) => {
      if (data?.rolledBack) {
        this.currentTransactionLabel = undefined;
      }
    });
  }

  private getCoalescedLabel(): string | undefined {
    if (this.coalescedLabels.length === 0) return undefined;
    if (this.coalescedLabels.length === 1) return this.coalescedLabels[0];

    const uniqueLabels = [...new Set(this.coalescedLabels)];
    if (uniqueLabels.length === 1) return uniqueLabels[0];

    const styleLabels = uniqueLabels.filter((l) => l.includes("style") || l.includes("Style"));
    if (styleLabels.length === uniqueLabels.length) return "style-batch";

    return uniqueLabels[0];
  }

  // ─── Recording ──────────────────────────────────────────────────────────────

  record(label?: string): void {
    const finalLabel = label ?? this.currentTransactionLabel;

    if (!this.composer.isTransactionActive?.()) {
      this.currentTransactionLabel = undefined;
    }

    if (!this.isRecording) return;

    const newState = this.captureSnapshot();
    const previousState = this.getCurrentState();
    const patch = createPatch(previousState, newState);

    if (isPatchEmpty(patch)) return;

    this.patchesSinceCheckpoint++;

    if (this.patchesSinceCheckpoint >= this.config.checkpointInterval) {
      this.undoStack.push({
        type: "checkpoint",
        timestamp: Date.now(),
        snapshot: newState,
        label: finalLabel,
      });
      this.patchesSinceCheckpoint = 0;
    } else {
      this.undoStack.push({
        type: "patch",
        timestamp: Date.now(),
        patch,
        reversePatch: reversePatch(patch),
        label: finalLabel,
      });
    }

    this.currentStateCache = newState;
    this.redoStack = [];
    this.trimHistory();
    this.composer.emit(EVENTS.HISTORY_RECORDED, { label: finalLabel });
  }

  // ─── Collaboration ──────────────────────────────────────────────────────────

  recordForCollaboration(label?: string): OTOperation | null {
    if (!this.isRecording) return null;

    const newState = this.captureSnapshot();
    const previousState = this.getCurrentState();
    const patch = createPatch(previousState, newState);
    if (isPatchEmpty(patch)) return null;

    const reversePatchData = reversePatch(patch);

    this.undoStack.push({
      type: "patch",
      timestamp: Date.now(),
      patch,
      reversePatch: reversePatchData,
      label,
    });

    this.currentStateCache = newState;
    this.redoStack = [];
    this.trimHistory();
    this.composer.emit(EVENTS.HISTORY_RECORDED, { label });

    const collab = this.composer.collaboration;
    if (collab?.isConnected()) {
      const otEngine = collab.getOTEngine();
      return otEngine.createOperation(patch, reversePatchData, label);
    }

    return null;
  }

  applyRemoteOperation(patch: Patch): void {
    const wasRecording = this.isRecording;
    this.isRecording = false;

    try {
      const currentState = this.getCurrentState();
      const newState = applyPatch(currentState, patch);
      this.composer.importProject(newState);
      this.currentStateCache = newState;
    } finally {
      this.isRecording = wasRecording;
    }
  }

  // ─── Checkpoints ────────────────────────────────────────────────────────────

  private recordCheckpoint(label?: string): void {
    const snapshot = this.captureSnapshot();
    this.undoStack.push({ type: "checkpoint", timestamp: Date.now(), snapshot, label });
    this.currentStateCache = snapshot;
    this.patchesSinceCheckpoint = 0;
  }

  forceCheckpoint(label?: string): void {
    if (!this.isRecording) return;
    const snapshot = this.captureSnapshot();
    this.undoStack.push({
      type: "checkpoint",
      timestamp: Date.now(),
      snapshot,
      label: label ?? "Checkpoint",
    });
    this.currentStateCache = snapshot;
    this.patchesSinceCheckpoint = 0;
    this.redoStack = [];
    this.trimHistory();
  }

  // ─── Snapshot helpers ───────────────────────────────────────────────────────

  private captureSnapshot(): ProjectData {
    return deepClone(this.composer.exportProject());
  }

  private getCurrentState(): ProjectData {
    if (this.currentStateCache) return this.currentStateCache;
    return this.reconstructState(this.undoStack.length - 1);
  }

  private reconstructState(targetIndex: number): ProjectData {
    if (targetIndex < 0) throw new Error("Invalid target index for state reconstruction");

    let checkpointIndex = targetIndex;
    while (checkpointIndex >= 0) {
      if (this.undoStack[checkpointIndex].type === "checkpoint") break;
      checkpointIndex--;
    }

    if (checkpointIndex < 0) throw new Error("No checkpoint found in history");

    const checkpoint = this.undoStack[checkpointIndex] as CheckpointEntry;
    let state = deepClone(checkpoint.snapshot);

    for (let i = checkpointIndex + 1; i <= targetIndex; i++) {
      const entry = this.undoStack[i];
      if (entry.type === "patch") {
        state = applyPatch(state, entry.patch);
      } else {
        state = deepClone((entry as CheckpointEntry).snapshot);
      }
    }

    return state;
  }

  private restoreSnapshot(snapshot: ProjectData): void {
    this.isRecording = false;
    this.composer.importProject(snapshot);
    this.currentStateCache = snapshot;
    this.isRecording = true;
  }

  // ─── Undo / Redo ────────────────────────────────────────────────────────────

  undo(): boolean {
    if (!this.canUndo()) return false;

    const current = this.undoStack.pop()!;

    if (current.type === "checkpoint") {
      const previousState = this.reconstructState(this.undoStack.length - 1);
      const patch = createPatch(previousState, current.snapshot);
      this.redoStack.push({
        type: "patch",
        timestamp: Date.now(),
        patch,
        reversePatch: reversePatch(patch),
        label: current.label,
      });
    } else {
      this.redoStack.push(current);
    }

    const previousState = this.reconstructState(this.undoStack.length - 1);
    this.restoreSnapshot(previousState);
    this.updatePatchCounter();

    this.composer.emit(EVENTS.HISTORY_UNDO, {
      entry: { timestamp: Date.now(), snapshot: previousState, label: current.label },
    });
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    const entry = this.redoStack.pop()!;
    const currentState = this.getCurrentState();

    let newState: ProjectData;
    if (entry.type === "patch") {
      newState = applyPatch(currentState, entry.patch);
    } else {
      newState = deepClone(entry.snapshot);
    }

    this.undoStack.push(entry);
    this.restoreSnapshot(newState);
    this.updatePatchCounter();

    this.composer.emit(EVENTS.HISTORY_REDO, {
      entry: { timestamp: Date.now(), snapshot: newState, label: entry.label },
    });
    return true;
  }

  // ─── Stack management ───────────────────────────────────────────────────────

  private updatePatchCounter(): void {
    this.patchesSinceCheckpoint = 0;
    for (let i = this.undoStack.length - 1; i >= 0; i--) {
      if (this.undoStack[i].type === "checkpoint") break;
      this.patchesSinceCheckpoint++;
    }
  }

  private trimHistory(): void {
    while (this.undoStack.length > this.config.maxHistory) {
      const removed = this.undoStack.shift();

      if (removed?.type === "checkpoint" && this.undoStack.length > 0) {
        const next = this.undoStack[0];
        if (next.type === "patch") {
          const state = this.reconstructState(0);
          this.undoStack[0] = {
            type: "checkpoint",
            timestamp: next.timestamp,
            snapshot: state,
            label: next.label,
          };
        }
      }
    }
  }

  // ─── Public query API ───────────────────────────────────────────────────────

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  getUndoCount(): number {
    return this.undoStack.length;
  }
  getRedoCount(): number {
    return this.redoStack.length;
  }

  /** Returns history entries for UI display (newest first, skips index 0). */
  getHistoryStack() {
    return buildHistoryDisplayEntries(this.undoStack);
  }

  getStats() {
    let checkpointCount = 0;
    let patchCount = 0;
    for (const entry of this.undoStack) {
      if (entry.type === "checkpoint") checkpointCount++;
      else patchCount++;
    }
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      checkpointCount,
      patchCount,
      patchesSinceLastCheckpoint: this.patchesSinceCheckpoint,
    };
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentStateCache = null;
    this.patchesSinceCheckpoint = 0;
    this.composer.emit(EVENTS.HISTORY_CLEARED);
  }

  pause(): void {
    this.isRecording = false;
  }
  resume(): void {
    this.isRecording = true;
  }

  setMaxHistory(max: number): void {
    this.config.maxHistory = max;
    this.trimHistory();
  }

  setCheckpointInterval(interval: number): void {
    this.config.checkpointInterval = Math.max(1, interval);
  }

  setCoalesceDelay(delay: number): void {
    this.config.coalesceDelay = Math.max(0, delay);
  }

  destroy(): void {
    this.isDestroyed = true;

    if (this.pendingRecordTimeoutId) {
      clearTimeout(this.pendingRecordTimeoutId);
      this.pendingRecordTimeoutId = null;
    }

    if (this.coalesceTimeoutId) {
      clearTimeout(this.coalesceTimeoutId);
      this.coalesceTimeoutId = null;
    }

    this.pendingRecord = false;
    this.coalescedLabels = [];

    if (this.projectChangedHandler) {
      this.composer.off(EVENTS.PROJECT_CHANGED, this.projectChangedHandler);
      this.projectChangedHandler = null;
    }
    this.clear();
  }
}
