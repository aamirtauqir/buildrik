/**
 * Aquibra Studio - Header Wrapper Component
 * Wraps Topbar with business logic for preview, export, and download
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { DeviceType } from "../../shared/types";
import { sanitizeHTMLForPreview, setupPreviewWindow } from "../export/ExportUtils";
import { useCollaboration } from "../canvas/hooks/useCollaboration";
import { PresenceIndicators, ConnectionQualityIndicator } from "../collaboration";
import { SyncStatusIndicator } from "../sync/SyncStatusIndicator";
import type { SyncStatus, Issue } from "./hooks/useStudioState";
import { useSyncStatus } from "./hooks/useSyncStatus";
import { Topbar } from "./Topbar";

/** Toast notification interface */
interface ToastParams {
  title: string;
  message: string;
  variant: "info" | "success" | "warning" | "error";
}

/** Selected element minimal info */
export interface SelectedElementInfo {
  id: string;
  type: string;
  tagName?: string;
}

export interface StudioHeaderProps {
  /** Composer instance */
  composer: Composer | null;
  /** Current device breakpoint */
  device: DeviceType;
  /** Current zoom level */
  zoom: number;
  /** Can undo history */
  canUndo: boolean;
  /** Can redo history */
  canRedo: boolean;
  /** Save status indicator */
  saveStatus: "idle" | "saving" | "error";
  /** Has unsaved changes */
  isDirty: boolean;
  /** Last saved timestamp */
  lastSaved: Date | null;
  /** Last saved as timestamp number */
  lastSavedAt?: number;
  /** Preview loading state */
  previewLoading: boolean;
  /** Export loading state */
  exportLoading: boolean;
  /** Currently selected element */
  selectedElement: SelectedElementInfo | null;
  /** X-Ray mode enabled */
  showXRay?: boolean;
  /** Dev Mode enabled */
  devMode?: boolean;
  /** Show suggestions enabled */
  showSuggestions?: boolean;
  /** Sync status */
  studioSyncStatus?: SyncStatus;
  /** Issues list */
  issues?: Issue[];

  // Callbacks for state changes
  onDeviceChange: (device: DeviceType) => void;
  onZoomChange: (zoom: number) => void;
  onSetPreviewLoading: (loading: boolean) => void;
  onSetExportLoading: (loading: boolean) => void;

  // UI toggles
  onShowTemplates: () => void;
  onShowAI: () => void;
  onShowCopilot?: () => void;
  onShowExporter: () => void;
  onToggleXRay: () => void;
  onToggleDevMode?: () => void;
  onToggleSuggestions?: () => void;
  onAddPage?: () => void;

  // Global settings menu handlers
  onOpenProjectSettings?: () => void;
  onOpenDesignSystem?: () => void;
  onOpenPublish?: () => void;
  onOpenPlugins?: () => void;
  onOpenHistory?: () => void;
  onOpenIssues?: () => void;

  // Core actions
  onSave: () => void;

  // Toast notifications
  addToast: (params: ToastParams) => void;
}


/**
 * StudioHeader Component
 * Wrapper around Topbar with preview, export, and download logic
 */
