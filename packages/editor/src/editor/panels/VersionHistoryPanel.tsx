import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/shared/ui/Button";
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
import { formatRelativeTime } from "../../editor/sidebar/tabs/history/helpers";
import type { CompareResult } from "../../shared/types/versions";
import type { NamedVersion } from "../../shared/types/versions";
import { SnapshotPreview } from "../../editor/sidebar/tabs/history/components/SnapshotPreview";
import type { Composer } from "../../engine";

// react-window 1.8.11 ships without TS types (the installed @types/react-window@2.0.0
// is a deprecated stub for v2). Import as an untyped module and wrap in a local typed
// alias so this file stays strict. The file scope for Wave 2B is one file — a shared
// .d.ts shim can be added in a follow-up to keep the fix local here.
// @ts-expect-error — no declaration file for react-window@1.8.x
import { FixedSizeList as FixedSizeListUntyped } from "react-window";

interface ListChildComponentProps {
  index: number;
  style: React.CSSProperties;
  data?: unknown;
}
interface FixedSizeListProps {
  height: number;
  width: number | string;
  itemCount: number;
  itemSize: number;
  overscanCount?: number;
  itemKey?: (index: number, data?: unknown) => React.Key;
  children: (props: ListChildComponentProps) => React.ReactNode;
}
const FixedSizeList = FixedSizeListUntyped as unknown as React.ComponentType<FixedSizeListProps>;

// ============================================
// Constants
// ============================================

const ROW_HEIGHT = 64; // version row (48px) + 16px breathing room
const OVERSCAN = 5;
const AI_COOLDOWN_MS = 60_000;
const TOAST_DURATION_MS = 3000;

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
// Flat Row Types (for virtualization)
// ============================================

type FlatRow =
  | { kind: "date-header"; id: string; label: string }
  | { kind: "version"; id: string; version: NamedVersion };

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
  aiCooldownSeconds: number;
}

const TOGGLE_PILL_CONTAINER: React.CSSProperties = {
  display: "inline-flex",
  gap: 2,
  padding: 2,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 999,
  marginBottom: 8,
};

const TOGGLE_PILL_BTN: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 500,
  color: "var(--buildrick-text-muted)",
  background: "transparent",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
  transition: "background 150ms ease-out, color 150ms ease-out",
};

const TOGGLE_PILL_ACTIVE: React.CSSProperties = {
  ...TOGGLE_PILL_BTN,
  background: "var(--buildrick-accent)",
  color: "var(--buildrick-text-on-accent)",
};

const TOGGLE_PILL_DISABLED: React.CSSProperties = {
  ...TOGGLE_PILL_BTN,
  opacity: 0.4,
  cursor: "not-allowed",
};

