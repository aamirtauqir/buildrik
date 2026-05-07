import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
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
import { useVersionHistory } from "../../shared/hooks/useVersionHistory";
import type { CompareResult } from "../../shared/types/versions";
import type { NamedVersion } from "../../shared/types/versions";
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

// ============================================
// Constants
// ============================================

const AI_COOLDOWN_MS = 60_000;
const TOAST_DURATION_MS = 3000;

// CompareView + toggle-pill style constants moved to
// ./version-history/CompareView.tsx (D3 Stage 2, audit-remediation 2026-05-08).
// VersionRow + EmptyState moved to ./version-history/VersionList.tsx
// (D3 Stage 1, audit-remediation 2026-05-08).

// ============================================
// Toast
// ============================================

type Toast = { id: string; message: string; kind: "success" | "error" };

const TOAST_STACK_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: 16,
  right: 16,
  zIndex: 150,
  display: "flex",
  flexDirection: "column-reverse",
  gap: 8,
  pointerEvents: "none",
};

const TOAST_BASE_STYLE: React.CSSProperties = {
  minWidth: 200,
  maxWidth: 320,
  padding: 12,
  borderRadius: 8,
  fontSize: 12,
  lineHeight: 1.4,
  color: "var(--buildrick-text-primary)",
  background: "var(--buildrick-surface-3, #1a1a24)",
  border: "1px solid var(--buildrick-border)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  pointerEvents: "auto",
  animation: "bd-history-fade-in 150ms ease-out",
};

const TOAST_ERROR_STYLE: React.CSSProperties = {
  ...TOAST_BASE_STYLE,
  color: "#fca5a5",
  borderColor: "rgba(239,68,68,0.4)",
  background: "rgba(31, 18, 20, 0.96)",
};

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div style={TOAST_STACK_STYLE}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live={t.kind === "error" ? "assertive" : "polite"}
          style={t.kind === "error" ? TOAST_ERROR_STYLE : TOAST_BASE_STYLE}
        >
          {t.message}
        </div>
      ))}
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

  // AI summary state + rate-limit tracking
  const [aiSummaryStates, setAiSummaryStates] = React.useState<
    Record<string, { loading: boolean; result: string | null; error: string | null }>
  >({});
  const aiCallTimestamps = React.useRef<Map<string, number>>(new Map());
  // Tick counter to force re-render once a cooldown expires (drives countdown UI).
  const [, setCooldownTick] = React.useState(0);

  // Toast state
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const pushToast = React.useCallback((message: string, kind: "success" | "error" = "success") => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

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

  // Handle AI Summary — with 60s per-version rate limit + cached-result short-circuit
  const handleGetAiSummary = React.useCallback(
    async (versionId: string) => {
      const version = versions.find((v) => v.id === versionId);

      // Cached result: surface immediately, no rate-limit penalty.
      if (version?.aiSummary) {
        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: { loading: false, result: version.aiSummary ?? null, error: null },
        }));
        return;
      }

      // Rate-limit check.
      const lastCall = aiCallTimestamps.current.get(versionId) ?? 0;
      const elapsed = Date.now() - lastCall;
      if (elapsed < AI_COOLDOWN_MS) {
        const remaining = Math.ceil((AI_COOLDOWN_MS - elapsed) / 1000);
        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: {
            loading: false,
            result: null,
            error: `Please wait ${remaining}s before requesting another summary`,
          },
        }));
        return;
      }

      // Record timestamp BEFORE fetch so a failed call still counts (prevents retry spam).
      aiCallTimestamps.current.set(versionId, Date.now());
      // Schedule a re-render when the cooldown expires so the countdown UI clears.
      setTimeout(() => setCooldownTick((n) => n + 1), AI_COOLDOWN_MS + 50);

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
            versionName: version?.name ?? "",
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

  // Build the expanded version (if any) for rendering below the list.
  const expandedVersion = expandedId
    ? filteredVersions.find((v) => v.id === expandedId) ?? null
    : null;

  // Compute per-version AI cooldown seconds (0 if not cooling down).
  const getCooldownSeconds = React.useCallback((versionId: string) => {
    const last = aiCallTimestamps.current.get(versionId) ?? 0;
    if (last === 0) return 0;
    const remaining = AI_COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, []);

  // Version currently awaiting restore confirmation (rendered outside the list).
  const restoreConfirmVersion = restoreConfirmId
    ? filteredVersions.find((v) => v.id === restoreConfirmId) ?? null
    : null;

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
                <Input
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
      {/* Toast stack — fixed bottom-right, above FAB z-index */}
      <ToastStack toasts={toasts} />
    </div>
  );
}