export const StudioHeader: React.FC<StudioHeaderProps> = ({
  composer,
  device,
  zoom,
  canUndo,
  canRedo,
  saveStatus,
  isDirty,
  lastSaved,
  lastSavedAt,
  previewLoading,
  exportLoading,
  selectedElement,
  showXRay = false,
  devMode = false,
  showSuggestions = true,
  studioSyncStatus = "connected",
  issues = [],
  onDeviceChange,
  onZoomChange,
  onSetPreviewLoading,
  onSetExportLoading,
  onShowTemplates,
  onShowAI,
  onShowCopilot,
  onShowExporter,
  onToggleXRay,
  onToggleDevMode,
  onToggleSuggestions,
  onAddPage,
  onOpenProjectSettings,
  onOpenDesignSystem,
  onOpenPublish,
  onOpenPlugins,
  onOpenHistory,
  onOpenIssues,
  onSave,
  addToast,
}) => {
  // Collaboration state
  const {
    users,
    currentUser,
    state: collaborationState,
    isConnected,
    connectionStats,
  } = useCollaboration(composer);

  // Gate: no real-time transport in demo — flip when WebSocket/OT transport is connected
  const hasTransport = isConnected;

  // Sync state
  const {
    status: syncStatus,
    managerState: syncManagerState,
    sync: handleSync,
  } = useSyncStatus(composer);

  /**
   * Handle preview - opens sanitized HTML in new window with sandboxed iframe
   */
  const handlePreview = React.useCallback(() => {
    if (previewLoading) return;
    onSetPreviewLoading(true);

    const rawHtml =
      composer?.exportHTML().combined || "<!DOCTYPE html><html><body>No content</body></html>";
    const html = sanitizeHTMLForPreview(rawHtml);
    const previewWindow = window.open("", "_blank");

    if (previewWindow) {
      setupPreviewWindow(previewWindow, html);
    } else {
      addToast({
        title: "Preview blocked",
        message: "Allow pop-ups.",
        variant: "warning",
      });
    }

    setTimeout(() => onSetPreviewLoading(false), 600);
  }, [composer, previewLoading, onSetPreviewLoading, addToast]);

  /**
   * Handle export - show export modal
   */
  const handleExport = React.useCallback(() => {
    onSetExportLoading(true);
    onShowExporter();
    setTimeout(() => onSetExportLoading(false), 500);
  }, [onSetExportLoading, onShowExporter]);

  /**
   * Handle device change - updates device and notifies composer
   */
  const handleDeviceChange = React.useCallback(
    (d: "desktop" | "tablet" | "mobile" | "wide") => {
      onDeviceChange(d as DeviceType);
      if (composer) composer.setDevice(d as DeviceType);
    },
    [composer, onDeviceChange]
  );

  /**
   * Handle zoom change - updates zoom and notifies composer
   */
  const handleZoomChange = React.useCallback(
    (z: number) => {
      onZoomChange(z);
      if (composer) composer.setZoom(z);
    },
    [composer, onZoomChange]
  );

  // Compute lastSavedAt from lastSaved Date if not provided
  const computedLastSavedAt = lastSavedAt ?? (lastSaved ? lastSaved.getTime() : undefined);

  return (
    <Topbar
      composer={composer}
      device={device}
      zoom={zoom}
      canUndo={canUndo}
      canRedo={canRedo}
      saveStatus={saveStatus}
      isDirty={isDirty}
      lastSavedAt={computedLastSavedAt}
      previewLoading={previewLoading}
      exportLoading={exportLoading}
      selectedElement={selectedElement}
      showXRay={showXRay}
      devMode={devMode}
      showSuggestions={showSuggestions}
      syncStatus={studioSyncStatus}
      issues={issues}
      onDeviceChange={handleDeviceChange}
      onZoomChange={handleZoomChange}
      onAddPage={onAddPage}
      onUndo={() => composer?.history.undo()}
      onRedo={() => composer?.history.redo()}
      onShowTemplates={onShowTemplates}
      onShowAI={onShowAI}
      onShowCopilot={onShowCopilot}
      onPreview={handlePreview}
      onPublish={onOpenPublish || handleExport}
      onExport={handleExport}
      onSave={onSave}
      onToggleXRay={onToggleXRay}
      onToggleDevMode={onToggleDevMode}
      onToggleSuggestions={onToggleSuggestions}
      onOpenProjectSettings={onOpenProjectSettings}
      onOpenDesignSystem={onOpenDesignSystem}
      onOpenPublish={onOpenPublish}
      onOpenPlugins={onOpenPlugins}
      onOpenHistory={onOpenHistory}
      onOpenAI={onShowAI}
      onOpenIssues={onOpenIssues}
      collaborationSlot={
        <>
          <SyncStatusIndicator
            status={syncStatus}
            managerState={syncManagerState}
            onSync={handleSync}
            compact
          />
          {hasTransport && (
            <ConnectionQualityIndicator stats={connectionStats} isConnected={isConnected} />
          )}
          {hasTransport && (
            <PresenceIndicators users={users} currentUser={currentUser} state={collaborationState} />
          )}
        </>
      }
    />
  );
};

export default StudioHeader;
