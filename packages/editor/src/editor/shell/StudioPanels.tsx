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
import { getTabMode, isColumnTabOpen, isInspectorColumnOpen, isTabAllowedForViewer, RIGHT_COLUMN_TABS, VIEWER_TABS } from "../rail/tabsConfig";
import type { BlockData, DeviceType } from "../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { Button, useToast } from "@/editor/chrome-ui";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import type { CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { ProInspector } from "../inspector/ProInspector";
import type { FocusSectionPayload } from "../inspector/hooks/usePropertyJump";
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
import { useConnectOfferToast } from "./hooks/useConnectOfferToast";
import { useAltTextAutoTrigger } from "./hooks/useAltTextAutoTrigger";
import { PageTabBar } from "./PageTabBar";
import { RightColumnPanel } from "./RightColumnPanel";
import { useColumnPanelEscape } from "./hooks/useColumnPanelEscape";
import type { NextMove } from "./lifecycle";
import { SiteFontsModal } from "../media/components/SiteFontsModal";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { getEditorViewMode } from "@shared/utils/editorViewMode";
import { useViewerChrome } from "./hooks/useEditorRole";
import { ViewerRoleNotice } from "./ViewerRoleNotice";

const CmsWorkspace = React.lazy(() => import("@/editor/cms/CmsWorkspace"));


/* VIEWER_TABS / isTabAllowedForViewer moved to `../rail/tabsConfig` — the
 * tab registry is the ONE place every door that gates a
 * VIEWER's left-panel tabs reads from: this file's rail click and
 * "ui:switch-tab" handler, useStudioState's openLeftPanelToTab/
 * setLeftPanelTab (the sink UI_PANEL_OPEN/deep-links/topbar buttons funnel
 * into), and CommandPalette (which nav commands to show a VIEWER). */
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
  /** The shell's guarded switch (B-1). `onSwitched` runs only once the switch
   *  actually happens — not while its unsaved-changes confirm is pending, and
   *  never if the user keeps editing. */
  onLeftPanelTabChange?: (tab: string, onSwitched?: () => void) => void;
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
   *  renders. It is handed the back row's action (M-1: "‹ Inspector" leads
   *  to the inspector, shown even if it was hidden). */
  issuesOpen?: boolean;
  renderIssuesPanel?: (onBack: () => void) => React.ReactNode;
  onCloseIssues?: () => void;
  /** FB-4: server flag for the agency review layer — see `TabRouter.reviewsEnabled`. */
  reviewsEnabled?: boolean | null;
}

// ============================================================================
// STYLES
// ============================================================================

/** How long a section-focus request waits for the inspector body (m-1). */
const PENDING_FOCUS_MS = 500;

/** Gives a held selection back after an escalation (P-5, §13). An element
 *  deleted meanwhile is not brought back. */
function restoreSelection(composer: Composer, ids: readonly string[]): void {
  const alive = ids
    .map((id) => composer.elements.getElement(id))
    .filter((el): el is NonNullable<typeof el> => !!el);
  if (alive.length === 1) composer.selection.select(alive[0]);
  else if (alive.length > 1) composer.selection.selectMultiple(alive);
}

/** Where "‹ Back to canvas" in the CMS workspace returns to (§13 Open record
 *  / Open collection): the drawer as it was, and the element the door was on. */
interface CmsReturn {
  tab: string;
  drawerOpen: boolean;
  ids: string[];
}

/* Board 36 (7995:210885): a 188 × 28 panel action, 20 in from the canvas's
   top right, label and shortcut centred, 13/500 gray-700. */
