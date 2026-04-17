/**
 * VersionHistoryPanel - Saves view with FAB, compare, restore, delete
 * Phase 4: Visual snapshots, Compare view, AI Summary
 * Phase 3: Uses useVersionHistory hook, FAB design, inline confirmations
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useVersionHistory } from "../../shared/hooks/useVersionHistory";
import { formatRelativeTime } from "../../editor/sidebar/tabs/history/helpers";
import type { CompareResult } from "../../shared/types/versions";
import type { NamedVersion } from "../../shared/types/versions";
import { SnapshotPreview } from "../../editor/sidebar/tabs/history/components/SnapshotPreview";
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

function EmptyState({ icon, message, hint }: { icon: React.ReactNode; message: string; hint?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{message}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  );
}

// ============================================
// Compare View
// ============================================

interface CompareViewProps {
  version: NamedVersion;
  compareResult: CompareResult | null;
  currentVisualSnapshot: string | null;
  aiSummaryState: { loading: boolean; result: string | null; error: string | null };
  onGetAiSummary: () => void;
}

function CompareView({
  version,
  compareResult,
  currentVisualSnapshot,
  aiSummaryState,
  onGetAiSummary,
}: CompareViewProps) {
  const { summary, changes } = compareResult ?? { summary: null, changes: [] };

  return (
    <div className="compare-view">
      {/* AI Summary text */}
      {(version.aiSummary || aiSummaryState.result) && (
        <div className="ai-summary">
          {aiSummaryState.result ?? version.aiSummary}
        </div>
      )}

      {/* Screenshots side-by-side */}
      {(version.visualSnapshot || currentVisualSnapshot) && (
        <div className="compare-screenshots">
          {currentVisualSnapshot && (
            <div className="screenshot-thumb">
              <img src={currentVisualSnapshot} alt="Current" />
              <span className="screenshot-label">Current</span>
            </div>
          )}
          {version.visualSnapshot && (
            <div className="screenshot-thumb">
              <img src={version.visualSnapshot} alt={version.name} />
              <span className="screenshot-label">{version.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Change summary badges */}
      {summary && (
        <div className="diff-summary-badges">
          {summary.style > 0 && (
            <span className="diff-summary-badge style">{summary.style} style</span>
          )}
          {summary.text > 0 && (
            <span className="diff-summary-badge text">{summary.text} text</span>
          )}
          {summary.layout > 0 && (
            <span className="diff-summary-badge layout">{summary.layout} layout</span>
          )}
          {summary.content > 0 && (
            <span className="diff-summary-badge content">{summary.content} content</span>
          )}
          {summary.other > 0 && (
            <span className="diff-summary-badge" style={{ background: "rgba(144,141,133,0.15)", color: "var(--aqb-text-muted)" }}>
              {summary.other} other
            </span>
          )}
        </div>
      )}

      {/* Change list */}
      {changes.length > 0 && (
        <div className="diff-change-list">
          {changes.slice(0, 20).map((change, i) => (
            <div key={i} className="diff-change">
              <span
                className={`diff-op ${
                  !change.before ? "add" : !change.after ? "remove" : "replace"
                }`}
              >
                {!change.before ? "+" : !change.after ? "−" : "~"}
              </span>
              <span className="diff-change-prop">{change.property}</span>
              {change.before && (
                <span className="diff-change-val before">{change.before}</span>
              )}
              {change.after && (
                <span className="diff-change-val after">{change.after}</span>
              )}
            </div>
          ))}
          {changes.length > 20 && (
            <p style={{ fontSize: 11, color: "var(--aqb-text-muted)", marginTop: 4 }}>
              +{changes.length - 20} more changes
            </p>
          )}
        </div>
      )}

      {/* AI Summary button */}
      <button
        className={`ai-summary-btn${aiSummaryState.loading ? " loading" : ""}`}
        onClick={onGetAiSummary}
        disabled={aiSummaryState.loading}
      >
        {aiSummaryState.loading ? (
          "Generating..."
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Get AI Summary
          </>
        )}
      </button>
      {aiSummaryState.error && (
        <p className="ai-summary-error">{aiSummaryState.error}</p>
      )}
    </div>
  );
}

// ============================================
// Version Row Component
// ============================================

interface VersionRowProps {
  version: NamedVersion;
  isRestoring: boolean;
  isExpanded: boolean;
  isDeleteConfirm: boolean;
  onRestore: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onCompare: () => void;
  compareResult: CompareResult | null;
  currentVisualSnapshot: string | null;
  aiSummaryState: { loading: boolean; result: string | null; error: string | null };
  onGetAiSummary: () => void;
  elementCount?: number;
}

function VersionRow({
  version,
  isRestoring,
  isExpanded,
  isDeleteConfirm,
  onRestore,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onCompare,
  compareResult,
  currentVisualSnapshot,
  aiSummaryState,
  onGetAiSummary,
  elementCount = 0,
}: VersionRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewRect, setPreviewRect] = React.useState<DOMRect | null>(null);

  const relative = formatRelativeTime(version.createdAt);

  const handleMouseEnter = React.useCallback(() => {
    if (!version.visualSnapshot) return;
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) {
        setPreviewRect(rect);
        setShowPreview(true);
      }
    }, 300);
  }, [version.visualSnapshot]);

  const handleMouseLeave = React.useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowPreview(false);
  }, []);

  return (
    <div className="version-row-wrapper">
      <div
        ref={rowRef}
        className={`version-row${isDeleteConfirm ? " delete-confirm" : ""}`}
        aria-label={`Version "${version.name}" from ${relative}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Version Info */}
        <div className="version-row-main">
          <div>
            <div className="version-name">{version.name}</div>
            <div className="version-meta">
              <span className="version-time">{formatTime(version.createdAt)}</span>
              <span>{relative}</span>
              {elementCount > 0 && (
                <span className="entry-badge" style={{ background: "rgba(45,109,255,0.12)", color: "var(--aqb-primary)" }}>
                  {elementCount} el
                </span>
              )}
              {version.isAutoCheckpoint && (
                <span className="entry-badge auto-save">Auto</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="version-actions">
            {isDeleteConfirm ? (
              <>
                <button onClick={onDeleteConfirm} className="action-btn danger" aria-label="Confirm delete">
                  Delete
                </button>
                <button onClick={onDeleteCancel} className="action-btn" aria-label="Cancel">
                  ×
                </button>
              </>
            ) : (
              <>
                <button onClick={onCompare} className="action-btn primary" aria-label={`Compare "${version.name}"`}>
                  Compare
                </button>
                <button
                  onClick={onRestore}
                  className="action-btn"
                  disabled={isRestoring}
                  aria-label={`Restore "${version.name}"`}
                >
                  {isRestoring ? "..." : "Restore"}
                </button>
                <button onClick={onDeleteRequest} className="action-btn danger" aria-label={`Delete "${version.name}"`}>
                  ×
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Compare View */}
      {isExpanded && (
        <CompareView
          version={version}
          compareResult={compareResult}
          currentVisualSnapshot={currentVisualSnapshot}
          aiSummaryState={aiSummaryState}
          onGetAiSummary={onGetAiSummary}
        />
      )}

      {/* Snapshot Preview Tooltip */}
      {showPreview && version.visualSnapshot && previewRect && (
        <SnapshotPreview
          snapshotUrl={version.visualSnapshot}
          versionName={version.name}
          anchorRect={previewRect}
        />
      )}
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
  const {
    versions,
    isAvailable,
    isLoading,
    createVersion,
    restoreVersion,
    deleteVersion,
    compareVersions,
    updateAiSummary,
  } = useVersionHistory(composer);

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

  // Expanded row state (Compare view)
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [compareResults, setCompareResults] = React.useState<Record<string, CompareResult | null>>({});
  const [currentVisualSnapshot, setCurrentVisualSnapshot] = React.useState<string | null>(null);

  // AI Summary state per version
  const [aiSummaryStates, setAiSummaryStates] = React.useState<
    Record<string, { loading: boolean; result: string | null; error: string | null }>
  >({});

  // Capture current canvas visual snapshot on mount
  React.useEffect(() => {
    if (composer?.versionHistory) {
      setCurrentVisualSnapshot(composer.versionHistory.captureVisualSnapshot());
    }
  }, [composer]);

  // Handle create version
  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) return;
    setIsSaving(true);
    await createVersion(newVersionName.trim(), "");
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
    if (expandedId === versionId) setExpandedId(null);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  // Handle Compare click
  const handleCompare = React.useCallback(
    async (versionId: string) => {
      if (expandedId === versionId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(versionId);

      // Load diff if not already cached
      if (!compareResults[versionId]) {
        const latest = versions[0];
        if (latest && latest.id !== versionId) {
          const result = await compareVersions(latest.id, versionId);
          setCompareResults((prev) => ({ ...prev, [versionId]: result }));
        }
      }
    },
    [expandedId, compareResults, compareVersions, versions]
  );

  // Handle AI Summary
  const handleGetAiSummary = React.useCallback(
    async (versionId: string) => {
      setAiSummaryStates((prev) => ({
        ...prev,
        [versionId]: { loading: true, result: null, error: null },
      }));

      try {
        const compareData = compareResults[versionId];
        if (!compareData) {
          throw new Error("Compare data not loaded yet");
        }
        const response = await fetch("/api/trpc/ai.summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            versionName: versions.find((v) => v.id === versionId)?.name ?? "",
            changes: compareData,
          }),
        });

        if (!response.ok) throw new Error("AI summary unavailable");
        const json = await response.json();
        // tRPC HTTP endpoint wraps the result in { result: { data: T } }
        const summary: string = json?.result?.data?.summary ?? json?.summary ?? "";
        if (!summary) throw new Error("Empty summary returned");

        await updateAiSummary(versionId, summary);

        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: { loading: false, result: summary, error: null },
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Summary unavailable";
        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: { loading: false, result: null, error: message },
        }));
      }
    },
    [compareResults, updateAiSummary, versions]
  );

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
      <div className="saves-view">
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
    <div className="saves-view">
      {/* Save Version FAB / Inline Form */}
      <div className="fab-container">
        {showSaveForm ? (
          <div className="save-form open">
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Version name *</label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  onKeyDown={handleSaveFormKeyDown}
                  placeholder="e.g. Homepage redesign"
                  className="form-input"
                  autoFocus
                  maxLength={50}
                />
              </div>
            </div>
            <div className="form-row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setNewVersionName("");
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVersion}
                className="save-btn"
                disabled={!newVersionName.trim() || isSaving}
              >
                {isSaving ? "Saving..." : "Save Version"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            className="fab"
            aria-label="Save version"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Version List */}
      <div className="version-list">
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
            <div key={dateGroup}>
              <div className="date-group-header">{dateGroup}</div>
              {groupVersions.map((version) => (
                <div key={version.id}>
                  {/* Inline restore confirmation */}
                  {restoreConfirmId === version.id && (
                    <div className="restore-confirm">
                      <span className="restore-confirm-text">
                        Restore to "{version.name}"?
                      </span>
                      <button
                        onClick={() => handleRestoreConfirm(version.id)}
                        className="action-btn primary"
                      >
                        Restore
                      </button>
                      <button onClick={handleRestoreCancel} className="action-btn">
                        Cancel
                      </button>
                    </div>
                  )}

                  <VersionRow
                    version={version}
                    isRestoring={restoringId === version.id}
                    isExpanded={expandedId === version.id}
                    isDeleteConfirm={deleteConfirmId === version.id}
                    onRestore={() => handleRestoreClick(version.id)}
                    onDeleteRequest={() => handleDeleteRequest(version.id)}
                    onDeleteConfirm={() => handleDeleteConfirm(version.id)}
                    onDeleteCancel={handleDeleteCancel}
                    onCompare={() => handleCompare(version.id)}
                    compareResult={compareResults[version.id] ?? null}
                    currentVisualSnapshot={currentVisualSnapshot}
                    aiSummaryState={
                      aiSummaryStates[version.id] ?? { loading: false, result: null, error: null }
                    }
                    onGetAiSummary={() => handleGetAiSummary(version.id)}
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
