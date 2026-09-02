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
import { versionDisplayName } from "@/shared/utils/versionLabel";
import { versionChangeCounts } from "@/shared/utils/versionChangeCounts";
import { useHistoryState } from "@/shared/hooks/useHistoryState";

// CompareView + toggle-pill style constants moved to
// ./version-history/CompareView.tsx (D3 Stage 2, audit-remediation 2026-05-08).
// VersionRow + EmptyState moved to ./version-history/VersionList.tsx
// (D3 Stage 1, audit-remediation 2026-05-08).
// AI summary state machinery (rate-limit + cooldown tick + handler) moved to
// ./version-history/useAISummary.ts (D3 Stage 4, audit-remediation 2026-05-08).

// ============================================
// Main Component
// ============================================


/*
  Saves states as `tw:` utilities. These shipped as rules in history.css; the
  panel-CSS lane is the thing the styling ratchet exists to drain, and the
  chrome-ui contract test (className-precedence) is why a caller's utilities
  are enough even on flowbite-themed children. The descendant selectors
  (`.saves-load-error strong`) become classes on the children they targeted.
*/
const LOAD_ERROR =
  "tw:flex tw:flex-col tw:items-center tw:gap-[var(--bk-space-4)] " +
  "tw:px-[var(--bk-space-16)] tw:py-[var(--bk-space-24)] tw:text-center";
const LOAD_ERROR_TITLE = "tw:text-[var(--bk-error-text)] tw:text-[13px] tw:font-normal";
const LOAD_ERROR_SUB = "tw:text-[var(--bk-ink-muted)] tw:text-[12px]";
/* Board 453:4031 closes on a 40-tall note strip with the retry as a text link. */
const LOAD_ERROR_FOOT =
  "tw:flex tw:h-10 tw:items-center tw:justify-between tw:gap-[var(--bk-space-8)] tw:mt-auto " +
  "tw:px-[var(--bk-space-12)] tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[var(--bk-ink-muted)] tw:text-[12px]";

/* Board 1138:4573 — the Saves loading state. Staggered indents so it reads as a
   tree settling, not a list of identical bars. */
const SKELETON = "tw:flex tw:flex-col";
const SKELETON_ROW = "tw:flex tw:h-8 tw:items-center tw:gap-[var(--bk-space-8)]";
/* Board indents: 16, 32, 48, 48, 32 — the icon's own left edge on each row. */
const SKELETON_INDENT = ["tw:pl-4", "tw:pl-8", "tw:pl-12", "tw:pl-12", "tw:pl-8"];
const SKELETON_DOT =
  "tw:flex-none tw:size-3 tw:rounded-[3px] tw:bg-[var(--bk-bg-subtle)]";
const SKELETON_BAR =
  "tw:flex-none tw:h-[10px] tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-bg-subtle)]";
const SKELETON_BAR_W = ["tw:w-[132px]", "tw:w-[96px]", "tw:w-[150px]", "tw:w-[110px]", "tw:w-[86px]"];

/* Board 163:269 pruned / 163:220 restoring. Amber says nothing failed — the
   oldest auto-saves aged out; accent says something is happening, not wrong. */
const NOTICE_BASE =
  "tw:flex tw:flex-col tw:gap-[2px] tw:px-[var(--bk-space-12)] " +
  "tw:py-[var(--bk-space-8)] tw:rounded-lg tw:text-[11px]";
/* Board 163:167's confirm band — accent tint, its own actions row. */
const RESTORE_CONFIRM =
  "tw:rounded-none tw:bg-[var(--bk-accent-tint)] tw:px-3 tw:py-2.5 tw:flex tw:flex-col tw:gap-1 tw:mb-2";
const RESTORE_CONFIRM_TITLE = "tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent)]";
const RESTORE_CONFIRM_SUB = "tw:text-[11px] tw:text-[var(--bk-ink-soft)]";
const RESTORE_CONFIRM_ACTIONS = "tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-2";

const NOTICE_PRUNED =
  `${NOTICE_BASE} tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]`;
const NOTICE_RESTORING =
  `${NOTICE_BASE} tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]`;
