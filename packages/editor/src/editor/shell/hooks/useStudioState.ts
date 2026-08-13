/**
 * useStudioState - Hook for managing UI state in AquibraStudio
 * Extracts device/zoom, panel state, overlay toggles, and save/undo state
 *
 * @module Editor/hooks/useStudioState
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DeviceType } from "../../../shared/types";
import { migrateLegacyPanelState } from "./panelStateMigration";

// ============================================
// Constants
// ============================================

/** LocalStorage key for panel state persistence */
const PANEL_STATE_KEY = "buildrick-panel-state";

// ============================================
// Types
// ============================================

/** Persisted panel state structure */
export interface PanelState {
  leftPanelTab?: string; // Now stores GroupedTabId
  leftPanelSubTabs?: Record<string, string>; // Stores sub-tab per primary tab
  rightPanelTab?: string;
  isLeftPanelOpen?: boolean;
  /**
   * Board 817:4649 states the canvas toggles persist. They were plain
   * useState, so every reload put Grid, Rulers, Badges, X-Ray and Spacing back
   * to off — a user who works with rulers on turned them on again every
   * session. Stored as a partial: a key absent from an older payload falls
   * back to its default rather than reading as `false`.
   */
  overlays?: Partial<Pick<
    OverlayState,
    | "showXRay"
    | "showSpacingIndicators"
    | "showBadges"
    | "showGuides"
    | "showGrid"
    | "showRulers"
  >>;
}

/** Selected element info */
import type { SelectedElementInfo } from "@/shared/types";
export type { SelectedElementInfo };

/** Save operation state */
export interface SaveState {
  /* "conflict" — someone else saved first. Distinct from "error": the save
     did not fail, it was refused because the server copy moved on, and the
     topbar's own chip has always had a conflict state waiting for it. */
  status: "idle" | "saving" | "error" | "conflict";
  error?: string;
  lastSavedAt?: number;
}

/** Overlay visibility state */
export interface OverlayState {
  showComponentView: boolean;
  showXRay: boolean;
  showSpacingIndicators: boolean;
  showBadges: boolean;
  showGuides: boolean;
  showGrid: boolean;
  showRulers: boolean;
  devMode: boolean;
  showSuggestions: boolean;
}

/** Sync status for real-time collaboration */
export type SyncStatus = "connected" | "syncing" | "offline";

/** Issue tracking for status indicators */
export interface Issue {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  /**
   * Set when the issue came from a design token. Carries what the Issues panel
   * needs to offer a fix: which token to rewrite, and the hint the engine's
   * `applyAutoFix` needs. Absent on issues nothing can auto-fix (a broken link
   * has no token and no mechanical repair).
   */
  tokenId?: string;
  autoFixHint?: string;
  /** Where the issue lives, e.g. "Brand › color.accent". Shown under the message. */
  location?: string;
  /**
   * The page the issue is bound to (topbar plan T10). Undefined = genuinely
   * site-wide (DS-lint token issues apply everywhere, so they have no page).
   * Element-bound producers (broken links, missing alt) stamp this when they
   * land — the Issues panel's page scope and the topbar chip count read it.
   */
  pageId?: string;
}

/**
 * Does an issue apply when the user is looking at `pageId`? Site-wide issues
 * (no pageId) apply on every page — that is why this is not a plain equality.
 */
export function issueAppliesToPage(issue: Issue, pageId: string | null): boolean {
  return issue.pageId == null || issue.pageId === pageId;
}

/** Hook return type */
export interface UseStudioStateReturn {
  // Device and zoom
  device: DeviceType;
  setDevice: React.Dispatch<React.SetStateAction<DeviceType>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;

  // Panel state
  leftPanelTab: string;
  setLeftPanelTab: (tab: string) => void;
  leftPanelSubTabs: Record<string, string>;
  setLeftPanelSubTabs: (updater: React.SetStateAction<Record<string, string>>) => void;
  rightPanelTab: string;
  setRightPanelTab: (tab: string) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openLeftPanel: () => void;

  // Navigation functions
  openLeftPanelToTab: (primaryTab: string, subTab?: string) => void;
  openBlocks: () => void;
  openPages: () => void;
  openLayers: () => void;

