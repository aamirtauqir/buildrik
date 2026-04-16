/**
 * Version History Manager
 * Manages named version snapshots for persistent version history
 *
 * @module engine/VersionHistoryManager
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
export class VersionHistoryManager {
  private composer: Composer;
  private config: VersionHistoryConfig;
  private versions: NamedVersion[] = [];
  private projectId: string = "default";
  private isLoading: boolean = false;
  private autoCheckpointHandlers: Map<string, () => void> = new Map();

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
    this.versions = await loadVersions(this.projectId);
    this.isLoading = false;

    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });
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

    const version: NamedVersion = {
      id: generateVersionId(),
      name,
      description,
      snapshot,
      createdAt: Date.now(),
      isAutoCheckpoint: false,
      projectId: this.projectId,
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
   * Update version metadata (name, description, tags)
   */
  async updateVersion(
    versionId: string,
    updates: Partial<Pick<NamedVersion, "name" | "description" | "tags">>
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
  private static classifyProperty(property: string): ChangeType {
    const normalizedProp = property.replace(/^(style|styles)\./, "");
    if (VersionHistoryManager.STYLE_PROPERTIES.has(normalizedProp)) {
      return "style";
    }
    if (VersionHistoryManager.TEXT_PROPERTIES.has(normalizedProp)) {
      return "text";
    }
    if (VersionHistoryManager.LAYOUT_PROPERTIES.has(normalizedProp)) {
      return "layout";
    }
    if (VersionHistoryManager.CONTENT_PROPERTIES.has(normalizedProp)) {
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

    // Collect all element IDs from both snapshots
    const allElementIds = new Set<string>();
    this.collectElementIds(currentData, allElementIds);
    this.collectElementIds(targetData, allElementIds);

    // Process each element
    for (const elementId of allElementIds) {
      const currentElement = this.findElementById(currentData, elementId);
      const targetElement = this.findElementById(targetData, elementId);

      if (!targetElement && currentElement) {
        // Element was removed
        changes.push({
          type: "other",
          property: "element",
          before: currentElement.id,
          after: "",
        });
      } else if (currentElement && !targetElement) {
        // Element was added
        changes.push({
          type: "other",
          property: "element",
          before: "",
          after: currentElement.id,
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
    };

    for (const change of changes) {
      summary[change.type]++;
    }

    return {
      elementName: `Version Comparison (${current.name} → ${target.name})`,
      changes,
      summary,
    };
  }

  /**
   * Recursively collect all element IDs from a project
   */
  private collectElementIds(project: ProjectData, ids: Set<string>): void {
    const traverse = (elements: unknown[]) => {
      if (!elements || !Array.isArray(elements)) return;
      for (const el of elements) {
        const element = el as { id?: string; children?: unknown[] };
        if (element.id) {
          ids.add(element.id);
        }
        if (element.children) {
          traverse(element.children);
        }
      }
    };

    for (const page of project.pages) {
      if (page.root) {
        if (page.root.id) ids.add(page.root.id);
        if (page.root.children) {
          traverse(page.root.children as unknown[]);
        }
      }
    }
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
        const type = VersionHistoryManager.classifyProperty(key);
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
   * Prune old versions if over limit
   */
  private async pruneIfNeeded(): Promise<void> {
    const pruned = await pruneVersions(this.projectId, this.config.maxVersions);
    if (pruned > 0) {
      this.versions = this.versions.slice(0, this.config.maxVersions);
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

  /**
   * Clear any active preview state
   */
  clearPreview(): void {
    this.composer.emit(EVENTS.VERSION_PREVIEW_CLEAR, {});
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
