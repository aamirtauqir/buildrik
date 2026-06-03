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

  /** Current user ID for team attribution — set from session when available */
  private currentUserId: string | null = null;

  /** True while restoreSnapshot is in flight — suppresses our own PROJECT_LOADED handler so undo/redo don't wipe their own stacks. */
  private isRestoringFromHistory: boolean = false;

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

    // After a project loads (sync from dashboard, file import, etc.), push an
    // initial checkpoint so undo always has a baseline. Without this, the
    // first user action goes onto an empty stack — undoing it triggers
    // reconstructState(-1) which wipes the canvas. PROJECT_LOADED fires 4×
    // during a typical load (wrapper + data, wrapper + data); only act on
    // the wrapped-data emits which carry the actual ProjectData shape.
    this.composer.on(EVENTS.PROJECT_LOADED, (data: unknown) => {
      if (this.isDestroyed) return;
      // Skip our own restoreSnapshot calls — those re-emit PROJECT_LOADED via
      // importProject and resetting the stacks here would silently wipe the
      // undo/redo state mid-operation (P1-1 from iter 7).
      if (this.isRestoringFromHistory) return;
      const isProjectData =
        data != null &&
        typeof data === "object" &&
        "pages" in (data as Record<string, unknown>) &&
        !("loading" in (data as Record<string, unknown>)) &&
        !("importing" in (data as Record<string, unknown>));
      if (!isProjectData) return;
      // Project load just completed. The import phase emitted PROJECT_CHANGED
      // for every intermediate operation (clear, importPage × N) which got
      // recorded as undo patches — those represent empty-canvas transitional
      // states, NOT user-undoable steps. Reset the stack and capture the
      // loaded state as the single baseline checkpoint so user's first undo
      // returns to the loaded state, not to mid-import garbage.
      this.undoStack = [];
      this.redoStack = [];
      this.patchesSinceCheckpoint = 0;
      this.currentStateCache = null;
      this.recordCheckpoint("loaded");
    });

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
        userId: this.currentUserId,
      });
      this.patchesSinceCheckpoint = 0;
    } else {
      this.undoStack.push({
        type: "patch",
        timestamp: Date.now(),
        patch,
        reversePatch: reversePatch(patch),
        label: finalLabel,
        userId: this.currentUserId,
      });
    }

    this.currentStateCache = newState;
    this.redoStack = [];
    this.trimHistory();
    this.composer.emit(EVENTS.HISTORY_RECORDED, { label: finalLabel });
  }

  /**
   * Commit any pending (debounced) record synchronously and cancel its timers.
   * Use after a programmatic edit that the user may immediately undo (e.g. an
   * applied AI edit): without this, the 500ms coalesce window leaves the edit
   * uncommitted, so an undo fired within that window reverts the PREVIOUS
   * action and the late record then clears the redo stack. Flushing makes the
   * edit a committed undo step before control returns to the user.
   */
  flushPending(): void {
    if (this.pendingRecordTimeoutId) {
      clearTimeout(this.pendingRecordTimeoutId);
      this.pendingRecordTimeoutId = null;
    }
    if (this.coalesceTimeoutId) {
      clearTimeout(this.coalesceTimeoutId);
      this.coalesceTimeoutId = null;
    }
    if (!this.pendingRecord) return;
    this.pendingRecord = false;
    if (this.isDestroyed || !this.isRecording) return;
    const label = this.getCoalescedLabel();
    this.coalescedLabels = [];
    this.record(label);
  }

  /**
   * Set the current user ID for team attribution on undo history entries.
   * Called by the shell when session becomes available (spec §2.10).
   */
  setCurrentUserId(userId: string | null): void {
    this.currentUserId = userId;
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
      userId: this.currentUserId,
    });

    this.currentStateCache = newState;
    this.redoStack = [];
    this.trimHistory();
    this.composer.emit(EVENTS.HISTORY_RECORDED, { label });

    const collab = this.composer.collab.manager;
    if (collab?.isConnected()) {
      const otEngine = collab.getOTEngine();
      return otEngine.createOperation(patch, reversePatchData, label);
    }

    return null;
  }

  applyRemoteOperation(patch: Patch): void {
    const wasRecording = this.isRecording;
    this.isRecording = false;
    this.isRestoringFromHistory = true;

    try {
      const currentState = this.getCurrentState();
      const newState = applyPatch(currentState, patch);
      this.composer.importProject(newState);
      this.currentStateCache = newState;
    } finally {
      this.isRestoringFromHistory = false;
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

    if (checkpointIndex < 0) {
      console.warn("[HistoryManager] no checkpoint found at targetIndex", targetIndex);
      const tail = this.undoStack[this.undoStack.length - 1];
      return deepClone(
        tail && tail.type === "checkpoint"
          ? (tail as CheckpointEntry).snapshot
          : ({} as ProjectData)
      );
    }

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
    this.isRestoringFromHistory = true;
    try {
      this.composer.importProject(snapshot);
      this.currentStateCache = snapshot;
    } finally {
      this.isRestoringFromHistory = false;
      this.isRecording = true;
    }
  }

  // ─── Undo / Redo ────────────────────────────────────────────────────────────

  undo(): boolean {
    if (!this.canUndo()) return false;

    const current = this.undoStack.pop()!;

    // Build the redo entry + target state inside try/catch. JSON-Patch path
    // navigation throws when the recorded patch references a tree shape that
    // has diverged from the current state (iter 13 P0-9). Bail without
    // mutating composer state — restore stacks to pre-undo position.
    let previousState: ProjectData;
    let redoEntry: HistoryEntry;
    try {
      previousState = this.reconstructState(this.undoStack.length - 1);
      if (current.type === "checkpoint") {
        const patch = createPatch(previousState, current.snapshot);
        redoEntry = {
          type: "patch",
          timestamp: Date.now(),
          patch,
          reversePatch: reversePatch(patch),
          label: current.label,
        };
      } else {
        redoEntry = current;
      }
    } catch (err) {
      this.undoStack.push(current);
      console.warn("[HistoryManager] undo bailed — state shape diverged from recorded patch:", err);
      return false;
    }

    this.redoStack.push(redoEntry);
    this.restoreSnapshot(previousState);
    this.updatePatchCounter();
    this.validateSelectionAfterRestore();

    this.composer.emit(EVENTS.HISTORY_UNDO, {
      entry: { timestamp: Date.now(), snapshot: previousState, label: current.label },
    });
    return true;
  }

  // Undo/redo replaces the entire element tree via importProject. The
  // selection manager still references the previously-selected element ID,
  // which may no longer exist in the restored tree — leaving inspector,
  // breadcrumb, and footer status stuck on a deleted element. Validate
  // post-restore: if the selected ID isn't in the new tree, clear selection.
  private validateSelectionAfterRestore(): void {
    try {
      const selected = this.composer.selection?.getSelected?.();
      if (!selected) return;
      const id = selected.getId();
      if (!id) {
        this.composer.selection.clear();
        return;
      }
      const stillExists = this.composer.elements?.getElement?.(id);
      if (!stillExists) {
        this.composer.selection.clear();
      }
    } catch {
      // Defensive: never let selection validation break undo/redo.
    }
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    const entry = this.redoStack.pop()!;
    const currentState = this.getCurrentState();

    // applyPatch throws "Cannot navigate path" when the patch's recorded path
    // (e.g. /pages/0/root/children/3/children/0) doesn't match the current
    // tree shape — happens after divergent mutations between record and apply
    // (iter 13 P0-9). Compute newState in try/catch; on failure, restore the
    // entry to the redo stack so user can choose to retry (or undo to a state
    // where the patch path resolves).
    let newState: ProjectData;
    try {
      if (entry.type === "patch") {
        newState = applyPatch(currentState, entry.patch);
      } else {
        newState = deepClone(entry.snapshot);
      }
    } catch (err) {
      this.redoStack.push(entry);
      console.warn("[HistoryManager] redo bailed — patch path diverged from current state:", err);
      return false;
    }

    this.undoStack.push(entry);
    this.restoreSnapshot(newState);
    this.updatePatchCounter();
    this.validateSelectionAfterRestore();

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

  /**
   * Get the snapshot (ProjectData) for a specific history entry.
   * Used by time-travel scrubber to preview historical states.
   */
  getEntrySnapshot(entryId: string): ProjectData | null {
    const entries = buildHistoryDisplayEntries(this.undoStack);
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return null;

    // Map display index back to undoStack index
    // buildHistoryDisplayEntries skips index 0, so display index i = undoStack index i+1
    const undoStackIndex = entry.index + 1;
    if (undoStackIndex < 0 || undoStackIndex >= this.undoStack.length) return null;

    try {
      return this.reconstructState(undoStackIndex);
    } catch {
      return null;
    }
  }

  /**
   * Restore to a specific history entry by ID.
   * Clears redo stack and replaces current state.
   */
  restoreEntry(entryId: string): boolean {
    const entries = buildHistoryDisplayEntries(this.undoStack);
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return false;

    const undoStackIndex = entry.index + 1;
    if (undoStackIndex < 0 || undoStackIndex >= this.undoStack.length) return false;

    try {
      const snapshot = this.reconstructState(undoStackIndex);

      // Clear redo stack
      this.redoStack = [];

      // Replace everything after target with a checkpoint at target position
      this.undoStack = this.undoStack.slice(0, undoStackIndex);

      // Record new checkpoint at current position
      this.undoStack.push({
        type: "checkpoint",
        timestamp: Date.now(),
        snapshot: deepClone(snapshot),
        label: `Restored to: ${entry.label}`,
      });

      this.restoreSnapshot(snapshot);
      this.composer.emit(EVENTS.HISTORY_RECORDED, {
        label: `Restored to: ${entry.label}`,
      });
      return true;
    } catch {
      return false;
    }
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
