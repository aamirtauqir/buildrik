/**
 * @lint-hex-policy: component-theme
 *   Inherits the panel-level palette policy. Chrome-hex lint rules
 *   do not apply to this feature folder (covers VersionRow's
 *   --buildrick-accent-12 alpha overlay).
 *
 * VersionList — D3 Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Owns the virtualized list of saved versions: date-group flattening,
 * react-window FixedSizeList wiring, container-height measurement,
 * VersionRow rendering, and the empty-state branch when the filtered
 * list yields nothing.
 *
 * Pre-extraction: lines 314-460 + 730-862 of VersionHistoryPanel.tsx
 * (FixedSizeList block + renderRow + VersionRow + EmptyState +
 * flatRows useMemo + listHeight measurement). Orchestrator now passes
 * filteredVersions + per-row handlers down; everything list-shaped
 * lives here.
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";
import type { NamedVersion } from "../../../shared/types/versions";
import { formatRelativeTime } from "../../../editor/sidebar/tabs/history/helpers";
import { SnapshotPreview } from "../../../editor/sidebar/tabs/history/components/SnapshotPreview";

// react-window 1.8.11 ships without TS types (the installed
// @types/react-window@2.0.0 is a deprecated stub for v2). Import as an
// untyped module and wrap in a local typed alias so this file stays
// strict.
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

// ─── Constants ────────────────────────────────────────────────────────

const ROW_HEIGHT = 64; // version row (48px) + 16px breathing room
const OVERSCAN = 5;

// ─── Date helpers ─────────────────────────────────────────────────────

export function getDateGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Flat row types ───────────────────────────────────────────────────

type FlatRow =
  | { kind: "date-header"; id: string; label: string }
  | { kind: "version"; id: string; version: NamedVersion };

// ─── Empty state ──────────────────────────────────────────────────────

export function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{message}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  );
}

// ─── Version row ──────────────────────────────────────────────────────

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

export function VersionRow({
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
        <div className="version-row-main">
          <div>
            <div className="version-name">{version.name}</div>
            <div className="version-meta">
              <span className="version-time">{formatTime(version.createdAt)}</span>
              <span>{relative}</span>
              {elementCount > 0 && (
                <span
                  className="entry-badge"
                  style={{
                    background: "rgba(45,109,255,0.12)",
                    color: "var(--buildrick-accent)",
                  }}
                >
                  {elementCount} el
                </span>
              )}
              {version.isAutoCheckpoint && (
                <span className="entry-badge auto-save">Auto</span>
              )}
            </div>
          </div>

          <div className="version-actions">
            {isDeleteConfirm ? (
              <>
                <Button
                  onClick={onDeleteConfirm}
                  className="action-btn danger"
                  aria-label="Confirm delete"
                >
                  Delete
                </Button>
                <Button onClick={onDeleteCancel} className="action-btn" aria-label="Cancel">
                  ×
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onCompare}
                  className="action-btn primary"
                  aria-label={`Compare "${version.name}"`}
                >
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
                <Button
                  onClick={onDeleteRequest}
                  className="action-btn danger"
                  aria-label={`Delete "${version.name}"`}
                >
                  ×
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
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

// ─── VersionList ──────────────────────────────────────────────────────

export interface VersionListProps {
  /** Pre-filtered (search-applied) versions. Orchestrator owns the filter. */
  filteredVersions: NamedVersion[];
  /** Total count of versions before filtering — drives empty-state copy. */
  totalCount: number;
  restoringId: string | null;
  deleteConfirmId: string | null;
  onRestoreRequest: (versionId: string) => void;
  onDeleteRequest: (versionId: string) => void;
  onDeleteConfirm: (versionId: string) => void;
  onDeleteCancel: () => void;
  onCompare: (versionId: string) => void;
}

export function VersionList({
  filteredVersions,
  totalCount,
  restoringId,
  deleteConfirmId,
  onRestoreRequest,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onCompare,
}: VersionListProps) {
  const listWrapperRef = React.useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = React.useState(0);

  // Flatten into virtualization-friendly rows: a date-header before
  // each new date group, then the version rows in that group.
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

  // Measure list container height for FixedSizeList. ResizeObserver
  // re-measures on container shape changes; window resize covers the
  // browser-resize case.
  React.useLayoutEffect(() => {
    const el = listWrapperRef.current;
    if (!el) return;

    const measure = () => setListHeight(el.clientHeight);
    measure();

    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

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
            onRestore={() => onRestoreRequest(v.id)}
            onDeleteRequest={() => onDeleteRequest(v.id)}
            onDeleteConfirm={() => onDeleteConfirm(v.id)}
            onDeleteCancel={onDeleteCancel}
            onCompare={() => onCompare(v.id)}
            elementCount={0}
          />
        </div>
      );
    },
    [
      flatRows,
      restoringId,
      deleteConfirmId,
      onRestoreRequest,
      onDeleteRequest,
      onDeleteConfirm,
      onDeleteCancel,
      onCompare,
    ],
  );

  return (
    <div ref={listWrapperRef} className="version-list" role="list">
      {filteredVersions.length === 0 ? (
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="8" y="6" width="16" height="20" rx="2" />
              <path d="M12 12h8M12 16h8M12 20h4" />
            </svg>
          }
          message={totalCount === 0 ? "No saved versions yet" : "No matching versions"}
          hint={
            totalCount === 0 ? (
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
          itemSize={ROW_HEIGHT}
          overscanCount={OVERSCAN}
          itemKey={(index) => flatRows[index]?.id ?? index}
        >
          {renderRow}
        </FixedSizeList>
      ) : null}
    </div>
  );
}
