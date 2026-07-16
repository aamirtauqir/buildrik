import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * LeftSidebar — Merged rail + panel component
 * Rail: 60px icon navigation with 3 zones (creation, structure, config)
 * Panel: Variable-width drawer with header, pin, close, and tab content
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LeftSidebar.css";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId, GroupedTabConfig, TabZone, RailTool } from "../rail/tabsConfig";
import { getTabWidth, getTabConfig, getTabsByZone, getRailTools, getTabsByTool, getFigmaRailGroups } from "../rail/tabsConfig";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import type { BlockData } from "../../shared/types";
import type { UsePublishJobResult } from "../shell/hooks/usePublishJob";
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { TabRouter } from "./TabRouter";
import { useSidebarKeyboard } from "./useSidebarKeyboard";
import {
  Plus,
  LayoutGrid,
  Image,
  Layers,
  File,
  Box,
  Palette,
  Settings,
  Timer,
  Sparkles,
  Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipProvider,
} from "@/editor/shared/vibcoder/Tooltip";

// ============================================
// Icon map — lucide icon name → component
// ============================================

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  LayoutGrid,
  Image,
  Layers,
  File,
  Box,
  Palette,
  Settings,
  Timer,
  Sparkles,
  Rocket,
};

// ============================================
// Types
// ============================================

export interface LeftSidebarProps {
  composer: Composer | null;
  activeTab: GroupedTabId;
  onTabChange: (tab: GroupedTabId) => void;
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onElementSelect?: (elementId: string) => void;
  onBlockClick?: (block: BlockData) => void;
  canvasHoveredId?: string | null;
  onReplayTour?: () => void;
  projectId?: string | null;
  publishJob?: UsePublishJobResult;
  onVercelPublish?: () => Promise<void>;
  /** Switches the assets tab from slim launcher to fullpage library manager. */
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
  /** §17 — opens ImageEditorModal for asset crop/rotate/adjust in panel-mode MediaTab. */
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  /** §20 — opens IconPickerModal from StockSourceModal "Browse full icon library". */
  onOpenIconPicker?: (
    currentIcon: import("../../shared/types/media").IconConfig | undefined,
    onSelect: (icon: import("../../shared/types/media").IconConfig) => void,
  ) => void;
}

// ============================================
// Zone rendering
// ============================================

const ZONES: TabZone[] = ["creation", "structure", "config"];

// Stable empty set — avoids allocating a new Set on every render
const EMPTY_SET: ReadonlySet<string> = new Set();
// Stable set for when settings tab has unsaved changes
const SETTINGS_DIRTY_SET: ReadonlySet<string> = new Set(["settings"]);

function RailZone({
  zone,
  tabs: tabsOverride,
  activeTab,
  drawerOpen,
  onBtnClick,
  dirtyTabIds,
}: {
  zone: TabZone;
  /** Explicit tab list. When omitted, all tabs in `zone` render (legacy path). */
  tabs?: GroupedTabConfig[];
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
  dirtyTabIds?: ReadonlySet<string>;
}) {
  const tabs = React.useMemo(
    () => tabsOverride ?? getTabsByZone(zone),
    [tabsOverride, zone],
  );

  return (
    <div className="ls-zone">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.iconName];
        if (!Icon) return null;
        const isSelectedTab = tab.id === activeTab;
        const isVisibleActive = isSelectedTab && drawerOpen;
        const isDirty = dirtyTabIds?.has(tab.id) ?? false;

        return (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <Button
                className={`ls-btn${isSelectedTab ? " ls-btn--active" : ""}${!drawerOpen && isSelectedTab ? " ls-btn--last" : ""}`}
                onClick={() => onBtnClick(tab.id)}
                role="tab"
                aria-selected={isVisibleActive}
                aria-label={tab.ariaLabel}
                data-tab={tab.id}
              >
                {isVisibleActive && <div className="ls-btn-bar" />}
                {isDirty && <div className="ls-btn__dirty-dot" aria-hidden="true" />}
                <Icon size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="right" sideOffset={8}>
                {tab.label}
                {tab.shortcut && (
                  <span style={{ opacity: 0.6, marginLeft: 6 }}>{tab.shortcut}</span>
                )}
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        );
      })}
    </div>
  );
}

