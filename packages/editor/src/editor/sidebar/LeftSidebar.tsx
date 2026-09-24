/**
 * LeftSidebar — Merged rail + panel component
 * Rail: 60px icon navigation with 3 zones (creation, structure, config)
 * Panel: Variable-width drawer with header, pin, close, and tab content
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import "./LeftSidebar.css";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId, GroupedTabConfig } from "../rail/tabsConfig";
import { getTabConfig, getFigmaRailGroups } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { PageSettingsOpenRequest } from "./tabs/pages/types";
import { ConfirmDialog, Button, HintTooltip, useToast } from "@/editor/chrome-ui";
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
  HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  /** Deep-link sub-tab for `activeTab` — see `TabRouter.activeSubTab`. */
  activeSubTab?: string;
  onTabChange: (tab: GroupedTabId) => void;
  drawerOpen: boolean;
  /** The active tab renders in the right column (Publish · Review · History),
   *  so the drawer must not mount a second, hidden copy of it. */
  hostedInColumn?: boolean;
  onDrawerToggle: () => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onElementSelect?: (elementId: string) => void;
  onBlockClick?: (block: BlockData) => void;
  canvasHoveredId?: string | null;
  /** Settings' unsaved-edit flag, owned by the shell — see the guard below. */
  settingsDirty?: boolean;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  /** `ui:pages-open-settings`, held by the shell for the Pages panel. */
  pagesOpen?: PageSettingsOpenRequest | null;
  projectId?: string | null;
  /** Switches the assets tab from slim launcher to fullpage library manager. */
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
  /** P4.2 — opens the CMS collection-setup modal from the Content tab (data-first). */
  onCreateCollection?: () => void;
  /** §17 — opens ImageEditorModal for asset crop/rotate/adjust in panel-mode MediaTab. */
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
  ) => void;
  /** §20 — opens IconPickerModal from StockSourceModal "Browse full icon library". */
  onOpenIconPicker?: (
    currentIcon: import("../../shared/types/media").IconConfig | undefined,
    onSelect: (icon: import("../../shared/types/media").IconConfig) => void,
  ) => void;
}

// ============================================
// Rail group rendering
// ============================================

function RailZone({
  tabs,
  activeTab,
  drawerOpen,
  onBtnClick,
}: {
  tabs: GroupedTabConfig[];
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
}) {
  return (
    <div className="ls-zone">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.iconName];
        if (!Icon) return null;
        const isSelectedTab = tab.id === activeTab;
        const isVisibleActive = isSelectedTab && drawerOpen;

        return (
          <HintTooltip
            key={tab.id}
            content={
              /* Board 4433:46540: "Add  A" — white label, muted shortcut. */
              tab.shortcut ? (
                <span className="tw:inline-flex tw:gap-1.5">
                  <span>{tab.label}</span>
                  <span className="tw:font-normal tw:text-[var(--bk-gray-400)]">{tab.shortcut}</span>
                </span>
              ) : (
                tab.label
              )
            }
            /* Beside the icon, not under it. `bottom` on this narrow vertical
               rail ran the bubble past the rail's width and into the open
               drawer — half on the rail, half on the panel. */
            placement="right"
          >
            <Button
              color="light"
              className={`ls-btn ls-btn--labeled${isSelectedTab ? " ls-btn--active" : ""}${!drawerOpen && isSelectedTab ? " ls-btn--last" : ""}`}
              onClick={() => onBtnClick(tab.id)}
              role="tab"
              aria-selected={isVisibleActive}
              aria-label={tab.ariaLabel}
              data-tab={tab.id}
              /* Conformance anchor, same reason as `data-testid="rail"` below:
                 recipes address by testid so a class or aria-label rewrite
                 cannot silently unhook a measurement. `data-tab` is read by
                 CSS and by the drag code, so it is not free to double as one. */
              data-testid={`rail-tab-${tab.id}`}
            >
              {isVisibleActive && (
                <div
                  data-testid="rail-active-bar"
                  /* Board 199:2: 3px, flush to the RAIL edge, the full
                     height of the item — measured at 1440x900 as x 0..2 over
                     y 114..157, the same 44px as the tinted pill. It was 2px,
                     inset from the edge and 8px in at each end, citing a
                     prototype spec older than the board, which read as a tick
                     floating beside the pill rather than a rule down its edge.
                     The offset is the button's own centring inset, written
                     from the two tokens that create it. */
                  className="ls-btn-bar tw:absolute tw:top-0 tw:bottom-0 tw:w-[3px] tw:rounded-[2px] tw:bg-[var(--bk-accent)] tw:left-[calc(-1*(var(--layout-rail-width,60px)-var(--bk-size-header))/2)]"
                />
              )}
              <Icon size={20} />
              <span className="ls-btn__label">{tab.label}</span>
            </Button>
          </HintTooltip>
        );
      })}
    </div>
  );
}

