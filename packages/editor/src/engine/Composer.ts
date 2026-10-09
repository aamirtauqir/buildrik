/**
 * Aquibra Composer Engine
 * Core visual editor engine - handles all editing operations
 *
 * @module engine/Composer
 * @license BSD-3-Clause
 */

import { emailService } from "../services/EmailService";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";
import { MEDIA_EVENTS } from "../shared/constants/media";
import { EVENTS, THRESHOLDS, isNavigationOnlyChange } from "../shared/constants";
import type {
  ComposerConfig,
  ComposerState,
  ProjectData,
  ProjectSettings,
  ExportOptions,
  ExportResult,
} from "../shared/types";
import { clamp, deepClone } from "../shared/utils/helpers";
import { dropSessionMediaUrls, sanitizeElementTreeContent } from "../shared/utils/html";
import { refineElementTypes } from "./migration/refineElementTypes";
import { CanvasIndicators } from "./canvas/indicators";
import { ResizeHandler } from "./canvas/ResizeHandler";
import { CMSBindingManager } from "./cms/CMSBindingManager";
import { CollectionManager } from "./cms/CollectionManager";
import { CollaborationManager } from "./collaboration/CollaborationManager";
import { CommandCenter } from "./commands/CommandCenter";
import { ComponentManager } from "./components/ComponentManager";
import { DataManager } from "./data/DataManager";
import { DragManager } from "./drag/DragManager";
import { ElementManager } from "./elements/ElementManager";
import { EventEmitter } from "./EventEmitter";
import { RESET_CSS, siteFontCSS, siteFontFaceCSS, emitSiteTokenCss, googleFontsHeadLinks, siteFontsFromSettings } from "./export/ExportHelpers";
import { pageFileNames } from "./export/ExportEngine";
import { resolvePageTitle, resolveLanguage } from "./export/SEOInjector";
import { buildInteractionRuntimeScript, INTERACTION_ATTR } from "./export/interactionRuntime";
import { escapeHTML } from "../shared/utils/html/encoding";
import { escapeStyleText } from "@buildrik/shared/schemas/element-markup";
import { copyIdKeyedRecord, copyIdKeyedStyles, type IdRename } from "@buildrik/shared/content/elementIds";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { FontManager } from "./fonts/FontManager";
import { FormHandler } from "./forms/FormHandler";
import { HistoryManager } from "./HistoryManager";
import { InteractionManager } from "./interactions/InteractionManager";
import { MediaManager } from "./media/MediaManager";
import { MediaCommandLayer } from "./media/MediaCommandLayer";
import { PluginManager } from "./PluginManager";
import { RecoveryManager } from "./recovery/RecoveryManager";
import { PageRouter } from "./routing/PageRouter";
import { SelectionManager } from "./SelectionManager";
import { StorageAdapter } from "./storage/StorageAdapter";
import { StyleEngine } from "./styles/StyleEngine";
import type { Patch } from "./utils/JsonPatch";
import { MigrationManager } from "./migration/MigrationManager";
import { AliasResolver } from "./aliasResolver";
import { ColorMode } from "./colorMode";
import { TokenUsageTracker } from "./designSystem/TokenUsageTracker";
import { findConnectSuggestions, type ConnectRef, type ConnectSuggestion } from "./designSystem/connectTokens";
import { LintState } from "./designSystem/LintState";
import { TokenBindingResolver } from "./designSystem/TokenBindingResolver";
import { applyContrastFix } from "./designSystem/contrastFix";
import { isAiEditableTokenValue } from "./designSystem/tokenValueGuard";
import { mergeProjectTokens } from "./designSystem/projectTokens";
import type { BrandPreview, DarkMode, DesignToken } from "./designSystem/types";
import { validateTokens, TOKENS_SCHEMA_VERSION } from "@buildrik/shared/schemas/design-tokens";
import { DSLinter } from "./designSystem/linter";
import { AIAssistService } from "./designSystem/services";
import { VersionTimelineManager } from "./VersionTimelineManager";
import { Viewport } from "./Viewport";
import { getDefaultPageName } from "../shared/utils/pageUtils";

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
  /* The DS project-migration version the loaded payload is at. Carried
     through import → export so a save writes it back (Site.dsSchemaVersion);
     dropped here, the migration re-ran on every open (walk A2, 2026-09-24). */
  private dsSchemaVersion: number | undefined;

  // Project metadata (name, author, timestamps)
  private projectMetadata: import("../shared/types").ProjectMetadata = {
    name: "Untitled Project",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Clipboard for copy/paste - stores serialized element data
  /* An ARRAY since 2026-08-23: copy and cut read the whole selection, not
     the primary element. A single copy is a one-item array, so callers have
     one shape to handle — but note an empty array is truthy, so guard on
     `.length`, never on the field itself. */
  clipboard: import("../shared/types").ElementData[] | null = null;

  // Style clipboard for copy/paste styles only
  styleClipboard: Record<string, string> | null = null;

  // Core managers — flat fields (kept flat per Option B-tight: high-traffic
  // hot paths like history/media/elements/styles all stay top-level).
  readonly elements: ElementManager;
  readonly styles: StyleEngine;
  readonly commands!: CommandCenter;

  /**
   * Read-only composer: every command that would change the document stands
   * down (see MUTATING_COMMANDS in CommandCenter). Set by the chrome for client
   * view, which is a VIEW — whoever is holding it is looking, not building.
   *
   * It lives here rather than in the chrome because KeybindingManager binds
   * keydown on WINDOW in the capture phase, so gating React handlers cannot
   * reach it: with the rail, inspector, inline edit and context menu all
   * withheld, click-then-Delete still removed an element and autosave still
   * wrote it. CLAUDE.md says the Composer is the single gateway to the engine;
   * this is the gate.
   */
  readOnly = false;
  readonly selection!: SelectionManager;
  readonly history!: HistoryManager;
  readonly versions!: VersionTimelineManager;
  readonly storage!: StorageAdapter;
  readonly viewport!: Viewport;
  readonly plugins!: PluginManager;
  readonly data!: DataManager;
  readonly fonts!: FontManager;
  readonly components!: ComponentManager;
  readonly media!: MediaManager;
  readonly mediaOps!: MediaCommandLayer;
  readonly forms!: FormHandler;
  readonly router!: PageRouter;
  readonly recovery!: RecoveryManager;
  readonly migration!: MigrationManager;
  readonly aliasResolver!: AliasResolver;
  readonly colorMode!: ColorMode;
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
    /** True when the site's tokens failed to migrate on load: Brand shows the
     *  old tokens and refuses edits. Set by the load path, announced with
     *  `EVENTS.DESIGN_SYSTEM_READ_ONLY`. */
    readOnly: boolean;
    /** Why `readOnly` is set (null when it is not): selects the Brand notice. */
    readOnlyReason: string | null;
    /** The server's brand-token switch for this site (`brandTokensV2`), set by
     *  the load path. False: a pre-v6 site's tokens are emitted (canvas,
     *  export, publish) as saved, never migrated in memory. True when nothing
     *  loaded from the server (standalone editor). */
    brandTokensV2: boolean;
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
    /**
     * THE token write (spec §4: one undo stack). Validates the whole v6 set
     * and writes `projectSettings.designTokens` + schema version 6 inside one
     * labelled transaction, so a multi-token edit is one ⌘Z step shared with
     * canvas history. Brand, "Update everywhere", import, starters, auto-fix
     * and the AI write all land here. Returns false and writes nothing when
     * the tokens are read-only or the set does not validate. A successful
     * write announces `EVENTS.BRAND_APPLIED` (onboarding's "Set your brand").
     * Also refuses a write that would remove a token the site still uses, or
     * whose usage cannot be counted yet (spec §6) — soft delete via
     * `replacedBy` keeps the token and is never refused for that.
     */
    readonly setTokens: (next: DesignToken[], label: string) => boolean;
    /** The canvas preview, or null. Set only through `setPreview`. */
    preview: BrandPreview | null;
    /** Paint `p` on the canvas instead of the saved tokens (null = back to the
     *  saved ones). Touches neither settings nor history. */
    readonly setPreview: (p: BrandPreview | null) => void;
    /**
     * Writes the site's Dark mode AND its tokens in ONE transaction (one ⌘Z).
     * Tokens are always written — `tokens` when given, else the current merged
     * set — because the save path keeps the stored darkMode when a payload
     * carries no designTokens (sites.service withCheckedTokens). False, and
     * nothing written, when read-only or the token write is refused.
     */
    readonly setDarkMode: (mode: DarkMode, label: string, tokens?: DesignToken[]) => boolean;
    /** Connect to tokens (spec §3): exact-match suggestions over every page,
     *  or one. Skips component instances and masters (owner, OQ-5). */
    readonly connectSuggestions: (pageId?: string) => ConnectSuggestion[];
    /** Binds the picked suggestions (base styles and breakpoint overrides) in
     *  ONE transaction; returns the style writes made — 0 when read-only or
     *  nothing applies. No restore point (owner, OQ-4): ⌘Z covers it. */
    readonly applyConnect: (picks: ReadonlyArray<{ key: string; tokenId: string }>) => number;
  };

  constructor(config: ComposerConfig) {
    super();
    this.config = this.normalizeConfig(config);
    this.state = this.createInitialState();
    this.applyProjectSettings(this.projectSettings, {
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
    this.fonts = new FontManager(this);
    this.components = new ComponentManager(this);
    this.media = new MediaManager(this.config.remoteSync);
    this.mediaOps = new MediaCommandLayer(this);
    this.forms = new FormHandler(this);
    this.router = new PageRouter();
    this.recovery = new RecoveryManager(this);
    this.migration = new MigrationManager(this);
    this.aliasResolver = new AliasResolver(this);
    this.colorMode = new ColorMode(this);
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

    const tokenUsage = new TokenUsageTracker(
      () => this.mergedDesignTokens(),
      () => {
        const components = this.components.isLoaded() ? this.components.getAllComponents() : null;
        return {
          sources: [
            this.elements.exportPages(),
            this.styles.exportStyles(),
            components ?? [],
            this.getProjectSettings().designPresets ?? [],
          ],
          unavailable: components === null ? ["components"] : [],
        };
      },
    );
    const lintState = new LintState();
    const tokenBindingResolver = new TokenBindingResolver();
    this.designSystem = {
      readOnly: false,
      readOnlyReason: null,
      brandTokensV2: true,
      tokenUsage,
      lintState,
      tokenBindingResolver,
      computeAutoFix: (currentValue, hint) => {
        if (!hint) return currentValue;
        return applyContrastFix(currentValue, hint);
      },
      applyAutoFix: (tokenId, hint) => {
        if (!hint) return null;
        const tokens = this.mergedDesignTokens();
        const current = resolveTokenLiteral(tokens, tokenId, "light");
        if (current === null) return null;
        const fixed = applyContrastFix(current, hint);
        if (fixed === current) return null;
        return this.designSystem.setTokens(setTokenLiteral(tokens, tokenId, "light", fixed), "Auto-fix contrast")
          ? fixed
          : null;
      },
      setDesignToken: (tokenId, value) => {
        const tokens = this.mergedDesignTokens();
        const target = tokens.find((t) => t.id === tokenId);
        if (!target) return null; // unknown id — never write a token that isn't registered
        if (!isAiEditableTokenValue(target.type, value)) return null; // per-type value guard
        if (value === resolveTokenLiteral(tokens, tokenId, "light")) return null; // no-op
        return this.designSystem.setTokens(setTokenLiteral(tokens, tokenId, "light", value), "Set design token")
          ? value
          : null;
      },
      setTokens: (next, label) => {
        if (this.designSystem.readOnly) return false;
        const checked = validateTokens(next);
        if (!checked.ok) {
          console.warn(`[tokens] refused "${label}": ${checked.reason}`);
          return false;
        }
        const blocked = this.tokensRemovedInUse(checked.tokens);
        if (blocked.length > 0) {
          console.warn(`[tokens] refused "${label}": still in use or uncounted: ${blocked.join(", ")}`);
          return false;
        }
        this.beginTransaction(label);
        try {
          this.setProjectSettings({
            ...this.getProjectSettings(),
            designTokens: checked.tokens,
            designTokensSchemaVersion: TOKENS_SCHEMA_VERSION,
          });
        } finally {
          this.endTransaction();
        }
        this.emit(EVENTS.BRAND_APPLIED, undefined);
        return true;
      },
      preview: null,
      setPreview: (p) => {
        this.designSystem.preview = p;
        this.emit(EVENTS.BRAND_PREVIEW_CHANGED, undefined);
      },
      setDarkMode: (mode, label, tokens) => {
        if (this.designSystem.readOnly) return false;
        this.beginTransaction(label);
        try {
          if (!this.designSystem.setTokens(tokens ?? this.mergedDesignTokens(), label)) return false;
          this.setProjectSettings({ ...this.getProjectSettings(), darkMode: mode });
          return true;
        } finally {
          this.endTransaction();
        }
      },
      connectSuggestions: (pageId) => {
        const pages = this.elements.exportPages().filter((p) => pageId === undefined || p.id === pageId);
        return findConnectSuggestions(
          pages.map((p) => p.root),
          this.mergedDesignTokens(),
          // Never write inside a component instance (it would create overrides).
          { skip: (id) => this.components.findInstanceContainingElement(id) !== null },
        );
      },
      applyConnect: (picks) => {
        if (this.designSystem.readOnly) return 0;
        const tokens = this.mergedDesignTokens();
        const byKey = new Map(this.designSystem.connectSuggestions().map((s) => [s.key, s]));
        const writes: Array<ConnectRef & { value: string }> = [];
        for (const pick of picks) {
          const s = byKey.get(pick.key);
          const token = tokens.find((t) => t.id === pick.tokenId);
          if (!s || !token || !s.candidates.includes(token.id)) continue;
          for (const r of s.refs) writes.push({ ...r, value: `var(${token.cssVar})` });
        }
        if (writes.length === 0) return 0;
        this.beginTransaction("Connect to tokens");
        try {
          for (const w of writes) {
            if (w.breakpoint) this.styles.setBreakpointStyle(w.elementId, w.breakpoint, { [w.prop]: w.value });
            else this.elements.getElement(w.elementId)?.setStyle(w.prop, w.value);
          }
        } finally {
          this.endTransaction();
        }
        return writes.length;
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
        this.recomputeTokenUsage();
      });
    };
    this.on(EVENTS.ELEMENT_CREATED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.ELEMENT_DELETED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.ELEMENT_UPDATED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.ELEMENT_STYLE_UPDATED, scheduleRecomputeTokenUsage);
    // Breakpoint overrides and pseudo-state rules are an element's uses too.
    this.on(EVENTS.STYLE_CHANGED, scheduleRecomputeTokenUsage);
    this.on(EVENTS.STYLE_REMOVED, scheduleRecomputeTokenUsage);
    // The site-wide count also reads tokens, project styles, saved components
    // and presets: those changes only mark it stale (it rebuilds on next read).
    const invalidateTokenUsage = () => tokenUsage.invalidate();
    this.on(EVENTS.PROJECT_CHANGED, invalidateTokenUsage);
    // importProject (page load, undo/redo, rollback, version restore) swaps
    // the whole tree without per-element events: rebuild the breakdown too.
    this.on(EVENTS.PROJECT_LOADED, () => {
      invalidateTokenUsage();
      scheduleRecomputeTokenUsage();
    });
    this.on(EVENTS.COMPONENT_LIST_UPDATED, invalidateTokenUsage);
    /* EDT-056: a collection names its template page by published file name,
       so after any page change — or the import that undo, redo and a version
       restore run (the PROJECT_LOADED without `importing`) — the collections
       follow the file names they named. */
    const followTemplatePages = () =>
      void this.cms.collections.followPageFiles(pageFileNames(this.elements.getAllPages()));
    this.on(EVENTS.PROJECT_CHANGED, (payload: { type?: string } | undefined) => {
      if (payload?.type?.startsWith("page:") && !isNavigationOnlyChange(payload)) followTemplatePages();
    });
    this.on(EVENTS.PROJECT_LOADED, (payload: { importing?: boolean } | undefined) => {
      if (!payload?.importing) followTemplatePages();
    });
    // A template that lands raw values a token already holds: offer Connect.
    this.on(EVENTS.TEMPLATE_APPLIED, ({ pageId }) => {
      const suggestions = this.designSystem.connectSuggestions(pageId);
      if (suggestions.length > 0) this.emit(EVENTS.BRAND_CONNECT_SUGGESTED, { pageId, suggestions });
    });

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
  /** Old → new object URLs for locally-stored media, from this session's rebuild. */
  private localMediaUrlRemap: Record<string, string> = {};

  /** Point any element carrying a dead local media URL at its live one. */
  private repairLocalMediaUrls(): void {
    if (Object.keys(this.localMediaUrlRemap).length === 0) return;
    for (const element of this.elements.getAllElements()) {
      const src = element.getAttributes().src;
      const next = src ? this.localMediaUrlRemap[src] : undefined;
      if (next) element.setAttribute("src", next);
    }
  }

  private async initialize(): Promise<void> {
    this.emit(EVENTS.COMPOSER_READY); // initializing phase

    /* Repair pages that point at a local asset's PREVIOUS object URL. The media
       library re-creates those on every load (blob: URLs die with the window)
       and until now healed only itself: measured live, after a reload the
       library held a fresh URL while the placed <img> still carried the dead
       one.

       Applied twice on purpose. The library rebuilds during media.init(), when
       no page has loaded yet, and the project arrives afterwards carrying the
       stale value — so the map is kept and replayed when it does. */
    this.media.on(MEDIA_EVENTS.LOCAL_URLS_REBUILT, (payload: unknown) => {
      const remapped = (payload as { remapped?: Record<string, string> })?.remapped;
      if (!remapped) return;
      Object.assign(this.localMediaUrlRemap, remapped);
      this.repairLocalMediaUrls();
    });
    this.on(EVENTS.PROJECT_LOADED, () => this.repairLocalMediaUrls());

    /* Site fonts. A font file in the library is UPLOADED; it becomes a
       family the pickers offer once it is ADDED — `Add font` in the Site
       fonts dialog sets `MediaAsset.siteFont` (Clone 3686:42317: "Existing
       text is unchanged until you choose this font"). Only flagged fonts are
       registered with the FontManager: at init for what is already stored,
       then on add / update (the flag turning on, or a device-only upload
       reaching the server with a new url); the flag turning off or the
       asset's deletion unregisters. `fonts.getAllFonts({ source: "custom" })`
       is therefore the added set, and the pickers and the export read
       nothing else. Registration failures (a file the browser cannot decode)
       are the FontManager's own event; nothing here should stop the library
       from loading over one bad file. */
    /* The delete event carries only the id and fires after the asset has
       left the media state, so the file each id provided is remembered here. */
    const fontFileById = new Map<string, string>();
    /* A family is keyed by FILE name, and two library files can share one
       (seen live: two Inter-Var.woff2, one added). It stays registered while
       ANY asset carrying that name is added — a not-added duplicate must not
       pull the added one's family out from under the pickers. */
    const stillAddedElsewhere = (filename: string, exceptId: string | undefined) => {
      for (const [id, file] of fontFileById) if (id !== exceptId && file === filename) return true;
      return false;
    };
    const syncLibraryFont = (asset: unknown) => {
      const a = asset as
        | { id?: string; type?: string; originalName?: string; src?: string; siteFont?: boolean }
        | undefined;
      if (a?.type !== "font" || !a.originalName || !a.src) return;
      if (a.siteFont === true) {
        /* A device-only upload reaching the server comes back under a new id
           for the same file; the old id's entry would otherwise hold the
           family registered forever. Entries the library no longer knows go. */
        for (const [id, file] of fontFileById) {
          if (id !== a.id && file === a.originalName && !this.media.getAsset(id)) fontFileById.delete(id);
        }
        if (a.id) fontFileById.set(a.id, a.originalName);
        void this.fonts.registerLibraryFont({ filename: a.originalName, url: a.src }).catch(() => {});
        return;
      }
      if (a.id) fontFileById.delete(a.id);
      if (stillAddedElsewhere(a.originalName, a.id)) return;
      this.fonts.unregisterLibraryFont(a.originalName);
    };
    this.media.on(MEDIA_EVENTS.MEDIA_ADDED, syncLibraryFont);
    /* D-10: importServerAssets (called on every project load,
       useComposerInit.ts:257) now emits one MEDIA_ADDED_BATCH instead of
       one MEDIA_ADDED per asset. Without this, a synced site font hydrated
       from the server silently never registers — this listener never fires
       for it. */
    this.media.on(MEDIA_EVENTS.MEDIA_ADDED_BATCH, (assets: unknown) => {
      if (!Array.isArray(assets)) return;
      for (const asset of assets) syncLibraryFont(asset);
    });
    this.media.on(MEDIA_EVENTS.MEDIA_UPDATED, (payload: unknown) => {
      const p = payload as { asset?: unknown } | undefined;
      syncLibraryFont(p && "asset" in p ? p.asset : payload);
    });
    /* L4-014: an asset's alt edit reaches the placements that still carry
       its old alt (or none). */
    this.media.on(MEDIA_EVENTS.MEDIA_UPDATED, (payload: unknown) => {
      const p = payload as
        | { asset?: { src?: string; altText?: string }; previous?: { altText?: string }; changes?: object }
        | undefined;
      if (!p?.asset?.src || !p.changes || !("altText" in p.changes)) return;
      if (p.previous?.altText === p.asset.altText) return;
      this.mediaOps.followAssetAlt(p.asset.src, p.previous?.altText, p.asset.altText);
    });
    this.media.on(MEDIA_EVENTS.MEDIA_DELETED, (payload: unknown) => {
      const id = (payload as { id?: string } | undefined)?.id;
      const filename = id ? fontFileById.get(id) : undefined;
      if (!filename) return;
      fontFileById.delete(id!);
      if (stillAddedElsewhere(filename, id)) return;
      this.fonts.unregisterLibraryFont(filename);
    });

    // Initialize async managers
    await this.media.init();
    for (const asset of this.media.getAssets()) syncLibraryFont(asset);

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
      this.markSaved(data);
    } catch (error) {
      this.emit(EVENTS.ERROR, { error, operation: "save" });
      throw error;
    }
  }

  /**
   * Announce that the project as it stands is persisted — whoever wrote it.
   *
   * `saveProject()` writes through `this.storage` and calls this itself. The
   * shipping editor does NOT take that path: with a siteId in the URL,
   * `useComposerInit`'s autosave hands the snapshot to BuildrikSyncProvider,
   * which persists to the dashboard and knows nothing about this object. So
   * the engine went on believing the project had never been saved, and
   * `useDirtyPages` — which clears its markers on PROJECT_SAVED — kept every
   * page's dirty dot lit over work that was already on the server.
   *
   * Measured live on a scratch site, 7s after an edit with no manual save:
   * the topbar read "Saved · just now", a second browser confirmed the server
   * had the edit, and the Pages tree still showed the page dirty. Three
   * readings of one question, and the panel was the one that lied.
   *
   * Takes the snapshot that was persisted so the caller does not pay for a
   * second `exportProject()` on every autosave tick.
   */
  markSaved(data?: ProjectData): void {
    this.state.dirty = false;
    this.emit(EVENTS.PROJECT_SAVED, data ?? this.exportProject());
  }

  /**
   * Import project data
   */
  importProject(data: ProjectData): void {
    this.emit(EVENTS.PROJECT_LOADED, { importing: true, data });
    /* Every element is replaced below, so a selection made before the import
       points at detached objects: after "Restore to draft" a deleted element
       stayed selected and editable (L5-043). Re-pointed by id at the end. */
    const selectedIds = this.selection.getSelectedIds();

    // Clear current state
    this.elements.clear();
    this.styles.clear();

    // Import pages and elements. Sanitize each page's content tree at this
    // trust boundary — external project JSON (localStorage, dashboard blocks,
    // templates) reaches the element tree here without otherwise passing the
    // HTML sanitizer, and content is later emitted raw onto the canvas.
    const renames: IdRename[] = [];
    if (data.pages) {
      data.pages.forEach((page) => {
        if (page.root) {
          sanitizeElementTreeContent(page.root);
          dropSessionMediaUrls(page.root, this.localMediaUrlRemap);
          // Q2: saved `container`s whose markup proves a real type get it.
          refineElementTypes(page.root);
        }
        renames.push(...this.elements.importPage(page));
      });
    }

    /* An element re-id'd on import (X-A1: its id was another page's too)
       keeps what was keyed by its old id — breakpoint/pseudo style rules and
       CMS bindings are COPIED to the new id; the originals stay with the
       page that kept the old id. */
    if (data.styles) {
      this.styles.importStyles([...data.styles, ...copyIdKeyedStyles(data.styles, renames)]);
    }

    // Restore CMS bindings before settings, so anything that reacts to a
    // settings change already sees the element->field wiring.
    if (data.cmsBindings) {
      if (data.cmsBindings.field)
        this.cms.bindings.import(copyIdKeyedRecord(data.cmsBindings.field, renames) as never);
      if (data.cmsBindings.collection)
        this.cms.bindings.importCollectionBindings(copyIdKeyedRecord(data.cmsBindings.collection, renames) as never);
    }

    // Import project settings
    this.applyProjectSettings(data.settings ?? {}, {
      emitProjectChanged: false,
    });

    this.dsSchemaVersion = data.dsSchemaVersion;

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
      this.elements.createPage(getDefaultPageName(pages));
    } else if (!this.elements.getActivePage()) {
      this.elements.setActivePage(pages[0].id);
    }

    this.reselectAfterImport(selectedIds);

    this.state.dirty = false;
    this.emit(EVENTS.PROJECT_LOADED, data);
  }

  /** The pre-import selection, on the imported elements with the same ids;
   *  cleared when none of them exists any more. */
  private reselectAfterImport(ids: string[]): void {
    if (ids.length === 0) return;
    const kept = ids.map((id) => this.elements.getElement(id)).filter((el): el is NonNullable<typeof el> => Boolean(el));
    this.selection.clear();
    if (kept.length === 0) return;
    this.selection.select(kept[0]);
    for (const el of kept.slice(1)) this.selection.addToSelection(el);
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
      ...(this.dsSchemaVersion !== undefined ? { dsSchemaVersion: this.dsSchemaVersion } : {}),
      /* Without this the binding survives only the session that made it: the
         maps are in memory, and a reload republished the placeholder text.
         Guarded because HistoryManager snapshots from its own constructor
         (:244), before `cms` exists (:272) — that snapshot is of an empty
         project, so an absent field there is correct, not lossy. */
      ...(this.cms
        ? {
            cmsBindings: {
              field: this.cms.bindings.export(),
              collection: this.cms.bindings.exportCollectionBindings(),
            },
          }
        : {}),
    };
  }

  // ============================================
  // Export Operations
  // ============================================

  /**
   * Export to HTML
   */
  /**
   * The quick single-document export — what the in-shell preview renders and
   * what "copy HTML" hands over.
   *
   * It carries the SAME base rules as a published export. It used to build its
   * own document with only the element CSS, so the preview showed the browser's
   * default typography while the published page showed the product's: the one
   * surface whose whole job is "this is what visitors will see" disagreed with
   * what visitors would see.
   */
  exportHTML(options?: ExportOptions): ExportResult {
    const html = this.elements.toHTML(options);
    const css = this.styles.toCSS(options);

    // The site's own fonts. The comment above is about this exact gap and it
    // reopened: the export learned to emit the three font slots and to fetch
    // the families that need fetching, and this document — the one the preview
    // renders — kept building a head with neither.
    const projectSettings = this.getProjectSettings?.();
    const brandSwitch = { migrate: this.designSystem?.brandTokensV2 !== false };
    const fonts = siteFontsFromSettings(projectSettings, brandSwitch);
    /* Preview builds its own document, so it needs the token definitions too —
       otherwise the preview and the published page disagree on every value a
       Brand preset binds. */
    const siteCss =
      emitSiteTokenCss(projectSettings, brandSwitch) + siteFontCSS(fonts);
    // The HTML too, not just the CSS: this document carries element styles
    // INLINE (`elements.toHTML`), so a heading set in Lora names its family in
    // a style attribute and nowhere in the stylesheet.
    const slotFamilies = [fonts.heading, fonts.body, fonts.mono].filter((f): f is string => Boolean(f));
    /* The site's ADDED fonts (Clone 3721:43423): this document renders in its
       own frame, where the editor's document.fonts never reach, so the faces
       the export declares are declared here too — and a family the site
       provides is never asked of Google. */
    const siteFonts = this.fonts?.getAllFonts({ source: "custom" }) ?? [];
    const faces = siteFontFaceCSS(`${css}${siteCss}${html}`, slotFamilies, siteFonts).css;
    const fontLinks = googleFontsHeadLinks(
      `${css}${siteCss}${html}`,
      slotFamilies,
      siteFonts.map((f) => f.family)
    );

    // The THIRD head this codebase assembles, after the single-file export and
    // the publish pipeline — and the one behind Quick preview, the preview
    // modal, the view mode and the "copy page HTML" command. Both of the
    // others were taught to resolve the page's own title today; this one still
    // stamped the literal "Buildrick Export" on every page, so the preview tab
    // and any HTML the user copied out carried our brand name as their title.
    // One precedence, all three paths.
    const titlePage = this.elements.getActivePage?.();
    const title = titlePage
      ? resolvePageTitle(
          titlePage,
          titlePage.settings?.seo,
          titlePage.settings,
          this.getProjectSettings?.()?.seo
        )
      : "Untitled";

    /* The interaction runtime, on the same rule the export uses: ship it only
       when the page carries a configured interaction. Without it this document
       had the triggers written into the markup and nothing listening, so a
       click animation set in the inspector did nothing in Preview — the one
       surface whose job is to show what a visitor gets — while working on the
       published page. */
    const interactionScript = html.includes(INTERACTION_ATTR)
      ? `\n${buildInteractionRuntimeScript()}`
      : "";

    return {
      html,
      css,
      combined: `<!DOCTYPE html>
<html lang="${resolveLanguage(this.getProjectSettings?.()?.seo)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
${fontLinks ? `${fontLinks}\n` : ""}  <style>${escapeStyleText(`${faces}${RESET_CSS}${css}${siteCss}`)}</style>
</head>
<body>
${html}${interactionScript}
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
    settings: ProjectSettings,
    options?: { emitProjectChanged?: boolean; emitSettingsChange?: boolean }
  ): void {
    this.projectSettings = settings ?? {};

    const emailConfig = this.projectSettings.integrations?.email || {
      provider: "none",
      enabled: false,
    };

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

  /** Ids the write would remove (after the seed merges back) whose site-wide
   *  usage is not a known 0. Builds usage synchronously: the microtask-coalesced
   *  recompute may not have run since the last element edit. */
  private tokensRemovedInUse(next: DesignToken[]): string[] {
    const merged = mergeProjectTokens(next, TOKENS_SCHEMA_VERSION);
    const after = new Set(merged.map((t) => t.id));
    const removed = this.mergedDesignTokens().filter((t) => !after.has(t.id));
    if (removed.length === 0) return [];
    this.recomputeTokenUsage();
    /* Counted through the NEXT set's aliases: a primitive the write also stops
       aliasing (Review changes · Revert, a restore) strands nothing. */
    return removed.filter((t) => this.designSystem.tokenUsage.getCountIn(t.id, merged) !== 0).map((t) => t.id);
  }

  /** Rebuilds the element breakdown now (the event path coalesces it into a microtask). */
  private recomputeTokenUsage(): void {
    this.designSystem.tokenUsage.recompute(this.elements.getAllElements(), this.styles.exportStyles());
  }

  /** The site's tokens as every write starts from them: the saved set merged
   *  over the seed (strict, never throws). */
  private mergedDesignTokens(): DesignToken[] {
    const settings = this.getProjectSettings();
    return mergeProjectTokens(settings.designTokens ?? [], settings.designTokensSchemaVersion);
  }

  /**
   * Set project-wide settings (analytics, integrations, design tokens)
   */
  setProjectSettings(settings: ProjectSettings): void {
    this.markDirty(); // Mark dirty BEFORE applyProjectSettings emits PROJECT_CHANGED
    this.applyProjectSettings(settings);
  }

  /**
   * Apply project settings the server already holds — the Settings Save
   * (Phase B, BE-3) wrote them through the settings mutations first. The
   * editor sees them (SETTINGS_CHANGE), but they are not a document edit: no
   * dirty flag and no PROJECT_CHANGED, so autosave does not send the project
   * again (`sites.saveProject`) for a change that is already saved.
   */
  adoptSavedProjectSettings(settings: ProjectSettings): void {
    this.applyProjectSettings(settings, { emitProjectChanged: false });
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
    /* Dev-only forensics, and LOAD-BEARING: `e2e/boot-clean.spec.ts` asserts
       against `__bkDirtyTrace` and fails as UNMEASURED if this is removed.
       A freshly loaded, untouched project was measured
       turning itself dirty and autosave then writing it — with a full-snapshot
       save that drops omitted pages, an unrequested write is the data-loss
       precondition, and the exit prompt is only its visible edge. Static
       reading could not say WHICH path fires, so the first transition records
       where it came from. Stripped from production by the DEV guard. */
    if (IS_DEV_BUILD && !this.state.dirty && typeof window !== "undefined") {
      const w = window as unknown as { __bkDirtyTrace?: string[] };
      (w.__bkDirtyTrace ??= []).push(new Error("markDirty").stack ?? "no stack");
    }
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
