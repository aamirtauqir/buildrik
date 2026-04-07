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
import type { ElementData } from "../../shared/types";

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

function countTree(el: ElementData | undefined): number {
  if (!el) return 0;
  return 1 + (el.children?.reduce((s, c) => s + countTree(c), 0) ?? 0);
}

function countElements(version: NamedVersion): number {
  const pages = version.snapshot?.pages;
  if (!pages || !Array.isArray(pages)) return 0;
  return pages.reduce((acc, p) => acc + countTree(p.root), 0);
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
  const [showSaveForm, setShowSaveForm] = React.useState(false);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

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
    setShowSaveForm(false);
    setIsLoading(false);
  };

  const handleSaveFormKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreateVersion();
    if (e.key === "Escape") {
      setShowSaveForm(false);
      setNewVersionName("");
    }
  };

  const handleRestore = async (version: NamedVersion) => {
    if (!composer?.versionHistory) return;
    setRestoring(version.id);
    await composer.versionHistory.restoreVersion(version.id);
    setRestoring(null);
  };

  const handleDelete = async (versionId: string) => {
    if (!composer?.versionHistory) return;
    await composer.versionHistory.deleteVersion(versionId);
    setDeleteConfirmId(null);
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
      {/* Save Version Button / Inline Form */}
      <div style={createRowStyles}>
        {showSaveForm ? (
          <div style={saveFormStyles}>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              onKeyDown={handleSaveFormKeyDown}
              placeholder="Version name (e.g. 'Before header redesign')"
              style={inputStyles}
              autoFocus
            />
            <div style={saveFormActionsStyles}>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setNewVersionName("");
                }}
                style={cancelBtnStyles}
              >
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
          </div>
        ) : (
          <button onClick={() => setShowSaveForm(true)} style={createButtonStyles}>
            <PlusIcon /> Save Version
          </button>
        )}
      </div>

      {/* Version List */}
      <div style={listContainerStyles}>
        {filteredVersions.length === 0 ? (
          <EmptyState
            icon={versions.length === 0 ? "📸" : "🔍"}
            message={versions.length === 0 ? "No versions yet" : "No matching versions"}
            hint={
              versions.length === 0
                ? "Save a version when you reach a milestone."
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
                  isDeleteConfirm={deleteConfirmId === version.id}
                  onRestore={() => handleRestore(version)}
                  onDeleteRequest={() => setDeleteConfirmId(version.id)}
                  onDeleteConfirm={() => handleDelete(version.id)}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                  composer={composer}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// Version Row Component
// ============================================

interface VersionRowProps {
  version: NamedVersion;
  isRestoring: boolean;
  isDeleteConfirm: boolean;
  onRestore: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  composer: Composer | null;
}

const VersionRow: React.FC<VersionRowProps> = ({
  version,
  isRestoring,
  isDeleteConfirm,
  onRestore,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  composer,
}) => {
  const elementCount = countElements(version);
  const relative = relativeTime(version.createdAt);

  // Inline restore confirm state
  const [restoreConfirm, setRestoreConfirm] = React.useState(false);

  // Compare diff state
  const [showCompare, setShowCompare] = React.useState(false);
  const [compareResult, setCompareResult] = React.useState<{
    available: boolean;
    summary?: string;
    changes?: Array<{ name: string; what: string }>;
  } | null>(null);

  const handleRestoreClick = () => {
    setRestoreConfirm(true);
  };

  const handleRestoreConfirm = () => {
    setRestoreConfirm(false);
    onRestore();
  };

  const handleRestoreCancel = () => {
    setRestoreConfirm(false);
  };

  const handleCompare = () => {
    if (showCompare) {
      setShowCompare(false);
      return;
    }

    // Check if compareVersions method exists
    const currentVersions = composer?.versionHistory?.getVersions() ?? [];
    const currentId = currentVersions[0]?.id;

    const compareMethod = (composer?.versionHistory as Record<string, unknown> | undefined)
      ?.compareVersions;
    if (typeof compareMethod === "function" && currentId) {
      try {
        const result = (
          compareMethod as (a: string, b: string) => { changedCount: number; changes: Array<{ elementName: string; description: string }> }
        )(currentId, version.id);
        setCompareResult({
          available: true,
          summary: `Changed ${result.changedCount ?? 0} elements`,
          changes: (result.changes ?? []).map((c) => ({
            name: c.elementName ?? "Unknown",
            what: c.description ?? "",
          })),
        });
      } catch {
        setCompareResult({ available: false });
      }
    } else {
      setCompareResult({ available: false });
    }

    setShowCompare(true);
  };

  return (
    <div
      style={versionRowStyles}
      aria-label={`Version "${version.name}" from ${relative}${elementCount > 0 ? `, ${elementCount} elements` : ""}${version.isAutoCheckpoint ? ", auto-saved" : ""}`}
    >
      {/* Main row content */}
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

      {/* Actions */}
      <div style={versionActionsStyles}>
        {restoreConfirm ? (
          <>
            <button
              onClick={handleRestoreConfirm}
              style={restoreConfirmBtnStyles}
              disabled={isRestoring}
              aria-label="Confirm restore"
            >
              {isRestoring ? "..." : "Confirm restore"}
            </button>
            <button
              onClick={handleRestoreCancel}
              style={restoreCancelBtnStyles}
              aria-label="Cancel restore"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleCompare}
              style={compareBtnStyles}
              title="Compare with current"
              aria-label={`Compare version "${version.name}"`}
            >
              {showCompare ? "Close" : "Compare"}
            </button>
            <button
              onClick={handleRestoreClick}
              style={restoreBtnStyles}
              disabled={isRestoring}
              aria-label={`Restore version "${version.name}"`}
            >
              {isRestoring ? "..." : "Restore"}
            </button>
            {isDeleteConfirm ? (
              <>
                <button
                  onClick={onDeleteConfirm}
                  style={deleteConfirmBtnStyles}
                  aria-label="Confirm delete"
                >
                  Delete
                </button>
                <button
                  onClick={onDeleteCancel}
                  style={deleteCancelBtnStyles}
                  aria-label="Cancel delete"
                >
                  ×
                </button>
              </>
            ) : (
              <button
                onClick={onDeleteRequest}
                style={deleteBtnStyles}
                title="Delete"
                aria-label={`Delete version "${version.name}"`}
              >
                ×
              </button>
            )}
          </>
        )}
      </div>

      {/* Inline Compare Diff View */}
      {showCompare && compareResult && (
        <div style={compareViewStyles}>
          {compareResult.available ? (
            <>
              <div style={compareSummaryStyles}>{compareResult.summary}</div>
              {compareResult.changes && compareResult.changes.length > 0 ? (
                <div style={compareListStyles}>
                  {compareResult.changes.map((change, idx) => (
                    <div key={idx} style={compareItemStyles}>
                      <span style={compareItemNameStyles}>{change.name}</span>
                      <span style={compareItemWhatStyles}>{change.what}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={compareNoChangesStyles}>No differences found</div>
              )}
            </>
          ) : (
            <span style={compareUnavailableStyles}>Compare not available</span>
          )}
        </div>
      )}
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

const saveFormStyles: React.CSSProperties = {
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-md, 8px)",
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const saveFormActionsStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
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
  fontSize: 11,
  fontWeight: 600,
  color: "var(--aqb-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const versionRowStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  marginBottom: 6,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 10,
  minHeight: 56,
  gap: 8,
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
  flexWrap: "wrap",
};

const restoreBtnStyles: React.CSSProperties = {
  padding: "5px 10px",
  background: "rgba(124,125,255,0.15)",
  color: "var(--aqb-primary)",
  border: "1px solid rgba(124,125,255,0.3)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
};

const restoreConfirmBtnStyles: React.CSSProperties = {
  padding: "5px 10px",
  background: "var(--aqb-error, #ef4444)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const restoreCancelBtnStyles: React.CSSProperties = {
  padding: "5px 10px",
  background: "transparent",
  color: "var(--aqb-text-secondary)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
};

const compareBtnStyles: React.CSSProperties = {
  padding: "5px 8px",
  background: "transparent",
  color: "var(--aqb-text-muted)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 11,
};

const deleteBtnStyles: React.CSSProperties = {
  padding: "5px 8px",
  background: "transparent",
  color: "var(--aqb-text-muted)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
};

const deleteConfirmBtnStyles: React.CSSProperties = {
  padding: "5px 8px",
  background: "var(--aqb-error, #ef4444)",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const deleteCancelBtnStyles: React.CSSProperties = {
  padding: "5px 8px",
  background: "transparent",
  color: "var(--aqb-text-muted)",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
};

// Compare diff view — full-width row below the version row content
const compareViewStyles: React.CSSProperties = {
  width: "100%",
  background: "var(--aqb-surface-2)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-md, 8px)",
  padding: 12,
  marginTop: 4,
};

const compareSummaryStyles: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--aqb-text-secondary)",
  marginBottom: 8,
};

const compareListStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const compareItemStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  fontSize: 12,
  alignItems: "baseline",
};

const compareItemNameStyles: React.CSSProperties = {
  color: "var(--aqb-text-primary)",
  fontWeight: 500,
  flexShrink: 0,
};

const compareItemWhatStyles: React.CSSProperties = {
  color: "var(--aqb-text-muted)",
};

const compareNoChangesStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--aqb-text-muted)",
};

const compareUnavailableStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  fontStyle: "italic",
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
  padding: "8px 10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  outline: "none",
  boxSizing: "border-box",
};

const cancelBtnStyles: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  color: "var(--aqb-text-secondary)",
  border: "1px solid var(--aqb-border)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
};

const saveBtnStyles: React.CSSProperties = {
  padding: "6px 12px",
  background: "var(--aqb-primary)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

export default VersionHistoryPanel;