function CompareView({
  version,
  compareResult,
  currentVisualSnapshot,
  aiSummaryState,
  onGetAiSummary,
  aiCooldownSeconds,
}: CompareViewProps) {
  const { summary, changes } = compareResult ?? { summary: null, changes: [] };

  const hasVisual = Boolean(version.visualSnapshot || currentVisualSnapshot);
  const [mode, setMode] = React.useState<"visual" | "semantic">(hasVisual ? "visual" : "semantic");

  // Force semantic if no visuals exist (e.g., version saved before snapshots shipped).
  React.useEffect(() => {
    if (!hasVisual && mode === "visual") setMode("semantic");
  }, [hasVisual, mode]);

  const aiDisabled = aiSummaryState.loading || aiCooldownSeconds > 0;
  const aiButtonLabel = aiSummaryState.loading
    ? "Generating..."
    : aiCooldownSeconds > 0
    ? `Get AI Summary (${aiCooldownSeconds}s)`
    : "Get AI Summary";

  return (
    <div className="compare-view">
      {/* Visual / Semantic toggle */}
      <div style={TOGGLE_PILL_CONTAINER} role="tablist" aria-label="Compare mode">
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "visual"}
          style={hasVisual ? (mode === "visual" ? TOGGLE_PILL_ACTIVE : TOGGLE_PILL_BTN) : TOGGLE_PILL_DISABLED}
          onClick={() => hasVisual && setMode("visual")}
          disabled={!hasVisual}
          title={hasVisual ? undefined : "No visual snapshot available for this version."}
        >
          Visual
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "semantic"}
          style={mode === "semantic" ? TOGGLE_PILL_ACTIVE : TOGGLE_PILL_BTN}
          onClick={() => setMode("semantic")}
        >
          Semantic
        </Button>
      </div>
      {/* AI Summary text */}
      {(version.aiSummary || aiSummaryState.result) && (
        <div className="ai-summary">
          {aiSummaryState.result ?? version.aiSummary}
        </div>
      )}
      {/* Visual mode — screenshots side-by-side */}
      {mode === "visual" && hasVisual && (
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
      {/* Change summary badges — shown in both modes */}
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
            <span className="diff-summary-badge" style={{ background: "rgba(144,141,133,0.15)", color: "var(--buildrick-text-muted)" }}>
              {summary.other} other
            </span>
          )}
        </div>
      )}
      {/* Page-level add/remove counts (Wave 1 CompareSummary fields) */}
      {summary && (summary.pagesAdded > 0 || summary.pagesDeleted > 0) && (
        <p style={{ fontSize: 11, color: "var(--buildrick-text-muted)", margin: "4px 0 0" }}>
          {summary.pagesAdded > 0 && `${summary.pagesAdded} page${summary.pagesAdded === 1 ? "" : "s"} added`}
          {summary.pagesAdded > 0 && summary.pagesDeleted > 0 && ", "}
          {summary.pagesDeleted > 0 && `${summary.pagesDeleted} page${summary.pagesDeleted === 1 ? "" : "s"} removed`}
        </p>
      )}
      {/* Semantic mode — change list */}
      {mode === "semantic" && changes.length > 0 && (
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
            <p style={{ fontSize: 11, color: "var(--buildrick-text-muted)", marginTop: 4 }}>
              +{changes.length - 20} more changes
            </p>
          )}
        </div>
      )}
      {/* AI Summary button — visible in both modes */}
      <Button
        className={`ai-summary-btn${aiSummaryState.loading ? " loading" : ""}`}
        onClick={onGetAiSummary}
        disabled={aiDisabled}
      >
        {aiSummaryState.loading ? (
          "Generating..."
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            {aiButtonLabel}
          </>
        )}
      </Button>
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
  isDeleteConfirm: boolean;
  onRestore: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onCompare: () => void;
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
  onCompare,
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
        role="listitem"
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
                <span className="entry-badge" style={{ background: "rgba(45,109,255,0.12)", color: "var(--buildrick-accent)" }}>
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
                <Button onClick={onDeleteConfirm} className="action-btn danger" aria-label="Confirm delete">
                  Delete
                </Button>
                <Button onClick={onDeleteCancel} className="action-btn" aria-label="Cancel">
                  ×
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onCompare} className="action-btn primary" aria-label={`Compare "${version.name}"`}>
                  Compare
                </Button>
                <Button
                  onClick={onRestore}
                  className="action-btn"
                  disabled={isRestoring}
                  aria-label={`Restore "${version.name}"`}
                >
                  {isRestoring ? "..." : "Restore"}
                </Button>
                <Button onClick={onDeleteRequest} className="action-btn danger" aria-label={`Delete "${version.name}"`}>
                  ×
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
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
  animation: "fadeIn 150ms ease-out",
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

  // Virtualization — measured height
  const listWrapperRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = React.useState(0);

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
    if (composer?.versionHistory) {
      setCurrentVisualSnapshot(composer.versionHistory.captureVisualSnapshot());
    }
  }, [composer]);

  // Measure list container height for FixedSizeList
  React.useLayoutEffect(() => {
    const el = listWrapperRef.current;
    if (!el) return;

    const measure = () => setListHeight(el.clientHeight);
    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

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

  // Flatten into a single row list for virtualization (excluding the expanded row's
  // CompareView, which renders outside the list so it can grow freely).
  const flatRows = React.useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    let currentGroup = "";
    for (const v of filteredVersions) {
      const group = getDateGroup(v.createdAt);
      if (group !== currentGroup) {
        currentGroup = group;
        rows.push({ kind: "date-header", id: `group-${group}`, label: group });
      }
      rows.push({ kind: "version", id: v.id, version: v });
    }
    return rows;
  }, [filteredVersions]);

  // Row size: date headers are smaller than version rows, but FixedSizeList
  // expects a single size. Use ROW_HEIGHT (64px) uniformly — the date header
  // has enough vertical padding to look natural at that height.
  const itemSize = ROW_HEIGHT;

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

  // Render a single virtualized row.
  const renderRow = React.useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const row = flatRows[index];
      if (!row) return null;

      if (row.kind === "date-header") {
        return (
          <div style={{ ...style, display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
            <div className="date-group-header" style={{ position: "static", width: "100%" }}>
              {row.label}
            </div>
          </div>
        );
      }

      const v = row.version;
      return (
        <div style={style}>
          <VersionRow
            version={v}
            isRestoring={restoringId === v.id}
            isDeleteConfirm={deleteConfirmId === v.id}
            onRestore={() => handleRestoreClick(v.id)}
            onDeleteRequest={() => handleDeleteRequest(v.id)}
            onDeleteConfirm={() => handleDeleteConfirm(v.id)}
            onDeleteCancel={handleDeleteCancel}
            onCompare={() => handleCompare(v.id)}
            elementCount={0}
          />
        </div>
      );
    },
    [flatRows, restoringId, deleteConfirmId, handleCompare]
  );

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
      {/* Version List — scrolls, fills available space above FAB */}
      <div ref={listWrapperRef} className="version-list" role="list">
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
                <>Save Version creates a named milestone you can restore anytime.</>
              ) : (
                "Try a different search term."
              )
            }
          />
        ) : listHeight > 0 ? (
          <FixedSizeList
            height={listHeight}
            width="100%"
            itemCount={flatRows.length}
            itemSize={itemSize}
            overscanCount={OVERSCAN}
            itemKey={(index) => flatRows[index]?.id ?? index}
          >
            {renderRow}
          </FixedSizeList>
        ) : null}
      </div>
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
                <label className="form-label" htmlFor="buildrick-save-name">
                  Version name *
                </label>
                <Input
                  id="buildrick-save-name"
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

