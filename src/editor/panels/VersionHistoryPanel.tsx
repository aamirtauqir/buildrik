/**
 * Version History Panel
 * Shows saved versions with restore/delete actions
 * Grouped by date (Today, Yesterday, older dates)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import type { NamedVersion } from "../../shared/types/versions";
import { Modal } from "../../shared/ui";

export interface VersionHistoryPanelProps {
  composer: Composer | null;
  searchQuery?: string;
}

// ============================================
// Date Helpers
// ============================================

function getDateGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function countElements(version: NamedVersion): number {
  const pages = version.snapshot?.pages;
  if (!pages || !Array.isArray(pages)) return 0;
  return pages.reduce((acc: number, p: { elements?: unknown[] }) => acc + (p.elements?.length ?? 0), 0);
}

function groupVersionsByDate(versions: NamedVersion[]): Map<string, NamedVersion[]> {
  const groups = new Map<string, NamedVersion[]>();
  versions.forEach((v) => {
    const group = getDateGroup(v.createdAt);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(v);
  });
  return groups;
}

// ============================================
// Component
// ============================================

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  composer,
  searchQuery = "",
}) => {
  const [versions, setVersions] = React.useState<NamedVersion[]>([]);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showRestoreModal, setShowRestoreModal] = React.useState<NamedVersion | null>(null);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Load versions
  React.useEffect(() => {
    if (!composer?.versionHistory) return;
    const loadVersions = () => setVersions(composer.versionHistory.getVersions());
    loadVersions();
    composer.on(EVENTS.VERSION_LIST_UPDATED, loadVersions);
    return () => {
      composer.off(EVENTS.VERSION_LIST_UPDATED, loadVersions);
    };
  }, [composer]);

  const handleCreateVersion = async () => {
    if (!composer?.versionHistory || !newVersionName.trim()) return;
    setIsLoading(true);
    await composer.versionHistory.createVersion(newVersionName.trim());
    setNewVersionName("");
    setShowCreateModal(false);
    setIsLoading(false);
  };

  const handleRestore = async (version: NamedVersion) => {
    if (!composer?.versionHistory) return;
    setRestoring(version.id);
    await composer.versionHistory.restoreVersion(version.id);
    setRestoring(null);
    setShowRestoreModal(null);
  };

  const handleDelete = async (versionId: string, versionName: string) => {
    if (!composer?.versionHistory) return;
    if (!confirm(`Delete version "${versionName}"?`)) return;
    await composer.versionHistory.deleteVersion(versionId);
  };

  // Filter versions by search query
  const filteredVersions = React.useMemo(() => {
    if (!searchQuery.trim()) return versions;
    const query = searchQuery.toLowerCase();
    return versions.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        getDateGroup(v.createdAt).toLowerCase().includes(query) ||
        formatTime(v.createdAt).includes(query)
    );
  }, [versions, searchQuery]);

  if (!composer?.versionHistory?.isAvailable()) {
    return (
      <div style={containerStyles}>
        <EmptyState
          icon="📋"
          message="Version history appears here as you save changes."
          hint="Use Ctrl+Z for undo. Saved versions persist across sessions."
        />
      </div>
    );
  }

  const groupedVersions = groupVersionsByDate(filteredVersions);

  return (
    <div style={containerStyles}>
      {/* Create Version Button */}
      <div style={createRowStyles}>
        <button onClick={() => setShowCreateModal(true)} style={createButtonStyles}>
          <PlusIcon /> Create checkpoint
        </button>
      </div>

      {/* Version List */}
      <div style={listContainerStyles}>
        {filteredVersions.length === 0 ? (
          <EmptyState
            icon={versions.length === 0 ? "📸" : "🔍"}
            message={versions.length === 0 ? "No versions yet" : "No matching versions"}
            hint={
              versions.length === 0
                ? "Create a checkpoint when you reach a milestone."
                : "Try a different search term."
            }
          />
        ) : (
          Array.from(groupedVersions.entries()).map(([dateGroup, groupVersions]) => (
            <div key={dateGroup} style={dateGroupStyles}>
              <div style={dateGroupHeaderStyles}>{dateGroup}</div>
              {groupVersions.map((version) => (
                <VersionRow
                  key={version.id}
                  version={version}
                  isRestoring={restoring === version.id}
                  onRestore={() => setShowRestoreModal(version)}
                  onDelete={() => handleDelete(version.id, version.name)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Checkpoint"
        size="sm"
      >
        <input
          type="text"
          value={newVersionName}
          onChange={(e) => setNewVersionName(e.target.value)}
          placeholder="e.g., Before header redesign"
          style={inputStyles}
          autoFocus
        />
        <div style={modalActionsStyles}>
          <button onClick={() => setShowCreateModal(false)} style={cancelBtnStyles}>
            Cancel
          </button>
          <button
            onClick={handleCreateVersion}
            style={saveBtnStyles}
            disabled={!newVersionName.trim() || isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={!!showRestoreModal}
        onClose={() => setShowRestoreModal(null)}
        title="Restore version?"
        size="sm"
      >
        <p style={restoreMessageStyles}>
          This will create a new version from the restored state. You can restore back anytime.
        </p>
        <div style={modalActionsStyles}>
          <button onClick={() => setShowRestoreModal(null)} style={cancelBtnStyles}>
            Cancel
          </button>
          <button
            onClick={() => showRestoreModal && handleRestore(showRestoreModal)}
            style={saveBtnStyles}
          >
            Restore
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ============================================
// Version Row Component
// ============================================

interface VersionRowProps {
  version: NamedVersion;
  isRestoring: boolean;
  onRestore: () => void;
  onDelete: () => void;
}

const VersionRow: React.FC<VersionRowProps> = ({ version, isRestoring, onRestore, onDelete }) => {
  const elementCount = countElements(version);
  const relative = relativeTime(version.createdAt);
  return (
    <div
      style={versionRowStyles}
      aria-label={`Version "${version.name}" from ${relative}${elementCount > 0 ? `, ${elementCount} elements` : ""}${version.isAutoCheckpoint ? ", auto-saved" : ""}`}
    >
      <div style={versionRowLeftStyles}>
        <div style={avatarStyles}>
          <UserIcon />
        </div>
        <div style={versionInfoStyles}>
          <div style={versionNameStyles}>{version.name}</div>
          <div style={versionMetaStyles}>
            {formatTime(version.createdAt)}
            <span style={{ color: "var(--aqb-text-muted)", fontSize: 12 }}>{relative}</span>
            {elementCount > 0 && (
              <span style={changeBadgeStyles} aria-label={`${elementCount} elements`}>
                {elementCount} el
              </span>
            )}
            {version.isAutoCheckpoint && <span style={autoBadgeStyles}>Auto</span>}
          </div>
        </div>
      </div>
      <div style={versionActionsStyles}>
        <button
          onClick={onRestore}
          style={restoreBtnStyles}
          disabled={isRestoring}
          aria-label={`Restore version "${version.name}"`}
        >
          {isRestoring ? "..." : "Restore"}
        </button>
        <button
          onClick={onDelete}
          style={deleteBtnStyles}
          title="Delete"
          aria-label={`Delete version "${version.name}"`}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  icon: string;
  message: string;
  hint?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, hint }) => (
  <div style={emptyStateStyles}>
    <span style={emptyIconStyles}>{icon}</span>
    <p style={emptyMessageStyles}>{message}</p>
    {hint && <p style={emptyHintStyles}>{hint}</p>}
  </div>
);

// ============================================
// Icons
// ============================================

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 3v8M3 7h8" />
  </svg>
);

const UserIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <circle cx="6" cy="4" r="2" />
    <path d="M2 11a4 4 0 0 1 8 0" />
  </svg>
);

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-2)",
  color: "var(--aqb-text-primary)",
  fontSize: 12,
};

const createRowStyles: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid var(--aqb-border)",
};

const createButtonStyles: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "10px 16px",
  background: "var(--aqb-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const listContainerStyles: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 12,
};

const dateGroupStyles: React.CSSProperties = { marginBottom: 16 };

const dateGroupHeaderStyles: React.CSSProperties = {
  padding: "4px 0 8px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const versionRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  marginBottom: 6,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 10,
  minHeight: 56,
};

const versionRowLeftStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: 1,
  minWidth: 0,
};

const avatarStyles: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "var(--aqb-surface-4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--aqb-text-muted)",
  flexShrink: 0,
};

const versionInfoStyles: React.CSSProperties = { flex: 1, minWidth: 0 };

const versionNameStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const versionMetaStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const changeBadgeStyles: React.CSSProperties = {
  padding: "1px 6px",
  background: "rgba(99,102,241,0.12)",
  color: "var(--aqb-primary)",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
};

const autoBadgeStyles: React.CSSProperties = {
  padding: "1px 4px",
  background: "rgba(255,255,255,0.08)",
  borderRadius: 4,
  fontSize: 12,
  textTransform: "uppercase",
};

const versionActionsStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
};

const restoreBtnStyles: React.CSSProperties = {
  padding: "6px 12px",
  background: "rgba(124,125,255,0.15)",
  color: "var(--aqb-primary)",
  border: "1px solid rgba(124,125,255,0.3)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
};

const deleteBtnStyles: React.CSSProperties = {
  padding: "6px 8px",
  background: "transparent",
  color: "var(--aqb-text-muted)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
};

const emptyStateStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 32,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
};

const emptyIconStyles: React.CSSProperties = {
  width: 48,
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.05)",
  borderRadius: 12,
  marginBottom: 12,
  fontSize: 24,
};

const emptyMessageStyles: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--aqb-text-secondary)",
};

const emptyHintStyles: React.CSSProperties = { fontSize: 12, marginTop: 4 };

const inputStyles: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 16,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const modalActionsStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const cancelBtnStyles: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  color: "var(--aqb-text-secondary)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
};

const saveBtnStyles: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--aqb-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const restoreMessageStyles: React.CSSProperties = {
  fontSize: 13,
  color: "var(--aqb-text-secondary)",
  marginBottom: 16,
  lineHeight: 1.5,
};

export default VersionHistoryPanel;
