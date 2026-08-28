/**
 * useComposerInit - Hook for Composer initialization and lifecycle
 * Extracts composer setup, event binding, and auto-save logic
 *
 * @module Editor/hooks/useComposerInit
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToastInput } from "@/editor/chrome-ui";
import { createComposer, Composer } from "../../../engine";
import { ProductCollectionService } from "../../../engine/cms";
import { THRESHOLDS } from "../../../shared/constants/config";
import { EVENTS } from "../../../shared/constants/events";
import type { SaveState } from "./useStudioState";
import { attachAdoptionRevertListener } from "../../../services/ai/adoptionTracker";
import type { ComposerConfig, ProjectData, DeviceType } from "../../../shared/types";
import type { DesignToken } from "@/editor/design-system";
import {
  getSiteIdFromUrl,
  loadCurrentUserId,
  loadProject,
  loadServerMedia,
  saveProject,
  SaveConflictError,
} from "@/services/BuildrikSyncProvider";
import { createRemoteAssetSync } from "@/services/AssetUploadService";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { ComponentSchemaAIClient } from "@/engine/designSystem/services";
import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";
import { getDefaultPageName } from "@/shared/utils/pageUtils";
import { isAuthSaveError, isForbiddenSaveError } from "./useSaveCallback";

export type ComposerOptions = Partial<ComposerConfig> & {
  project?: {
    type?: string;
    default?: { pages?: Array<{ name: string; component: string }> };
  };
};

export interface UseComposerInitParams {
  options?: ComposerOptions;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady?: (composer: Composer) => void;
  onEditor?: (composer: Composer) => void;
  onUpdate?: (data: ProjectData) => void;
  addToast: (input: ToastInput) => string;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;
  setDevice: (d: DeviceType) => void;
  setZoom: (z: number) => void;
  setShowExporter: React.Dispatch<React.SetStateAction<boolean>>;
  setShowComponentView: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: (dirty: boolean) => void;
  /* Was this shape spelled out inline — a fourth copy of SaveState, and an
     anonymous one, so no duplicate-name scan could see it. Widening the union
     in useStudioState broke here and nowhere else, which is how it surfaced. */
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  openCollectionSetup?: (onConfirm: (includeSampleData: boolean) => Promise<void>) => void;
  /** S1.5: surface a dashboard load failure as a persistent banner instead of
   *  a transient toast. `auth` = session expired, `network` = generic failure.
   *  When wired, it replaces the toast; when omitted, the toast is kept (back-compat). */
  onLoadError?: (kind: "auth" | "network" | "missing") => void;
  /** Board 813:4870: a mid-session 401 during AUTOSAVE opens the blocking
   *  recovery surface. Same back-compat shape as onLoadError. */
  onAuthExpired?: () => void;
}

