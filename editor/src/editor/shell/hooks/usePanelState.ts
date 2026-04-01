/**
 * usePanelState - Hook for managing left/right panel open/closed and tab state
 *
 * Handles leftPanelTab, leftPanelSubTabs, rightPanelTab, isLeftPanelOpen,
 * and localStorage persistence for all panel state.
 *
 * @module Editor/hooks/usePanelState
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { GroupedTabId } from "../../rail/tabsConfig";
import { migrateLegacyPanelState } from "./panelStateMigration";
import type { PanelState, PanelSizeMode } from "./useStudioState";

/** LocalStorage key for panel state persistence */
const PANEL_STATE_KEY = "aqb-panel-state";

/**
 * Load saved panel state from localStorage
 */
function getSavedPanelState(): PanelState | null {
  try {
    const saved = localStorage.getItem(PANEL_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as PanelState;
      // Migrate legacy state to new grouped structure
      return migrateLegacyPanelState(parsed);
    }
  } catch {
    // Ignore parse errors
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
  panelSizeMode: PanelSizeMode;
  setPanelSizeMode: (mode: PanelSizeMode) => void;
}

/**
 * Manages left/right panel open state, active tabs, and localStorage persistence
 */
export function usePanelState(): UsePanelStateReturn {
  // Load saved panel state once on mount
  const savedState = React.useMemo(() => getSavedPanelState(), []);

  // Panel state with persistence
  // savedState?.leftPanelTab may be a legacy string from localStorage; cast after migration guarantees GroupedTabId
  const [leftPanelTab, _setLeftPanelTab] = React.useState<GroupedTabId>(
    (savedState?.leftPanelTab as GroupedTabId) || "add"
  );
  const [leftPanelSubTabs, _setLeftPanelSubTabs] = React.useState<Record<string, string>>(
    savedState?.leftPanelSubTabs || {
      build: "elements",
      structure: "layers",
      content: "cms",
      ai: "ai-assistant",
    }
  );
  const [rightPanelTab, _setRightPanelTab] = React.useState(
    savedState?.rightPanelTab || "inspector"
  );
  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(savedState?.isLeftPanelOpen ?? false);
  const [panelPinned, _setPanelPinned] = React.useState<boolean>(savedState?.panelPinned ?? true);
  const [panelSizeMode, _setPanelSizeMode] = React.useState<PanelSizeMode>(
    savedState?.panelSizeMode ?? "normal"
  );

  // Persist panel state to localStorage when it changes
  React.useEffect(() => {
    savePanelState({
      leftPanelTab,
      leftPanelSubTabs,
      rightPanelTab,
      isLeftPanelOpen,
      panelPinned,
      panelSizeMode,
    });
  }, [leftPanelTab, leftPanelSubTabs, rightPanelTab, isLeftPanelOpen, panelPinned, panelSizeMode]);

  // Wrapped setters that update state and trigger persistence
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

  const setPanelSizeMode = React.useCallback((mode: PanelSizeMode) => {
    _setPanelSizeMode(mode);
  }, []);

  // Convenience handler for opening left panel
  const openLeftPanel = React.useCallback(() => {
    setIsLeftPanelOpen(true);
  }, []);

  // Navigation functions for specific panel tabs
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
    // 8-tab structure: 'layers' is a standalone tab, no subtab needed
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
    panelSizeMode,
    setPanelSizeMode,
  };
}