  // Overlay toggles
  overlays: OverlayState;
  setShowComponentView: React.Dispatch<React.SetStateAction<boolean>>;
  setShowXRay: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSpacingIndicators: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBadges: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGuides: React.Dispatch<React.SetStateAction<boolean>>;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  setShowRulers: React.Dispatch<React.SetStateAction<boolean>>;
  setDevMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOverlay: (overlay: keyof OverlayState) => void;
  toggleDevMode: () => void;

  // Sync status
  syncStatus: SyncStatus;
  setSyncStatus: React.Dispatch<React.SetStateAction<SyncStatus>>;

  // Issues tracking
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  addIssue: (issue: Omit<Issue, "id">) => void;
  removeIssue: (id: string) => void;
  clearIssues: () => void;

  // Save state
  saveState: SaveState;
  setSaveState: React.Dispatch<React.SetStateAction<SaveState>>;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  markDirty: () => void;
  markClean: () => void;

  // Undo/Redo state
  canUndo: boolean;
  setCanUndo: React.Dispatch<React.SetStateAction<boolean>>;
  canRedo: boolean;
  setCanRedo: React.Dispatch<React.SetStateAction<boolean>>;
}

// ============================================
// Helper Functions
// ============================================

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

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for managing UI state in AquibraStudio
 * Consolidates device, zoom, panels, overlays, save state, and undo/redo
 */