export function useComposerInit(params: UseComposerInitParams): Composer | null {
  const [composer, setComposer] = React.useState<Composer | null>(null);
  const {
    options,
    containerRef,
    onReady,
    onEditor,
    onUpdate,
    addToast,
    setCanUndo,
    setCanRedo,
    setDevice,
    setZoom,
    setShowExporter,
    setShowComponentView,
    setIsDirty,
    setSaveState,
    openCollectionSetup,
    onLoadError,
    onAuthExpired,
  } = params;

  // Codex P2 (2026-05-21): mount-only init effect previously captured
  // `options`/`onReady`/`onEditor`/`onUpdate`/`addToast`/`openCollectionSetup`
  // in its closure forever, with explicit exhaustive-deps suppression.
  // Callers passing new function refs (e.g. inline arrow props from parent
  // re-render) silently kept calling the FIRST-render version.
  //
  // Fix: stash mutable callbacks in refs synced every render. Init effect
  // still runs mount-only (empty deps preserved), but reads `.current`
  // through the refs so it always sees the latest functions. State setters
  // (setComposer/setIsDirty/etc.) are stable by React contract — kept as
  // captured.
  const optionsRef = React.useRef(options);
  const onReadyRef = React.useRef(onReady);
  const onEditorRef = React.useRef(onEditor);
  const onUpdateRef = React.useRef(onUpdate);
  const addToastRef = React.useRef(addToast);
  const openCollectionSetupRef = React.useRef(openCollectionSetup);
  const onLoadErrorRef = React.useRef(onLoadError);
  React.useEffect(() => {
    optionsRef.current = options;
    onReadyRef.current = onReady;
    onEditorRef.current = onEditor;
    onUpdateRef.current = onUpdate;
    addToastRef.current = addToast;
    openCollectionSetupRef.current = openCollectionSetup;
    onLoadErrorRef.current = onLoadError;
  });

  // Initialize composer
  React.useEffect(() => {
    const { project: projectConfig, ...composerOptions } = optionsRef.current || {};
    // Phase B2: wire remote asset sync. Always provided — the service
    // gracefully falls back to local-only on auth fail / offline / dashboard
    // unconfigured. siteId scopes asset rows when known.
    const remoteSync = createRemoteAssetSync({ siteId: getSiteIdFromUrl() });
    // Phase C.2: ai.componentSchema mutation returns single-shot JSON via
    // ComponentSchemaAIClient. Adapter uses hand-rolled types so it stays
    // test-injectable; cast at the impedance boundary preserves type-safety
    // on both sides.
    const aiClient = isFeatureEnabled("dsAi")
      ? new ComponentSchemaAIClient({
          mutate: (args, options) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (getAiSubscriptionClient().ai.componentSchema.mutate as any)(args, options),
        })
      : null;
    const instance = createComposer({
      container: containerRef.current || document.createElement("div"),
      ...composerOptions,
      remoteSync,
      aiClient,
    } as ComposerConfig);

    // Store event handlers for proper cleanup
    const composerReadyHandler = () => {
      onReadyRef.current?.(instance);

      const siteId = getSiteIdFromUrl();

      if (siteId) {
        // Scope the per-site IndexedDB buckets. Without this, every site edited
        // in the same browser shares the "default" bucket — version snapshots
        // and saved components bleed across sites, and restoring a version
        // imports ANOTHER site's content (then autosave persists the bleed).
        void instance.versions?.setProjectId?.(siteId);
        void instance.components?.setProjectId?.(siteId);
        /* Media was left out of this list, and the comment above was therefore
           only two-thirds true. Walked live on 2026-08-24: a site created
           seconds earlier and never uploaded to listed another site's asset,
           because `MediaManager` and its IndexedDB store carry no site at all. */
        void instance.media?.setProjectId?.(siteId);
        void instance.cms?.collections?.setProjectId?.(siteId);

        /* Attribution. Both managers have carried a `setCurrentUserId` with no
           caller, so every version and every history entry was written with
           `userId: null` — six write sites recording nothing. Board 162:2 puts
           an author on the row and could never have had one. Fire-and-forget:
           a failed lookup must not delay or block the project load, and the
           managers stamp whatever they hold at write time, so an id that
           arrives a moment later still attributes everything after it. */
        void loadCurrentUserId().then((userId) => {
          if (!userId) return;
          instance.versions?.setCurrentUserId?.(userId);
          instance.history?.setCurrentUserId?.(userId);
        });

        /* The shell is already fully mounted at this point — the canvas is up
           and empty, which is the state that draws "Start building · Browse
           templates" over someone's existing site until this fetch lands.
           Board 65:412 gives that window its own treatment; the flag is what
           the canvas and footer read to draw it. Cleared in .finally() so a
           failed load leaves a usable editor, never a permanent skeleton. */
        instance.setProjectLoading(true);
        loadProject(siteId)
          .then(async (data) => {
            // A.1 integration: run DS schema migrations on the loaded payload
            // before importing into the engine. Runner is pure w.r.t. DOM and
            // writes a localStorage snapshot/marker for crash-resume. Failure
            // surfaces a toast and falls through with un-migrated data so the
            // editor still loads — DS migrations are forward-fix, not load-gating.
            const fromVersion = data.dsSchemaVersion ?? 0;
            let toImport: ProjectData = data;
            try {
              const result = instance.migration.run({
                project: { tokens: (data.styles ?? []) as unknown as DesignToken[] },
                currentVersion: fromVersion,
                siteId,
              });
              if (result.newVersion !== fromVersion) {
                toImport = {
                  ...data,
                  styles: result.project.tokens as unknown as ProjectData["styles"],
                  dsSchemaVersion: result.newVersion,
                };
              }
              instance.aliasResolver.validate(
                (toImport.styles ?? []) as unknown as DesignToken[]
              );
            } catch (err) {
              console.error("[BuildrikSync] DS migration failed:", err);
              addToastRef.current({
                title: "Project update failed",
                description: "Could not update design system schema. Loaded as-is.",
                tone: "warning",
              });
            }
            instance.importProject(toImport);
            // P1-3 (iter 16): seed saveState so topbar shows "Saved · just now"
            // instead of "Not saved" on fresh load. The just-loaded state IS
            // the persisted state; without this seed lastSavedAt stays null
            // and the indicator falsely warns of unsaved work.
            setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
            setIsDirty(false);
            // Phase B3: hydrate media library from server. Additive — never
            // throws. Returns null on offline/auth/unconfigured; we just
            // keep going with engine-only state in that case.
            const remote = await loadServerMedia(siteId);
            if (remote) {
              await instance.media.importServerAssets(remote.assets, remote.folders);
              /* Hand the page's edges to the media domain. This pull is one
                 page; the drawer's "Load more" walks the rest, and it can only
                 do that if the cursor survives past this line. It used to be
                 discarded here, which is how a 200-asset cap became invisible.  */
              instance.media.setServerPage({
                nextCursor: remote.nextCursor,
                total: remote.total ?? remote.assets.length,
                loaded: remote.assets.length,
              });
            }
            addToastRef.current({
              title: "Project loaded",
              description: "Loaded from dashboard.",
              tone: "success",
            });
          })
          .catch((err) => {
            console.error("[BuildrikSync] load failed:", err);
            // Distinguish an auth failure from a generic load failure. On
            // UNAUTHORIZED the generic "falling back to local" message is
            // misleading — the user has a real site on the server they can't
            // see because they are signed out. Point them at sign-in instead.
            const isAuth =
              err instanceof Error && /unauthorized/i.test(err.message);
            /* NOT_FOUND is not a blip. The site is deleted or the link is
               stale, so no retry will ever succeed and no save will ever land
               — the editor was offering a blank canvas and "Start blank" to
               someone whose work could not be stored anywhere. */
            const isMissing =
              err instanceof Error && /not_found/i.test(err.message);
            // S1.5: prefer a persistent banner over a transient toast when the
            // shell wired onLoadError; the toast stays as the back-compat path.
            if (isMissing) {
              // The canvas invites work ("Start blank") and cannot see the
              // banner; it has to hear that this site is not coming back.
              instance.emit(EVENTS.PROJECT_UNAVAILABLE, { reason: "missing" });
            }
            if (onLoadErrorRef.current) {
              onLoadErrorRef.current(isAuth ? "auth" : isMissing ? "missing" : "network");
            } else if (isAuth) {
              addToastRef.current({
                title: "Session expired",
                description:
                  "Sign in to load this site from the dashboard. Showing local changes for now.",
                tone: "warning",
                action: {
                  label: "Sign in",
                  onClick: () => {
                    window.location.href = `${DASHBOARD_URL}/auth`;
                  },
                },
              });
            } else {
              addToastRef.current({
                title: "Load failed",
                description:
                  "Could not load project from dashboard. Falling back to local.",
                tone: "warning",
              });
            }
            loadFromLocalStorage(instance, projectConfig);
          })
          .finally(() => instance.setProjectLoading(false));
        return;
      }

      loadFromLocalStorage(instance, projectConfig);
    };

    function loadFromLocalStorage(
      inst: Composer,
      config: typeof projectConfig
    ) {
      let loadedFromStorage = false;
      inst
        .loadProject()
        .then((data) => {
          if (data) loadedFromStorage = true;
        })
        .catch(() => {
          addToastRef.current({
            title: "Load failed",
            description: "Could not load saved project.",
            tone: "warning",
          });
        })
        .finally(() => {
          if (loadedFromStorage) return;
          try {
            const savedRaw = localStorage.getItem("buildrick-project");
            if (savedRaw) {
              const saved = JSON.parse(savedRaw);
              if (saved.project) {
                inst.importProject(saved.project);
                loadedFromStorage = true;
              } else if (saved.content) {
                inst.elements.importHTMLToActivePage(saved.content);
                loadedFromStorage = true;
              }
            }
          } catch {
            // Ignore parse errors from malformed localStorage data
          }
          if (loadedFromStorage) return;
          const existingPages = inst.elements.getAllPages();
          /* One condition, one name. This said "Page 1" while Composer's own
             repair for the same condition said "Home" and `getDefaultPageName`
             said a third thing — and "Page 1" slugifies to `page-1`, the one
             slug the SEO score singles out as a placeholder. */
          if (!existingPages || existingPages.length === 0) {
            inst.elements.createPage(getDefaultPageName(existingPages ?? []));
          }
          config?.default?.pages?.forEach((page) => {
            const p = inst.elements.createPage(page.name);
            if (page.component && p.root?.id) {
              const root = inst.elements.getElement(p.root.id);
              root?.setContent(page.component);
            }
          });
        });
    }

    // Note: setCanUndo/setCanRedo are intentionally NOT called here to avoid duplicate updates.
    // These are managed by a separate useEffect (lines 130-144) that handles undo/redo state changes.
    const projectChangedHandler = () => {
      onUpdateRef.current?.(instance.exportProject());
    };

    // Note: setCanUndo/setCanRedo are intentionally NOT called here to avoid duplicate updates.
    // These are managed by a separate useEffect (lines 130-144) that handles undo/redo state changes.
    const historyRecordedHandler = () => {
      // This handler is intentionally empty but kept for potential future use
      // History state is managed in the dedicated undo/redo useEffect
    };

    // Templates is one surface now — the TemplatesTab drawer. The ⌘⇧T command
    // emits ui:toggle:templates; translate it to opening the "templates" tab
    // (StudioPanels listens for ui:switch-tab) instead of the retired modal.
    const toggleTemplatesHandler = () => instance.emit("ui:switch-tab", { tab: "templates" });
    const toggleExporterHandler = () => setShowExporter((v) => !v);
    // AI is one surface now — the AITab rail panel. The ⌘K "AI" command emits
    // ui:toggle:ai; translate it to opening the "ai" tab (StudioPanels listens
    // for ui:switch-tab) instead of the removed AIAssistant modal.
    const toggleAIHandler = () => instance.emit("ui:switch-tab", { tab: "ai" });
    const toggleComponentViewHandler = () => setShowComponentView((v) => !v);
    const deviceChangedHandler = (d: DeviceType) => setDevice(d);
    const zoomChangedHandler = (z: number) => setZoom(z);

    // Register all event listeners with named handlers
    instance.on("composer:ready", composerReadyHandler);
    instance.on("project:changed", projectChangedHandler);
    instance.on("history:recorded", historyRecordedHandler);
    instance.on("ui:toggle:templates", toggleTemplatesHandler);
    instance.on("ui:toggle:exporter", toggleExporterHandler);
    instance.on("ui:toggle:ai", toggleAIHandler);
    instance.on("ui:toggle:component-view", toggleComponentViewHandler);
    /* The engine names these BREAKPOINT_CHANGED and VIEWPORT_ZOOM (Viewport.ts
       :70,:87). Listening for "device:changed" / "zoom:changed" meant nothing
       the engine did to zoom ever reached React — and the canvas transform is
       `zoom / 100` off THIS state, not off composer. Zoom to Fit, Zoom In and
       Zoom Out from both command palettes set engine zoom and stopped there:
       no scale change, no change in the footer readout. */
    instance.on(EVENTS.BREAKPOINT_CHANGED, deviceChangedHandler);
    instance.on(EVENTS.VIEWPORT_ZOOM, zoomChangedHandler);

    setComposer(instance);
    onEditorRef.current?.(instance);

    // Adoption telemetry: report when the user undoes an AI edit ("ai-edit" label).
    const detachAdoption = attachAdoptionRevertListener(instance);

    // Cleanup: Remove all event listeners before destroying
    return () => {
      detachAdoption();
      instance.off("composer:ready", composerReadyHandler);
      instance.off("project:changed", projectChangedHandler);
      instance.off("history:recorded", historyRecordedHandler);
      instance.off("ui:toggle:templates", toggleTemplatesHandler);
      instance.off("ui:toggle:exporter", toggleExporterHandler);
      instance.off("ui:toggle:ai", toggleAIHandler);
      instance.off("ui:toggle:component-view", toggleComponentViewHandler);
      instance.off(EVENTS.BREAKPOINT_CHANGED, deviceChangedHandler);
      instance.off(EVENTS.VIEWPORT_ZOOM, zoomChangedHandler);
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - initialize only once on mount

  // Auto-save on project changes (dashboard sync when siteId present, localStorage otherwise)
  React.useEffect(() => {
    if (!composer) return;
    const siteId = getSiteIdFromUrl();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    /* Counts document changes so a save that is still in flight can tell
       whether it is still the newest state. Without it, an edit made WHILE a
       save was travelling was announced as saved when the older payload came
       back: `setIsDirty(false)` and `markSaved()` both fire, every dirty dot
       clears, and the editor claims work is on the server that never left the
       tab. Close it there and the edit is gone. */
    let changeSeq = 0;

    const handler = () => {
      setIsDirty(true);
      changeSeq += 1;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const seqAtSend = changeSeq;
        setSaveState((prev) => ({ ...prev, status: "saving", error: undefined }));

        /* Captured, not re-derived: `markSaved` below re-announces THIS
           snapshot, and a second `exportProject()` per autosave tick is a full
           serialize of the document. */
        const snapshot = siteId ? composer.exportProject() : null;
        const savePromise = snapshot
          ? saveProject(siteId!, snapshot).then(() => undefined)
          : composer.saveProject();

        savePromise
          .then(() => {
            /* A newer edit landed while this one was in flight, so what came
               back is not the current document. Say nothing: leave the dirty
               state standing and let the save this edit already scheduled
               report on the newer payload. Announcing here would clear every
               marker over work that is still only local. */
            if (changeSeq !== seqAtSend) return;
            /* Tell the engine, not just this component. The dashboard branch
               persists through BuildrikSyncProvider, which never touches the
               composer — so `composer.isDirty()` stayed true and
               `useDirtyPages` kept every page's dirty dot lit over work that
               was already on the server, while the topbar chip beside it read
               "Saved · just now". `composer.saveProject()` (the no-siteId
               branch, and the manual ⌘S path) has always announced itself;
               only the branch every real user takes did not. */
            if (snapshot) composer.markSaved(snapshot);
            setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
            setIsDirty(false);
          })
          .catch((err) => {
            /* A refused save is not a failed one. `BuildrikSyncProvider` has
               already opened the conflict modal — "Your copy is behind …
               nothing is lost without your choice" — and this catch used to
               paint a red "Save failed — retry" chip and a toast saying
               "Changes are unsaved" straight over it. Walked live in two tabs:
               modal and contradiction on screen together. The manual-save path
               (`useSaveCallback`) already distinguishes these two; autosave
               now does the same. */
            if (err instanceof SaveConflictError) {
              setSaveState((prev) => ({ ...prev, status: "conflict", error: undefined }));
              setIsDirty(true);
              return;
            }
            const message = err instanceof Error ? err.message : "Auto-save failed";
            /* Offline is not a server error. `useSaveCallback` already draws
               this line for a manual save; autosave shouted "Save failed —
               Could not save to dashboard" at someone whose wifi dropped.
               Read live with the browser offline: that toast sat under a chip
               already saying Offline. Same words as the manual path, so the
               two agree about what happened and what to do. */
            const offline =
              (typeof navigator !== "undefined" && !navigator.onLine) ||
              /network|fetch|offline|failed to fetch|connection/i.test(message);
            if (offline) {
              /* `status: "error"` matches `useSaveCallback`; the topbar's own
                 offline flag outranks it and draws the Offline pill. There is
                 no "offline" status in this state machine. */
              setSaveState((prev) => ({ ...prev, status: "error", error: message }));
              setIsDirty(true);
              if (siteId) {
                addToast({
                  title: "Offline — not saved",
                  description:
                    "Your changes are still open in this tab. Keep it open and save again once you're back online.",
                  tone: "warning",
                });
              }
              return;
            }
            console.error("[BuildrikSync] auto-save failed:", message);
            setSaveState((prev) => ({
              ...prev,
              status: "error",
              error: message,
            }));
            /* The autosave path had NO auth branch at all — a mid-session 401
               here read as the generic red "Save failed", with no way to sign
               back in. Same split as the manual path: 401 opens the recovery
               surface (board 813:4870), FORBIDDEN says the role truth. */
            if (isAuthSaveError(message)) {
              if (onAuthExpired) {
                onAuthExpired();
              } else {
                addToast({
                  title: "Session expired",
                  description: "Sign in again to save your changes. Keep this tab open.",
                  tone: "warning",
                });
              }
              return;
            }
            if (isForbiddenSaveError(message)) {
              addToast({
                title: "You don't have access to save this site",
                description: "Your role changed, or the site isn't yours to edit. Ask the owner.",
                tone: "warning",
              });
              return;
            }
            if (siteId) {
              /* A save refused because the project never loaded is not a
                 failed request — it is the guard that stops autosave from
                 overwriting the real site with the fallback. Say so, and
                 offer the only action that helps. */
              const notLoaded = message.includes("PROJECT_NOT_LOADED");
              // Deleted is not "not loaded yet" — no reload will fix it.
              const gone = message.includes("SITE_MISSING");
              addToast({
                title: gone
                  ? "This site isn't there anymore"
                  : notLoaded
                    ? "Not saved — this site never loaded"
                    : "Save failed",
                description: gone
                  ? "It was deleted, or it isn't yours to open — either way nothing can be saved to it."
                  : notLoaded
                    ? "Autosave is held back so it can't overwrite the stored pages. Reload to get the real site."
                    : "Could not save to dashboard. Changes are unsaved.",
                tone: notLoaded ? "warning" : "error",
                ...(notLoaded && !gone
                  ? { action: { label: "Reload", onClick: () => window.location.reload() } }
                  : {}),
              });
            }
          });
      }, THRESHOLDS.AUTOSAVE_DEBOUNCE);
    };
    // Persist on direct edits AND on undo/redo/version-restore. Those last
    // three go through importProject (emits only history:*/version:restored,
    // never project:changed), so without these listeners an undo or a
    // "Restore version" was never auto-saved — the change was lost on reload
    // while the server kept the pre-undo state.
    composer.on("project:changed", handler);
    composer.on("history:undo", handler);
    composer.on("history:redo", handler);
    composer.on("version:restored", handler);
    return () => {
      composer.off("project:changed", handler);
      composer.off("history:undo", handler);
      composer.off("history:redo", handler);
      composer.off("version:restored", handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [composer, setIsDirty, setSaveState, addToast, onAuthExpired]);

  // Track undo/redo state
  React.useEffect(() => {
    if (!composer) return;
    const update = () => {
      setCanUndo(composer.history.canUndo());
      setCanRedo(composer.history.canRedo());
    };
    update();
    /* PROJECT_LOADED belongs here even though it is not a `history:*` event.
       `importProject` — project load, undo/redo internals, version restore —
       rebuilds the tree and emits ONLY `project:loaded`, so without this line
       the React copy of canUndo keeps whatever the last history event left it
       as and is never corrected.

       Walked live 2026-08-24 on a freshly loaded site: the command palette,
       which calls `composer.history.canUndo()` at render, said "nothing to
       undo" while the canvas footer's Undo button — reading this React state —
       was ENABLED, and clicking it did nothing. Two surfaces, one question,
       opposite answers. Same shape as the dirty-dot bug fixed in 768e9661. */
    const HISTORY_STATE_EVENTS = [
      "history:undo",
      "history:redo",
      "history:recorded",
      "history:cleared",
      EVENTS.PROJECT_LOADED,
      EVENTS.VERSION_RESTORED,
    ] as const;
    HISTORY_STATE_EVENTS.forEach((e) => composer.on(e, update));
    return () => {
      HISTORY_STATE_EVENTS.forEach((e) => composer.off(e, update));
    };
  }, [composer, setCanUndo, setCanRedo]);

  /* Offer the Products collection the first time a product block is inserted.
     This listened for ELEMENT_CREATED on an element whose type was one of the
     three product types, and neither half was ever true: all three blocks are
     HTML-content blocks, so they come in through `insertHTMLToElement`, which
     emits nothing and derives each element's type from its TAG — measured
     live, a Product Card insert produced a `container`, not a `product-card`.
     The modal, `ProductCollectionService` and the sample-data flow behind it
     were therefore unreachable from the only door that inserts these blocks.
     ELEMENT_INSERTED carries the block id, which is the identity this wants. */
  const hasPromptedForCollectionRef = React.useRef(false);
  React.useEffect(() => {
    if (!composer || !openCollectionSetup) return;

    const ECOMMERCE_BLOCK_IDS = ["product-card", "product-grid", "product-detail"];

    const handleElementCreated = async ({ blockId }: { blockId?: string }) => {
      if (!blockId || !ECOMMERCE_BLOCK_IDS.includes(blockId)) return;

      /* Claim the one prompt BEFORE the await. Claiming it after the
         collection lookup let two inserts in flight at once both pass the
         guard and open the dialog twice — and "already has a collection" is
         also a reason never to ask again, so the flag is right either way. */
      if (hasPromptedForCollectionRef.current) return;
      hasPromptedForCollectionRef.current = true;

      const service = new ProductCollectionService(composer.cms.collections);
      if (await service.hasProductsCollection()) return;

      // Open the collection setup modal
      openCollectionSetup(async (includeSampleData: boolean) => {
        const svc = new ProductCollectionService(composer.cms.collections);
        await svc.createProductsCollection(includeSampleData);
        addToast({
          title: "Collection Created",
          description: includeSampleData
            ? "Products collection created with sample data"
            : "Products collection created",
          tone: "success",
        });
      });
    };

    composer.on(EVENTS.ELEMENT_INSERTED, handleElementCreated);
    return () => {
      composer.off(EVENTS.ELEMENT_INSERTED, handleElementCreated);
    };
  }, [composer, openCollectionSetup, addToast]);

  return composer;
}

export default useComposerInit;
