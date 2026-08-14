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
import { clamp, deepClone } from "../shared/utils/helpers";
import { sanitizeElementTreeContent } from "../shared/utils/html";
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
import { MediaCommandLayer } from "./media/MediaCommandLayer";
import { PluginManager } from "./PluginManager";
import { RecoveryManager } from "./recovery/RecoveryManager";
import { PageRouter } from "./routing/PageRouter";
import { SelectionManager } from "./SelectionManager";
import { StorageAdapter } from "./storage/StorageAdapter";
import { GlobalStyleManager } from "./styles/GlobalStyleManager";
import { StyleEngine } from "./styles/StyleEngine";
import { TemplateManager } from "./templates/TemplateManager";
import type { Patch } from "./utils/JsonPatch";
import { MigrationManager } from "./migration/MigrationManager";
import { AliasResolver } from "./aliasResolver";
import { DarkResolver } from "./darkResolver";
import { ColorMode } from "./colorMode";
import { TokenUsageTracker } from "./designSystem/TokenUsageTracker";
import { LintState } from "./designSystem/LintState";
import { TokenBindingResolver } from "./designSystem/TokenBindingResolver";
import { applyContrastFix } from "./designSystem/contrastFix";
import { isAiEditableTokenValue } from "./designSystem/tokenValueGuard";
import { CSSBundler } from "./designSystem/bundler";
import { DSLinter } from "./designSystem/linter";
import { AIAssistService } from "./designSystem/services";
import { VersionTimelineManager } from "./VersionTimelineManager";
import { Viewport } from "./Viewport";

/**
 * From-address for form-submission notifications on published sites. Must stay on
 * a domain we control, so it can be SPF/DKIM-verified with the mail provider.
 */
const FORM_NOTIFICATION_SENDER = "noreply@buildrick.io";

/**
 * Main Aquibra Composer class
 * Central orchestrator for the visual editing experience
 */
type InternalComposerState = Omit<ComposerState, "device">;

export class Composer extends EventEmitter {
  private config: ComposerConfig;
  private state: InternalComposerState;

  private collaborationHandlers: Set<(...args: any[]) => void> = new Set();
  private selectionHandlers: Set<(...args: any[]) => void> = new Set();
  private initPromise: Promise<void> | null = null;
  /** See isProjectLoading(). */
  private projectLoading = false;

  private transactionDepth = 0;
  private transactionDirty = false;
  /** Pre-transaction snapshot captured at the outermost begin, used by rollbackTransaction. */
  private transactionSnapshot: ProjectData | null = null;

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

  // Core managers — flat fields (kept flat per Option B-tight: high-traffic
  // hot paths like history/media/elements/styles all stay top-level).
  readonly elements: ElementManager;
  readonly styles: StyleEngine;
  readonly commands!: CommandCenter;
  readonly selection!: SelectionManager;
  readonly history!: HistoryManager;
  readonly versions!: VersionTimelineManager;
  readonly storage!: StorageAdapter;
  readonly viewport!: Viewport;
  readonly plugins!: PluginManager;
  readonly data!: DataManager;
  readonly globalStyles!: GlobalStyleManager;
  readonly styleBindings!: StyleDataBinding;
  readonly traitBindings!: TraitDataBinding;
  readonly textBindings!: TextDataBinding;
  readonly templates!: TemplateManager;
  readonly fonts!: FontManager;
  readonly components!: ComponentManager;
  readonly media!: MediaManager;
  readonly mediaOps!: MediaCommandLayer;
  readonly forms!: FormHandler;
  readonly router!: PageRouter;
  readonly recovery!: RecoveryManager;
  readonly migration!: MigrationManager;
  readonly aliasResolver!: AliasResolver;
  readonly darkResolver!: DarkResolver;
  readonly colorMode!: ColorMode;
  readonly cssBundler!: CSSBundler;
  readonly dsLinter!: DSLinter;
  readonly aiAssistService!: AIAssistService;