export function useStudioState(): UseStudioStateReturn {
  // Load saved panel state once on mount
  const savedState = React.useMemo(() => getSavedPanelState(), []);

  // Device and zoom state
  const [device, setDevice] = React.useState<DeviceType>("desktop");
  const [zoom, setZoom] = React.useState(100);

  // Panel state with persistence
  const [leftPanelTab, _setLeftPanelTab] = React.useState(savedState?.leftPanelTab || "add");
  const [leftPanelSubTabs, _setLeftPanelSubTabs] = React.useState<Record<string, string>>(
    savedState?.leftPanelSubTabs || {}
  );
  const [rightPanelTab, _setRightPanelTab] = React.useState(
    savedState?.rightPanelTab || "inspector"
  );
  // Always open on session start. Closed state is per-session only — persisting
  // `false` stranded users with an invisible panel after the rail-click toggle
  // bug closed it. Reopening is a deliberate act during this session.
  const [isLeftPanelOpen, setIsLeftPanelOpen] = React.useState(true);

  // Overlay states
  const [showComponentView, setShowComponentView] = React.useState(false);
  const [showXRay, setShowXRay] = React.useState(savedState?.overlays?.showXRay ?? false);
  const [showSpacingIndicators, setShowSpacingIndicators] = React.useState(
    savedState?.overlays?.showSpacingIndicators ?? false
  );
  const [showBadges, setShowBadges] = React.useState(savedState?.overlays?.showBadges ?? false);
  const [showGuides, setShowGuides] = React.useState(savedState?.overlays?.showGuides ?? true);
  const [showGrid, setShowGrid] = React.useState(savedState?.overlays?.showGrid ?? false);
  const [showRulers, setShowRulers] = React.useState(savedState?.overlays?.showRulers ?? false);
  const [devMode, setDevMode] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(true);

  // Sync status for collaboration
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>("connected");

  // Issues tracking
  const [issues, setIssues] = React.useState<Issue[]>([]);

  // Save state
  const [saveState, setSaveState] = React.useState<SaveState>({
    status: "idle",
    lastSavedAt: undefined,
  });
  const [isDirty, setIsDirty] = React.useState(false);

  // Undo/Redo state
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // Persist panel state to localStorage when it changes.
  // `isLeftPanelOpen` intentionally excluded — see initializer above.
  React.useEffect(() => {
    savePanelState({
      leftPanelTab,
      leftPanelSubTabs,
      rightPanelTab,
      overlays: {
        showXRay,
        showSpacingIndicators,
        showBadges,
        showGuides,
        showGrid,
        showRulers,
      },
    });
  }, [
    leftPanelTab,
    leftPanelSubTabs,
    rightPanelTab,
    showXRay,
    showSpacingIndicators,
    showBadges,
    showGuides,
    showGrid,
    showRulers,
  ]);

  // Wrapped setters that update state and trigger persistence
  const setLeftPanelTab = React.useCallback((tab: string) => {
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

  // Convenience handler for opening left panel
  const openLeftPanel = React.useCallback(() => {
    setIsLeftPanelOpen(true);
  }, []);

  // Navigation functions for specific panel tabs
  const openLeftPanelToTab = React.useCallback((primaryTab: string, subTab?: string) => {
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

  // Computed overlay state object
  const overlays: OverlayState = React.useMemo(
    () => ({
      showComponentView,
      showXRay,
      showSpacingIndicators,
      showBadges,
      showGuides,
      showGrid,
      showRulers,
      devMode,
      showSuggestions,
    }),
    [
      showComponentView,
      showXRay,
      showSpacingIndicators,
      showBadges,
      showGuides,
      showGrid,
      showRulers,
      devMode,
      showSuggestions,
    ]
  );

  // Generic overlay toggle
  const toggleOverlay = React.useCallback((overlay: keyof OverlayState) => {
    switch (overlay) {
      case "showComponentView":
        setShowComponentView((prev) => !prev);
        break;
      case "showXRay":
        setShowXRay((prev) => !prev);
        break;
      case "showSpacingIndicators":
        setShowSpacingIndicators((prev) => !prev);
        break;
      case "showBadges":
        setShowBadges((prev) => !prev);
        break;
      case "showGuides":
        setShowGuides((prev) => !prev);
        break;
      case "showGrid":
        setShowGrid((prev) => !prev);
        break;
      case "showRulers":
        setShowRulers((prev) => !prev);
        break;
      case "devMode":
        setDevMode((prev) => !prev);
        break;
      case "showSuggestions":
        setShowSuggestions((prev) => !prev);
        break;
    }
  }, []);

  // Dev Mode master toggle - enables/disables multiple features at once
  const toggleDevMode = React.useCallback(() => {
    setDevMode((prev) => {
      const newState = !prev;
      // When enabling dev mode, turn on all dev features
      // When disabling, turn them off
      setShowGrid(newState);
      setShowGuides(newState);
      setShowSpacingIndicators(newState);
      setShowBadges(newState);
      setShowComponentView(newState);
      return newState;
    });
  }, []);

  // Issue management helpers
  const addIssue = React.useCallback((issue: Omit<Issue, "id">) => {
    const newIssue: Issue = {
      ...issue,
      id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    setIssues((prev) => [...prev, newIssue]);
  }, []);

  const removeIssue = React.useCallback((id: string) => {
    setIssues((prev) => prev.filter((issue) => issue.id !== id));
  }, []);

  const clearIssues = React.useCallback(() => {
    setIssues([]);
  }, []);

  // Dirty state helpers
  const markDirty = React.useCallback(() => setIsDirty(true), []);
  const markClean = React.useCallback(() => setIsDirty(false), []);

  return {
    // Device and zoom
    device,
    setDevice,
    zoom,
    setZoom,

    // Panel state
    leftPanelTab,
    setLeftPanelTab,
    leftPanelSubTabs,
    setLeftPanelSubTabs,
    rightPanelTab,
    setRightPanelTab,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    openLeftPanel,

    // Navigation functions
    openLeftPanelToTab,
    openBlocks,
    openPages,
    openLayers,

    // Overlay toggles
    overlays,
    setShowComponentView,
    setShowXRay,
    setShowSpacingIndicators,
    setShowBadges,
    setShowGuides,
    setShowGrid,
    setShowRulers,
    setDevMode,
    setShowSuggestions,
    toggleOverlay,
    toggleDevMode,

    // Sync status
    syncStatus,
    setSyncStatus,

    // Issues tracking
    issues,
    setIssues,
    addIssue,
    removeIssue,
    clearIssues,

    // Save state
    saveState,
    setSaveState,
    isDirty,
    setIsDirty,
    markDirty,
    markClean,

    // Undo/Redo state
    canUndo,
    setCanUndo,
    canRedo,
    setCanRedo,
  };
}

export default useStudioState;
