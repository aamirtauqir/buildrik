/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * VersionHistoryPanel - Saves view with FAB, compare, restore, delete
 * Phase 4: Visual snapshots, Compare view, AI Summary
 * Phase 3: Uses useVersionHistory hook, FAB design, inline confirmations
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "@/shared/constants/events";
import { useVersionHistory } from "../../shared/hooks/useVersionHistory";
import type { CompareResult } from "../../shared/types/versions";
import type { Composer } from "../../engine";
// D3 Stage 1 (audit-remediation 2026-05-08): list virtualization +
// VersionRow + EmptyState lifted into version-history/VersionList.tsx.
// The orchestrator passes filteredVersions + per-row handlers down.
import {
  VersionList,
  EmptyState,
  formatTime,
} from "./version-history/VersionList";
import { CompareView } from "./version-history/CompareView";
import { useAISummary } from "./version-history/useAISummary";
import { Button, TextField, useToast } from "@/editor/chrome-ui";

// CompareView + toggle-pill style constants moved to
// ./version-history/CompareView.tsx (D3 Stage 2, audit-remediation 2026-05-08).
// VersionRow + EmptyState moved to ./version-history/VersionList.tsx
// (D3 Stage 1, audit-remediation 2026-05-08).
// AI summary state machinery (rate-limit + cooldown tick + handler) moved to
// ./version-history/useAISummary.ts (D3 Stage 4, audit-remediation 2026-05-08).

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

  // Restore / delete confirmation + in-flight state
  const [restoreConfirmId, setRestoreConfirmId] = React.useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [restoringId, setRestoringId] = React.useState<string | null>(null);

  // Expanded row state (Compare view)
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [compareResults, setCompareResults] = React.useState<Record<string, CompareResult | null>>({});
  const [currentVisualSnapshot, setCurrentVisualSnapshot] = React.useState<string | null>(null);

  // Canonical chrome toast — one queue, one viewport, one timer owner.
  const { addToast } = useToast();
  const pushToast = React.useCallback(
    (message: string, kind: "success" | "error" = "success") =>
      addToast({ description: message, tone: kind }),
    [addToast],
  );

  // AI summary state — hook owns the rate-limit + cooldown tick + handler.
  const { aiSummaryStates, handleGetAiSummary, getCooldownSeconds } =
    useAISummary({ versions, compareResults, updateAiSummary });

  /* Board 163:269 — pruning used to happen with nothing said, so a user's
     older auto-saves simply stopped being there. The engine now announces it
     (VERSION_PRUNED); this is the notice. Dismissible, and it clears itself on
     the next prune-free session because it is session state, not stored. */
  const [pruned, setPruned] = React.useState<{ removed: number; kept: number } | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const onPruned = (p: { removed: number; kept: number }) => setPruned(p);
    composer.on(EVENTS.VERSION_PRUNED, onPruned);
    return () => {
      composer.off(EVENTS.VERSION_PRUNED, onPruned);
    };
  }, [composer]);

  // Capture current canvas visual snapshot on mount
  React.useEffect(() => {
    if (composer?.versions) {
      setCurrentVisualSnapshot(composer.versions.captureVisualSnapshot());
    }
  }, [composer]);

  // Handle create version
  const handleCreateVersion = async () => {
    const name = newVersionName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      await createVersion(name, "");
      setNewVersionName("");
      setShowSaveForm(false);
      pushToast(`Saved '${name}'`, "success");
    } catch {
      pushToast("Save failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFormKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreateVersion();
    if (e.key === "Escape") {
      setShowSaveForm(false);
      setNewVersionName("");
    }
  };

  const handleRestoreClick = (versionId: string) => {
    setRestoreConfirmId(versionId);
  };

  const handleRestoreConfirm = async (versionId: string) => {
    setRestoreConfirmId(null);
    setRestoringId(versionId);
    const target = versions.find((v) => v.id === versionId);
    try {
      await restoreVersion(versionId);
      if (target) pushToast(`Restored to ${formatTime(target.createdAt)}`, "success");
    } catch {
      pushToast("Restore failed", "error");
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreCancel = () => {
    setRestoreConfirmId(null);
  };

  const handleDeleteRequest = (versionId: string) => {
    setDeleteConfirmId(versionId);
  };

  const handleDeleteConfirm = async (versionId: string) => {
    setDeleteConfirmId(null);
    const target = versions.find((v) => v.id === versionId);
    try {
      await deleteVersion(versionId);
      if (expandedId === versionId) setExpandedId(null);
      if (target) pushToast(`Deleted ${target.name}`, "success");
    } catch {
      pushToast("Delete failed", "error");
    }
  };

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

  // Filter versions by search query
  const filteredVersions = React.useMemo(() => {
    if (!searchQuery.trim()) return versions;
    const query = searchQuery.toLowerCase();
    return versions.filter((v) => v.name.toLowerCase().includes(query));
  }, [versions, searchQuery]);

  // Build the expanded version (if any) for rendering below the list.
  const expandedVersion = expandedId
    ? filteredVersions.find((v) => v.id === expandedId) ?? null
    : null;

  // Version currently awaiting restore confirmation (rendered outside the list).
  const restoreConfirmVersion = restoreConfirmId
    ? filteredVersions.find((v) => v.id === restoreConfirmId) ?? null
    : null;

  /* Board 1138:4573 — skeleton rows while storage resolves. Without this the
     empty state below answers a question the panel cannot yet answer: it said
     "no versions" during the await, to users who had plenty. */
  if (isLoading) {
    return (
      <div className="saves-view">
        <div className="saves-skeleton" aria-busy="true" aria-label="Loading versions">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`saves-skeleton__row saves-skeleton__row--${i % 3}`}>
              <span className="saves-skeleton__dot" />
              <span className="saves-skeleton__bar" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
      {pruned && (
        <div className="saves-pruned-notice" role="status">
          <strong>Older auto-saves were removed</strong>
          <span>
            Past {pruned.kept}. Named versions and the approved one were kept.
          </span>
        </div>
      )}

      {/* Version List — virtualization + row rendering owned by VersionList.
          See ./version-history/VersionList.tsx (D3 Stage 1). */}
      <VersionList
        filteredVersions={filteredVersions}
        totalCount={versions.length}
        restoringId={restoringId}
        deleteConfirmId={deleteConfirmId}
        onRestoreRequest={handleRestoreClick}
        onDeleteRequest={handleDeleteRequest}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={handleDeleteCancel}
        onCompare={handleCompare}
      />
      {/* Inline restore confirmation — rendered outside the virtualized list.
          Appears as a pinned section below the list for the pending version. */}
      {restoreConfirmVersion && (
        <div className="restore-confirm">
          <span className="restore-confirm-text">
            Restore to "{restoreConfirmVersion.name}"?
          </span>
          <Button
            onClick={() => handleRestoreConfirm(restoreConfirmVersion.id)}
            className="action-btn primary"
          >
            Restore
          </Button>
          <Button onClick={handleRestoreCancel} className="action-btn">
            Cancel
          </Button>
        </div>
      )}
      {/* Expanded CompareView — rendered outside the virtualized list so it
          can grow freely. Shown as an inline detail section anchored below. */}
      {expandedVersion && (
        <div className="version-compare-detail" style={{ padding: "0 8px 8px" }}>
          <CompareView
            version={expandedVersion}
            compareResult={compareResults[expandedVersion.id] ?? null}
            currentVisualSnapshot={currentVisualSnapshot}
            aiSummaryState={
              aiSummaryStates[expandedVersion.id] ?? { loading: false, result: null, error: null }
            }
            onGetAiSummary={() => handleGetAiSummary(expandedVersion.id)}
            aiCooldownSeconds={getCooldownSeconds(expandedVersion.id)}
          />
        </div>
      )}
      {/* Save Version FAB / inline form — fixed at bottom-right of saves-view */}
      <div className="fab-container">
        {showSaveForm ? (
          <div className="save-form open">
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="bd-save-name">
                  Version name *
                </label>
                <TextField
                  id="bd-save-name"
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  onKeyDown={handleSaveFormKeyDown}
                  placeholder="e.g. Homepage redesign"
                  className="form-input"
                  autoFocus
                  maxLength={50}
                />
                <span className="form-hint">{newVersionName.length}/50</span>
              </div>
            </div>
            <div className="form-row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <Button
                type="button"
                onClick={() => {
                  setShowSaveForm(false);
                  setNewVersionName("");
                }}
                className="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateVersion}
                className="save-btn"
                disabled={!newVersionName.trim() || isSaving}
              >
                {isSaving ? "Saving..." : "Save Version"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setShowSaveForm(true)}
            className="fab"
            aria-label="Save version"
            title="Save Version"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}

