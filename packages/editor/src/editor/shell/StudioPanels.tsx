/**
 * StudioPanels - Main panel layout component
 * Manages left sidebar, canvas area, right inspector, and fullpage views.
 *
 * Panel mode: Rail + Drawer (variable width) + Canvas + Inspector
 * Fullpage mode: Rail + FullPage (Templates, Assets, Settings, Design — the
 * FullPageRouter cases; History is a right-column mode, not fullpage)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "./hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import type { Composer } from "../../engine";
import type { UsePublishJobResult } from "./hooks/usePublishJob";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId } from "../rail/tabsConfig";
import { getTabMode } from "../rail/tabsConfig";
import type { BlockData, DeviceType } from "../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { useToast } from "@/editor/chrome-ui";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import type { CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { ProInspector } from "../inspector/ProInspector";
import { AITab } from "../sidebar/tabs/ai/AITab";
import { LayoutShell } from "../rail/LayoutShell";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { TabRouter } from "../sidebar/TabRouter";
import { requestAssetPick, useRailTab } from "../sidebar/tabs/media/data/assetPick";
import { FullPageView } from "../sidebar/FullPageView";
import type { SettingsOpenRequest } from "../sidebar/tabs/settings/types";
import type { TemplatesOpenRequest } from "@/editor/sidebar/tabs/templates/TemplatesTab";
import type { PageSettingsOpenRequest } from "../sidebar/tabs/pages/types";
import { usePageCommands, usePageJumpList } from "../sidebar/tabs/pages/usePageCommands";
import { cmsWorkspace, type CmsOpenRequest } from "@/editor/cms/cmsWorkspaceStore";
import { TokenRegistryProvider, DSModeProvider, StylePresetRegistryProvider } from "@/editor/design-system";
import { MigrationProgressMount } from "@/editor/design-system/ui/MigrationProgressMount";
import { DSLintRunner } from "@/editor/design-system/ui/DSLintRunner";
import { ProjectTokensApplier } from "@/editor/design-system/ui/ProjectTokensApplier";
import { useBlockInsertion } from "./hooks/useBlockInsertion";
import { useClipboardToasts } from "./hooks/useClipboardToasts";
import { useAltTextAutoTrigger } from "./hooks/useAltTextAutoTrigger";
import { PageTabBar } from "./PageTabBar";
import { RightColumnPanel } from "./RightColumnPanel";
import { useColumnPanelEscape } from "./hooks/useColumnPanelEscape";
import type { NextMove } from "./lifecycle";
import { SiteFontsModal } from "../media/components/SiteFontsModal";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { getEditorViewMode } from "@shared/utils/editorViewMode";
import { useEditorRole } from "./hooks/useEditorRole";
import { ViewerRoleNotice } from "./ViewerRoleNotice";

const CmsWorkspace = React.lazy(() => import("@/editor/cms/CmsWorkspace"));

/** Panels that take the inspector's column instead of the left drawer. */
/** What a VIEWER's rail opens: inspection surfaces only. */
const VIEWER_TABS: ReadonlySet<GroupedTabId> = new Set<GroupedTabId>(["layers", "assets"]);
const RIGHT_COLUMN_TABS: ReadonlySet<GroupedTabId> = new Set<GroupedTabId>(["publish", "review", "history", "activity"]);
// ============================================================================
// TYPES
// ============================================================================