  // Facade groupings — D3 Stage 1 (Option B-tight). Three clusters where
  // ≥2 managers share a domain:
  //   cms.{collections, bindings}
  //   collab.{manager}        (was {manager, sync} — cloud sync stack removed)
  //   canvas.{indicators, resize, drag, interactions}
  readonly cms!: {
    readonly collections: CollectionManager;
    readonly bindings: CMSBindingManager;
  };
  readonly collab!: {
    readonly manager: CollaborationManager;
  };
  readonly canvas!: {
    readonly indicators: CanvasIndicators;
    readonly resize: ResizeHandler;
    readonly drag: DragManager;
    readonly interactions: InteractionManager;
  };
  readonly designSystem!: {
    readonly tokenUsage: TokenUsageTracker;
    readonly lintState: LintState;
    readonly tokenBindingResolver: TokenBindingResolver;
    /**
     * Resolves a LintIssue `autoFixHint` into a suggested next hex value.
     *
     * Pure compute helper — does NOT mutate the token registry (the
     * registries live React-side in `TokenRegistryContext`, not in the
     * engine). Callers chain this with `onColorChange` / `updateToken` to
     * actually apply the fix, then call `lintState.suppress(id)` to clear
     * the row.
     *
     * Naming intent: `compute*` signals "pure, no side effects". Use
     * `applyAutoFix` below for the history-aware path that mutates
     * projectSettings inside a transaction.
     */
    readonly computeAutoFix: (currentValue: string, hint: string | undefined) => string;
    /**
     * History-aware Auto-fix entry (Arc D6.c, 2026-05-16). Computes the
     * fixed value, then writes it to `projectSettings.designTokens` inside
     * a labeled transaction so HistoryManager captures ONE undoable entry.
     *
     * Returns the fixed value when the token was found and the value
     * actually changed, otherwise `null` (caller may decide whether to
     * still suppress the lint row).
     *
     * React-side registries follow this update via the existing
     * `project:changed` event — TokensSection re-hydrates all 14 kind
     * registries on every emission, so Cmd+Z roundtrips back into the UI.
     */
    readonly applyAutoFix: (tokenId: string, hint: string | undefined) => string | null;
    /**
     * AI token write (W4 set-token). Models on `applyAutoFix`: looks the token up
     * in `projectSettings.designTokens`, validates the value against the token's
     * `type` (the trust boundary — see tokenValueGuard), and writes it inside a
     * labeled transaction so the `project:changed` re-hydration in TokensSection
     * re-applies the live CSS var AND Cmd+Z roundtrips through the same path.
     *
     * Returns the new value on success, or `null` when the id is unknown, the
     * type is not AI-editable, the value fails its format guard, or it is a no-op.
     * The single engine write path means the AI never touches the React hooks.
     */
    readonly setDesignToken: (tokenId: string, value: string) => string | null;
  };

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
    this.versions = new VersionTimelineManager(this);
    this.storage = new StorageAdapter(this, this.config.storage);
    this.viewport = new Viewport(this);
    this.plugins = new PluginManager(this);
    this.data = new DataManager(this);
    this.globalStyles = new GlobalStyleManager(this);
    this.styleBindings = new StyleDataBinding(this);
    this.traitBindings = new TraitDataBinding(this);
    this.textBindings = new TextDataBinding(this);
    this.templates = new TemplateManager(this);
    this.fonts = new FontManager(this);
    this.components = new ComponentManager(this);
    this.media = new MediaManager(this.config.remoteSync);
    this.mediaOps = new MediaCommandLayer(this);
    this.forms = new FormHandler(this);
    this.router = new PageRouter();
    this.recovery = new RecoveryManager(this);
    this.migration = new MigrationManager(this);
    this.aliasResolver = new AliasResolver(this);
    this.darkResolver = new DarkResolver(this);
    this.colorMode = new ColorMode(this);
    this.cssBundler = new CSSBundler();
    this.dsLinter = new DSLinter();
    this.aiAssistService = new AIAssistService(this, config.aiClient ?? null);

    // Facade groupings — D3 Stage 1.
    const cmsCollections = new CollectionManager();
    this.cms = {
      collections: cmsCollections,
      bindings: new CMSBindingManager(this, cmsCollections),
    };
    this.collab = {
      manager: new CollaborationManager(this),
    };
    this.canvas = {
      indicators: new CanvasIndicators(this),
      resize: new ResizeHandler(this),
      drag: new DragManager(this),
      interactions: new InteractionManager(this),
    };

