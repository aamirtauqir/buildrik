/**
 * VersionHistoryPanel - Saves view with FAB, compare, restore, delete
 * Phase 3: Uses useVersionHistory hook, FAB design, inline confirmations
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useVersionHistory } from "../../shared/hooks/useVersionHistory";
import { formatRelativeTime } from "../../editor/sidebar/tabs/history/helpers";
import { SaveIcon } from "../../editor/sidebar/tabs/history/icons";

import type { Composer } from "../../engine";

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

// ============================================
// Empty State
// ============================================

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  hint?: React.ReactNode;
}

function EmptyState({ icon, message, hint }: EmptyStateProps) {
  return (
    <div className="aqb-ht-empty">
      <div className="aqb-ht-empty__icon">{icon}</div>
      <p className="aqb-ht-empty__title">{message}</p>
      {hint && <p className="aqb-ht-empty__desc">{hint}</p>}
    </div>
  );
}

// ============================================
// Version Row Component
// ============================================

interface VersionRowProps {
  version: { id: string; name: string; createdAt: number; isAutoCheckpoint?: boolean };
  isRestoring: boolean;
  isDeleteConfirm: boolean;
  onRestore: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  elementCount?: number;
}

function VersionRow({
  version,
  isRestoring,
  isDeleteConfirm,
  onRestore,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  elementCount = 0,
}: VersionRowProps) {
  const relative = formatRelativeTime(version.createdAt);

  return (
    <div
      className={`aqb-ht-version-row${isDeleteConfirm ? " aqb-ht-version-row--delete-confirm" : ""}`}
      aria-label={`Version "${version.name}" from ${relative}`}
    >
      {/* Version Info */}
      <div className="aqb-ht-version-row__info">
        <div className="aqb-ht-version-row__avatar">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="6" cy="4" r="2" />
            <path d="M2 11a4 4 0 0 1 8 0" />
          </svg>
        </div>
        <div className="aqb-ht-version-row__details">
          <div className="aqb-ht-version-row__name">{version.name}</div>
          <div className="aqb-ht-version-row__meta">
            {formatTime(version.createdAt)}
            <span className="aqb-ht-version-row__relative">{relative}</span>
            {elementCount > 0 && (
              <span className="aqb-ht-badge aqb-ht-badge--count">{elementCount} el</span>
            )}
            {version.isAutoCheckpoint && (
              <span className="aqb-ht-badge aqb-ht-badge--auto">Auto</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="aqb-ht-version-row__actions">
        {isDeleteConfirm ? (
          <>
            <button
              onClick={onDeleteConfirm}
              className="aqb-ht-btn aqb-ht-btn--danger"
              aria-label="Confirm delete"
            >
              Delete
            </button>
            <button
              onClick={onDeleteCancel}
              className="aqb-ht-btn aqb-ht-btn--ghost"
              aria-label="Cancel delete"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onRestore}
              className="aqb-ht-btn aqb-ht-btn--restore"
              disabled={isRestoring}
              aria-label={`Restore version "${version.name}"`}
            >
              {isRestoring ? "..." : "Restore"}
            </button>
            <button
              onClick={onDeleteRequest}
              className="aqb-ht-btn aqb-ht-btn--ghost"
              aria-label={`Delete version "${version.name}"`}
            >
              ×
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function VersionHistoryPanel({
  composer,
  searchQuery = "",
}: {
  composer: Composer | null;
  searchQuery?: string;
}) {
  const { versions, isAvailable, isLoading, createVersion, restoreVersion, deleteVersion } =
    useVersionHistory(composer);

  // Save form state
  const [showSaveForm, setShowSaveForm] = React.useState(false);
  const [newVersionName, setNewVersionName] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Restore confirmation state
  const [restoreConfirmId, setRestoreConfirmId] = React.useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // Restoring state
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

  // Handle create version
  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) return;
    setIsSaving(true);
    await createVersion(newVersionName.trim());
    setNewVersionName("");
    setShowSaveForm(false);
    setIsSaving(false);
  };

  // Handle save form key down
  const handleSaveFormKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreateVersion();
    if (e.key === "Escape") {
      setShowSaveForm(false);
      setNewVersionName("");
    }
  };

  // Handle restore click (shows inline confirmation)
  const handleRestoreClick = (versionId: string) => {
    setRestoreConfirmId(versionId);
  };

  // Handle restore confirm
  const handleRestoreConfirm = async (versionId: string) => {
    setRestoreConfirmId(null);
    setRestoringId(versionId);
    await restoreVersion(versionId);
    setRestoringId(null);
  };

  // Handle restore cancel
  const handleRestoreCancel = () => {
    setRestoreConfirmId(null);
  };

  // Handle delete request
  const handleDeleteRequest = (versionId: string) => {
    setDeleteConfirmId(versionId);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async (versionId: string) => {
    setDeleteConfirmId(null);
    await deleteVersion(versionId);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  // Filter versions by search query
  const filteredVersions = React.useMemo(() => {
    if (!searchQuery.trim()) return versions;
    const query = searchQuery.toLowerCase();
    return versions.filter((v) => v.name.toLowerCase().includes(query));
  }, [versions, searchQuery]);

  // Group versions by date
  const groupedVersions = React.useMemo(() => {
    const groups = new Map<string, typeof versions>();
    for (const v of filteredVersions) {
      const group = getDateGroup(v.createdAt);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(v);
    }
    return groups;
  }, [filteredVersions]);

  if (!isAvailable) {
    return (
      <div className="aqb-ht-version-panel">
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="16" cy="16" r="12" />
              <path d="M16 10v6l4 2" />
            </svg>
          }
          message="Version history appears here as you save changes."
          hint="Use Ctrl+Z for undo. Saved versions persist across sessions."
        />
      </div>
    );
  }

  return (
    <div className="aqb-ht-version-panel">
      {/* Save Version FAB / Inline Form */}
      <div className="aqb-ht-version-panel__header">
        {showSaveForm ? (
          <div className="aqb-ht-save-form">
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              onKeyDown={handleSaveFormKeyDown}
              placeholder="Version name (e.g. 'Before header redesign')"
              className="aqb-ht-save-form__input"
              autoFocus
              maxLength={50}
            />
            <div className="aqb-ht-save-form__actions">
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setNewVersionName("");
                }}
                className="aqb-ht-btn aqb-ht-btn--ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVersion}
                className="aqb-ht-btn aqb-ht-btn--primary"
                disabled={!newVersionName.trim() || isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            className="aqb-ht-fab"
            aria-label="Save version"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3v8M3 7h8" />
            </svg>
            Save Version
          </button>
        )}
      </div>

      {/* Version List */}
      <div className="aqb-ht-version-list">
        {filteredVersions.length === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="8" y="6" width="16" height="20" rx="2" />
                <path d="M12 12h8M12 16h8M12 20h4" />
              </svg>
            }
            message={versions.length === 0 ? "No saved versions yet" : "No matching versions"}
            hint={
              versions.length === 0 ? (
                <>
                  Save Version creates a named milestone you can restore anytime.
                </>
              ) : (
                "Try a different search term."
              )
            }
          />
        ) : (
          Array.from(groupedVersions.entries()).map(([dateGroup, groupVersions]) => (
            <div key={dateGroup} className="aqb-ht-version-group">
              <div className="aqb-ht-version-group__label">{dateGroup}</div>
              {groupVersions.map((version) => (
                <div key={version.id}>
                  {/* Inline restore confirmation */}
                  {restoreConfirmId === version.id && (
                    <div className="aqb-ht-inline-confirm aqb-ht-inline-confirm--restore">
                      <span className="aqb-ht-inline-confirm__text">
                        Restore to "{version.name}"?
                      </span>
                      <button
                        onClick={() => handleRestoreConfirm(version.id)}
                        className="aqb-ht-btn aqb-ht-btn--danger"
                      >
                        Restore
                      </button>
                      <button
                        onClick={handleRestoreCancel}
                        className="aqb-ht-btn aqb-ht-btn--ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <VersionRow
                    version={version}
                    isRestoring={restoringId === version.id}
                    isDeleteConfirm={deleteConfirmId === version.id}
                    onRestore={() => handleRestoreClick(version.id)}
                    onDeleteRequest={() => handleDeleteRequest(version.id)}
                    onDeleteConfirm={() => handleDeleteConfirm(version.id)}
                    onDeleteCancel={handleDeleteCancel}
                    elementCount={0}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}