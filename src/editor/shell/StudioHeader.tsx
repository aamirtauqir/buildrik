/**
 * Aquibra Studio - Header Wrapper Component
 * Wraps Topbar with business logic for preview, export, and download
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { DeviceType } from "../../shared/types";
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

const FORBIDDEN_PROTOCOLS = ["javascript:", "data:", "vbscript:"];
const FORBIDDEN_STYLE_TOKENS = ["expression", "url("];

/** Sanitize HTML for safe preview rendering - removes dangerous elements/attributes */
function sanitizeHTMLForPreview(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    // Block active content / navigation primitives
    doc
      .querySelectorAll("script,iframe,object,embed,link,meta[http-equiv],base,form")
      .forEach((n) => n.remove());

    doc.querySelectorAll("*").forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.toLowerCase();
        // Remove inline handlers or srcdoc
        if (name.startsWith("on") || name === "srcdoc") {
          el.removeAttribute(attr.name);
        } else if (
          (name === "src" || name === "href") &&
          FORBIDDEN_PROTOCOLS.some((p) => value.startsWith(p))
        ) {
          el.removeAttribute(attr.name);
        } else if (
          name === "style" &&
          FORBIDDEN_STYLE_TOKENS.some((t) => value.replace(/\s+/g, "").includes(t))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
    const body = doc.body.textContent !== null ? doc.body.outerHTML : "<body></body>";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>${body}</html>`;
  } catch {
    return "<!DOCTYPE html><html><body>Preview unavailable</body></html>";
  }
}

/** Create sandboxed preview iframe in target window */
function setupPreviewWindow(targetWindow: Window, html: string): void {
  while (targetWindow.document.head.firstChild)
    targetWindow.document.head.removeChild(targetWindow.document.head.firstChild);
  while (targetWindow.document.body.firstChild)
    targetWindow.document.body.removeChild(targetWindow.document.body.firstChild);

  const iframe = targetWindow.document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin allow-forms allow-pointer-lock");
  iframe.setAttribute("referrerpolicy", "no-referrer");
  Object.assign(iframe.style, { border: "0", width: "100%", height: "100vh" });
  iframe.srcdoc = html;
  targetWindow.document.body.appendChild(iframe);
  targetWindow.document.title = "Aquibra Preview";
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
    (d: "desktop" | "tablet" | "mobile") => {
      onDeviceChange(d);
      if (composer) composer.setDevice(d);
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
          <ConnectionQualityIndicator stats={connectionStats} isConnected={isConnected} />
          <PresenceIndicators users={users} currentUser={currentUser} state={collaborationState} />
        </>
      }
    />
  );
};

export default StudioHeader;