    const tokenUsage = new TokenUsageTracker();
    const lintState = new LintState();
    const tokenBindingResolver = new TokenBindingResolver();
    this.designSystem = {
      tokenUsage,
      lintState,
      tokenBindingResolver,
      computeAutoFix: (currentValue, hint) => {
        if (!hint) return currentValue;
        return applyContrastFix(currentValue, hint);
      },
      applyAutoFix: (tokenId, hint) => {
        if (!hint) return null;
        const settings = this.getProjectSettings();
        const tokens = settings.designTokens ?? [];
        const target = tokens.find((t) => t.id === tokenId);
        if (!target) return null;
        const fixed = applyContrastFix(target.value, hint);
        if (fixed === target.value) return null;
        this.beginTransaction("Auto-fix contrast");
        const updated = tokens.map((t) => (t.id === tokenId ? { ...t, value: fixed } : t));
        this.setProjectSettings({ ...settings, designTokens: updated });
        this.endTransaction();
        return fixed;
      },
      setDesignToken: (tokenId, value) => {
        const settings = this.getProjectSettings();
        const tokens = settings.designTokens ?? [];
        const target = tokens.find((t) => t.id === tokenId);
        if (!target) return null; // unknown id — never write a token that isn't registered
        if (!isAiEditableTokenValue(target.type, value)) return null; // per-type value guard
        if (value === target.value) return null; // no-op
        this.beginTransaction("Set design token");
        const updated = tokens.map((t) => (t.id === tokenId ? { ...t, value } : t));
        this.setProjectSettings({ ...settings, designTokens: updated });
        this.endTransaction();
        return value;
      },
    };
    // Recompute token usage whenever element trees or styles change. These
    // four events cover create/delete/update/style-set — markDirty's broader
    // PROJECT_CHANGED also fires for non-element work (settings, metadata)
    // that can't affect token bindings, so we stay surgical.
    //
    // Coalesce via microtask: ELEMENT_UPDATED fires on every keystroke
    // (Element.setContent) and on every setStyle call, so a typing burst on
    // a 200-element project would otherwise trigger 200 recomputes/sec. One
    // recompute per microtask collapses bursts to a single O(N·S·L) walk.
    let recomputeScheduled = false;
    const scheduleRecomputeTokenUsage = () => {
      if (recomputeScheduled) return;
      recomputeScheduled = true;
      queueMicrotask(() => {
        recomputeScheduled = false;
        tokenUsage.recompute(this.elements.getAllElements());
      });
    };
    this.on(EVENTS.ELEMENT_CREATED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.ELEMENT_DELETED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.ELEMENT_UPDATED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.ELEMENT_STYLE_UPDATED, scheduleRecomputeTokenUsage);

    const operationApplyHandler = (patch: Patch) => {
      this.history.applyRemoteOperation(patch);
    };
    this.collaborationHandlers.add(operationApplyHandler);
    this.collab.manager.on("operation:apply", operationApplyHandler);

    const elementSelectedHandler = (element: import("./elements/Element").Element | null) => {
      if (this.collab.manager.isConnected()) {
        this.collab.manager.updateSelection(element ? [element.getId()] : []);
      }
    };
    this.selectionHandlers.add(elementSelectedHandler);
    this.on("element:selected", elementSelectedHandler);

    const selectionMultipleHandler = (elements: import("./elements/Element").Element[]) => {
      if (this.collab.manager.isConnected()) {
        this.collab.manager.updateSelection(elements.map((el) => el.getId()));
      }
    };
    this.selectionHandlers.add(selectionMultipleHandler);
    this.on("selection:multiple", selectionMultipleHandler);

    const selectionClearedHandler = () => {
      if (this.collab.manager.isConnected()) {
        this.collab.manager.updateSelection([]);
      }
    };
    this.selectionHandlers.add(selectionClearedHandler);
    this.on("selection:cleared", selectionClearedHandler);