// ============================================
// F1 — Figma-contract rail (default)
// ============================================
// Five rail tools in two zones: Add/Assets/Components (creation) then
// Layers/Pages (structure), with a divider between. Reuses RailZone's button
// markup via an explicit tab list. The six off-rail panels (AI, Templates,
// Design, Settings, Publish, History) still open from ⌘K + topbar — nothing
// is stranded (see tabsConfig RAIL_FIGMA + tabsConfig.figma.test.ts).
function FigmaRail({
  activeTab,
  drawerOpen,
  onBtnClick,
  dirtyTabIds,
}: {
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
  dirtyTabIds?: ReadonlySet<string>;
}) {
  const groups = React.useMemo(() => getFigmaRailGroups(), []);
  return (
    <>
      {groups.map((g, i) => (
        <React.Fragment key={g.zone}>
          <RailZone
            zone={g.zone}
            tabs={g.tabs}
            activeTab={activeTab}
            drawerOpen={drawerOpen}
            onBtnClick={onBtnClick}
            dirtyTabIds={dirtyTabIds}
          />
          {i < groups.length - 1 && <div className="ls-divider" />}
        </React.Fragment>
      ))}
    </>
  );
}

// ============================================
// E3 — 4-tool rail (escape hatch: ?rail=e3)
// ============================================
// Each tool button opens its PRIMARY folded panel; the remaining folded tabs
// (templates/components/media under Insert; publish/history under Site) reach
// their panels via the composite sub-nav — built next. Default rail (11 buttons)
// is unchanged, so this is additive + reversible.
const TOOL_PRIMARY_TAB: Record<RailTool, GroupedTabId> = {
  insert: "add",
  pages: "pages",
  styles: "design",
  site: "settings",
  assistant: "ai",
  structure: "layers",
};

function FourToolRail({
  activeTab,
  drawerOpen,
  onBtnClick,
}: {
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
}) {
  const activeTool = getTabConfig(activeTab)?.tool;
  return (
    <div className="ls-zone">
      {getRailTools().map(({ tool, meta }) => {
        const Icon = ICON_MAP[meta.iconName];
        if (!Icon) return null;
        const isSelected = tool === activeTool;
        const isVisibleActive = isSelected && drawerOpen;
        return (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Button
                className={`ls-btn${isSelected ? " ls-btn--active" : ""}${!drawerOpen && isSelected ? " ls-btn--last" : ""}`}
                onClick={() => onBtnClick(TOOL_PRIMARY_TAB[tool])}
                role="tab"
                aria-selected={isVisibleActive}
                aria-label={meta.ariaLabel}
                data-tool={tool}
              >
                {isVisibleActive && <div className="ls-btn-bar" />}
                <Icon size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="right" sideOffset={8}>
                {meta.label}
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        );
      })}
    </div>
  );
}

