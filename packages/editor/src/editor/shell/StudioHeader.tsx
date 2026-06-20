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
import { PresenceIndicators } from "../collaboration";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Users } from "lucide-react";
import { getSiteIdFromUrl } from "../../services/BuildrikSyncProvider";
import { EVENTS } from "../../shared/constants";
import { isFeatureEnabled } from "../../shared/utils/featureFlags";
import type { SyncStatus, Issue } from "./hooks/useStudioState";
import { Topbar } from "./Topbar";
import type { ToastInput } from "@/editor/shared/vibcoder";

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
  /** Network offline — edits are queued locally (60-save-states). */
  isOffline?: boolean;
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
  /** Open Keyboard Shortcuts panel (wired to topbar Help button) */
  onOpenShortcuts?: () => void;

  // Core actions
  onSave: () => void;

  /** Export HTML as zip download */
  onExportHTML?: () => void;

  /** Vercel publish flow — when present, replaces fallback handleExport on Publish click */
  onVercelPublish?: () => void;
  /** Publish workflow state — drives PublishDropdown visuals */
  publishState?: "draft" | "in-review" | "approved" | "published";
  /** True while a publish job is in flight */
  publishLoading?: boolean;
  /** Live URL after successful publish */
  publishedUrl?: string | null;

  // Toast notifications
  addToast: (input: ToastInput) => string;
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
  isOffline,
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
  onOpenShortcuts,
  onSave,
  onExportHTML,
  onVercelPublish,
  publishState,
  publishLoading,
  publishedUrl,
  addToast,
}) => {
  // Collaboration state
  const {
    users,
    currentUser,
    state: collaborationState,
    isConnected,
  } = useCollaboration(composer);

  // Gate: presence shows once a session is connected. When not connected we
  // show a visible "Collaborate" button so the session is discoverable (it was
  // only reachable via a hidden command-palette action before).
  const hasTransport = isConnected;

  const handleStartCollab = React.useCallback(() => {
    const siteId = getSiteIdFromUrl();
    if (!siteId || !composer) {
      addToast?.({ title: "Save your site first", description: "Open a saved site to collaborate.", tone: "info" });
      return;
    }
    void composer.collab.manager
      .startSession(siteId, currentUser?.name ?? "Editor")
      .catch(() =>
        addToast?.({
          title: "Couldn't start collaboration",
          description: "Try again in a moment.",
          tone: "error",
        }),
      );
  }, [composer, currentUser, addToast]);

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
        description: "Allow pop-ups.",
        tone: "warning",
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

  // Redesign P5: real topbar breadcrumb. Read the live site name + active page
  // name from the composer (populated by loadProject → importProject) instead of
  // the "My project › Home" placeholders. Reactive to project load + page switch.
  // selectedElement is a dep so a page rename committed via the inspector re-reads.
  const [crumb, setCrumb] = React.useState<{ projectName?: string; pageName?: string }>({});
  React.useEffect(() => {
    if (!composer) return;
    const read = () =>
      setCrumb({
        projectName: composer.getProjectMetadata?.()?.name || undefined,
        pageName: composer.elements?.getActivePage?.()?.name || undefined,
      });
    read();
    composer.on(EVENTS.PROJECT_LOADED, read);
    composer.on(EVENTS.PAGE_CHANGED, read);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, read);
      composer.off(EVENTS.PAGE_CHANGED, read);
    };
  }, [composer, selectedElement]);

  return (
    <Topbar
      composer={composer}
      projectName={crumb.projectName}
      pageName={crumb.pageName}
      device={device}
      zoom={zoom}
      canUndo={canUndo}
      canRedo={canRedo}
      saveStatus={saveStatus}
      isOffline={isOffline}
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
      onPublish={onVercelPublish ?? onOpenPublish ?? handleExport}
      publishState={publishState}
      publishLoading={publishLoading}
      publishedUrl={publishedUrl}
      onExportHTML={onExportHTML}
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
      onHelp={onOpenShortcuts}
      collaborationSlot={
        hasTransport ? (
          <PresenceIndicators users={users} currentUser={currentUser} state={collaborationState} />
        ) : isFeatureEnabled("collab") ? (
          // Collaboration is DEMO-ONLY (last-write-wins, 6 known P1s). The
          // CTA is gated behind VITE_FEATURE_COLLAB so it isn't exposed as
          // production-ready until a real OT/CRDT arc lands. An already-live
          // session (hasTransport) still shows presence.
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartCollab}
            aria-label="Start collaboration session"
            title="Start a real-time collaboration session (beta)"
          >
            <Users size={14} />
            <span style={{ marginLeft: 4 }}>Collaborate</span>
          </Button>
        ) : null
      }
    />
  );
};

export default StudioHeader;
