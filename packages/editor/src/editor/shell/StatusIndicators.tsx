import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * StatusIndicators Component
 * Displays save status, sync status, and issues count in the topbar
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SvgSave, SvgSync, SvgWarning, SvgCheck } from "../../shared/ui/Icons";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from "@/editor/shared/vibcoder";
import { formatRelativeTime } from "../../shared/utils/relativeTime";
import type { SyncStatus, Issue } from "./hooks/useStudioState";

// ============================================
// Sub-components
// ============================================

interface SaveStatusProps {
  status: "idle" | "saving" | "unsaved" | "error" | "offline";
  lastSavedAt?: number;
  onRetry?: () => void;
}

const formatLastSaved = (timestamp: number | undefined): string =>
  timestamp ? formatRelativeTime(timestamp, { showSeconds: true }) : "Not saved yet";

// Inline SVG for cloud-off icon (no external dep needed)
const SvgCloudOff: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 19H9a7 7 0 0 1-1.35-13.87A4.998 4.998 0 0 1 16.5 6h.5a5 5 0 0 1 1 9.9" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const SaveStatusIndicator: React.FC<SaveStatusProps> = ({ status, lastSavedAt, onRetry }) => {
  const [justSaved, setJustSaved] = React.useState(false);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const prevStatusRef = React.useRef(status);

  // Detect saving → idle transition and show "Saved ✓" for 3s then fade out
  React.useEffect(() => {
    if (prevStatusRef.current === "saving" && status === "idle") {
      setJustSaved(true);
      setSavedVisible(true);
      const hideTimer = setTimeout(() => setSavedVisible(false), 3000);
      const resetTimer = setTimeout(() => setJustSaved(false), 3300); // after fade completes
      prevStatusRef.current = status;
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(resetTimer);
      };
    }
    prevStatusRef.current = status;
  }, [status]);

  // Offline state: pill background
  if (status === "offline") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="status-indicator save-status save-status--offline"
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 8px",
              borderRadius: "var(--buildrick-radius-md)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--buildrick-text-muted)",
              background: "var(--buildrick-surface-3)",
              transition: `opacity var(--buildrick-duration-normal, 200ms) ease`,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14 }}>
              <SvgCloudOff />
            </span>
            <span>Offline</span>
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>No internet connection — changes will sync when reconnected</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }

  // Unsaved changes state
  if (status === "unsaved") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="status-indicator save-status save-status--unsaved"
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--buildrick-text-muted)",
              transition: `opacity var(--buildrick-duration-normal, 200ms) ease`,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "var(--bd-radius-full)",
                background: "var(--buildrick-warning)",
                flexShrink: 0,
              }}
            />
            <span>Unsaved changes</span>
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>You have unsaved changes</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }

  // Saving in-progress state
  if (status === "saving") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="status-indicator save-status save-status--saving"
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--buildrick-text-secondary)",
              transition: `opacity var(--buildrick-duration-normal, 200ms) ease`,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 14,
                height: 14,
                animation: "bd-spin 1s linear infinite",
              }}
            >
              <SvgSync />
            </span>
            <span>Saving...</span>
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Saving changes...</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="status-indicator save-status save-status--error"
            role="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--buildrick-error)",
              background: "var(--buildrick-error-light)",
              transition: `opacity var(--buildrick-duration-normal, 200ms) ease`,
              cursor: "default",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14 }}>
              <SvgWarning />
            </span>
            <span>Save failed</span>
            <span
              role="button"
              tabIndex={0}
              onClick={onRetry}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRetry?.(); }}
              style={{
                textDecoration: "underline",
                cursor: "pointer",
                color: "var(--buildrick-error)",
              }}
              aria-label="Retry save"
            >
              Retry
            </span>
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Save failed — click Retry to try again</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }

  // Idle state — "Saved ✓" shows for 3s post-save then fades; otherwise invisible
  if (justSaved) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="status-indicator save-status save-status--saved"
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--buildrick-text-muted)",
              transition: `opacity var(--buildrick-duration-normal, 200ms) ease`,
              opacity: savedVisible ? 1 : 0,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 14, height: 14 }}>
              <SvgCheck />
            </span>
            <span>Saved</span>
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>{`Last saved: ${formatLastSaved(lastSavedAt)}`}</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    );
  }

  // Idle and no recent save — render nothing (no clutter)
  return null;
};

// ============================================
// Sync Dot
// ============================================

interface SyncDotProps {
  status: SyncStatus;
}

const SYNC_DOT_CONFIG: Record<
  SyncStatus,
  { color: string; label: string; pulse: boolean }
> = {
  connected: {
    color: "var(--buildrick-success)",
    label: "Synced",
    pulse: false,
  },
  syncing: {
    color: "var(--buildrick-warning)",
    label: "Syncing",
    pulse: true,
  },
  offline: {
    color: "var(--buildrick-text-disabled)",
    label: "Disconnected",
    pulse: false,
  },
};

