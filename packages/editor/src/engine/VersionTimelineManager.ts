/**
 * Version History Manager
 * Manages named version snapshots for persistent version history
 *
 * @module engine/VersionTimelineManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../shared/constants";
import type { ProjectData } from "../shared/types";
import type {
  NamedVersion,
  VersionHistoryConfig,
  VersionHistoryExport,
  CompareResult,
} from "../shared/types/versions";
import { DEFAULT_VERSION_HISTORY_CONFIG } from "../shared/types/versions";
import type { ChangeType } from "./historyTypes";
import { deepClone } from "../shared/utils/helpers";
import type { Composer } from "./Composer";
import {
  saveVersion,
  loadVersions,
  loadVersion,
  deleteVersion as deleteVersionFromStorage,
  pruneVersions,
  exportVersions as exportVersionsFromStorage,
  importVersions as importVersionsToStorage,
  downloadVersionsFile,
  isStorageAvailable,
  getStorageStats,
} from "./storage/VersionHistoryStorage";

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique version ID
 */
function generateVersionId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Version History Manager
// ============================================

/**
 * Manages persistent named version snapshots
 */
export class VersionTimelineManager {
  private composer: Composer;
  private config: VersionHistoryConfig;

  /**
   * How many versions are kept before the oldest auto-saves are pruned.
   *
   * Board 162:2 states the rule under the list ("50 versions kept. Auto-saves
   * prune oldest first; named ones never prune."), and a panel that hardcoded
   * the number would go on saying 50 the day the config changed. The prune
   * event already reports `kept`, but only when a prune has just happened —
   * the note has to be true before that, too.
   */
  get maxVersions(): number {
    return this.config.maxVersions;
  }
  private versions: NamedVersion[] = [];
  private projectId: string = "default";
  private isLoading: boolean = false;
  /* Read synchronously by useVersionHistory at mount. VERSION_LIST_UPDATED /
     VERSION_LOAD_FAILED fire once when the storage read settles — a panel
     that mounts later has missed them, and an event-only contract left it
     showing the loading skeleton forever. */
  private loadState: "loading" | "ready" | "error" = "loading";
  private autoCheckpointHandlers: Map<string, () => void> = new Map();
  /** Current user ID for team attribution — set from session when available */
  private currentUserId: string | null = null;