// ============================================
// F1 — Figma-contract rail (default)
// ============================================
// P1 convergence (board 52:2): SIX rail items in ONE group — Insert · Layers ·
// Pages · Media · Content · Brand — icon + visible label, no divider. Reuses
// RailZone's button markup via an explicit tab list. Off-rail panels (AI,
// Templates, Components, Settings, Publish, History) still open from ⌘K +
// shortcuts + topbar — nothing is stranded (see tabsConfig RAIL_FIGMA +
// tabsConfig.figma.test.ts).
function FigmaRail({
  activeTab,
  drawerOpen,
  onBtnClick,
}: {
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
}) {
  const groups = React.useMemo(() => getFigmaRailGroups(), []);
  return (
    <>
      {groups.map((g, i) => (
        <React.Fragment key={g.zone}>
          <RailZone tabs={g.tabs} activeTab={activeTab} drawerOpen={drawerOpen} onBtnClick={onBtnClick} />
          {i < groups.length - 1 && <div className="ls-divider" />}
        </React.Fragment>
      ))}
    </>
  );
}

// ============================================
// LeftSidebar Component
// ============================================

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  composer,
  activeTab,
  activeSubTab,
  onTabChange,
  drawerOpen,
  hostedInColumn = false,
  onDrawerToggle,
  isExpanded: controlledExpanded,
  onExpandToggle: controlledExpandToggle,
  onElementSelect,
  onBlockClick,
  canvasHoveredId,
  settingsDirty = false,
  onSettingsDirtyChange,
  pagesOpen,
  projectId,
  onOpenLibrary,
  onCreateCollection,
  onOpenImageEditor,
  onOpenIconPicker,
}) => {
  const navRef = React.useRef<HTMLElement>(null);
  const panelContentRef = React.useRef<HTMLDivElement>(null);
  const [errorKey, setErrorKey] = React.useState(0);

  // Expand state (board 16:6 header action): 280 ↔ 700 drawer width.
  // Collapsed by default — the boards draw the 280 drawer (redrawn 2026-09-02). Controlled or
  // internal fallback, same shape the pin state had.
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  const onExpandToggle = controlledExpandToggle ?? (() => setInternalExpanded((p) => !p));

  /* `settingsDirty` is OWNED BY THE SHELL, not by this component. Settings is
     a full-page tab, so the copy the user types into is the one FullPageView
     mounts, and only the shell sees both that and this rail. While the flag
     lived here it was fed by a second, invisible SettingsTab that no edit
     ever reached — so the guard below never fired and leaving Settings
     dropped unsaved changes without a word. */
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
    onSettingsDirtyChange?.(false);
    if (dest) onTabChange(dest);
  }, [tabGuard.pendingTab, onTabChange, onSettingsDirtyChange]);

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
  const openAssistant = React.useCallback(() => composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "ai" }), [composer]);
  useSidebarKeyboard(safeTabChange, openAssistant);

  const { addToast } = useToast();

  // Component creation handler
  const handleCreateComponent = React.useCallback(() => {
    if (!composer) return;
    /*
      The guard used to ask `composer.elements` for a `getComponents` method.
      No such method exists anywhere — the components API lives on
      `composer.components` (`ComponentManager.isAvailable()` at :483), which is
      what every other caller checks, ComponentsTab included at its own :118.

      So the guard was always false and this handler always returned on its
      second line. It is what the Components panel's empty state calls from BOTH
      of its actions — the inline "Create component" link and the footer
      "+ Create component" button — so the only two things that panel offers a
      new user did nothing at all. Measured live: zero dialogs, no toast, no
      console error. Silence is what a wrong-manager typeof check buys.
    */
    if (!composer.components?.isAvailable?.()) return;
    const selectedIds = composer.selection.getSelectedIds();
    const elementId = selectedIds[0];
    /* And with NOTHING selected it returned silently on the next line, which is
       the state the empty state is FOR: both of its actions sit under copy that
       says "Select an element on the canvas and save it as a component", and a
       new user who clicks them first got no dialog, no toast, nothing. Say what
       is missing instead of saying nothing. Measured live 2026-08-22: three
       clicks (the header +, the inline link, the footer button), zero change of
       any kind. */
    if (!elementId) {
      addToast({
        description: "Select an element on the canvas first — a component is made from something.",
        tone: "info",
        duration: 4000,
      });
      return;
    }
    composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
  }, [composer, addToast]);

  // Panel header info
  const tabConfig = getTabConfig(activeTab);
  const panelTitle = tabConfig?.label ?? "Panel";

  // Header expand (board 16:6) widens a drawer to 700. `null` means "no flow
  // width" — the default comes from `--bk-size-drawer` in LeftSidebar.css, so
  // the generated token is the single source.
  const panelWidthOverride = isExpanded ? 700 : null;

  const commonTabProps = {
    /* A closed drawer keeps its tab mounted (width 0); a tab that acts on
       the shell while visible (Layers' topbar filter, its Escape) reads this. */
    isOpen: drawerOpen,
    isExpanded,
    onExpandToggle: onExpandToggle ?? (() => {}),
    onClose: onDrawerToggle,
  };

  return (
    <div className="ls-root">
      {/* Rail */}
      <nav
        ref={navRef}
        className="ls-rail ls-rail--figma"
        // Conformance anchor — see themes/fonts.css era note in Topbar.tsx.
        // `.ls-rail` happens to be stable today, but recipes select on testids
        // uniformly so a class rename can never silently unhook measurement.
        data-testid="rail"
        role="tablist"
        aria-label="Editor navigation"
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
      >
        {/* Board 4418:123573: the rail starts with its first item — no logo
            mark, no divider. */}
        <FigmaRail activeTab={activeTab} drawerOpen={drawerOpen} onBtnClick={handleBtnClick} />

        <div className="ls-spacer" />

        {/* Every v3 shell board ends the rail with "? Help" (C5 G1-089). It
            opens the Keyboard legend card (4418:126882), whose "All shortcuts
            ›" is the door to the one sheet (B7) — not a tab; the drawer stays. */}
        <HintTooltip content="Keyboard shortcuts · ?" placement="right">
          <Button
            color="light"
            className="ls-btn ls-btn--labeled"
            onClick={() => composer?.emit(EVENTS.UI_TOGGLE_KEYBOARD_LEGEND, {})}
            aria-label="Help — keyboard shortcuts"
            data-testid="rail-help"
          >
            <HelpCircle size={20} />
            <span className="ls-btn__label">Help</span>
          </Button>
        </HintTooltip>
      </nav>
      {/* Panel */}
      <div
        className={`ls-panel${!drawerOpen ? " ls-panel--closed" : ""}`}
        style={
          panelWidthOverride !== null
            ? ({ "--drawer-w": `${panelWidthOverride}px` } as React.CSSProperties)
            : undefined
        }
        data-testid="sidebar-panel"
        role="tabpanel"
        aria-hidden={!drawerOpen}
        /* `inert` as well as aria-hidden: the closed drawer is width 0 and
           opacity 0 but its whole tree stays mounted, so every control inside
           it kept its tab stop. axe called it (aria-hidden-focus, serious) and
           a keyboard user could Tab into an invisible panel and operate it. */
        inert={!drawerOpen}
      >
        {/* ls-panel-close removed: PanelHeader inside each tab owns the close X.
            Tabs without a PanelHeader (Layers, Add) can be closed by re-clicking
            the active rail icon, which now toggles drawerOpen. */}
        <div ref={panelContentRef} className="ls-panel-content ls-panel-content--no-padding" tabIndex={-1}>
          <InspectorErrorBoundary
            key={errorKey}
            fallback={<SidebarErrorFallback onRetry={() => setErrorKey((k) => k + 1)} />}
          >
            {/* Keyed on the sub-tab too: a deep link that only changes the
                sub-tab (⋯ → Publish history while History is already open)
                must remount so the tab re-reads its initial screen. */}
            <div key={`${activeTab}:${activeSubTab ?? ""}`} className="ls-panel-animate">
              {hostedInColumn ? null : (
              <React.Suspense fallback={<PanelSkeleton />}>
                <TabRouter
                  activeTab={activeTab}
                  activeSubTab={activeSubTab}
                  pagesOpen={pagesOpen}
                  composer={composer}
                  commonTabProps={commonTabProps}
                  onBlockClick={onBlockClick}
                  onElementSelect={onElementSelect}
                  canvasHoveredId={canvasHoveredId}
                  onSwitchToAdd={() => safeTabChange("add")}
                  onSwitchToTemplates={() => safeTabChange("templates")}
                  onCreateComponent={handleCreateComponent}
                  projectId={projectId}
                  onOpenLibrary={onOpenLibrary}
                  onOpenImageEditor={onOpenImageEditor}
                  onOpenIconPicker={onOpenIconPicker}
                  onCreateCollection={onCreateCollection}
                />
              </React.Suspense>
              )}
            </div>
          </InspectorErrorBoundary>
        </div>
      </div>
      {/* Settings dirty guard */}
      <ConfirmDialog
        open={tabGuard.open}
        onClose={cancelTabSwitch}
        onConfirm={confirmTabSwitch}
        title="Unsaved Changes"
        message="You have unsaved changes in Settings. Switching tabs will discard them."
        confirmLabel="Discard & Switch"
        tone="destructive"
      />
    </div>
  );
};

export default LeftSidebar;