const NOTICE_STRONG = "tw:font-normal tw:text-[12px]";
const NOTICE_SUB = "tw:text-[var(--bk-ink-muted)]";

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
    loadError,
    retryLoad,
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


  /* Board 163:220 draws the restore in flight, and its second line is the
     reassurance the engine now actually keeps: the work that was open is
     saved as its own version before anything is replaced. */
  const [restoring, setRestoring] = React.useState<{ targetName: string; savedAs: string | null } | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const onPruned = (p: { removed: number; kept: number }) => setPruned(p);
    const onRestoring = (p: { targetName: string; savedAs: string | null }) => setRestoring(p);
    const onRestored = () => setRestoring(null);
    composer.on(EVENTS.VERSION_PRUNED, onPruned);
    composer.on(EVENTS.VERSION_RESTORING, onRestoring);
    composer.on(EVENTS.VERSION_RESTORED, onRestored);
    return () => {
      composer.off(EVENTS.VERSION_PRUNED, onPruned);
      composer.off(EVENTS.VERSION_RESTORING, onRestoring);
      composer.off(EVENTS.VERSION_RESTORED, onRestored);
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
      if (target) pushToast(`Deleted ${versionDisplayName(target)}`, "success");
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

  /* Board 162:2 puts a change count on every row. It is derived, not stored:
     the undo stack is the same source the board's sibling view (Saves ·
     changes) lists, and a version's count is the entries taken between the
     previous version and this one. Absent ids mean "the stack does not reach
     back that far", which is why the row omits the badge rather than printing
     a 0 it cannot stand behind. */
  const { historyStack } = useHistoryState(composer);
  const changeCounts = React.useMemo(
    () => versionChangeCounts(versions, historyStack),
    [versions, historyStack]
  );

  // Build the expanded version (if any) for rendering below the list.
  const expandedVersion = expandedId
    ? filteredVersions.find((v) => v.id === expandedId) ?? null
    : null;

  // Version currently awaiting restore confirmation (rendered outside the list).
  const restoreConfirmVersion = restoreConfirmId
    ? filteredVersions.find((v) => v.id === restoreConfirmId) ?? null
    : null;

  /* Board 453:4031. The list failed to read; the versions themselves are
     intact, and saying so is the whole point of this copy — the empty state
     would have told the user they were gone. */
  if (loadError) {
    return (
      <div className="saves-view">
        <div className={LOAD_ERROR} role="alert">
          <strong className={LOAD_ERROR_TITLE}>Couldn&apos;t load version history.</strong>
          <span className={LOAD_ERROR_SUB}>Your versions are still stored. Only this list failed to load.</span>
        </div>
        <div className={LOAD_ERROR_FOOT}>
          <span>Retry, or reopen Versions in a moment.</span>
          <Button color="light" size="xs" variant="link" className="tw:h-auto tw:p-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent-text)]" onClick={retryLoad}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  /* Board 1138:4573 — skeleton rows while storage resolves. Without this the
     empty state below answers a question the panel cannot yet answer: it said
     "no versions" during the await, to users who had plenty. */
  if (isLoading) {
    return (
      <div className="saves-view">
        <div className={SKELETON} aria-busy="true" aria-label="Loading versions">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`${SKELETON_ROW} ${SKELETON_INDENT[i]}`}>
              <span className={SKELETON_DOT} />
              <span className={`${SKELETON_BAR} ${SKELETON_BAR_W[i]}`} />
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
      {/* Board 163:167 — the restore confirm, at the TOP of the panel.
          It used to render below the list, "as a pinned section", which on a
          list of fifty auto-saves put the confirmation for a click at the top
          somewhere the user had to go looking for.

          The board also carries the sentence this was missing entirely:
          restoring does not discard the current work, it saves it first. That
          is the whole reason the action is safe to take, and the confirm said
          only "Restore to X?". The board writes "saved as v4 first" — the
          engine does save first (VERSION_RESTORING reports `savedAs`), but
          not until the restore is under way, so the name is absent and the
          fact stated. */}
      {restoreConfirmVersion && (
        <div className={RESTORE_CONFIRM} role="alertdialog" aria-label="Confirm restore">
          <strong className={RESTORE_CONFIRM_TITLE}>
            Restore “{versionDisplayName(restoreConfirmVersion)}”?
          </strong>
          <span className={RESTORE_CONFIRM_SUB}>
            Your current work is saved first — nothing is lost.
          </span>
          <div className={RESTORE_CONFIRM_ACTIONS}>
            {/* Cancel first, per the board: the safe door is the one nearer
                the reading order's start. */}
            <Button color="light" size="xs" className="tw:h-7" onClick={handleRestoreCancel}>
              Cancel
            </Button>
            <Button size="xs" className="tw:h-7" onClick={() => handleRestoreConfirm(restoreConfirmVersion.id)}>
              Restore
            </Button>
          </div>
        </div>
      )}

      {/* Board 163:220 — the restore banner, above the list. */}
      {restoring && (
        <div className={NOTICE_RESTORING} role="status">
          <strong className={NOTICE_STRONG}>Restoring {restoring.targetName}…</strong>
          {restoring.savedAs && <span className={NOTICE_SUB}>Saving your current work as “{restoring.savedAs}” first.</span>}
        </div>
      )}

      {pruned && (
        <div className={NOTICE_PRUNED} role="status">
          <strong className={NOTICE_STRONG}>Older auto-saves were removed</strong>
          <span className={NOTICE_SUB}>
            Past {pruned.kept}. Named versions and the approved one were kept.
          </span>
        </div>
      )}

      {/* Version List — virtualization + row rendering owned by VersionList.
          See ./version-history/VersionList.tsx (D3 Stage 1). */}
      <VersionList
        changeCounts={changeCounts}
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
          /* Board 162:2 writes this as a labelled link at the foot of the
             panel — "+ Save a version". It was a floating "+" circle with the
             label only in a tooltip, so the one action that creates a NAMED
             version (the kind the prune rule promises never to remove)
             announced itself as an unlabelled dot. */
          <Button
            type="button"
            color="light"
            size="xs"
            onClick={() => setShowSaveForm(true)}
            className="tw:border-transparent tw:bg-transparent tw:px-1 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)]"
          >
            + Save a version
          </Button>
        )}
      </div>
    </div>
  );
}

