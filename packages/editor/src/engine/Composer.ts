/**
 * Aquibra Composer Engine
 * Core visual editor engine - handles all editing operations
 *
 * @module engine/Composer
 * @license BSD-3-Clause
 */

import { emailService } from "../services/EmailService";
import { EVENTS, THRESHOLDS } from "../shared/constants";
import type {
  ComposerConfig,
  ComposerState,
  ProjectData,
  ProjectSettings,
  ExportOptions,
  ExportResult,
} from "../shared/types";
import { clamp } from "../shared/utils/helpers";
import { CanvasIndicators } from "./canvas/indicators";
import { ResizeHandler } from "./canvas/ResizeHandler";
import { CMSBindingManager } from "./cms/CMSBindingManager";
import { CollectionManager } from "./cms/CollectionManager";
import { CollaborationManager } from "./collaboration/CollaborationManager";
import { CommandCenter } from "./commands/CommandCenter";
import { ComponentManager } from "./components/ComponentManager";
import { DataManager } from "./data/DataManager";
import { StyleDataBinding } from "./data/StyleDataBinding";
import { TextDataBinding } from "./data/TextDataBinding";
import { TraitDataBinding } from "./data/TraitDataBinding";
import { DragManager } from "./drag/DragManager";
import { ElementManager } from "./elements/ElementManager";
import { EventEmitter } from "./EventEmitter";
import { FontManager } from "./fonts/FontManager";
import { FormHandler } from "./forms/FormHandler";
import { HistoryManager } from "./HistoryManager";
import { emailMarketingService } from "./integrations";
import { InteractionManager } from "./interactions/InteractionManager";
import { MediaManager } from "./media/MediaManager";
import { PluginManager } from "./PluginManager";
import { RecoveryManager } from "./recovery/RecoveryManager";
import { PageRouter } from "./routing/PageRouter";
import { SelectionManager } from "./SelectionManager";
import { StorageAdapter } from "./storage/StorageAdapter";
import { GlobalStyleManager } from "./styles/GlobalStyleManager";
import { StyleEngine } from "./styles/StyleEngine";
import { SyncManager } from "./sync/SyncManager";
import { TemplateManager } from "./templates/TemplateManager";
import type { Patch } from "./utils/JsonPatch";
import { VersionHistoryManager } from "./VersionHistoryManager";
import { Viewport } from "./Viewport";

/**
 * Main Aquibra Composer class
 * Central orchestrator for the visual editing experience
 */
export class Composer extends EventEmitter {
  private config: ComposerConfig;
  private state: ComposerState;

  private transactionDepth = 0;
  private transactionDirty = false;

  // Project-wide settings (analytics, integrations)
  private projectSettings: ProjectSettings = {};