export interface StudioPanelsProps {
  composer: Composer | null;
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;
  device: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  /** Whether undo/redo steps are available — drives the canvas footer toolbar. */
  canUndo?: boolean;
  canRedo?: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isLeftPanelOpen: boolean;
  onLeftPanelToggle?: () => void;
  leftPanelTab?: string;
  leftPanelSubTab?: string;
  onLeftPanelTabChange?: (tab: string) => void;
  onLeftPanelSubTabChange?: (tab: string) => void;
  blocks: BlockData[];
  onQuickAdd: (block: BlockData) => void;
  showSpacingIndicators?: boolean;
  showBadges?: boolean;
  showGuides?: boolean;
  showGrid?: boolean;
  showRulers?: boolean;
  showXRay?: boolean;
  onOverlayChange?: (overlay: keyof CanvasOverlayState, enabled: boolean) => void;
  onAIRequest?: (payload: { elementId: string; elementType?: string }) => void;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void,
    forLabel?: string,
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  onOpenCreateCollection?: () => void;
  /** P0 review loop: full re-send for the Review panel. */
  onResendReview?: (clientEmail?: string) => Promise<{ inviteEmailSent: boolean | null } | void>;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
  ) => void;
  canvasRef?: React.RefObject<CanvasRef | null>;
  composerContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Whether the active tab is in fullpage mode (derived from useStudioState) */
  isFullPageMode?: boolean;
  /** Drawer width in pixels for the active tab (derived from useStudioState) */
  drawerWidth?: number;
  /** Canonical publish state machine (shared with the Topbar), forwarded to
   *  the sidebar PublishTab so both drive ONE flow. */
  publishJob?: UsePublishJobResult;
  /** The site's ONE next move (`useLifecycle`, derived once in
   *  AquibraStudio) — the same object the topbar CTA reads. The Publish
   *  panel's footer, its gate banner and its CTA read `nextMove.gate`. */
  nextMove?: NextMove | null;
  /** The ONE publish door — AquibraStudio's `requestPublish`, which routes on
   *  `nextMove.gate`. Absent = no publish path is wired (flag off). */
  onRequestPublish?: () => void;
  /** FB-8: Issues is a right-column mode, same mechanism as the AI drill-in
   *  (`aiInInspector` below) — it swaps in for ProInspector rather than
   *  floating an absolute overlay on top of it. AquibraStudio owns the open
   *  state and builds the panel (it needs `composer.designSystem` +
   *  `requestBrandToken`, already in scope there); this just says where it
   *  renders. */
  issuesOpen?: boolean;
  issuesPanel?: React.ReactNode;
  onCloseIssues?: () => void;
  /** FB-4: server flag for the agency review layer — see `TabRouter.reviewsEnabled`. */
  reviewsEnabled?: boolean | null;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    flex: 1,
    overflow: "hidden",
    background: "var(--bk-bg-panel)",
  } as React.CSSProperties,

  /* The dots were `rgba(255,255,255,0.03)`, painted over `--bk-bg-panel`, which
     the token file sets to ``var(--bk-bg-panel)``. White at 3% on white is not faint, it is
     absent — the backdrop grid has drawn nothing at all since the theme flipped
     from dark to light. `--bk-border` is the faint-line token and reads as a
     light grey dot on the panel. */
  canvasPattern: {
    position: "absolute" as const,
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 1px 1px, var(--bk-border) 1px, transparent 0)
    `,
    backgroundSize: "24px 24px",
    pointerEvents: "none" as const,
    zIndex: 0,
  } as React.CSSProperties,

  canvasContent: {
    height: "100%",
    width: "100%",
    display: "flex",
    flex: 1,
    position: "relative" as const,
    zIndex: 1,
  } as React.CSSProperties,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const StudioPanels: React.FC<StudioPanelsProps> = ({
  composer,
  selectedElement,
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  zoom,
  onZoomChange,
  isLeftPanelOpen,
  onLeftPanelToggle,
  leftPanelTab,
  leftPanelSubTab,
  onLeftPanelTabChange,
  onLeftPanelSubTabChange: _onLeftPanelSubTabChange,
  blocks: _blocks,
  onQuickAdd: _onQuickAdd,
  showSpacingIndicators = false,
  showBadges = false,
  showGuides = true,
  showGrid = false,
  showRulers = false,
  showXRay = false,
  onOverlayChange,
  onAIRequest,
  onOpenMediaLibrary,
  onOpenIconPicker,
  onOpenCreateCollection,
  onResendReview,
  onOpenImageEditor,
  canvasRef,
  composerContainerRef,
  isFullPageMode = false,
  drawerWidth,
  publishJob,
  nextMove = null,
  onRequestPublish,
  issuesOpen = false,
  issuesPanel,
  onCloseIssues,
  reviewsEnabled,
}) => {
  /* The site whose brand/tokens/publish state these panels edit.
     This was a prop, and `AquibraStudio` never passed it — so every consumer
     below ran on `undefined`, and `TokenRegistryProvider` fell through to its
     `"default"` storage key. One key for every site on the origin: apply a
     brand colour on one site and the next site you open loads it, on a
     surface whose whole job is per-site identity. The id is not something
     the shell has to hand down — it is in the URL, which is where the sync
     provider and PublishTab already read it from. */
  const projectId = React.useMemo(() => getSiteIdFromUrl(), []);

  const { addToast } = useToast();

  // Copy / cut / paste / duplicate feedback. The canvas keyboard hook used to
  // carry these next to its own second implementation of those shortcuts; the
  // implementations are gone and the feedback follows the commands' events.
  useClipboardToasts(composer, addToast);
  const { handleBlockClick } = useBlockInsertion(composer);
  useAltTextAutoTrigger(composer);

  /* v3 FC-2: page-jump ⌘K rows registered from the shell — always present,
     like Layers/Assets/Records/Templates — instead of only while the Pages
     drawer happens to be mounted (PagesTab no longer calls this). */
  const pageJumpList = usePageJumpList(composer);
  usePageCommands(
    composer,
    pageJumpList,
    React.useCallback((id: string) => composer?.elements.setActivePage(id), [composer]),
    React.useCallback(() => composer?.emit(EVENTS.UI_NEW_PAGE_REQUESTED, {}), [composer]),
  );

  const [canvasHoveredId, setCanvasHoveredId] = React.useState<string | null>(null);
  /** AI drills in over the inspector (boards 170:* · 66:225). */
  /* URL-derived, so it is stable for the life of the document — view mode
     is entered by navigation (StudioHeader.toggleReadOnlyView), never by state. */
  const readOnlyView = React.useMemo(() => getEditorViewMode().readOnlyView, []);
  const editorRole = useEditorRole();
  /* A workspace VIEWER is always in view mode (dashboard redirect), and board
     4418:126059 still draws the editor chrome for them: the rail, Layers, and
     the role notice in the inspector column. View mode for anyone else stays
     the bare canvas (founder call, 2026-08-23). */
  const viewerChrome = readOnlyView && editorRole === "VIEWER";
  /* A root class, not a prop, because the surfaces that still leak editing
     chrome into view mode are reached by CSS alone: the empty-container
     placeholder is a ::after in Canvas.css, and the footer's selection label is
     rendered by AquibraStudio, which an agent session must not stage. */
  /* The engine gate. Withholding React handlers left the document mutable —
     KeybindingManager listens on window in the capture phase, so click-then-
     Delete still worked. One flag on the gateway closes every chord at once. */
  React.useEffect(() => {
    if (composer) composer.readOnly = readOnlyView;
  }, [composer, readOnlyView]);

  /* useLayoutEffect, not useEffect: this class now drives LAYOUT as well as the
     canvas placeholder rules — it collapses the rail column via
     --layout-rail-width (LayoutShell.css). Under useEffect the browser can
     paint one frame with the 60px rail track still reserved, i.e. an empty
     strip beside the canvas, before the class lands. */
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    if (!readOnlyView) return;
    root.classList.add("bk-read-only-view");
    /* Keeps the rail track for a VIEWER (LayoutShell.css). */
    if (viewerChrome) root.classList.add("bk-viewer-chrome");
    return () => root.classList.remove("bk-read-only-view", "bk-viewer-chrome");
  }, [readOnlyView, viewerChrome]);

  const [aiInInspector, setAiInInspector] = React.useState(false);
  /* Inspector visibility, user-operated and remembered. Defaults to SHOWN so
     the drawn no-selection board is still the default state — collapsing it
     automatically was tried before and rendered that board off-viewport.
     This is the opt-out. */
  const [inspectorShown, setInspectorShown] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try { return localStorage.getItem("buildrick-inspector-shown") !== "false"; }
    catch { return true; }
  });
  const toggleInspector = React.useCallback(() => {
    setInspectorShown((v) => {
      const next = !v;
      try { localStorage.setItem("buildrick-inspector-shown", String(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);
  /* The toggle's doors are the inspector's own ✕ and the ⌘K row
     (`toggle-inspector`, commands registry) — both emit this event (G2-037:
     the footer word bar's Inspector toggle had no home on the board). */
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.UI_TOGGLE_INSPECTOR, toggleInspector);
    return () => {
      composer.off(EVENTS.UI_TOGGLE_INSPECTOR, toggleInspector);
    };
  }, [composer, toggleInspector]);

  // Media tab dual-mode: panel (slim launcher) or fullpage (library manager)
  const [mediaFullPage, setMediaFullPage] = React.useState(false);

  /* Settings' unsaved-edit flag lives here because two children need it:
     FullPageView mounts the SettingsTab that raises it, and LeftSidebar's
     rail draws the dirty dot and guards the tab switch against it. */
  const [settingsDirty, setSettingsDirty] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState<SettingsOpenRequest | null>(null);
  const [pagesOpen, setPagesOpen] = React.useState<PageSettingsOpenRequest | null>(null);
  /* `ui:browse-templates` — the New-page modal's name + "Add to site
     navigation" (#19, 6752:59256), a ⌘K template row's preview, or the
     Pages row's replace mode (4428:149355). A plain visit carries none. */
  const [templatesOpen, setTemplatesOpen] = React.useState<TemplatesOpenRequest | null>(null);

  // Derive fullpage mode from tab if not explicitly passed
  const activeTabId = (leftPanelTab as GroupedTabId) || "add";
  /* A CMS field's image pick opens in the Assets drawer but keeps the CMS
     workspace (and the record being edited) open beside it. */
  const railTab = useRailTab(activeTabId);
  const pickForCms = React.useCallback(
    (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void, label?: string) => {
      if (composer) requestAssetPick(composer, { allowedTypes, onSelect, label, host: "content" });
    },
    [composer],
  );
  /* Boards 4418:97118 / 4418:115784 / 4418:73791: Publish, Review and
     History are not drawer panels — each REPLACES the inspector in the right
     column (300), with the left drawer closed. Every door still opens them
     the way it did (openLeftPanelToTab / ui:switch-tab); only where they
     render moved. ✕ closes the panel and the inspector returns. */
  /* FB-4: don't hand Review the right column when the server's agency
     review layer is off — a gated door that still swaps the inspector out
     for an empty panel is worse than the door not opening. */
  const rightColumnTab =
    !readOnlyView &&
    isLeftPanelOpen &&
    RIGHT_COLUMN_TABS.has(activeTabId) &&
    (activeTabId !== "review" || Boolean(reviewsEnabled));
  useColumnPanelEscape(rightColumnTab, () => onLeftPanelToggle?.());
  /* FB-8: Issues is a right-column mode too — Escape returns to the
     Inspector the same way it does for Publish/Review/History. */
  useColumnPanelEscape(!readOnlyView && issuesOpen, () => onCloseIssues?.());
  /* FA-1: AI is the other right-column mode (over the inspector, not the
     drawer) — Escape returns to the Inspector the same way it returns from
     Publish/Review/History. The hook's own isTyping guard is what makes the
     first Escape (still focused in the AI composer field) a no-op here; the
     Composer blurs on that Escape, so the next one lands with isTyping
     false and closes. */
  useColumnPanelEscape(aiInInspector, () => setAiInInspector(false));
  /* …and Issues replaces AI the same way. */
  React.useEffect(() => {
    if (issuesOpen) setAiInInspector(false);
  }, [issuesOpen]);

  /* A click on the empty canvas closes the Layers drawer (prototype B10 /
     C4#18) — the canvas clears the selection itself. */
  React.useEffect(() => {
    if (!composer || !isLeftPanelOpen || activeTabId !== "layers") return;
    const close = () => onLeftPanelToggle?.();
    composer.on(EVENTS.UI_CANVAS_BACKGROUND_CLICK, close);
    return () => {
      composer.off(EVENTS.UI_CANVAS_BACKGROUND_CLICK, close);
    };
  }, [composer, isLeftPanelOpen, activeTabId, onLeftPanelToggle]);

  /* The site menu's Unpublish emits UI_UNPUBLISH_REQUEST in the same gesture
     that opens the Publish panel, before PublishTab has subscribed. This
     component is always mounted, so it latches the intent and hands it down;
     PublishTab consumes it once. Cleared on leaving the tab. (Moved here
     from LeftSidebar with the panel.) */
  const [unpublishIntent, setUnpublishIntent] = React.useState(false);
  React.useEffect(() => {
    if (!composer) return;
    const latch = () => setUnpublishIntent(true);
    composer.on(EVENTS.UI_UNPUBLISH_REQUEST, latch);
    return () => {
      composer.off(EVENTS.UI_UNPUBLISH_REQUEST, latch);
    };
  }, [composer]);
  React.useEffect(() => {
    if (activeTabId !== "publish") setUnpublishIntent(false);
  }, [activeTabId]);
  const effectiveFullPageMode =
    isFullPageMode ||
    getTabMode(activeTabId) === "fullpage" ||
    (activeTabId === "assets" && mediaFullPage);

  /* v3 IA (4428:140486): rail CMS keeps its drawer and REPLACES the canvas +
     inspector with the CMS workspace. The canvas stays mounted underneath
     (its iframe and engine state survive the round trip); the inspector
     column closes so the workspace spans both. */
  const cmsWorkspaceOpen = !readOnlyView && isLeftPanelOpen && railTab === "content";
  const inspectorOpen =
    viewerChrome || (!readOnlyView && !effectiveFullPageMode && inspectorShown && !cmsWorkspaceOpen);

  // Reset media fullpage override when switching away from assets tab
  React.useEffect(() => {
    if (activeTabId !== "assets" && mediaFullPage) {
      setMediaFullPage(false);
    }
  }, [activeTabId, mediaFullPage]);

  // Listen for panel open events from composer
  React.useEffect(() => {
    if (!composer) return;

    const openTemplates = (data?: TemplatesOpenRequest) => {
      /* A fresh object per request → the view re-reads it each time. */
      setTemplatesOpen({ ...data });
      onLeftPanelTabChange?.("templates");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    const openDesign = () => {
      onLeftPanelTabChange?.("design");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };

    /* Clone 3519:19920 — the Pages panel's `Add redirect` opens Settings ON
       Redirects with the draft. Held here, not in the tab: Settings mounts
       on the switch, after the emit, so a listener inside it would miss the
       request. A fresh object per request → the tab re-navigates each time. */
    const openSettings = (data: SettingsOpenRequest) => {
      setSettingsOpen({ screen: data.screen, repair: data.repair ?? null });
      onLeftPanelTabChange?.("settings");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    /* The way back (3519:20096 `Back to <Page> SEO`): the same shape — the
       Pages panel is lazy and unmounted under the Settings fullpage, so the
       request waits here for it. */
    const openPageSettings = (data: PageSettingsOpenRequest) => {
      setPagesOpen({ pageId: data.pageId, tab: data.tab });
      onLeftPanelTabChange?.("pages");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };

    /* ⌘K → a collection or record. The workspace reads its store, which
       outlives it, so the request is written there and the tab switched. */
    const openCms = (data: CmsOpenRequest) => {
      cmsWorkspace.openRequest(data);
      onLeftPanelTabChange?.("content");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };

    composer.on(EVENTS.UI_BROWSE_TEMPLATES, openTemplates);
    composer.on(EVENTS.UI_CMS_OPEN, openCms);
    composer.on(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
    composer.on(EVENTS.UI_SETTINGS_OPEN, openSettings);
    composer.on(EVENTS.UI_PAGES_OPEN_SETTINGS, openPageSettings);
    return () => {
      composer.off(EVENTS.UI_BROWSE_TEMPLATES, openTemplates);
      composer.off(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
      composer.off(EVENTS.UI_SETTINGS_OPEN, openSettings);
      composer.off(EVENTS.UI_PAGES_OPEN_SETTINGS, openPageSettings);
      composer.off(EVENTS.UI_CMS_OPEN, openCms);
    };
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  /* A request is one visit's: leaving the tab drops it, so the next plain
     visit does not land on that screen again. */
  React.useEffect(() => {
    if (activeTabId !== "settings") setSettingsOpen(null);
    if (activeTabId !== "pages") setPagesOpen(null);
    if (activeTabId !== "templates") setTemplatesOpen(null);
  }, [activeTabId]);

  // Listen for tab switch events
  React.useEffect(() => {
    if (!composer) return;
    const handler = (data: { tab: string; fullPage?: boolean }) => {
      /* Boards 170:2 and 66:225 put AI in the INSPECTOR column with a
         "‹ Inspector" way back — not in the left sidebar. Every existing
         entry point (the inspector's ✦ AI chip, the multi-select toolbar, the
         no-selection state, the shell's own onShowAI) emits this same event,
         so routing it here moves them all at once. */
      if (data.tab === "ai") {
        /* One right-column mode at a time: AI replaces Issues rather than
           opening hidden under it (Issues wins the render, so both open meant
           an invisible AI that one Escape also closed). */
        onCloseIssues?.();
        setAiInInspector(true);
        return;
      }
      onLeftPanelTabChange?.(data.tab);
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
      /* Clone 3724:43815 — the inspector's "Manage video" opens the Asset
         LIBRARY (the fullpage), not the drawer; the file to select rides on
         the engine's media selection the way the drawer's own door hands it. */
      if (data.tab === "assets" && data.fullPage) setMediaFullPage(true);
    };
    composer.on("ui:switch-tab", handler);
    return () => {
      composer.off("ui:switch-tab", handler);
    };
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  // Canvas hover sync
  React.useEffect(() => {
    if (!composer) return;
    const handleCanvasHover = (data: { id: string | null }) => {
      setCanvasHoveredId(data.id);
    };
    composer.on("canvas:hover", handleCanvasHover);
    return () => {
      composer.off("canvas:hover", handleCanvasHover);
    };
  }, [composer]);

  const handleElementSelect = React.useCallback(
    (elementId: string) => {
      if (composer) {
        const el = composer.elements.getElement(elementId);
        if (el) composer.selection.select(el);
      }
    },
    [composer]
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      if (!composer) return;
      const element = composer.elements.getElement(id);
      const elementType = element?.getType?.() || "element";
      const elementLabel = elementType.charAt(0).toUpperCase() + elementType.slice(1);
      composer.elements.removeElement(id);
      addToast({
        description: `${elementLabel} deleted`,
        tone: "info",
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            composer.history?.undo?.();
          },
        },
      });
    },
    [composer, addToast]
  );

  const handleRailTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      /* A viewer inspects: Layers, and Assets (view-only since B5). The other
         rail doors lead to writing surfaces, so they say why instead. */
      if (viewerChrome && !VIEWER_TABS.has(tab)) {
        addToast({ description: "View only — adding, pages, CMS and brand edits need an Editor role." });
        return;
      }
      // Tab-only switcher. Drawer-toggle lives in LeftSidebar.handleBtnClick;
      // duplicating it here caused both setters to fire setIsLeftPanelOpen(v=>!v)
      // in the same batch, netting zero on different-tab clicks (2-click bug).
      onLeftPanelTabChange?.(tab);
    },
    [onLeftPanelTabChange, viewerChrome, addToast]
  );

  /* Board 4418:126059 opens a viewer on Layers. */
  React.useEffect(() => {
    if (!viewerChrome || VIEWER_TABS.has(activeTabId)) return;
    onLeftPanelTabChange?.("layers");
  }, [viewerChrome, activeTabId, onLeftPanelTabChange]);

  const handleFullPageClose = React.useCallback(() => {
    if (activeTabId === "assets" && mediaFullPage) {
      // Media dual-mode: return to panel (slim launcher), don't switch tabs
      setMediaFullPage(false);
    } else {
      // Return to last panel tab (default: Add)
      onLeftPanelTabChange?.("add");
    }
  }, [activeTabId, mediaFullPage, onLeftPanelTabChange]);

  const handleOpenLibrary = React.useCallback(() => {
    setMediaFullPage(true);
  }, []);

  const handleEditMedia = React.useCallback(
    (item: { key: string; src: string; name: string }) => {
      if (!onOpenImageEditor || !composer) return;
      onOpenImageEditor(item.src, async (editedSrc) => {
        try {
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          const file = new File([blob], `edited-${item.name}.webp`, { type: "image/webp" });
          const result = await composer.media.uploadFile(file);
          if (result.success && result.asset) {
            composer.elements.getElement(item.key)?.setAttribute("src", result.asset.src);
          }
        } catch (err) {
          console.error("Failed to save edited canvas media:", err);
        }
      });
    },
    [onOpenImageEditor, composer]
  );

  return (
    <DSModeProvider>
    <TokenRegistryProvider projectId={projectId} composer={composer ?? undefined}>
    <StylePresetRegistryProvider projectId={projectId}>
      {/* Headless. The linter only ran from inside the Brand panel, so the
          topbar Issues chip — which gates the publish-anyway confirm — read
          "No issues" until the user happened to open Brand. */}
      <DSLintRunner composer={composer} />
      <MigrationProgressMount composer={composer} />
      {/* Headless, for the same reason the linter above is: a site's own
          tokens reached the page only when the Brand panel mounted, so a
          machine without the localStorage cache drew the DEFAULT brand. */}
      <ProjectTokensApplier composer={composer} />
      <LayoutShell
        /* View mode is a VIEW, the way Figma's is: the person holding the link
           is looking, not building, so the rail, the drawer and the inspector are
           not rendered at all and the canvas takes the whole width. It used to
           trim four header tools and leave every editing surface in place, so an
           owner opening "what my client sees" was shown the full editor.
           (Founder call, 2026-08-23.) */
        drawerOpen={(!readOnlyView || viewerChrome) && isLeftPanelOpen && !effectiveFullPageMode && !rightColumnTab}
        drawerWidth={drawerWidth}
        fullPageMode={!readOnlyView && effectiveFullPageMode && isLeftPanelOpen}
        // Open whenever not fullpage — the no-selection state is a DRAWN
        // board (2 lines + ✦ Ask AI); gating on selectedElement collapsed the
        // column to 1px, so that state rendered off-viewport, unseeable.
        inspectorOpen={inspectorOpen}
        style={styles.container}
      >
        {/* Left Sidebar — merged rail + panel. Absent in view mode, except for
            a VIEWER (board 4418:126059). */}
        {readOnlyView && !viewerChrome ? null : (
        <LayoutShell.Sidebar>
          <LeftSidebar
            composer={composer}
            activeTab={activeTabId}
            activeSubTab={leftPanelSubTab}
            onTabChange={handleRailTabChange}
            drawerOpen={isLeftPanelOpen && !effectiveFullPageMode && !rightColumnTab}
            /* QA 2026-09-24: the closed drawer still mounted a second copy of
               the column's panel (two subscriptions, two fetches). */
            hostedInColumn={RIGHT_COLUMN_TABS.has(activeTabId)}
            onDrawerToggle={onLeftPanelToggle ?? (() => {})}
            onElementSelect={handleElementSelect}
            onBlockClick={handleBlockClick}
            canvasHoveredId={canvasHoveredId}
            settingsDirty={settingsDirty}
            onSettingsDirtyChange={setSettingsDirty}
            pagesOpen={pagesOpen}
            projectId={projectId}
            onOpenLibrary={handleOpenLibrary}
            onCreateCollection={onOpenCreateCollection}
            onOpenImageEditor={onOpenImageEditor}
            onOpenIconPicker={onOpenIconPicker}
            reviewsEnabled={reviewsEnabled}
          />
        </LayoutShell.Sidebar>
        )}

        {/* Canvas Area — main editing surface */}
        <LayoutShell.Canvas>
          {/* Board 4418:123573: the page tabs head the canvas column. */}
          <PageTabBar composer={composer} />
          <div style={styles.canvasPattern} />
          <div ref={composerContainerRef} style={styles.canvasContent}>
            <Canvas
              ref={canvasRef as React.Ref<CanvasRef>}
              /* The overlay toggles (Grid / Rulers / Badges / X-Ray) are build
                 tools, so they go with the rest of the editing chrome. */
              showFooterToolbar={!readOnlyView || viewerChrome}
              readOnly={readOnlyView}
              composer={composer}
              device={device}
              zoom={zoom}
              showSpacing={showSpacingIndicators}
              showBadges={showBadges}
              showGuides={showGuides}
              showGrid={showGrid}
              showRulers={showRulers}
              showXRay={showXRay}
              onAIRequest={onAIRequest}
              onOpenImageEditor={handleEditMedia}
              onZoomChange={onZoomChange}
              onOverlayChange={onOverlayChange}
              onDeviceChange={onDeviceChange}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>
          {/* FC-7 takeover shape 2 of 3 (see FullPageRouter.tsx's "THE THREE
              TAKEOVER SHAPES" contract): an in-place region over the canvas,
              NOT a Portal — the rail and drawer stay mounted and reachable
              beside it. */}
          {cmsWorkspaceOpen ? (
            <div className="tw:absolute tw:inset-0 tw:z-[var(--bk-z-chrome)] tw:bg-[var(--bk-bg-panel)]" data-testid="cms-workspace-host">
              <React.Suspense fallback={null}>
                <CmsWorkspace composer={composer} onCreateCollection={onOpenCreateCollection} onOpenMediaLibrary={pickForCms} />
              </React.Suspense>
            </div>
          ) : null}
        </LayoutShell.Canvas>

        {/* Right Inspector — element properties, or the AI drill-in that
            replaces them (boards 170:*). In view mode it is absent — except
            for a workspace VIEWER, who is always in view mode and gets the
            role notice board 4418:126059 draws in this column. */}
        {readOnlyView ? (
          viewerChrome ? (
            <LayoutShell.Inspector>
              <ViewerRoleNotice role="VIEWER" />
            </LayoutShell.Inspector>
          ) : null
        ) : (
        <LayoutShell.Inspector>
          {issuesOpen && issuesPanel ? (
            issuesPanel
          ) : rightColumnTab ? (
            <RightColumnPanel>
              <TabRouter
                activeTab={activeTabId}
                activeSubTab={leftPanelSubTab}
                composer={composer}
                commonTabProps={{ isExpanded: false, onClose: () => onLeftPanelToggle?.() }}
                onCreateComponent={() => {}}
                unpublishIntent={unpublishIntent}
                onUnpublishIntentConsumed={() => setUnpublishIntent(false)}
                projectId={projectId}
                publishJob={publishJob}
                nextMove={nextMove}
                onRequestPublish={onRequestPublish}
                onResendReview={onResendReview}
                reviewsEnabled={reviewsEnabled}
              />
            </RightColumnPanel>
          ) : aiInInspector ? (
            <AITab
              composer={composer}
              isExpanded={false}
              onExpandToggle={() => {}}
              onClose={() => setAiInInspector(false)}
              onBack={() => setAiInInspector(false)}
            />
          ) : (
          <ProInspector
            composer={composer}
            selectedElement={selectedElement}
            currentBreakpoint={device}
            onDelete={handleDelete}
            onOpenMediaLibrary={onOpenMediaLibrary}
            onOpenIconPicker={onOpenIconPicker}
            onOpenCreateCollection={onOpenCreateCollection}
          />
          )}
        </LayoutShell.Inspector>
        )}

        {/* FullPage View — Templates, Assets, Settings, Design (replaces canvas area).
            Mounted ONLY in fullpage mode. It used to render on every tab and
            rely on the slot's display:none, so the Media DRAWER kept a whole
            second LibraryManager (and its media state) mounted invisibly —
            and once the library became a portaled overlay (Clone
            3695:45155) that invisible copy was on screen at boot. */}
        {effectiveFullPageMode && (
        <LayoutShell.FullPage>
          <FullPageView
            activeTab={activeTabId}
            composer={composer}
            onClose={handleFullPageClose}
            onSwitchToAdd={() => onLeftPanelTabChange?.("add")}
            onSwitchToDesign={() => onLeftPanelTabChange?.("design")}
            /* Templates' "Open page settings" after Create page. */
            onTemplatesSwitchTab={(tab) => onLeftPanelTabChange?.(tab)}
            templatesOpen={templatesOpen}
            /* The deep-link sub-tab reached the DRAWER and stopped there. Every
               fullpage tab — Settings above all — got nothing, so the site
               menu's "Plugins" landed on the Settings root and looked like a
               dead door. */
            activeSubTab={leftPanelSubTab}
            onSettingsDirtyChange={setSettingsDirty}
            settingsOpen={settingsOpen}
            projectId={projectId}
            onOpenImageEditor={onOpenImageEditor}
            onOpenIconPicker={onOpenIconPicker}
          />
        </LayoutShell.FullPage>
        )}
      </LayoutShell>

      {/* Clone 3686:42317 — Site fonts. Mounted once, here, and opened by
          `ui:site-fonts` from every door (the rail's Manage font, the
          drawer's Aa Fonts, the Typography picker's Manage site fonts row),
          so no door owns a dialog and nothing threads through AquibraStudio. */}
      {composer ? <SiteFontsModal composer={composer} /> : null}
    </StylePresetRegistryProvider>
    </TokenRegistryProvider>
    </DSModeProvider>
  );
};

export default StudioPanels;
