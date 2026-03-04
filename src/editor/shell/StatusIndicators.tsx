/**
 * StatusIndicators Component
 * Displays save status, sync status, and issues count in the topbar
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SvgSave, SvgSync, SvgWarning, SvgCheck } from "../../shared/ui/Icons";
import { Tooltip } from "../../shared/ui/Tooltip";
import type { SyncStatus, Issue } from "./hooks/useStudioState";

// ============================================
// Sub-components
// ============================================

interface SaveStatusProps {
  status: "idle" | "saving" | "error";
  lastSavedAt?: number;
  onRetry?: () => void;
}

/** Format relative time for last saved */
const formatLastSaved = (timestamp: number | undefined): string => {
  if (!timestamp) return "Not saved yet";
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(timestamp).toLocaleDateString();
};

const SaveStatusIndicator: React.FC<SaveStatusProps> = ({ status, lastSavedAt, onRetry }) => {
  const statusConfig = {
    idle: {
      color: "var(--status-saved, #22c55e)",
      bg: "rgba(34, 197, 94, 0.1)",
      label: "Saved",
      icon: <SvgCheck />,
    },
    saving: {
      color: "var(--blue, #4b8dff)",
      bg: "rgba(75, 141, 255, 0.1)",
      label: "Saving...",
      icon: <SvgSave />,
    },
    error: {
      color: "var(--status-error, #ef4444)",
      bg: "rgba(239, 68, 68, 0.1)",
      label: "Error",
      icon: <SvgWarning />,
    },
  };

  const config = statusConfig[status];
  const tooltipContent =
    status === "error"
      ? "Save failed - click to retry"
      : status === "saving"
        ? "Saving changes..."
        : `Last saved: ${formatLastSaved(lastSavedAt)}`;

  return (
    <Tooltip content={tooltipContent}>
      <div
        className="status-indicator save-status"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: config.color,
          background: config.bg,
          transition: "all 0.2s ease",
          cursor: status === "error" ? "pointer" : "default",
        }}
        onClick={status === "error" ? onRetry : undefined}
        role={status === "error" ? "button" : undefined}
        tabIndex={status === "error" ? 0 : undefined}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            animation: status === "saving" ? "pulse 1s infinite" : "none",
          }}
        >
          {config.icon}
        </span>
        <span>{config.label}</span>
      </div>
    </Tooltip>
  );
};

interface SyncIndicatorProps {
  status: SyncStatus;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status }) => {
  const statusConfig: Record<
    SyncStatus,
    { color: string; bg: string; label: string; animate: boolean }
  > = {
    connected: {
      color: "var(--status-synced, #22c55e)",
      bg: "rgba(34, 197, 94, 0.1)",
      label: "Connected",
      animate: false,
    },
    syncing: {
      color: "var(--blue, #4b8dff)",
      bg: "rgba(75, 141, 255, 0.1)",
      label: "Syncing",
      animate: true,
    },
    offline: {
      color: "var(--status-offline, #475569)",
      bg: "rgba(71, 85, 105, 0.1)",
      label: "Offline",
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Tooltip content={`Sync: ${config.label}`}>
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
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            animation: config.animate ? "spin 1.5s linear infinite" : "none",
          }}
        >
          <SvgSync />
        </span>
      </div>
    </Tooltip>
  );
};

interface IssuesBadgeProps {
  issues: Issue[];
  onClick?: () => void;
}

const IssuesBadge: React.FC<IssuesBadgeProps> = ({ issues, onClick }) => {
  if (issues.length === 0) return null;

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;

  const hasErrors = errorCount > 0;
  const color = hasErrors ? "var(--status-error, #ef4444)" : "var(--status-saving, #f59e0b)";
  const bg = hasErrors ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)";

  const tooltip = `${errorCount} error${errorCount !== 1 ? "s" : ""}, ${warningCount} warning${warningCount !== 1 ? "s" : ""}`;

  return (
    <Tooltip content={tooltip}>
      <button
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
          transition: "all 0.2s ease",
        }}
        onClick={onClick}
        aria-label={`${issues.length} issues found`}
      >
        <SvgWarning />
        <span>{issues.length}</span>
      </button>
    </Tooltip>
  );
};

// ============================================
// Main Component
// ============================================

export interface StatusIndicatorsProps {
  saveStatus: "idle" | "saving" | "error";
  lastSavedAt?: number;
  syncStatus: SyncStatus;
  issues: Issue[];
  onSaveRetry?: () => void;
  onIssuesClick?: () => void;
}

/**
 * StatusIndicators - Displays save, sync, and issues status
 */
export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  saveStatus,
  lastSavedAt,
  syncStatus,
  issues,
  onSaveRetry,
  onIssuesClick,
}) => {
  return (
    <div
      className="status-indicators"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} onRetry={onSaveRetry} />
      <SyncIndicator status={syncStatus} />
      <IssuesBadge issues={issues} onClick={onIssuesClick} />
    </div>
  );
};

StatusIndicators.displayName = "StatusIndicators";

export default StatusIndicators;