  // Project metadata (name, author, timestamps)
  private projectMetadata: import("../shared/types").ProjectMetadata = {
    name: "Untitled Project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Clipboard for copy/paste - stores serialized element data
  clipboard: import("../shared/types").ElementData | null = null;

  // Style clipboard for copy/paste styles only
  styleClipboard: Record<string, string> | null = null;

  // Core managers
  readonly elements: ElementManager;
  readonly styles: StyleEngine;
  readonly commands!: CommandCenter;
  readonly selection!: SelectionManager;
  readonly history!: HistoryManager;
  readonly versionHistory!: VersionHistoryManager;
  readonly storage!: StorageAdapter;
  readonly viewport!: Viewport;
  readonly plugins!: PluginManager;
  readonly data!: DataManager;
  readonly globalStyles!: GlobalStyleManager;
  readonly styleBindings!: StyleDataBinding;
  readonly traitBindings!: TraitDataBinding;
  readonly textBindings!: TextDataBinding;
  readonly templates!: TemplateManager;
  readonly canvasIndicators!: CanvasIndicators;
  readonly resizeHandler!: ResizeHandler;
  readonly fonts!: FontManager;
  readonly components!: ComponentManager;
  readonly cmsManager!: CollectionManager;
  readonly cmsBindings!: CMSBindingManager;
  readonly collaboration!: CollaborationManager;
  readonly media!: MediaManager;
  readonly forms!: FormHandler;
  readonly sync!: SyncManager;
  readonly router!: PageRouter;
  readonly recovery!: RecoveryManager;
  readonly interactions!: InteractionManager;
  readonly drag!: DragManager;

  constructor(config: ComposerConfig) {
    super();
    this.config = this.normalizeConfig(config);
    this.state = this.createInitialState();
    this.applyProjectSettings({}, this.projectSettings, {
      emitProjectChanged: false,
      emitSettingsChange: false,
    });

    // Initialize core systems
    this.elements = new ElementManager(this);
    this.styles = new StyleEngine(this);
    this.commands = new CommandCenter(this);
    this.selection = new SelectionManager(this);
    this.history = new HistoryManager(this);
    this.versionHistory = new VersionHistoryManager(this);
    this.storage = new StorageAdapter(this, this.config.storage);
    this.viewport = new Viewport(this);
    this.plugins = new PluginManager(this);
    this.data = new DataManager(this);
    this.globalStyles = new GlobalStyleManager(this);
    this.styleBindings = new StyleDataBinding(this);
    this.traitBindings = new TraitDataBinding(this);
    this.textBindings = new TextDataBinding(this);
    this.templates = new TemplateManager(this);
    this.canvasIndicators = new CanvasIndicators(this);
    this.resizeHandler = new ResizeHandler(this);
    this.fonts = new FontManager(this);
    this.components = new ComponentManager(this);
    this.cmsManager = new CollectionManager();
    this.cmsBindings = new CMSBindingManager(this, this.cmsManager);
    this.collaboration = new CollaborationManager(this);
    this.media = new MediaManager();
    this.forms = new FormHandler(this);
    this.sync = new SyncManager(this);
    this.router = new PageRouter();
    this.recovery = new RecoveryManager(this);
    this.interactions = new InteractionManager(this);
    this.drag = new DragManager(this);

    // Listen for remote operations from collaboration
    this.collaboration.on("operation:apply", (patch: Patch) => {
      this.history.applyRemoteOperation(patch);
    });

    // Wire selection sync to collaboration
    this.on("element:selected", (element: import("./elements/Element").Element | null) => {
      if (this.collaboration.isConnected()) {
        this.collaboration.updateSelection(element ? [element.getId()] : []);
      }
    });

    this.on("selection:multiple", (elements: import("./elements/Element").Element[]) => {
      if (this.collaboration.isConnected()) {
        this.collaboration.updateSelection(elements.map((el) => el.getId()));
      }
    });

    this.on("selection:cleared", () => {
      if (this.collaboration.isConnected()) {
        this.collaboration.updateSelection([]);
      }
    });

    this.initialize();
  }

  /**
   * Initialize the composer
   */
  private async initialize(): Promise<void> {
    this.emit(EVENTS.COMPOSER_READY); // initializing phase

    // Initialize async managers
    await this.media.init();
    await this.sync.init();

    // Load project if configured
    if (this.config.project?.autoLoad) {
      await this.loadProject();
    }

    this.state.ready = true;
    this.emit(EVENTS.COMPOSER_READY, this);
  }

  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig(config: ComposerConfig): ComposerConfig {
    return {
      ...config,
      width: config.width ?? "100%",
      height: config.height ?? "100%",
      storage: {
        type: config.storage?.type ?? "local",
        autoSave: config.storage?.autoSave ?? true,
        autoSaveInterval: config.storage?.autoSaveInterval ?? 5000,
        ...config.storage,
      },
      project: {
        autoLoad: config.project?.autoLoad ?? false,
        ...config.project,
      },
      canvas: {
        backgroundColor: config.canvas?.backgroundColor ?? "#ffffff",
        ...config.canvas,
      },
    };
  }

  /**
   * Create initial state
   */
  private createInitialState(): ComposerState {
    return {
      ready: false,
      dirty: false,
      device: "desktop",
      zoom: 100,
      activePageId: null,
      snapToGrid: false,
      gridSize: 10,
      isPreviewMode: false,
    };
  }

  // ============================================
  // Project Operations
  // ============================================

  /**
   * Load project from storage
   */
  async loadProject(id?: string): Promise<ProjectData | null> {
    this.emit(EVENTS.PROJECT_LOADED, { id, loading: true });

    try {
      const data = await this.storage.load(id);
      if (data) {
        this.importProject(data);
        this.emit(EVENTS.PROJECT_LOADED, data);
      }
      return data;
    } catch (error) {
      this.emit(EVENTS.ERROR, { error, operation: "load" });
      throw error;
    }
  }

  /**
   * Save current project
   */
  async saveProject(): Promise<void> {
    this.emit(EVENTS.PROJECT_SAVED, { saving: true });

    try {
      const data = this.exportProject();
      await this.storage.save(data);
      this.state.dirty = false;
      this.emit(EVENTS.PROJECT_SAVED, data);
    } catch (error) {
      this.emit(EVENTS.ERROR, { error, operation: "save" });
      throw error;
    }
  }

  /**
   * Import project data
   */
  importProject(data: ProjectData): void {
    this.emit(EVENTS.PROJECT_LOADED, { importing: true, data });

    // Clear current state
    this.elements.clear();
    this.styles.clear();

    // Import pages and elements
    if (data.pages) {
      data.pages.forEach((page) => {
        this.elements.importPage(page);
      });
    }

    // Import global styles
    if (data.styles) {
      this.styles.importStyles(data.styles);
    }

    // Import project settings
    this.applyProjectSettings(this.projectSettings, data.settings ?? {}, {
      emitProjectChanged: false,
    });

    // Import project metadata
    if (data.metadata) {
      this.projectMetadata = { ...this.projectMetadata, ...data.metadata };
    }

    this.state.dirty = false;
    this.emit(EVENTS.PROJECT_LOADED, data);
  }

  /**
   * Export current project
   */
  exportProject(): ProjectData {
    return {
      version: "1.0.0",
      pages: this.elements.exportPages(),
      styles: this.styles.exportStyles(),
      assets: [],
      metadata: {
        ...this.projectMetadata,
        updatedAt: new Date().toISOString(),
      },
      settings: this.projectSettings,
    };
  }

  // ============================================
  // Export Operations
  // ============================================

  /**
   * Export to HTML
   */
  exportHTML(options?: ExportOptions): ExportResult {
    const html = this.elements.toHTML(options);
    const css = this.styles.toCSS(options);

    return {
      html,
      css,
      combined: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aquibra Export</title>
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`,
    };
  }

  /**
   * Export to JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.exportProject(), null, 2);
  }

  // ============================================
  // Project Settings
  // ============================================

  /**
   * Apply project settings and update dependent integrations
   */
  private applyProjectSettings(
    prev: ProjectSettings,
    settings: ProjectSettings,
    options?: { emitProjectChanged?: boolean; emitSettingsChange?: boolean }
  ): void {
    this.projectSettings = settings ?? {};

    // Only reconfigure email marketing when the email integration settings actually changed
    const emailConfig = this.projectSettings.integrations?.email || {
      provider: "none",
      enabled: false,
    };
    if (JSON.stringify(prev.integrations?.email) !== JSON.stringify(settings.integrations?.email)) {
      emailMarketingService.configure(emailConfig);
    }

    // Configure form email notification service
    // Maps project settings to the form email service format
    if (emailConfig.provider === "sendgrid" && emailConfig.apiKey && emailConfig.enabled) {
      emailService.configure({
        provider: "sendgrid",
        apiKey: emailConfig.apiKey,
        fromEmail: "noreply@aquibra.com", // Default sender; could be made configurable
      });
    } else if (emailConfig.provider !== "none" && emailConfig.apiKey && emailConfig.enabled) {
      // For other providers with API keys, use mock until properly configured
      emailService.configure({
        provider: "mock",
        fromEmail: "noreply@aquibra.com",
      });
    }

    if (options?.emitSettingsChange !== false) {
      this.emit(EVENTS.SETTINGS_CHANGE, this.projectSettings);
    }
    if (options?.emitProjectChanged !== false) {
      this.emit(EVENTS.PROJECT_CHANGED);
    }
  }

  /**
   * Set project-wide settings (analytics, integrations, design tokens)
   */
  setProjectSettings(settings: ProjectSettings): void {
    const prev = this.projectSettings;
    this.markDirty(); // Mark dirty BEFORE applyProjectSettings emits PROJECT_CHANGED
    this.applyProjectSettings(prev, settings);
  }

  /**
   * Get current project settings
   */
  getProjectSettings(): ProjectSettings {
    return this.projectSettings;
  }

  /**
   * Set project settings without marking dirty (for loading)
   */
  setProjectSettingsRaw(settings: ProjectSettings): void {
    this.projectSettings = settings;
  }

  /**
   * Update project metadata
   */
  updateProjectMetadata(metadata: Partial<import("../shared/types").ProjectMetadata>): void {
    this.projectMetadata = {
      ...this.projectMetadata,
      ...metadata,
      updatedAt: new Date().toISOString(),
    };
    this.markDirty();
  }

  /**
   * Get project metadata
   */
  getProjectMetadata(): import("../shared/types").ProjectMetadata {
    return { ...this.projectMetadata };
  }

  /**
   * Merge project metadata without marking dirty (for loading)
   */
  mergeProjectMetadata(metadata: Partial<import("../shared/types").ProjectMetadata>): void {
    this.projectMetadata = {
      ...this.projectMetadata,
      ...metadata,
    };
  }

  // ============================================
  // State & Config
  // ============================================

  /**
   * Get current state
   */
  getState(): ComposerState {
    return { ...this.state };
  }

  /**
   * Patch state properties directly (for load/save operations)
   */
  patchState(patch: Partial<ComposerState>): void {
    this.state = { ...this.state, ...patch };
  }

  /**
   * Get configuration
   */
  getConfig(): ComposerConfig {
    return { ...this.config };
  }

  /**
   * Check if composer is ready
   */
  isReady(): boolean {
    return this.state.ready;
  }

  /**
   * Check if project has unsaved changes
   */
  isDirty(): boolean {
    return this.state.dirty;
  }

  /**
   * Mark project as modified
   */
  markDirty(): void {
    // Once a project has unsaved changes we keep dirty=true,
    // but we still emit "project:changed" on every logical
    // modification so that HistoryManager and storage can
    // capture a full history of edits.
    if (!this.state.dirty) {
      this.state.dirty = true;
    }
    if (this.transactionDepth > 0) {
      this.transactionDirty = true;
      return;
    }

    this.emit(EVENTS.PROJECT_CHANGED);
  }

  beginTransaction(label?: string): void {
    this.transactionDepth++;

    if (this.transactionDepth === 1) {
      this.transactionDirty = false;
      this.emit(EVENTS.TRANSACTION_BEGIN, { label });
    }
  }

  endTransaction(): void {
    if (this.transactionDepth === 0) {
      return;
    }

    this.transactionDepth--;

    if (this.transactionDepth === 0) {
      this.emit(EVENTS.TRANSACTION_END);

      if (this.transactionDirty) {
        this.transactionDirty = false;

        if (!this.state.dirty) {
          this.state.dirty = true;
        }

        this.emit(EVENTS.PROJECT_CHANGED);
      }
    }
  }

  /**
   * Rollback transaction - discard changes without emitting PROJECT_CHANGED
   * Use this when an error occurs during a transaction
   */
  rollbackTransaction(): void {
    if (this.transactionDepth === 0) {
      return;
    }

    this.transactionDepth--;

    if (this.transactionDepth === 0) {
      // Discard any changes made during this transaction
      this.transactionDirty = false;
      this.emit(EVENTS.TRANSACTION_END, { rolledBack: true });
    }
  }

  /**
   * Check if a transaction is currently active
   */
  isTransactionActive(): boolean {
    return this.transactionDepth > 0;
  }

  // ============================================
  // Device & Viewport
  // ============================================

  /**
   * Set active device for responsive preview
   */
  setDevice(device: import("../shared/types").DeviceType): void {
    if (this.state.device !== device) {
      this.state.device = device;
      this.viewport.setDevice(device);
      this.emit(EVENTS.BREAKPOINT_CHANGED, device);
    }
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    const clampedZoom = clamp(zoom, THRESHOLDS.ZOOM_MIN, THRESHOLDS.ZOOM_MAX);
    if (this.state.zoom !== clampedZoom) {
      this.state.zoom = clampedZoom;
      this.viewport.setZoom(clampedZoom);
      this.emit(EVENTS.VIEWPORT_ZOOM, clampedZoom);
    }
  }

  /**
   * Toggle snap to grid
   */
  setSnapToGrid(enabled: boolean): void {
    if (this.state.snapToGrid !== enabled) {
      this.state.snapToGrid = enabled;
      this.emit("snap:toggle", { snapToGrid: enabled });
    }
  }

  /**
   * Set grid size for snapping
   */
  setGridSize(size: number): void {
    const clampedSize = clamp(size, 1, 100);
    if (this.state.gridSize !== clampedSize) {
      this.state.gridSize = clampedSize;
      this.emit("grid:changed", { gridSize: clampedSize });
    }
  }

  // ============================================
  // Preview Mode
  // ============================================

  /**
   * Toggle preview mode
   * Starts/stops interaction runtime and updates UI state
   */
  setPreviewMode(enabled: boolean): void {
    if (this.state.isPreviewMode === enabled) return;

    this.state.isPreviewMode = enabled;

    if (enabled) {
      this.interactions.startRuntime();
    } else {
      this.interactions.stopRuntime();
    }

    this.emit(EVENTS.PREVIEW_MODE_CHANGED, { enabled });
  }

  /** Check if composer is in preview mode */
  isPreviewMode(): boolean {
    return !!this.state.isPreviewMode;
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * Destroy the composer instance
   */
  async destroy(): Promise<void> {
    this.emit(EVENTS.COMPOSER_DESTROY);

    if (this.plugins?.destroy) await this.plugins.destroy();
    if (this.data?.destroy) this.data.destroy();
    if (this.globalStyles?.destroy) this.globalStyles.destroy();
    if (this.styleBindings?.destroy) this.styleBindings.destroy();
    if (this.traitBindings?.destroy) this.traitBindings.destroy();
    if (this.templates?.destroy) this.templates.destroy();
    if (this.canvasIndicators?.destroy) this.canvasIndicators.destroy();
    if (this.fonts?.destroy) this.fonts.destroy();
    if (this.components?.destroy) this.components.destroy();
    if (this.cmsBindings?.destroy) this.cmsBindings.destroy();
    if (this.collaboration?.destroy) this.collaboration.destroy();
    if (this.forms?.destroy) this.forms.destroy();
    if (this.sync?.destroy) this.sync.destroy();
    if (this.drag?.destroy) this.drag.destroy();
    if (this.router?.clear) this.router.clear();
    if (this.elements?.destroy) this.elements.destroy();
    if (this.styles?.destroy) this.styles.destroy();
    if (this.commands?.destroy) this.commands.destroy();
    if (this.selection?.destroy) this.selection.destroy();
    if (this.history?.destroy) this.history.destroy();
    if (this.versionHistory?.destroy) this.versionHistory.destroy();
    if (this.storage?.destroy) this.storage.destroy();
    if (this.viewport?.destroy) this.viewport.destroy();

    this.removeAllListeners();
    this.emit(EVENTS.COMPOSER_DESTROY);
  }
}

/**
 * Create a new Composer instance
 */
export function createComposer(config: ComposerConfig): Composer {
  return new Composer(config);
}