const SyncDot: React.FC<SyncDotProps> = ({ status }) => {
  const config = SYNC_DOT_CONFIG[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="status-indicator sync-dot"
          role="img"
          aria-label={`Sync status: ${config.label}`}
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "var(--bd-radius-full)",
            background: config.color,
            flexShrink: 0,
            animation: config.pulse ? "bd-status-pulse 1s ease-in-out infinite" : "none",
            transition: `background var(--buildrick-duration-normal, 200ms) ease`,
          }}
        />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{`Sync: ${config.label}`}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

// ============================================
// Legacy SyncIndicator (icon-based, kept for back-compat)
// ============================================

interface SyncIndicatorProps {
  status: SyncStatus;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status }) => {
  const statusConfig: Record<
    SyncStatus,
    { color: string; bg: string; label: string; animate: boolean }
  > = {
    connected: {
      color: "var(--status-synced, var(--buildrick-success))",
      bg: "var(--buildrick-success-light)",
      label: "Connected",
      animate: false,
    },
    syncing: {
      color: "var(--buildrick-text-secondary)",
      bg: "transparent",
      label: "Syncing",
      animate: true,
    },
    offline: {
      color: "var(--buildrick-text-muted)",
      bg: "transparent",
      label: "Offline",
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="status-indicator sync-status"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            color: config.color,
            background: config.bg,
            transition: `all var(--buildrick-duration-normal, 200ms) ease`,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 14,
              height: 14,
              animation: config.animate ? "bd-spin 1.5s linear infinite" : "none",
            }}
          >
            <SvgSync />
          </span>
        </div>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{`Sync: ${config.label}`}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

// ============================================
// Issues Badge
// ============================================

interface IssuesBadgeProps {
  issues: Issue[];
  onClick?: () => void;
}

const IssuesBadge: React.FC<IssuesBadgeProps> = ({ issues, onClick }) => {
  if (issues.length === 0) return null;

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;

  const hasErrors = errorCount > 0;
  const color = hasErrors ? "var(--buildrick-error)" : "var(--buildrick-warning)";
  const bg = hasErrors ? "var(--buildrick-error-light)" : "var(--buildrick-warning-light)";

  const tooltip = `${errorCount} error${errorCount !== 1 ? "s" : ""}, ${warningCount} warning${warningCount !== 1 ? "s" : ""}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="status-indicator issues-badge"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            color,
            background: bg,
            border: "none",
            cursor: "pointer",
            transition: `all var(--buildrick-duration-normal, 200ms) ease`,
          }}
          onClick={onClick}
          aria-label={`${issues.length} issues found`}
        >
          <SvgWarning />
          <span>{issues.length}</span>
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{tooltip}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

// ============================================
// Main Component
// ============================================

export interface StatusIndicatorsProps {
  /** Save operation status. Pass "unsaved" when isDirty=true and not currently saving. */
  saveStatus: "idle" | "saving" | "unsaved" | "error" | "offline";
  lastSavedAt?: number;
  syncStatus: SyncStatus;
  issues: Issue[];
  onSaveRetry?: () => void;
  onIssuesClick?: () => void;
  /** Whether to show the legacy icon-based sync indicator instead of the sync dot */
  showSyncIcon?: boolean;
}

/**
 * StatusIndicators — Displays save, sync, and issues status in the topbar.
 *
 * Save states handled:
 *   idle     — nothing shown (or "Saved ✓" for 3s after a save completes)
 *   saving   — spinner + "Saving..."
 *   unsaved  — amber dot + "Unsaved changes"
 *   error    — warning icon + "Save failed" + "Retry" button
 *   offline  — cloud-off icon + "Offline" pill
 *
 * Sync dot states (always visible, 8px circle):
 *   connected — green
 *   syncing   — amber, pulses
 *   offline   — grey/disabled
 */
export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  saveStatus,
  lastSavedAt,
  syncStatus,
  issues,
  onSaveRetry,
  onIssuesClick,
  showSyncIcon = false,
}) => {
  // Mirror network connectivity into saveStatus=offline automatically
  const [isOnline, setIsOnline] = React.useState(() => navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // When network goes offline, override save status display to "offline"
  const effectiveSaveStatus = !isOnline ? "offline" : saveStatus;

  // Derive sync dot status from network state when offline
  const effectiveSyncStatus: SyncStatus = !isOnline ? "offline" : syncStatus;

  return (
    <div
      className="status-indicators"
      aria-label="Project status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <SaveStatusIndicator
        status={effectiveSaveStatus}
        lastSavedAt={lastSavedAt}
        onRetry={onSaveRetry}
      />
      <SyncDot status={effectiveSyncStatus} />
      {showSyncIcon && <SyncIndicator status={effectiveSyncStatus} />}
      <IssuesBadge issues={issues} onClick={onIssuesClick} />
    </div>
  );
};

StatusIndicators.displayName = "StatusIndicators";

export default StatusIndicators;
