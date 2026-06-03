/**
 * useComposerInit - Hook for Composer initialization and lifecycle
 * Extracts composer setup, event binding, and auto-save logic
 *
 * @module Editor/hooks/useComposerInit
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createComposer, Composer } from "../../../engine";
import { ProductCollectionService } from "../../../engine/cms";
import type { Element } from "../../../engine/elements/Element";
import { THRESHOLDS } from "../../../shared/constants/config";
import type { ComposerConfig, ProjectData, DeviceType, ElementType } from "../../../shared/types";
import type { DesignToken } from "@/editor/design-system";
import {
  getSiteIdFromUrl,
  loadProject,
  loadServerMedia,
  saveProject,
} from "@/services/BuildrikSyncProvider";
import { createRemoteAssetSync } from "@/services/AssetUploadService";
import type { ToastInput } from "@/editor/shared/vibcoder";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { ComponentSchemaAIClient } from "@/engine/designSystem/services";
import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";

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
  setShowTemplates: React.Dispatch<React.SetStateAction<boolean>>;
  setShowExporter: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAI: React.Dispatch<React.SetStateAction<boolean>>;
  setShowComponentView: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: (dirty: boolean) => void;
  setSaveState: React.Dispatch<
    React.SetStateAction<{
      status: "idle" | "saving" | "error";
      error?: string;
      lastSavedAt?: number;
    }>
  >;
  openCollectionSetup?: (onConfirm: (includeSampleData: boolean) => Promise<void>) => void;
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
    setShowTemplates,
    setShowExporter,
    setShowAI,
    setShowComponentView,
    setIsDirty,
    setSaveState,
    openCollectionSetup,
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
  React.useEffect(() => {
    optionsRef.current = options;
    onReadyRef.current = onReady;
    onEditorRef.current = onEditor;
    onUpdateRef.current = onUpdate;
    addToastRef.current = addToast;
    openCollectionSetupRef.current = openCollectionSetup;
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
            if (isAuth) {
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
          });
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
          if (!existingPages || existingPages.length === 0) inst.elements.createPage("Page 1");
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

    const toggleTemplatesHandler = () => setShowTemplates((v) => !v);
    const toggleExporterHandler = () => setShowExporter((v) => !v);
    const toggleAIHandler = () => setShowAI((v) => !v);
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
    instance.on("device:changed", deviceChangedHandler);
    instance.on("zoom:changed", zoomChangedHandler);

    setComposer(instance);
    onEditorRef.current?.(instance);

    // Cleanup: Remove all event listeners before destroying
    return () => {
      instance.off("composer:ready", composerReadyHandler);
      instance.off("project:changed", projectChangedHandler);
      instance.off("history:recorded", historyRecordedHandler);
      instance.off("ui:toggle:templates", toggleTemplatesHandler);
      instance.off("ui:toggle:exporter", toggleExporterHandler);
      instance.off("ui:toggle:ai", toggleAIHandler);
      instance.off("ui:toggle:component-view", toggleComponentViewHandler);
      instance.off("device:changed", deviceChangedHandler);
      instance.off("zoom:changed", zoomChangedHandler);
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - initialize only once on mount

  // Auto-save on project changes (dashboard sync when siteId present, localStorage otherwise)
  React.useEffect(() => {
    if (!composer) return;
    const siteId = getSiteIdFromUrl();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      setIsDirty(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSaveState((prev) => ({ ...prev, status: "saving", error: undefined }));

        const savePromise = siteId
          ? saveProject(siteId, composer.exportProject()).then(() => undefined)
          : composer.saveProject();

        savePromise
          .then(() => {
            setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
            setIsDirty(false);
          })
          .catch((err) => {
            const message = err instanceof Error ? err.message : "Auto-save failed";
            console.error("[BuildrikSync] auto-save failed:", message);
            setSaveState((prev) => ({
              ...prev,
              status: "error",
              error: message,
            }));
            if (siteId) {
              addToast({
                title: "Save failed",
                description: "Could not save to dashboard. Changes are unsaved.",
                tone: "error",
              });
            }
          });
      }, THRESHOLDS.AUTOSAVE_DEBOUNCE);
    };
    composer.on("project:changed", handler);
    return () => {
      composer.off("project:changed", handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [composer, setIsDirty, setSaveState, addToast]);

  // Track undo/redo state
  React.useEffect(() => {
    if (!composer) return;
    const update = () => {
      setCanUndo(composer.history.canUndo());
      setCanRedo(composer.history.canRedo());
    };
    update();
    composer.on("history:undo", update);
    composer.on("history:redo", update);
    composer.on("history:recorded", update);
    composer.on("history:cleared", update);
    return () => {
      composer.off("history:undo", update);
      composer.off("history:redo", update);
      composer.off("history:recorded", update);
      composer.off("history:cleared", update);
    };
  }, [composer, setCanUndo, setCanRedo]);

  // E-commerce block detection - trigger collection setup modal when needed
  const hasPromptedForCollectionRef = React.useRef(false);
  React.useEffect(() => {
    if (!composer || !openCollectionSetup) return;

    const ECOMMERCE_BLOCK_TYPES: ElementType[] = ["product-card", "product-grid", "product-detail"];

    const handleElementCreated = async (element: Element | { element: Element }) => {
      // Handle both single element and object with element property
      const el = "element" in element ? element.element : element;
      const elementType = el.getType?.() as ElementType | undefined;

      if (!elementType || !ECOMMERCE_BLOCK_TYPES.includes(elementType)) return;

      // Only prompt once per session
      if (hasPromptedForCollectionRef.current) return;

      // Check if Products collection already exists
      const service = new ProductCollectionService(composer.cms.collections);
      const hasCollection = await service.hasProductsCollection();
      if (hasCollection) return;

      hasPromptedForCollectionRef.current = true;

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

    composer.on("element:created", handleElementCreated);
    return () => {
      composer.off("element:created", handleElementCreated);
    };
  }, [composer, openCollectionSetup, addToast]);

  return composer;
}

export default useComposerInit;
