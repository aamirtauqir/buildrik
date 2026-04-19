/**
 * usePanelState - Sole authority for panel state management
 *
 * Manages: leftPanelTab, leftPanelSubTabs, rightPanelTab, isLeftPanelOpen,
 * panelPinned, and derived values (isFullPageMode, drawerWidth).
 * localStorage persistence for all panel state.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { GroupedTabId } from "../../rail/tabsConfig";
import { getTabMode, getTabWidth } from "../../rail/tabsConfig";
import { migrateLegacyPanelState } from "./panelStateMigration";

/** LocalStorage key for panel state persistence */
const PANEL_STATE_KEY = "buildrick-panel-state";

/** Persisted panel state structure */
interface PanelState {
  leftPanelTab?: string;
  leftPanelSubTabs?: Record<string, string>;
  rightPanelTab?: string;
  isLeftPanelOpen?: boolean;
  panelPinned?: boolean;
}

/**
 * Load saved panel state from localStorage
 */
function getSavedPanelState(): PanelState | null {
  try {
    const saved = localStorage.getItem(PANEL_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as PanelState;
      return migrateLegacyPanelState(parsed) as PanelState;
    }
  } catch {
    // Corrupted JSON — fall back to defaults
  }
  return null;
}

/**
 * Save panel state to localStorage
 */
function savePanelState(state: PanelState): void {
  try {
    localStorage.setItem(PANEL_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/** Hook return type for panel state */
export interface UsePanelStateReturn {
  leftPanelTab: GroupedTabId;
  setLeftPanelTab: (tab: GroupedTabId) => void;
  leftPanelSubTabs: Record<string, string>;
  setLeftPanelSubTabs: (updater: React.SetStateAction<Record<string, string>>) => void;
  rightPanelTab: string;
  setRightPanelTab: (tab: string) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openLeftPanel: () => void;
  openLeftPanelToTab: (primaryTab: GroupedTabId, subTab?: string) => void;
  openBlocks: () => void;
  openPages: () => void;
  openLayers: () => void;
  panelPinned: boolean;
  setPanelPinned: (pinned: boolean) => void;
  /** Whether the active tab is a fullpage tab (Templates, Settings, History, Design) */
  isFullPageMode: boolean;
  /** Panel width in pixels for the active tab (200 or 280) */
  drawerWidth: number;
}

/**
 * Manages all panel state with localStorage persistence.
 * Derives isFullPageMode and drawerWidth from the active tab's config.
 */
export function usePanelState(): UsePanelStateReturn {
  const savedState = React.useMemo(() => getSavedPanelState(), []);

  const [leftPanelTab, _setLeftPanelTab] = React.useState<GroupedTabId>(
    (savedState?.leftPanelTab as GroupedTabId) || "add"
  );
  const [leftPanelSubTabs, _setLeftPanelSubTabs] = React.useState<Record<string, string>>(
    savedState?.leftPanelSubTabs || {}
  );
  const [rightPanelTab, _setRightPanelTab] = React.useState(
    savedState?.rightPanelTab || "inspector"
  );
  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(savedState?.isLeftPanelOpen ?? false);
  const [panelPinned, _setPanelPinned] = React.useState<boolean>(savedState?.panelPinned ?? true);

  // Derived state from active tab config
  const isFullPageMode = getTabMode(leftPanelTab) === "fullpage";
  const drawerWidth = getTabWidth(leftPanelTab);

  // Persist to localStorage
  React.useEffect(() => {
    savePanelState({
      leftPanelTab,
      leftPanelSubTabs,
      rightPanelTab,
      isLeftPanelOpen,
      panelPinned,
    });
  }, [leftPanelTab, leftPanelSubTabs, rightPanelTab, isLeftPanelOpen, panelPinned]);

  const setLeftPanelTab = React.useCallback((tab: GroupedTabId) => {
    _setLeftPanelTab(tab);
  }, []);

  const setLeftPanelSubTabs = React.useCallback(
    (updater: React.SetStateAction<Record<string, string>>) => {
      _setLeftPanelSubTabs(updater);
    },
    []
  );

  const setRightPanelTab = React.useCallback((tab: string) => {
    _setRightPanelTab(tab);
  }, []);

  const setPanelPinned = React.useCallback((pinned: boolean) => {
    _setPanelPinned(pinned);
  }, []);

  const openLeftPanel = React.useCallback(() => {
    setIsLeftPanelOpen(true);
  }, []);

  const openLeftPanelToTab = React.useCallback((primaryTab: GroupedTabId, subTab?: string) => {
    setIsLeftPanelOpen(true);
    _setLeftPanelTab(primaryTab);
    if (subTab) {
      _setLeftPanelSubTabs((prev) => ({
        ...prev,
        [primaryTab]: subTab,
      }));
    }
  }, []);

  const openBlocks = React.useCallback(() => {
    openLeftPanelToTab("add");
  }, [openLeftPanelToTab]);

  const openPages = React.useCallback(() => {
    openLeftPanelToTab("pages");
  }, [openLeftPanelToTab]);

  const openLayers = React.useCallback(() => {
    openLeftPanelToTab("layers");
  }, [openLeftPanelToTab]);

  return {
    leftPanelTab,
    setLeftPanelTab,
    leftPanelSubTabs,
    setLeftPanelSubTabs,
    rightPanelTab,
    setRightPanelTab,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    openLeftPanel,
    openLeftPanelToTab,
    openBlocks,
    openPages,
    openLayers,
    panelPinned,
    setPanelPinned,
    isFullPageMode,
    drawerWidth,
  };
}