const SHOW_INSPECTOR =
  "tw:absolute tw:top-5 tw:right-5 tw:z-[var(--bk-z-chrome)] tw:h-7 tw:w-[188px] tw:gap-1.5 tw:rounded-md " +
  "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 " +
  "tw:font-medium tw:text-[var(--bk-gray-700)] tw:focus:ring-0";

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
    /* Under the 36px page-tab bar, `height: 100%` resolved to the whole
       column and min-height:auto kept it there — the canvas ran 36px past the
       viewport's bottom. Invisible while the footer toolbar floated 56 up;
       docked to the bottom edge (owner decision 2026-10-03) it was cut off. */
    minHeight: 0,
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
  drawerWidth,
  publishJob,
  nextMove = null,
  onRequestPublish,
  issuesOpen = false,
  renderIssuesPanel,
  onCloseIssues,
  reviewsEnabled,
}) => {
  /* The site whose brand/tokens/publish state these panels edit.
     This was a prop, and `AquibraStudio` never passed it — so every consumer
     below ran on `undefined`, and the token registry fell through to its
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
  useConnectOfferToast(composer, addToast);
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
  /* A workspace VIEWER is always in view mode (dashboard redirect), and board
     4418:126059 still draws the editor chrome for them: the rail, Layers, and
     the role notice in the inspector column. View mode for anyone else stays
     the bare canvas (founder call, 2026-08-23). useViewerChrome is the SAME
     computation useStudioState's openLeftPanelToTab/setLeftPanelTab sink and
     CommandPalette use — one source, so this file's rail/drawer layout can't
     disagree with what the sink actually lets through. */
  const viewerChrome = useViewerChrome();
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
  /* Inspector visibility, user-operated. Defaults to SHOWN so the drawn
     no-selection board is still the default state — collapsing it
     automatically was tried before and rendered that board off-viewport.
     Session-only (gap walk 93 #3): persisted, a reload left the inspector
     hidden with no visible way back. Board 36 draws that way back now — the
     canvas's own "Show inspector ⌘\" (below) — so the hide no longer answers
     with a toast; ⌘\ and ⌘K "Toggle inspector" are the other doors. */
  const [inspectorShown, setInspectorShown] = React.useState<boolean>(true);
  const toggleInspector = React.useCallback(() => setInspectorShown((v) => !v), []);
  /* What the inspector column shows this render (assigned below, once known):
     read by the section-focus route. */
  const columnRef = React.useRef({ bodyShown: false, blocked: false, rightColumnTab: false });
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

  const [settingsOpen, setSettingsOpen] = React.useState<SettingsOpenRequest | null>(null);
  const [pagesOpen, setPagesOpen] = React.useState<PageSettingsOpenRequest | null>(null);
  /* `ui:browse-templates` — the New-page modal's name + "Add to site
     navigation" (#19, 6752:59256), a ⌘K template row's preview, or the
     Pages row's replace mode (4428:149355). A plain visit carries none. */
  const [templatesOpen, setTemplatesOpen] = React.useState<TemplatesOpenRequest | null>(null);

  // Derive fullpage mode from tab if not explicitly passed
  const activeTabId = (leftPanelTab as GroupedTabId) || "add";

  /* A-7: the drawer tab to fall back to when a full page (Settings,
     Templates, the Asset library) closes — the tab the user was actually on
     before they navigated away, not always "add". Mirrors useStudioState's
     own prevDrawerTabRef (persistence), kept separately here because the
     hook does not expose it. */
  const prevDrawerTabRef = React.useRef<string>("add");
  React.useEffect(() => {
    if (getTabMode(activeTabId) !== "fullpage") prevDrawerTabRef.current = activeTabId;
  }, [activeTabId]);
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
  const rightColumnTab = isColumnTabOpen({
    readOnlyView,
    viewerChrome,
    isLeftPanelOpen,
    activeTabId,
    reviewsEnabled,
  });
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
    getTabMode(activeTabId) === "fullpage" || (activeTabId === "assets" && mediaFullPage);

  /* v3 IA (4428:140486): rail CMS keeps its drawer and REPLACES the canvas +
     inspector with the CMS workspace. The canvas stays mounted underneath
     (its iframe and engine state survive the round trip); the inspector
     column closes so the workspace spans both. */
  const cmsWorkspaceOpen = !readOnlyView && isLeftPanelOpen && railTab === "content";
  const [cmsReturn, setCmsReturn] = React.useState<CmsReturn | null>(null);
  /* Leaving the workspace any other way (the rail, a closed drawer) ends the
     visit: the return is not offered to a later, unrelated one. */
  const cmsWasOpen = React.useRef(cmsWorkspaceOpen);
  React.useEffect(() => {
    if (cmsWasOpen.current && !cmsWorkspaceOpen) setCmsReturn(null);
    cmsWasOpen.current = cmsWorkspaceOpen;
  }, [cmsWorkspaceOpen]);
  const backToCanvas = React.useCallback(() => {
    const back = cmsReturn;
    if (!back || !composer) return;
    setCmsReturn(null);
    onLeftPanelTabChange?.(back.tab, () => {
      if (!back.drawerOpen) onLeftPanelToggle?.();
      restoreSelection(composer, back.ids);
    });
  }, [cmsReturn, composer, onLeftPanelTabChange, onLeftPanelToggle]);
  const inspectorOpen = isInspectorColumnOpen({
    readOnlyView,
    viewerChrome,
    fullPage: effectiveFullPageMode,
    cmsWorkspaceOpen,
    inspectorShown,
    columnModeOpen: rightColumnTab || issuesOpen || aiInInspector,
  });
  /* Board 36's "Show inspector ⌘\": only when the user hid the inspector and
     nothing else fills or replaces its column. */
  const showInspectorDoor =
    !readOnlyView && !inspectorShown && !inspectorOpen && !effectiveFullPageMode && !cmsWorkspaceOpen;
  /* The inspector BODY (ProInspector) is on screen: its column is open and no
     mode (Issues · a column tab · AI) has replaced it. */
  const inspectorBodyShown =
    !readOnlyView && inspectorOpen && !(issuesOpen && renderIssuesPanel) && !rightColumnTab && !aiInInspector;

  /* I-1: UI_INSPECTOR_FOCUS_SECTION ("Bind to CMS field…", "Add
     interaction", ⌘K Jump to property) is heard by the inspector body. With a
     mode over it, or the inspector hidden, the request landed nowhere visible.
     Here it clears the way — inspector shown, the covering mode closed — and
     is re-sent on the next frame, once the body is up and listening. Only
     requests the visible body could not take are held, so the re-send does
     not loop. A full page or the CMS workspace has no inspector to show. */
  columnRef.current = {
    bodyShown: inspectorBodyShown,
    blocked: readOnlyView || effectiveFullPageMode || cmsWorkspaceOpen,
    rightColumnTab,
  };
  /* m-1: a held request lapses — after PENDING_FOCUS_MS if the body never
     came up, and on any selection change — so it cannot fire later, at a
     moment the user no longer connects with it. */
  const pendingFocus = React.useRef<FocusSectionPayload | null>(null);
  const pendingLapse = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropPendingFocus = React.useCallback(() => {
    pendingFocus.current = null;
    clearTimeout(pendingLapse.current);
  }, []);
  React.useEffect(() => dropPendingFocus, [dropPendingFocus]);
  React.useEffect(() => {
    if (!composer) return;
    const selectionEvents = [
      EVENTS.ELEMENT_SELECTED,
      EVENTS.SELECTION_MULTIPLE,
      EVENTS.SELECTION_CLEARED,
      EVENTS.SELECTION_ADDED,
      EVENTS.SELECTION_REMOVED,
    ] as const;
    for (const ev of selectionEvents) composer.on(ev, dropPendingFocus);
    return () => {
      for (const ev of selectionEvents) composer.off(ev, dropPendingFocus);
    };
  }, [composer, dropPendingFocus]);
  React.useEffect(() => {
    if (!composer) return;
    const route = (payload: FocusSectionPayload) => {
      const r = columnRef.current;
      if (r.bodyShown || r.blocked) return;
      pendingFocus.current = payload;
      clearTimeout(pendingLapse.current);
      pendingLapse.current = setTimeout(dropPendingFocus, PENDING_FOCUS_MS);
      setInspectorShown(true);
      setAiInInspector(false);
      onCloseIssues?.();
      if (r.rightColumnTab) onLeftPanelToggle?.();
    };
    composer.on(EVENTS.UI_INSPECTOR_FOCUS_SECTION, route);
    return () => {
      composer.off(EVENTS.UI_INSPECTOR_FOCUS_SECTION, route);
    };
  }, [composer, onCloseIssues, onLeftPanelToggle, dropPendingFocus]);
  React.useEffect(() => {
    if (!composer || !inspectorBodyShown || !pendingFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const payload = pendingFocus.current;
      dropPendingFocus();
      if (payload) composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, payload);
    });
    return () => cancelAnimationFrame(frame);
  }, [composer, inspectorBodyShown, dropPendingFocus]);

  // Reset media fullpage override when switching away from assets tab
  React.useEffect(() => {
    if (activeTabId !== "assets" && mediaFullPage) {
      setMediaFullPage(false);
    }
  }, [activeTabId, mediaFullPage]);

  /* A-6: a full-page surface hides the canvas selection but does not clear
     it — the command guard now refuses shortcuts on that surface, but the
     selection itself should not sit stale (highlighted on a canvas the user
     cannot see) while a full page is open.
     P-5: it is HELD, not dropped. Brand (a token chip), the Asset library
     ("Manage SVG") and Settings are escalations from the element being
     edited; "Back to canvas" gives the same selection back, and the
     inspector — mounted throughout — keeps its tab and scroll for it. An
     element deleted while the page was open is not brought back. */
  const heldSelectionRef = React.useRef<string[] | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    if (effectiveFullPageMode) {
      const ids = composer.selection.getSelectedIds();
      if (ids.length > 0) heldSelectionRef.current = ids;
      composer.selection.clear();
      return;
    }
    const held = heldSelectionRef.current;
    heldSelectionRef.current = null;
    if (!held || composer.selection.getSelectedIds().length > 0) return;
    restoreSelection(composer, held);
  }, [effectiveFullPageMode, composer]);

  // Listen for panel open events from composer
  React.useEffect(() => {
    if (!composer) return;

    /* Each door's side effects ride the switch's `onSwitched`: a request
       handed down, or a drawer opened, for a switch still waiting on (or
       refused by) the unsaved-changes confirm would land on the wrong tab. */
    const openDrawer = () => {
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    const openTemplates = (data?: TemplatesOpenRequest) => {
      onLeftPanelTabChange?.("templates", () => {
        /* A fresh object per request → the view re-reads it each time. */
        setTemplatesOpen({ ...data });
        openDrawer();
      });
    };
    const openDesign = () => {
      onLeftPanelTabChange?.("design", openDrawer);
    };

    /* Clone 3519:19920 — the Pages panel's `Add redirect` opens Settings ON
       Redirects with the draft. Held here, not in the tab: Settings mounts
       on the switch, after the emit, so a listener inside it would miss the
       request. A fresh object per request → the tab re-navigates each time. */
    const openSettings = (data: SettingsOpenRequest) => {
      onLeftPanelTabChange?.("settings", () => {
        setSettingsOpen({ screen: data.screen, repair: data.repair ?? null });
        openDrawer();
      });
    };
    /* The way back (3519:20096 `Back to <Page> SEO`): the same shape — the
       Pages panel is lazy and unmounted under the Settings fullpage, so the
       request waits here for it. */
    const openPageSettings = (data: PageSettingsOpenRequest) => {
      onLeftPanelTabChange?.("pages", () => {
        setPagesOpen({ pageId: data.pageId, tab: data.tab });
        openDrawer();
      });
    };

    /* ⌘K → a collection or record. The workspace reads its store, which
       outlives it, so the request is written there and the tab switched. */
    /* §13: a door on an element (the inspector's Open record ›, Open
       collection ›) remembers where it was opened, so the workspace can offer
       "‹ Back to canvas". A request with nothing selected (⌘K) has no element
       to return to; one made from inside the workspace keeps the first. */
    const openCms = (data: CmsOpenRequest) => {
      const ids = composer.selection.getSelectedIds();
      const from: CmsReturn | null =
        ids.length > 0 && !cmsWorkspaceOpen ? { tab: activeTabId, drawerOpen: isLeftPanelOpen, ids } : null;
      onLeftPanelTabChange?.("content", () => {
        cmsWorkspace.openRequest(data);
        if (from) setCmsReturn(from);
        openDrawer();
      });
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
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle, activeTabId, cmsWorkspaceOpen]);

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
      /* Every "ui:switch-tab" emitter (⌘K palette, canvas context menus,
         inspector doors, PublishTab, CmsWorkspace, …) is a second door onto
         the same tabs the rail gates — without this check a VIEWER could not
         click into Add/CMS/Brand from the rail, but ⌘K "Open AI assistant"
         or CmsWorkspace's own emit routed them there anyway. Same predicate
         the rail uses (isTabAllowedForViewer), so the two doors can't drift. */
      if (!isTabAllowedForViewer(data.tab as GroupedTabId, viewerChrome)) {
        addToast({ description: "View only — adding, pages, CMS and brand edits need an Editor role." });
        return;
      }
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
        /* A-14: with the inspector hidden, AI used to mount into a 0-px
           column; isInspectorColumnOpen now opens the column for any panel
           it hosts, AI included. */
        setAiInInspector(true);
        return;
      }
      onLeftPanelTabChange?.(data.tab, () => {
        if (!isLeftPanelOpen) onLeftPanelToggle?.();
        /* Clone 3724:43815 — the inspector's "Manage video" opens the Asset
           LIBRARY (the fullpage), not the drawer; the file to select rides on
           the engine's media selection the way the drawer's own door hands it. */
        if (data.tab === "assets" && data.fullPage) setMediaFullPage(true);
      });
    };
    composer.on("ui:switch-tab", handler);
    return () => {
      composer.off("ui:switch-tab", handler);
    };
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle, viewerChrome, addToast]);

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

  const handleRailTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      /* A viewer inspects: Layers, and Assets (view-only since B5). The other
         rail doors lead to writing surfaces, so they say why instead. */
      if (!isTabAllowedForViewer(tab, viewerChrome)) {
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
      // Return to the drawer tab the user was actually on (default: Add).
      onLeftPanelTabChange?.(prevDrawerTabRef.current);
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

  /* The column-hosted tab (Publish · Review · History · Activity). One
     element, two hosts: the inspector column, and a VIEWER's (X-8). */
  const columnPanel = rightColumnTab ? (
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
  ) : null;

  return (
    <DSModeProvider>
    <TokenRegistryProvider composer={composer}>
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
            viewerChrome={viewerChrome}
            onDrawerToggle={onLeftPanelToggle ?? (() => {})}
            onElementSelect={handleElementSelect}
            onBlockClick={handleBlockClick}
            canvasHoveredId={canvasHoveredId}
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
            {/* Board 36: with the inspector hidden the canvas runs full width
                and carries the way back at its top right. */}
            {showInspectorDoor ? (
              <Button
                color="light"
                size="xs"
                className={SHOW_INSPECTOR}
                aria-label="Show inspector"
                aria-keyshortcuts={"Meta+\\"}
                title={"Show inspector (⌘\\)"}
                data-testid="show-inspector"
                onClick={() => setInspectorShown(true)}
              >
                Show inspector
                <kbd className="tw:font-[inherit]" aria-hidden="true">
                  {"⌘\\"}
                </kbd>
              </Button>
            ) : null}
          </div>
          {/* FC-7 takeover shape 2 of 3 (see FullPageRouter.tsx's "THE THREE
              TAKEOVER SHAPES" contract): an in-place region over the canvas,
              NOT a Portal — the rail and drawer stay mounted and reachable
              beside it. */}
          {cmsWorkspaceOpen ? (
            <div className="tw:absolute tw:inset-0 tw:z-[var(--bk-z-chrome)] tw:bg-[var(--bk-bg-panel)]" data-testid="cms-workspace-host">
              <React.Suspense fallback={null}>
                <CmsWorkspace
                  composer={composer}
                  onCreateCollection={onOpenCreateCollection}
                  onOpenMediaLibrary={pickForCms}
                  onBackToCanvas={cmsReturn ? backToCanvas : undefined}
                />
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
              {/* X-8: a VIEWER's read-only History/Review/Activity replace the
                  role notice here, the way they replace the inspector for
                  everyone else. */}
              {rightColumnTab ? columnPanel : <ViewerRoleNotice role="VIEWER" />}
            </LayoutShell.Inspector>
          ) : null
        ) : (
        <LayoutShell.Inspector>
          {issuesOpen && renderIssuesPanel ? (
            renderIssuesPanel(() => {
              onCloseIssues?.();
              setInspectorShown(true);
            })
          ) : rightColumnTab ? (
            columnPanel
          ) : (
          <>
            {aiInInspector ? (
              <AITab
                composer={composer}
                isExpanded={false}
                onExpandToggle={() => {}}
                onClose={() => setAiInInspector(false)}
                /* M-1: "‹ Inspector" leads to the inspector — shown even if it
                   was hidden, where closing AI alone took the column with it. */
                onBack={() => {
                  setAiInInspector(false);
                  setInspectorShown(true);
                }}
              />
            ) : null}
            {/* P-7a: AI covers the inspector; it does not unmount it. The
                round trip used to reset the tab to Style, the scroll to 0 and
                a :hover state to Base. `invisible` keeps the layout box, so
                the scroll offset survives, and takes it out of the tab order
                and the accessibility tree. */}
            <div
              className={aiInInspector ? "tw:absolute tw:inset-0 tw:invisible tw:pointer-events-none" : "tw:contents"}
              aria-hidden={aiInInspector || undefined}
              data-testid="inspector-body-host"
            >
              <ProInspector
                composer={composer}
                selectedElement={selectedElement}
                currentBreakpoint={device}
                onOpenMediaLibrary={onOpenMediaLibrary}
                onOpenIconPicker={onOpenIconPicker}
                onOpenCreateCollection={onOpenCreateCollection}
              />
            </div>
          </>
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
