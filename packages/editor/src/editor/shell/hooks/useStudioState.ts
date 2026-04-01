/**
 * useStudioState - Composition hook for AquibraStudio UI state
 *
 * Delegates to four focused sub-hooks and adds sync status and issue tracking.
 * Public API is identical to the pre-refactor monolithic version.
 *
 * @module Editor/hooks/useStudioState
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DeviceType } from "../../../shared/types";
import type { PanelSizeMode } from "../../../shared/types/ui";
import type { GroupedTabId } from "../../rail/tabsConfig";
import { useDeviceZoom } from "./useDeviceZoom";
import { useOverlayState } from "./useOverlayState";
import { usePanelState } from "./usePanelState";
import { useSaveState } from "./useSaveState";

// ============================================
// Types (SSOT — imported by sub-hooks)
// ============================================

export type { PanelSizeMode };

/** Persisted panel state structure */
export interface PanelState {
  leftPanelTab?: string; // Raw from localStorage — may be a legacy value pre-migration
  leftPanelSubTabs?: Record<string, string>; // Stores sub-tab per primary tab
  rightPanelTab?: string;
  isLeftPanelOpen?: boolean;
  panelPinned?: boolean;
  panelSizeMode?: PanelSizeMode;
}

/** Selected element info */
export interface SelectedElementInfo {
  id: string;
  type: string;
  tagName?: string;
}

/** Save operation state */
export interface SaveState {
  status: "idle" | "saving" | "error";
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
}

/** Hook return type */
export interface UseStudioStateReturn {
  // Device and zoom
  device: DeviceType;
  setDevice: React.Dispatch<React.SetStateAction<DeviceType>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;

  // Panel state
  leftPanelTab: GroupedTabId;
  setLeftPanelTab: (tab: GroupedTabId) => void;
  leftPanelSubTabs: Record<string, string>;
  setLeftPanelSubTabs: (updater: React.SetStateAction<Record<string, string>>) => void;
  rightPanelTab: string;
  setRightPanelTab: (tab: string) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openLeftPanel: () => void;

  // Panel pin and size mode
  panelPinned: boolean;
  setPanelPinned: (pinned: boolean) => void;
  panelSizeMode: PanelSizeMode;
  setPanelSizeMode: (mode: PanelSizeMode) => void;

  // Navigation functions
  openLeftPanelToTab: (primaryTab: GroupedTabId, subTab?: string) => void;
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
// Hook Implementation
// ============================================

/**
 * Composition hook for AquibraStudio UI state.
 * Delegates concerns to focused sub-hooks and exposes a unified API.
 */
export function useStudioState(): UseStudioStateReturn {
  const deviceZoom = useDeviceZoom();
  const overlayState = useOverlayState();
  const panelState = usePanelState();
  const saveState = useSaveState();

  // Sync status for collaboration
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>("connected");

  // Issues tracking
  const [issues, setIssues] = React.useState<Issue[]>([]);

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

  return {
    ...deviceZoom,
    ...panelState,
    ...overlayState,
    ...saveState,
    syncStatus,
    setSyncStatus,
    issues,
    setIssues,
    addIssue,
    removeIssue,
    clearIssues,
  };
}

export default useStudioState;
