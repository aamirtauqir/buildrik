/**
 * Aquibra Studio - Topbar Component (IA Redesign 2026)
 * Clean 5-section layout: Project | Undo/Redo | Device | Preview | Publish
 *
 * REMOVED (per IA Redesign):
 * - History button → Now in Settings tab (Version History)
 * - Settings button → Now in sidebar Settings tab
 * - Zoom controls → Moved to Canvas Footer Toolbar
 * - DevMode/XRay/Suggestions toggles → Moved to Canvas Footer or Inspector
 * - Theme toggle → Moved to Design tab
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import previewIcon from "../../assets/icons/navbar/preview.svg";
import redoIcon from "../../assets/icons/navbar/redo.svg";
import undoIcon from "../../assets/icons/navbar/undo.svg";
import type { Composer } from "../../engine";
import { Tooltip } from "../../shared/ui/Tooltip";
import { BreakpointDropdown } from "./BreakpointDropdown";
import type { SyncStatus, Issue } from "./hooks/useStudioState";
import { StatusIndicators } from "./StatusIndicators";

/** Simple loading spinner for button states */
const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

export interface TopbarProps {
  composer: Composer | null;
  device: string;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: "idle" | "saving" | "error";
  isDirty: boolean;
  lastSavedAt?: number;
  previewLoading: boolean;
  publishLoading?: boolean;
  isPublished?: boolean;
  selectedElement: { id: string; type: string; tagName?: string } | null;
  // Status
  syncStatus?: SyncStatus;
  issues?: Issue[];
  /** Slot for rendering collaboration presence indicators */
  collaborationSlot?: React.ReactNode;
  /** Project name for display */
  projectName?: string;
  // Handlers
  onDeviceChange: (d: "desktop" | "tablet" | "mobile") => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
  onOpenIssues?: () => void;
  onProjectNameClick?: () => void;

