/**
 * SyncStatusIndicator - Display sync status in the UI
 * @module components/Sync/SyncStatusIndicator
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SyncManagerState } from "../../engine/sync/SyncManager";
import type { SyncStatus } from "../../services/CloudSyncService";

// ============================================================================
// TYPES
// ============================================================================

export interface SyncStatusIndicatorProps {
  /** Current sync status */
  status: SyncStatus;
  /** Sync manager state */
  managerState: SyncManagerState;
  /** Callback when user clicks to sync */
  onSync?: () => void;
  /** Compact mode (icon only) */
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  managerState,
  onSync,
  compact = false,
}) => {
  const getStatusInfo = () => {
    if (!managerState.isOnline) {
      return { icon: <OfflineIcon />, label: "Offline", color: "#94a3b8" };
    }

    if (managerState.activeConflict) {
      return { icon: <ConflictIcon />, label: "Conflict", color: "#f59e0b" };
    }

    if (status.isSyncing) {
      return { icon: <SyncingIcon />, label: "Syncing...", color: "#3b82f6" };
    }

    if (status.error) {
      return { icon: <ErrorIcon />, label: "Sync Error", color: "#ef4444" };
    }

    if (status.hasLocalChanges) {
      return { icon: <UnsyncedIcon />, label: "Unsaved changes", color: "#f59e0b" };
    }

    if (status.lastSyncedAt) {
      return { icon: <SyncedIcon />, label: "Synced", color: "#10b981" };
    }

    return { icon: <CloudIcon />, label: "Not synced", color: "#94a3b8" };
  };

  const { icon, label, color } = getStatusInfo();

  const formatLastSync = () => {
    if (!status.lastSyncedAt) return null;
    const diff = Date.now() - status.lastSyncedAt;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(status.lastSyncedAt).toLocaleDateString();
  };

  const lastSync = formatLastSync();

  if (compact) {
    return (
      <button
        onClick={onSync}
        style={{ ...compactButtonStyles, color }}
        title={label}
        disabled={status.isSyncing}
      >
        {icon}
        {managerState.pendingOperations > 0 && (
          <span style={badgeStyles}>{managerState.pendingOperations}</span>
        )}
      </button>
    );
  }

  return (
    <div style={containerStyles}>
      <button onClick={onSync} style={buttonStyles} disabled={status.isSyncing}>
        <span style={{ color }}>{icon}</span>
        <div style={textContainerStyles}>
          <span style={labelStyles}>{label}</span>
          {lastSync && <span style={lastSyncStyles}>{lastSync}</span>}
        </div>
      </button>
      {managerState.pendingOperations > 0 && (
        <span style={{ ...badgeStyles, position: "static", marginLeft: "8px" }}>
          {managerState.pendingOperations} pending
        </span>
      )}
    </div>
  );
};

// ============================================================================
// ICONS
// ============================================================================

const CloudIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
  </svg>
);

const SyncedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const SyncingIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const UnsyncedIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const ConflictIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const OfflineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 1l22 22" />
    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88" />
    <path d="M8.53 16.11a6 6 0 016.95 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
);

// ============================================================================
// STYLES
// ============================================================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const buttonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  border: "1px solid var(--aqb-border)",
  borderRadius: "6px",
  background: "var(--aqb-surface)",
  cursor: "pointer",
  transition: "all 150ms ease",
};

const compactButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  width: "32px",
  height: "32px",
  border: "none",
  borderRadius: "6px",
  background: "transparent",
  cursor: "pointer",
  transition: "all 150ms ease",
};

const textContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const labelStyles: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--aqb-text-primary)",
};

const lastSyncStyles: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--aqb-text-muted)",
};

const badgeStyles: React.CSSProperties = {
  position: "absolute",
  top: "-4px",
  right: "-4px",
  minWidth: "16px",
  height: "16px",
  padding: "0 4px",
  background: "#f59e0b",
  color: "#fff",
  fontSize: "10px",
  fontWeight: 600,
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default SyncStatusIndicator;