// E3 composite sub-nav: in 4-tool mode, a tool that folds >1 tab (Insert: Add/
// Templates/Components/Media; Site: Settings/Publish/History) shows a sub-tab row
// at the top of its panel so every folded tab keeps its reach (acceptance #5).
// Pages/Styles fold a single tab → no sub-nav. vibcoder Button keeps Gate 24 clean.
function ToolSubNav({
  activeTab,
  onSubTabChange,
}: {
  activeTab: GroupedTabId;
  onSubTabChange: (id: GroupedTabId) => void;
}) {
  const tool = getTabConfig(activeTab)?.tool;
  const subs = tool ? getTabsByTool(tool) : [];
  if (subs.length <= 1) return null;
  return (
    <div
      role="tablist"
      aria-label="Section"
      style={{
        display: "flex",
        gap: 2,
        padding: "6px 8px",
        borderBottom: "1px solid var(--bd-border, var(--color-border-default, #e5e7eb))",
      }}
    >
      {subs.map((t) => {
        const active = t.id === activeTab;
        return (
          <Button
            key={t.id}
            variant="bare"
            role="tab"
            aria-selected={active}
            onClick={() => onSubTabChange(t.id)}
            style={{
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              padding: "4px 10px",
              borderRadius: 6,
              color: active ? "var(--bd-accent, #2D6DFF)" : "var(--bd-text-secondary, #64748b)",
              background: active ? "var(--bd-accent-subtle, rgba(45,109,255,0.08))" : "transparent",
            }}
          >
            {t.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================
// LeftSidebar Component
// ============================================

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  composer,
  activeTab,
  onTabChange,
  drawerOpen,
  onDrawerToggle,
  isPinned: controlledPinned,
  onPinToggle: controlledPinToggle,
  onElementSelect,
  onBlockClick,
  canvasHoveredId,
  onReplayTour,
  projectId,
  publishJob,
  onVercelPublish,
  onOpenLibrary,
  onOpenImageEditor,
  onOpenIconPicker,
}) => {
  const navRef = React.useRef<HTMLElement>(null);
  const panelContentRef = React.useRef<HTMLDivElement>(null);
  const [errorKey, setErrorKey] = React.useState(0);

  // Pin state (controlled or internal fallback)
  const [internalPinned, setInternalPinned] = React.useState(true);
  const isPinned = controlledPinned ?? internalPinned;
  const onPinToggle = controlledPinToggle ?? (() => setInternalPinned((p) => !p));

  // Settings dirty-state guard
  const [settingsDirty, setSettingsDirty] = React.useState(false);
  const [tabGuard, setTabGuard] = React.useState<{
    open: boolean;
    pendingTab: GroupedTabId | null;
  }>({ open: false, pendingTab: null });

  const safeTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      if (activeTab === "settings" && settingsDirty) {
        setTabGuard({ open: true, pendingTab: tab });
      } else {
        onTabChange(tab);
      }
    },
    [activeTab, onTabChange, settingsDirty]
  );

  const confirmTabSwitch = React.useCallback(() => {
    const dest = tabGuard.pendingTab;
    setTabGuard({ open: false, pendingTab: null });
    setSettingsDirty(false);
    if (dest) onTabChange(dest);
  }, [tabGuard.pendingTab, onTabChange]);

  const cancelTabSwitch = React.useCallback(() => {
    setTabGuard({ open: false, pendingTab: null });
    if (activeTab !== "settings") {
      onTabChange("settings");
    }
  }, [activeTab, onTabChange]);

  // Rail button click: open drawer if closed, switch tab if different.
  // Clicking the already-active tab TOGGLES the drawer (closes when open,
  // reopens when closed) — replaces the removed `.ls-panel-close` × icon.
  const handleBtnClick = React.useCallback(
    (tabId: GroupedTabId) => {
      if (tabId !== activeTab) {
        safeTabChange(tabId);
        if (!drawerOpen) onDrawerToggle();
      } else {
        // Clicking the already-active rail icon toggles the drawer
        // (open if closed, close if open). Replaces the redundant
        // outer `ls-panel-close` × icon for tabs without PanelHeader.
        onDrawerToggle();
      }
    },
    [activeTab, drawerOpen, onDrawerToggle, safeTabChange]
  );

  // Keyboard nav within rail
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const buttons = navRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      if (!buttons || buttons.length === 0) return;
      const arr = Array.from(buttons);
      const idx = arr.indexOf(document.activeElement as HTMLElement);
      if (idx === -1) return;

      let nextIdx = idx;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (idx + 1) % arr.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (idx - 1 + arr.length) % arr.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = arr.length - 1;
      }

      if (nextIdx !== idx) {
        const nextButton = arr[nextIdx];
        const tabId = nextButton.dataset.tab as GroupedTabId | undefined;
        if (tabId) safeTabChange(tabId);
        nextButton.focus();
      }
    },
    [safeTabChange]
  );

  // Global keyboard shortcuts (A, T, Z, etc.)
  useSidebarKeyboard(safeTabChange);

  // Rail mode — read once. Default "figma" (F1); "e3" and "legacy" are escape hatches.
  const railMode = React.useMemo(() => getEditorViewMode().railMode, []);
  const useFourToolRail = railMode === "e3";

  // Component creation handler
  const handleCreateComponent = React.useCallback(() => {
    if (!composer) return;
    const hasComponentsApi =
      typeof (composer?.elements as unknown as Record<string, unknown> | undefined)?.[
        "getComponents"
      ] === "function";
    if (!hasComponentsApi) return;
    const selectedIds = composer.selection.getSelectedIds();
    const elementId = selectedIds[0];
    if (elementId) {
      composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
    }
  }, [composer]);

  // Panel header info
  const tabConfig = getTabConfig(activeTab);
  const configPanelWidth = getTabWidth(activeTab);
  const panelTitle = tabConfig?.label ?? "Panel";

  // §12 — assets tab supports runtime width override (320 ↔ 560) via
  // ui:media-panel-width composer event. Other tabs ignore the event.
  const [mediaPanelOverride, setMediaPanelOverride] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const handler = (payload: unknown) => {
      const p = payload as { width?: number };
      if (typeof p?.width === "number") setMediaPanelOverride(p.width);
    };
    composer.on("ui:media-panel-width", handler);
    return () => {
      composer.off("ui:media-panel-width", handler);
    };
  }, [composer]);
  // Reset override when leaving assets tab — prevents stale 560 leaking to
  // next tab opened.
  React.useEffect(() => {
    if (activeTab !== "assets") setMediaPanelOverride(null);
  }, [activeTab]);
  // prototype-v3 §2 — templates tab supports runtime width override
  // (320 ↔ 700) via ui:templates-panel-width composer event when detail
  // card opens. Other tabs ignore the event.
  const [templatesPanelOverride, setTemplatesPanelOverride] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const handler = (payload: unknown) => {
      const p = payload as { width?: number };
      if (typeof p?.width === "number") setTemplatesPanelOverride(p.width);
    };
    composer.on("ui:templates-panel-width", handler);
    return () => {
      composer.off("ui:templates-panel-width", handler);
    };
  }, [composer]);
  // Reset override when leaving templates tab.
  React.useEffect(() => {
    if (activeTab !== "templates") setTemplatesPanelOverride(null);
  }, [activeTab]);
  const panelWidth = activeTab === "assets" && mediaPanelOverride !== null
    ? mediaPanelOverride
    : activeTab === "templates" && templatesPanelOverride !== null
    ? templatesPanelOverride
    : configPanelWidth;

  const commonTabProps = {
    isPinned,
    onPinToggle: onPinToggle ?? (() => {}),
    onClose: onDrawerToggle,
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="ls-root">
      {/* Rail */}
      <nav
        ref={navRef}
        className="ls-rail"
        role="tablist"
        aria-label="Editor navigation"
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
      >
        <div className="ls-logo">
          <Layers size={28} />
        </div>

        <div className="ls-divider" />

        {railMode === "e3" ? (
          <FourToolRail
            activeTab={activeTab}
            drawerOpen={drawerOpen}
            onBtnClick={handleBtnClick}
          />
        ) : railMode === "figma" ? (
          <FigmaRail
            activeTab={activeTab}
            drawerOpen={drawerOpen}
            onBtnClick={handleBtnClick}
            dirtyTabIds={settingsDirty ? SETTINGS_DIRTY_SET : EMPTY_SET}
          />
        ) : (
          ZONES.map((zone, i) => (
            <React.Fragment key={zone}>
              <RailZone
                zone={zone}
                activeTab={activeTab}
                drawerOpen={drawerOpen}
                onBtnClick={handleBtnClick}
                dirtyTabIds={settingsDirty ? SETTINGS_DIRTY_SET : EMPTY_SET}
              />
              {i < ZONES.length - 1 && <div className="ls-divider" />}
            </React.Fragment>
          ))
        )}

        <div className="ls-spacer" />
      </nav>
      {/* Panel */}
      <div
        className={`ls-panel${!drawerOpen ? " ls-panel--closed" : ""}`}
        style={{ width: drawerOpen ? panelWidth : 0 }}
        role="tabpanel"
        aria-hidden={!drawerOpen}
      >
        {/* ls-panel-close removed: PanelHeader inside each tab owns the close X.
            Tabs without a PanelHeader (Layers, Add) can be closed by re-clicking
            the active rail icon, which now toggles drawerOpen. */}
        <div ref={panelContentRef} className="ls-panel-content ls-panel-content--no-padding" tabIndex={-1}>
          {useFourToolRail && <ToolSubNav activeTab={activeTab} onSubTabChange={handleBtnClick} />}
          <InspectorErrorBoundary
            key={errorKey}
            fallback={<SidebarErrorFallback onRetry={() => setErrorKey((k) => k + 1)} />}
          >
            <div key={activeTab} className="ls-panel-animate">
              <React.Suspense fallback={<PanelSkeleton />}>
                <TabRouter
                  activeTab={activeTab}
                  composer={composer}
                  commonTabProps={commonTabProps}
                  onBlockClick={onBlockClick}
                  onElementSelect={onElementSelect}
                  canvasHoveredId={canvasHoveredId}
                  onSwitchToAdd={() => safeTabChange("add")}
                  onSwitchToTemplates={() => safeTabChange("templates")}
                  onSwitchToDesign={() => safeTabChange("design")}
                  onCreateComponent={handleCreateComponent}
                  onReplayTour={onReplayTour}
                  projectId={projectId}
                  publishJob={publishJob}
                  onVercelPublish={onVercelPublish}
                  onSettingsDirtyChange={setSettingsDirty}
                  onTemplatesSwitchTab={(tab) => safeTabChange(tab as GroupedTabId)}
                  onOpenLibrary={onOpenLibrary}
                  onOpenImageEditor={onOpenImageEditor}
                  onOpenIconPicker={onOpenIconPicker}
                />
              </React.Suspense>
            </div>
          </InspectorErrorBoundary>
        </div>
      </div>
      {/* Settings dirty guard */}
      <ConfirmDialog
        isOpen={tabGuard.open}
        onClose={cancelTabSwitch}
        onConfirm={confirmTabSwitch}
        title="Unsaved Changes"
        message="You have unsaved changes in Settings. Switching tabs will discard them."
        confirmText="Discard & Switch"
        variant="danger"
      />
    </div>
    </TooltipProvider>
  );
};

export default LeftSidebar;