  constructor(composer: Composer, config?: Partial<VersionHistoryConfig>) {
    this.composer = composer;
    this.config = { ...DEFAULT_VERSION_HISTORY_CONFIG, ...config };

    // Initialize if storage available
    if (isStorageAvailable() && this.config.enabled) {
      this.initialize();
    }
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the version history manager
   */
  private async initialize(): Promise<void> {
    await this.loadVersionsFromStorage();
    this.setupAutoCheckpoints();
  }

  /**
   * Load versions from storage
   */
  private async loadVersionsFromStorage(): Promise<void> {
    this.isLoading = true;
    this.loadState = "loading";
    try {
      this.versions = await loadVersions(this.projectId);
      this.loadState = "ready";
      this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });
    } catch {
      /* loadVersions rejects on any IndexedDB failure and this had no catch —
         an unhandled rejection, `isLoading` stuck true, and the panel showing
         its EMPTY state, which tells the user their versions are gone when
         they are only unreadable. Board 453:4031 says the opposite in as many
         words: "Your versions are still stored. Only this list failed to
         load." */
      this.loadState = "error";
      this.composer.emit(EVENTS.VERSION_LOAD_FAILED, {});
    } finally {
      this.isLoading = false;
    }
  }

  /** Where the one-shot storage read stands, for subscribers that mount
      after its events have already fired. */
  getLoadState(): "loading" | "ready" | "error" {
    return this.loadState;
  }

  /** Re-run the storage read behind board 453:4031's "Try again". */
  async reloadVersions(): Promise<void> {
    await this.loadVersionsFromStorage();
  }

  /**
   * Set up auto-checkpoint event listeners
   */
  private setupAutoCheckpoints(): void {
    this.config.autoCheckpointEvents.forEach((eventName) => {
      const handler = () => {
        if (!this.isLoading) {
          this.autoCheckpoint(`Auto: ${eventName}`);
        }
      };
      this.autoCheckpointHandlers.set(eventName, handler);
      this.composer.on(eventName, handler);
    });
  }

  // ============================================
  // Public API - Version CRUD
  // ============================================

  /**
   * Create a new named version
   */
  async createVersion(name: string, description?: string): Promise<NamedVersion> {
    const snapshot = await this.captureSnapshotAsync();
    const visualSnapshot = this.captureVisualSnapshot();

    const version: NamedVersion = {
      id: generateVersionId(),
      name,
      description,
      snapshot,
      createdAt: Date.now(),
      isAutoCheckpoint: false,
      projectId: this.projectId,
      visualSnapshot: visualSnapshot ?? null,
      userId: this.currentUserId,
    };

    await saveVersion(version);
    this.versions.unshift(version);
    await this.pruneIfNeeded();

    this.composer.emit(EVENTS.VERSION_CREATED, {
      version,
      isAuto: false,
    });
    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });

    return version;
  }

  /**
   * Set the current user ID for team attribution on versions.
   * Called by the shell when session becomes available.
   */
  setCurrentUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  /**
   * Create an auto-checkpoint
   */
  async autoCheckpoint(label: string): Promise<NamedVersion | null> {
    if (!this.config.enabled) return null;

    const snapshot = await this.captureSnapshotAsync();

    const version: NamedVersion = {
      id: generateVersionId(),
      name: label,
      snapshot,
      createdAt: Date.now(),
      isAutoCheckpoint: true,
      projectId: this.projectId,
      visualSnapshot: null, // Skip visual snapshot for auto-checkpoints to save storage
      userId: this.currentUserId,
    };

    await saveVersion(version);
    this.versions.unshift(version);
    await this.pruneIfNeeded();

    this.composer.emit(EVENTS.VERSION_CREATED, {
      version,
      isAuto: true,
    });
    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });

    return version;
  }

  /**
   * Get all versions
   */
  getVersions(): NamedVersion[] {
    return [...this.versions];
  }

  /**
   * Get a single version by ID
   */
  async getVersion(versionId: string): Promise<NamedVersion | null> {
    // Check cache first
    const cached = this.versions.find((v) => v.id === versionId);
    if (cached) return cached;

    // Load from storage
    return loadVersion(versionId);
  }

  /**
   * Restore to a named version
   */
  async restoreVersion(versionId: string): Promise<boolean> {
    const version = await this.getVersion(versionId);
    if (!version) return false;

    const previousVersionId = this.versions[0]?.id;

    /* Save the current work FIRST. `importProject` clears every element and
       style before it loads the snapshot, so without this a restore is
       unrecoverable data loss: the work on screen exists in no version, and
       nothing listens for VERSION_RESTORED to put it back. Board 163:220
       states the promise on screen — "Saving your current work as v4 first" —
       which made it a contract, not a nicety. A failed save aborts the
       restore; losing the work is the outcome this exists to prevent. */
    let savedAs: string | null = null;
    try {
      const safety = await this.createVersion(
        `Before restoring "${version.name}"`,
        "Automatic — the work that was open when a restore was requested.",
      );
      savedAs = safety.name;
    } catch {
      this.composer.emit(EVENTS.VERSION_LOAD_FAILED, {});
      return false;
    }

    this.composer.emit(EVENTS.VERSION_RESTORING, {
      targetName: version.name,
      savedAs,
    });

    // Import the snapshot
    this.composer.importProject(deepClone(version.snapshot));

    this.composer.emit(EVENTS.VERSION_RESTORED, {
      version,
      previousVersionId,
    });

    return true;
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return false;

    await deleteVersionFromStorage(versionId);
    this.versions = this.versions.filter((v) => v.id !== versionId);

    this.composer.emit(EVENTS.VERSION_DELETED, {
      versionId,
      versionName: version.name,
    });
    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });

    return true;
  }

  /**
   * Update version metadata (name, description, tags, aiSummary, visualSnapshot)
   */
  async updateVersion(
    versionId: string,
    updates: Partial<Pick<NamedVersion, "name" | "description" | "tags" | "aiSummary" | "visualSnapshot">>
  ): Promise<boolean> {
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return false;

    Object.assign(version, updates);
    await saveVersion(version);

    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });
    return true;
  }

  // ============================================
  // Export / Import
  // ============================================

  /**
   * Export all versions to a file
   */
  async exportVersions(download: boolean = true): Promise<VersionHistoryExport> {
    const data = await exportVersionsFromStorage(this.projectId);

    if (download) {
      downloadVersionsFile(data);
    }

    this.composer.emit(EVENTS.VERSION_EXPORTED, {
      projectId: this.projectId,
      count: data.versions.length,
    });

    return data;
  }

  /**
   * Import versions from a file
   */
  async importVersions(file: File, clearExisting: boolean = false): Promise<number> {
    const text = await file.text();
    const data = JSON.parse(text) as VersionHistoryExport;

    const count = await importVersionsToStorage(data, clearExisting);
    await this.loadVersionsFromStorage();

    this.composer.emit(EVENTS.VERSION_IMPORTED, {
      projectId: this.projectId,
      count,
      filename: file.name,
    });

    return count;
  }

  // ============================================
  // Configuration
  // ============================================

  /**
   * Set project ID (call when project changes)
   */
  async setProjectId(projectId: string): Promise<void> {
    this.projectId = projectId;
    await this.loadVersionsFromStorage();
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<VersionHistoryConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-setup auto-checkpoints if events changed
    if (config.autoCheckpointEvents) {
      this.removeAutoCheckpoints();
      this.setupAutoCheckpoints();
    }
  }

  /**
   * Enable/disable version history
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) {
      this.setupAutoCheckpoints();
    } else {
      this.removeAutoCheckpoints();
    }
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get version history statistics
   */
  async getStats(): Promise<{
    count: number;
    oldestDate: Date | null;
    newestDate: Date | null;
    autoCount: number;
    manualCount: number;
  }> {
    const baseStats = await getStorageStats(this.projectId);
    const autoCount = this.versions.filter((v) => v.isAutoCheckpoint).length;

    return {
      ...baseStats,
      autoCount,
      manualCount: this.versions.length - autoCount,
    };
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return isStorageAvailable() && this.config.enabled;
  }

  // ============================================
  // Snapshot Capture
  // ============================================

  /**
   * Style property classification mapping
   */
  private static readonly STYLE_PROPERTIES = new Set([
    "color",
    "background",
    "backgroundColor",
    "backgroundImage",
    "border",
    "borderColor",
    "borderWidth",
    "borderStyle",
    "borderRadius",
    "boxShadow",
    "opacity",
    "visibility",
    "display",
    "width",
    "height",
    "minWidth",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "fontVariant",
    "lineHeight",
    "letterSpacing",
    "textAlign",
    "textDecoration",
    "textTransform",
    "textOverflow",
    "whiteSpace",
    "wordBreak",
    "overflow",
    "overflowX",
    "overflowY",
    "transform",
    "transformOrigin",
    "transition",
    "animation",
    "cursor",
    "zIndex",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "flexGrow",
    "flexShrink",
    "flexBasis",
    "gap",
    "gridTemplateColumns",
    "gridTemplateRows",
    "gridTemplateAreas",
    "gridColumn",
    "gridRow",
    "gridArea",
    "justifyContent",
    "justifyItems",
    "justifySelf",
    "alignContent",
    "alignItems",
    "alignSelf",
    "flexDirection",
    "flexWrap",
  ]);

  /**
   * Text property classification mapping
   */
  private static readonly TEXT_PROPERTIES = new Set(["content", "innerText", "textContent", "value"]);

  /**
   * Layout property classification mapping
   */
  private static readonly LAYOUT_PROPERTIES = new Set([
    "gridTemplateColumns",
    "gridTemplateRows",
    "gridTemplateAreas",
    "gridColumn",
    "gridRow",
    "gridArea",
    "flexGrow",
    "flexShrink",
    "flexBasis",
    "flexDirection",
    "flexWrap",
    "gap",
    "justifyContent",
    "justifyItems",
    "justifySelf",
    "alignContent",
    "alignItems",
    "alignSelf",
    "order",
    "position",
    "display",
    "float",
    "clear",
    "width",
    "height",
    "minWidth",
    "minHeight",
    "maxWidth",
    "maxHeight",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "top",
    "right",
    "bottom",
    "left",
    "zIndex",
  ]);

  /**
   * Content property classification mapping
   */
  private static readonly CONTENT_PROPERTIES = new Set([
    "src",
    "href",
    "alt",
    "title",
    "srcset",
    "loading",
    "poster",
    "action",
    "method",
    "name",
    "placeholder",
    "required",
    "readonly",
    "disabled",
    "checked",
    "selected",
  ]);

  /**
   * Classify a property into ChangeType
   */
  public static classifyProperty(property: string): ChangeType {
    const normalizedProp = property.replace(/^(style|styles)\./, "");
    if (VersionTimelineManager.STYLE_PROPERTIES.has(normalizedProp)) {
      return "style";
    }
    if (VersionTimelineManager.TEXT_PROPERTIES.has(normalizedProp)) {
      return "text";
    }
    if (VersionTimelineManager.LAYOUT_PROPERTIES.has(normalizedProp)) {
      return "layout";
    }
    if (VersionTimelineManager.CONTENT_PROPERTIES.has(normalizedProp)) {
      return "content";
    }
    if (normalizedProp.startsWith("font")) {
      return "style";
    }
    if (
      normalizedProp === "className" ||
      normalizedProp === "classes" ||
      normalizedProp.startsWith("class")
    ) {
      return "style";
    }
    return "other";
  }

  /**
   * Capture a snapshot with chunked approach for large projects
   */
  private captureSnapshotAsync(): Promise<ProjectData> {
    const project = this.composer.exportProject();
    const elements = this.countElements(project);

    // For small projects, use synchronous deep clone
    if (elements < 100) {
      try {
        return Promise.resolve(structuredClone(project) as ProjectData);
      } catch {
        return Promise.resolve(deepClone(project));
      }
    }

    // For large projects, use requestIdleCallback with fallback
    return new Promise((resolve) => {
      const doCapture = () => {
        try {
          const clone = structuredClone(project);
          resolve(clone as ProjectData);
        } catch {
          // Fallback to deepClone if structuredClone fails
          resolve(deepClone(project));
        }
      };

      if (typeof requestIdleCallback !== "undefined") {
        const timeoutId = setTimeout(() => {
          doCapture();
        }, 2000);

        requestIdleCallback(
          () => {
            clearTimeout(timeoutId);
            doCapture();
          },
          { timeout: 2000 }
        );
      } else {
        // Fallback for environments without requestIdleCallback
        setTimeout(doCapture, 0);
      }
    });
  }

  /**
   * Count total elements in a project (for determining snapshot strategy)
   */
  private countElements(project: ProjectData): number {
    let count = 0;
    const traverse = (elements: unknown[]) => {
      if (!elements || !Array.isArray(elements)) return;
      for (const el of elements) {
        count++;
        const element = el as { children?: unknown[] };
        if (element.children) {
          traverse(element.children);
        }
      }
    };

    for (const page of project.pages) {
      if (page.root) {
        count++;
        if (page.root.children) {
          traverse(page.root.children as unknown[]);
        }
      }
    }
    return count;
  }

  /**
   * Compare two version snapshots and return detailed differences
   */
  async compareVersions(currentId: string, targetId: string): Promise<CompareResult | null> {
    const current = await this.getVersion(currentId);
    const target = await this.getVersion(targetId);

    if (!current || !target) {
      return null;
    }

    const changes: Array<{ type: ChangeType; property: string; before: string; after: string }> = [];
    const currentData = current.snapshot;
    const targetData = target.snapshot;

    const currentMap = this.flattenSnapshot(currentData);
    const targetMap = this.flattenSnapshot(targetData);

    // Collect all element IDs from both snapshots
    const allElementIds = new Set<string>([...currentMap.keys(), ...targetMap.keys()]);

    // Process each element
    for (const elementId of allElementIds) {
      const currentElement = currentMap.get(elementId) || null;
      const targetElement = targetMap.get(elementId) || null;

      if (!targetElement && currentElement) {
        // Element was removed
        changes.push({
          type: "other",
          property: "element",
          before: currentElement.id,
          after: "",
        });
      } else if (!currentElement && targetElement) {
        // Element was added
        changes.push({
          type: "other",
          property: "element",
          before: "",
          after: targetElement.id,
        });
      } else if (currentElement && targetElement) {
        // Element exists in both, compare properties
        this.compareElements(currentElement, targetElement, changes);
      }
    }

    // Build summary
    const summary = {
      style: 0,
      text: 0,
      layout: 0,
      content: 0,
      other: 0,
      pagesAdded: 0,
      pagesDeleted: 0,
    };

    for (const change of changes) {
      summary[change.type]++;
    }

    // Page-level diff (spec §2.3): match by id, fall back to name
    const pageKey = (page: { id?: string; name?: string }): string =>
      page.id || page.name || "";
    const currentPageKeys = new Set(
      currentData.pages.map(pageKey).filter((k) => k !== "")
    );
    const targetPageKeys = new Set(
      targetData.pages.map(pageKey).filter((k) => k !== "")
    );
    for (const key of targetPageKeys) {
      if (!currentPageKeys.has(key)) summary.pagesAdded++;
    }
    for (const key of currentPageKeys) {
      if (!targetPageKeys.has(key)) summary.pagesDeleted++;
    }

    return {
      elementName: `Version Comparison (${current.name} → ${target.name})`,
      changes,
      summary,
    };
  }

  /**
   * Find an element by ID in a project snapshot
   */
  private findElementById(
    project: ProjectData,
    id: string
  ): { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] } | null {
    const traverse = (
      elements: unknown[]
    ): { id?: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] } | null => {
      if (!elements || !Array.isArray(elements)) return null;
      for (const el of elements) {
        const element = el as { id?: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] };
        if (element.id === id) {
          return element;
        }
        if (element.children) {
          const found = traverse(element.children);
          if (found) return found;
        }
      }
      return null;
    };

    for (const page of project.pages) {
      if (page.root) {
        if (page.root.id === id) return page.root as { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] };
        if (page.root.children) {
          const found = traverse(page.root.children as unknown[]);
          if (found && found.id) return found as { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] };
        }
      }
    }
    return null;
  }

  private flattenSnapshot(project: ProjectData): Map<string, { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] }> {
    const map = new Map<string, { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] }>();
    const traverse = (elements: unknown[]) => {
      if (!elements || !Array.isArray(elements)) return;
      for (const el of elements) {
        const element = el as { id?: string; children?: unknown[] };
        if (element.id) {
          map.set(element.id, element as { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] });
        }
        if (element.children) {
          traverse(element.children);
        }
      }
    };
    for (const page of project.pages) {
      if (page.root) {
        if (page.root.id) map.set(page.root.id, page.root);
        if (page.root.children) traverse(page.root.children as unknown[]);
      }
    }
    return map;
  }

  /**
   * Compare two elements and collect all differences
   */
  private compareElements(
    current: { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] },
    target: { id: string; type?: string; tagName?: string; attributes?: Record<string, string>; classes?: string[]; styles?: Record<string, string>; content?: string; children?: unknown[]; traits?: unknown[] },
    changes: Array<{ type: ChangeType; property: string; before: string; after: string }>
  ): void {
    // Compare type
    if (current.type !== target.type) {
      changes.push({
        type: "other",
        property: "type",
        before: current.type ?? "",
        after: target.type ?? "",
      });
    }

    // Compare tagName
    if (current.tagName !== target.tagName) {
      changes.push({
        type: "other",
        property: "tagName",
        before: current.tagName ?? "",
        after: target.tagName ?? "",
      });
    }

    // Compare styles
    const styleChanges = this.compareObjects(
      current.styles ?? {},
      target.styles ?? {},
      "style"
    );
    changes.push(...styleChanges);

    // Compare classes
    if (JSON.stringify(current.classes) !== JSON.stringify(target.classes)) {
      changes.push({
        type: "style",
        property: "classes",
        before: JSON.stringify(current.classes ?? []),
        after: JSON.stringify(target.classes ?? []),
      });
    }

    // Compare content
    if (current.content !== target.content) {
      changes.push({
        type: "text",
        property: "content",
        before: current.content ?? "",
        after: target.content ?? "",
      });
    }

    // Compare attributes
    const attrChanges = this.compareObjects(
      current.attributes ?? {},
      target.attributes ?? {},
      "content"
    );
    changes.push(...attrChanges);

    // Compare traits
    if (JSON.stringify(current.traits) !== JSON.stringify(target.traits)) {
      changes.push({
        type: "other",
        property: "traits",
        before: JSON.stringify(current.traits ?? []),
        after: JSON.stringify(target.traits ?? []),
      });
    }
  }

  /**
   * Compare two objects and return list of differences
   */
  private compareObjects(
    current: Record<string, string>,
    target: Record<string, string>,
    defaultType: ChangeType
  ): Array<{ type: ChangeType; property: string; before: string; after: string }> {
    const changes: Array<{ type: ChangeType; property: string; before: string; after: string }> = [];
    const allKeys = new Set([...Object.keys(current), ...Object.keys(target)]);

    for (const key of allKeys) {
      const beforeVal = current[key];
      const afterVal = target[key];

      if (beforeVal !== afterVal) {
        const type = VersionTimelineManager.classifyProperty(key);
        changes.push({
          type: type === "other" ? defaultType : type,
          property: key,
          before: beforeVal ?? "",
          after: afterVal ?? "",
        });
      }
    }

    return changes;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Capture current project snapshot (synchronous)
   */
  private captureSnapshot(): ProjectData {
    return deepClone(this.composer.exportProject());
  }

  /**
   * Capture a visual snapshot of the editor canvas as a JPEG data URL.
   * Returns null if the canvas is not available or capture fails.
   */
  captureVisualSnapshot(): string | null {
    try {
      const canvas = document.getElementById("editor-canvas") as HTMLCanvasElement | null;
      if (!canvas) return null;
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch {
      return null;
    }
  }

  /**
   * Prune old versions if over limit
   */
  private async pruneIfNeeded(): Promise<void> {
    const pruned = await pruneVersions(this.projectId, this.config.maxVersions);
    if (pruned > 0) {
      this.versions = this.versions.slice(0, this.config.maxVersions);
      /* Pruning was silent: a user's older auto-saves vanished with nothing
         said. Board 163:269 draws the notice — announce it so the panel can. */
      this.composer.emit(EVENTS.VERSION_PRUNED, {
        removed: pruned,
        kept: this.config.maxVersions,
      });
    }
  }

  /**
   * Remove auto-checkpoint event listeners
   */
  private removeAutoCheckpoints(): void {
    this.autoCheckpointHandlers.forEach((handler, eventName) => {
      this.composer.off(eventName, handler);
    });
    this.autoCheckpointHandlers.clear();
  }

  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Destroy the manager
   */
  destroy(): void {
    this.removeAutoCheckpoints();
    this.versions = [];
  }
}