    this.initPromise = this.initialize().catch((err) => {
      this.emit(EVENTS.ERROR, { error: err, operation: "init" });
      throw err;
    });
  }

  /**
   * Initialize the composer
   */
  private async initialize(): Promise<void> {
    this.emit(EVENTS.COMPOSER_READY); // initializing phase

    // Initialize async managers
    await this.media.init();

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
  private createInitialState(): InternalComposerState {
    return {
      ready: false,
      dirty: false,
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
    /* PROJECT_SAVING, not PROJECT_SAVED-with-a-flag. Listeners read the event
       NAME: useDirtyPages clears every dirty page marker on PROJECT_SAVED, so
       announcing the save before storage.save() ran cleared the markers up
       front — and left them cleared when the write threw. */
    this.emit(EVENTS.PROJECT_SAVING, {});

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

    // Import pages and elements. Sanitize each page's content tree at this
    // trust boundary — external project JSON (localStorage, dashboard blocks,
    // templates) reaches the element tree here without otherwise passing the
    // HTML sanitizer, and content is later emitted raw onto the canvas.
    if (data.pages) {
      data.pages.forEach((page) => {
        if (page.root) {
          sanitizeElementTreeContent(page.root);
        }
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

    /* A loaded project always has a page, and one of them is active — every
       insert path reads it (`useBlockInsertion`: `if (!page) return`), and
       importPage/createPage/RecoveryManager all maintain it. This was the one
       entry point that could leave it broken: a snapshot carrying no pages
       cleared the editor above and set nothing back, so the sidebar rendered
       normally and every insert died silently.

       Reachable in the product, not just in theory: auto-checkpoints fire on
       `project:loaded`, so a version captured before pages existed sits in the
       user's own version list — restoring it bricked the editor until they
       found "Start Blank". Repaired here, at the moment the invariant breaks,
       rather than minutes later on RecoveryManager's inactivity timer. */
    const pages = this.elements.getAllPages();
    if (pages.length === 0) {
      this.elements.createPage("Home");
    } else if (!this.elements.getActivePage()) {
      this.elements.setActivePage(pages[0].id);
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
  <title>Buildrick Export</title>
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
        // Sender must be on a domain we can verify with the provider. It used to
        // be noreply@aquibra.com — a domain from the project this was forked from,
        // which SendGrid would reject as an unverified sender, so form
        // notifications failed silently.
        fromEmail: FORM_NOTIFICATION_SENDER,
      });
    } else if (emailConfig.provider !== "none" && emailConfig.apiKey && emailConfig.enabled) {
      // For other providers with API keys, use mock until properly configured
      emailService.configure({
        provider: "mock",
        fromEmail: FORM_NOTIFICATION_SENDER,
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
    this.emit(EVENTS.PROJECT_METADATA_CHANGED, this.getProjectMetadata());
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
    // Deliberately no markDirty (load path), but consumers of the name —
    // the topbar — still need to hear about it (F7).
    this.emit(EVENTS.PROJECT_METADATA_CHANGED, this.getProjectMetadata());
  }

  // ============================================
  // State & Config
  // ============================================

  /**
   * Get current state. Device is computed from viewport (E-004 SSOT — viewport is authoritative).
   */
  getState(): ComposerState {
    return { ...this.state, device: this.viewport.getDevice() };
  }

  /**
   * Patch state properties directly (for load/save operations).
   * Device patches are forwarded to setDevice so viewport stays SSOT (E-004).
   */
  patchState(patch: Partial<ComposerState>): void {
    const { device, ...rest } = patch;
    this.state = { ...this.state, ...rest };
    if (device !== undefined) this.setDevice(device);
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
   * Is a project still arriving from the dashboard?
   *
   * The shell creates the composer and mounts the whole editor SYNCHRONOUSLY,
   * then fetches the site's pages. For the length of that fetch the canvas is
   * empty — and an empty canvas draws "Start building · Browse templates",
   * which tells someone with a twelve-page site that they have nothing. Board
   * 65:412 (Shell state 12 · Loading) draws the other thing: the shell, with
   * the canvas showing placeholders and the status bar saying so.
   *
   * A getter as well as an event because the consumers mount AFTER the fetch
   * starts — a subscriber-only signal is a signal they were never there for.
   */
  isProjectLoading(): boolean {
    return this.projectLoading;
  }

  /** Set by whoever owns the fetch (the shell); the engine does no I/O. */
  setProjectLoading(loading: boolean): void {
    if (this.projectLoading === loading) return;
    this.projectLoading = loading;
    this.emit(EVENTS.PROJECT_LOAD_STATE, { loading });
  }

  /**
   * Returns a promise that resolves when initialization completes.
   * Rejects if initialization fails.
   */
  whenReady(): Promise<void> {
    return this.initPromise ?? Promise.resolve();
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
      // Capture a pre-transaction snapshot so rollbackTransaction can actually
      // restore state on error. Transactions wrap discrete user ops (delete,
      // paste, move, drag-drop) — not per-tick edits — so one clone per
      // outermost transaction is acceptable cost.
      this.transactionSnapshot = deepClone(this.exportProject());
      this.emit(EVENTS.TRANSACTION_BEGIN, { label });
    }
  }

  endTransaction(): void {
    if (this.transactionDepth === 0) {
      return;
    }

    this.transactionDepth--;

    if (this.transactionDepth === 0) {
      this.transactionSnapshot = null;
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
      // Restore the pre-transaction snapshot so partial mutations made before
      // the error are actually discarded — not just hidden from PROJECT_CHANGED.
      // Quiet restore: no history record, no stack reset.
      const snapshot = this.transactionSnapshot;
      this.transactionSnapshot = null;
      this.transactionDirty = false;
      if (snapshot) {
        // importProject resets state.dirty = false. Preserve the pre-transaction
        // dirty flag so a rollback doesn't strand earlier unsaved edits (autosave
        // gates on isDirty()).
        const wasDirty = this.state.dirty;
        this.history.runWithoutTracking(() => this.importProject(snapshot));
        this.state.dirty = wasDirty;
      }
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
   * Set active device for responsive preview.
   *
   * E-004: viewport is the single source of truth. State no longer mirrors
   * device — `getState()` reads from `viewport.currentDevice` at serialization
   * time. `BREAKPOINT_CHANGED` is emitted once by `viewport.setDevice`
   * (Viewport.ts:70).
   */
  setDevice(device: import("../shared/types").DeviceType): void {
    if (this.viewport.getDevice() !== device) {
      this.viewport.setDevice(device);
    }
  }

  /**
   * Active device for responsive preview. Reads from viewport (SSOT).
   */
  get device(): import("../shared/types").DeviceType {
    return this.viewport.getDevice();
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    const clampedZoom = clamp(zoom, THRESHOLDS.ZOOM_MIN, THRESHOLDS.ZOOM_MAX);
    if (this.state.zoom !== clampedZoom) {
      this.state.zoom = clampedZoom;
      // viewport.setZoom already emits VIEWPORT_ZOOM — don't double-fire it
      // (every zoom listener ran twice).
      this.viewport.setZoom(clampedZoom);
    }
  }

  /**
   * Toggle snap to grid
   */
  setSnapToGrid(enabled: boolean): void {
    if (this.state.snapToGrid !== enabled) {
      this.state.snapToGrid = enabled;
      this.emit(EVENTS.SNAP_TOGGLE, { snapToGrid: enabled });
    }
  }

  /**
   * Set grid size for snapping
   */
  setGridSize(size: number): void {
    const clampedSize = clamp(size, 1, 100);
    if (this.state.gridSize !== clampedSize) {
      this.state.gridSize = clampedSize;
      this.emit(EVENTS.GRID_CHANGED, { gridSize: clampedSize });
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
      this.canvas.interactions.startRuntime();
    } else {
      this.canvas.interactions.stopRuntime();
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
    if (this.canvas.indicators?.destroy) this.canvas.indicators.destroy();
    if (this.fonts?.destroy) this.fonts.destroy();
    if (this.components?.destroy) this.components.destroy();
    if (this.cms.bindings?.destroy) this.cms.bindings.destroy();
    if (this.collab.manager?.destroy) this.collab.manager.destroy();
    if (this.forms?.destroy) this.forms.destroy();
    if (this.recovery?.destroy) this.recovery.destroy();
    if (this.media?.destroy) this.media.destroy();
    if (this.canvas.drag?.destroy) this.canvas.drag.destroy();
    if (this.router?.clear) this.router.clear();
    if (this.elements?.destroy) this.elements.destroy();
    if (this.styles?.destroy) this.styles.destroy();
    if (this.commands?.destroy) this.commands.destroy();
    if (this.selection?.destroy) this.selection.destroy();
    if (this.history?.destroy) this.history.destroy();
    if (this.versions?.destroy) this.versions.destroy();
    if (this.storage?.destroy) this.storage.destroy();
    if (this.viewport?.destroy) this.viewport.destroy();

    // Remove individually tracked handlers before global teardown
    for (const handler of this.collaborationHandlers) {
      this.collab.manager.off("operation:apply", handler);
    }
    this.collaborationHandlers.clear();

    for (const handler of this.selectionHandlers) {
      this.off("element:selected", handler);
      this.off("selection:multiple", handler);
      this.off("selection:cleared", handler);
    }
    this.selectionHandlers.clear();

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