  // Legacy props (kept for backward compatibility, but unused in new layout)
  /** @deprecated Zoom now in Canvas Footer */
  zoom?: number;
  /** @deprecated Zoom now in Canvas Footer */
  onZoomChange?: (z: number) => void;
  /** @deprecated Export merged into Settings > Export */
  exportLoading?: boolean;
  /** @deprecated Export merged into Settings > Export */
  onExport?: () => void;
  /** @deprecated Add Page in Pages tab */
  onAddPage?: () => void;
  /** @deprecated Templates in Add tab */
  onShowTemplates?: () => void;
  /** @deprecated AI in Inspector */
  onShowAI?: () => void;
  /** @deprecated Copilot in Inspector */
  onShowCopilot?: () => void;
  /** @deprecated X-Ray in Canvas Footer */
  showXRay?: boolean;
  /** @deprecated DevMode in Canvas Footer */
  devMode?: boolean;
  /** @deprecated Suggestions in Inspector */
  showSuggestions?: boolean;
  /** @deprecated Toggle in Canvas Footer */
  onToggleXRay?: () => void;
  /** @deprecated Toggle in Canvas Footer */
  onToggleDevMode?: () => void;
  /** @deprecated Toggle in Inspector */
  onToggleSuggestions?: () => void;
  /** @deprecated Settings in sidebar */
  onOpenProjectSettings?: () => void;
  /** @deprecated Design in sidebar */
  onOpenDesignSystem?: () => void;
  /** @deprecated History in sidebar */
  onOpenHistory?: () => void;
  /** @deprecated AI in Inspector */
  onOpenAI?: () => void;
  /** @deprecated Plugins in Settings */
  onOpenPlugins?: () => void;
  /** @deprecated Merged into onPublish */
  onOpenPublish?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  device,
  canUndo,
  canRedo,
  saveStatus,
  lastSavedAt,
  previewLoading,
  publishLoading = false,
  syncStatus = "connected",
  issues = [],
  collaborationSlot,
  projectName = "Untitled Project",
  onDeviceChange,
  onUndo,
  onRedo,
  onPreview,
  onPublish,
  onSave,
  onOpenIssues,
  onProjectNameClick,
}) => {
  return (
    <div className="navWrap">
      <div className="navBar">
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT SECTION: Project + Undo/Redo + Device Switcher
            Width: auto (content-based)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="left">
          <div className="leftRow">
            {/* Brand + Project Name */}
            <button
              className="brand"
              onClick={onProjectNameClick}
              style={{ cursor: onProjectNameClick ? "pointer" : "default" }}
              aria-label="Project menu"
            >
              <div className="brandMark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13Z"
                    stroke="var(--aqb-brand-accent)"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 17c2-5 6-9 13-13"
                    stroke="var(--aqb-brand-accent)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="brandName">
                {projectName}
                <span className="brandChevron" aria-hidden="true">
                  ▾
                </span>
              </div>
            </button>

            {/* Undo/Redo */}
            <div className="leftRowScrollable">
              <Tooltip content="Undo" shortcut="⌘Z">
                <button
                  className="pill pillIconOnly"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-disabled={!canUndo}
                  aria-label="Undo last action"
                  style={{
                    opacity: canUndo ? 1 : 0.4,
                    cursor: canUndo ? "pointer" : "not-allowed",
                    filter: canUndo ? "none" : "grayscale(100%)",
                  }}
                >
                  <span className="ico" aria-hidden="true">
                    <img src={undoIcon} alt="" className="navbar-icon" />
                  </span>
                </button>
              </Tooltip>

              <Tooltip content="Redo" shortcut="⌘⇧Z">
                <button
                  className="pill pillIconOnly"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-disabled={!canRedo}
                  aria-label="Redo last action"
                  style={{
                    opacity: canRedo ? 1 : 0.4,
                    cursor: canRedo ? "pointer" : "not-allowed",
                    filter: canRedo ? "none" : "grayscale(100%)",
                  }}
                >
                  <span className="ico" aria-hidden="true">
                    <img src={redoIcon} alt="" className="navbar-icon" />
                  </span>
                </button>
              </Tooltip>

              {/* Divider */}
              <div className="navDivider" />

              {/* Device breakpoint selector */}
              <BreakpointDropdown
                device={device as "desktop" | "tablet" | "mobile"}
                onDeviceChange={onDeviceChange}
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CENTER SECTION: Spacer + Status
            Width: flex-1 (fills remaining space)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="center" style={{ flex: 1, justifyContent: "center" }}>
          {/* Status Indicators (centered) */}
          <StatusIndicators
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            syncStatus={syncStatus}
            issues={issues}
            onSaveRetry={onSave}
            onIssuesClick={onOpenIssues}
          />

          {/* Collaboration Presence Indicators */}
          {collaborationSlot}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT SECTION: Preview + Publish
            Width: auto (content-based)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="right">
          {/* Preview Button (Secondary) */}
          <Tooltip content="Preview" shortcut="⌘P">
            <button
              className="pill"
              onClick={onPreview}
              disabled={previewLoading}
              aria-disabled={previewLoading}
              aria-label="Preview in browser"
              style={{
                opacity: previewLoading ? 0.6 : 1,
                cursor: previewLoading ? "wait" : "pointer",
              }}
            >
              <span className="ico" aria-hidden="true">
                {previewLoading ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <img src={previewIcon} alt="" className="navbar-icon" />
                )}
              </span>
              {previewLoading ? "Loading..." : "Preview"}
            </button>
          </Tooltip>

          {/* Publish Button (Primary CTA) — opens Publish sidebar tab */}
          <Tooltip content="Publish your site">
            <button
              className="pill pillPublish"
              onClick={onPublish}
              disabled={publishLoading}
              aria-disabled={publishLoading}
              aria-label="Publish site"
              style={{
                opacity: publishLoading ? 0.6 : 1,
                cursor: publishLoading ? "wait" : "pointer",
              }}
            >
              <span className="ico" aria-hidden="true">
                {publishLoading ? (
                  <LoadingSpinner size={16} />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 11c-1 .84-1.33 3.33-1.33 3.33s2.5-.33 3.33-1.33c.47-.56.47-1.42-.06-1.94a1.45 1.45 0 00-1.94-.06z" />
                    <path d="M8 10l-2-2a14.67 14.67 0 011.33-2.63A8.59 8.59 0 0114.67 1.33c0 1.81-.52 5-4 7.34A14.9 14.9 0 018 10z" />
                  </svg>
                )}
              </span>
              {publishLoading ? "Publishing..." : "Publish"}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
