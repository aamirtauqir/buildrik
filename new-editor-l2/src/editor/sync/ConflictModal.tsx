/**
 * ConflictModal - Display and resolve sync conflicts
 * @module components/Sync/ConflictModal
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SyncConflict, ConflictResolution } from "../../services/CloudSyncService";

// ============================================================================
// TYPES
// ============================================================================

export interface ConflictModalProps {
  /** The sync conflict to display */
  conflict: SyncConflict;
  /** Callback when user resolves the conflict */
  onResolve: (resolution: ConflictResolution) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ConflictModal: React.FC<ConflictModalProps> = ({ conflict, onResolve, onCancel }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeDiff = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  return (
    <div style={overlayStyles}>
      <div style={modalStyles}>
        <div style={headerStyles}>
          <WarningIcon />
          <h2 style={titleStyles}>Sync Conflict Detected</h2>
        </div>

        <p style={descriptionStyles}>
          The project has been modified both locally and on the cloud. Choose which version to keep:
        </p>

        <div style={versionsContainerStyles}>
          <div style={versionCardStyles}>
            <div style={versionHeaderStyles}>
              <LocalIcon />
              <span style={versionLabelStyles}>Local Version</span>
            </div>
            <div style={versionMetaStyles}>
              <div>Modified: {formatDate(conflict.localModifiedAt)}</div>
              <div style={timeAgoStyles}>{formatTimeDiff(conflict.localModifiedAt)}</div>
            </div>
            <button
              onClick={() => onResolve("keep-local")}
              style={{ ...buttonStyles, ...primaryButtonStyles }}
            >
              Keep Local
            </button>
          </div>

          <div style={vsStyles}>VS</div>

          <div style={versionCardStyles}>
            <div style={versionHeaderStyles}>
              <CloudIcon />
              <span style={versionLabelStyles}>Cloud Version</span>
            </div>
            <div style={versionMetaStyles}>
              <div>Modified: {formatDate(conflict.remoteModifiedAt)}</div>
              <div style={timeAgoStyles}>{formatTimeDiff(conflict.remoteModifiedAt)}</div>
            </div>
            <button
              onClick={() => onResolve("keep-remote")}
              style={{ ...buttonStyles, ...secondaryButtonStyles }}
            >
              Keep Cloud
            </button>
          </div>
        </div>

        <div style={footerStyles}>
          {onCancel && (
            <button onClick={onCancel} style={cancelButtonStyles}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ICONS
// ============================================================================

const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const LocalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const CloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
  </svg>
);

// ============================================================================
// STYLES
// ============================================================================

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
};

const modalStyles: React.CSSProperties = {
  background: "var(--aqb-surface, #fff)",
  borderRadius: "12px",
  padding: "24px",
  maxWidth: "500px",
  width: "90%",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
};

const headerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "16px",
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const descriptionStyles: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "14px",
  color: "var(--aqb-text-secondary, #666)",
  lineHeight: 1.5,
};

const versionsContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "20px",
};

const versionCardStyles: React.CSSProperties = {
  flex: 1,
  padding: "16px",
  background: "var(--aqb-surface-2, #f5f5f5)",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const versionHeaderStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const versionLabelStyles: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const versionMetaStyles: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--aqb-text-secondary)",
};

const timeAgoStyles: React.CSSProperties = {
  color: "var(--aqb-accent)",
  fontWeight: 500,
};

const vsStyles: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
};

const buttonStyles: React.CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 150ms ease",
};

const primaryButtonStyles: React.CSSProperties = {
  background: "var(--aqb-accent)",
  color: "#fff",
};

const secondaryButtonStyles: React.CSSProperties = {
  background: "var(--aqb-surface-3)",
  color: "var(--aqb-text-primary)",
};

const footerStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

const cancelButtonStyles: React.CSSProperties = {
  padding: "8px 16px",
  border: "none",
  background: "transparent",
  color: "var(--aqb-text-muted)",
  fontSize: "13px",
  cursor: "pointer",
};

export default ConflictModal;
