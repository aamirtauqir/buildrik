/**
 * ActivityView — Undo/redo activity timeline
 * Pixel-aligned with the History Tab prototype:
 *   activity-header (label + Time-Travel button)
 *   virtual-list with sticky date-group-header (virtualized via react-window)
 *   entry-row → entry-row-main → entry-label / entry-meta / entry-badge
 *   diff-preview with diff-item rows (operation icon + property + change-type badge)
 *   keyboard-hints footer
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
// react-window 1.8.x ships JS only; stub the minimal surface we use.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — module has no bundled .d.ts (see @types/react-window stub)
import { VariableSizeList } from "react-window";
import { useHistoryState } from "../../../../../shared/hooks/useHistoryState";
import { useReducedMotion } from "../../../../../shared/hooks/useReducedMotion";
import {
  collapseIdenticalChanges,
  formatRelativeTime,
  groupByDate,
  type CollapsedChange,
} from "../helpers";
import { TimeTravelIcon } from "../icons";
import type { ActivityViewProps } from "../types";
import type { HistoryDisplayEntry } from "../../../../../engine/historyTypes";

const MAX_VISIBLE_CHANGES = 5;

// Row sizing constants (see spec §2.5)
const ROW_H_COLLAPSED = 48;
const ROW_H_CHANGE = 24;
const ROW_H_SHOW_ALL_BTN = 32;
const ROW_H_DATE_HEADER = 28;

const OP_ICON: Record<string, string> = {
  add: "+",
  remove: "−",
  replace: "~",
  info: "·",
};

// Canonical canvas id — see VersionHistoryManager.ts:904
const CANVAS_ID = "editor-canvas";
const CROSSFADE_MS = 300;

type Row =
  | { kind: "date-header"; label: string; key: string }
  | {
      kind: "entry";
      entry: HistoryDisplayEntry;
      globalIndex: number;
      isCurrent: boolean;
    };

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitial(userId: string): string {
  const trimmed = userId.trim();
  return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : "?";
}

// Inline style objects hoisted so RowRenderer stays compact + stable identity.
const STYLE_TIME_BTN: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const STYLE_USER_CHIP: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: "var(--aqb-primary-subtle)",
  color: "var(--aqb-primary)",
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1,
};

const STYLE_RELATIVE_TIME: React.CSSProperties = {
  fontSize: 11,
  color: "var(--aqb-text-muted)",
};

const STYLE_DIFF_COUNT: React.CSSProperties = {
  marginLeft: 6,
  fontSize: 11,
  color: "var(--aqb-text-muted)",
  fontVariantNumeric: "tabular-nums",
};

const STYLE_SHOW_ALL_BTN: React.CSSProperties = {
  marginTop: 6,
  alignSelf: "flex-start",
};

const STYLE_VIRTUAL_HOST: React.CSSProperties = { flex: 1, minHeight: 0 };

interface ExtendedActivityViewProps extends ActivityViewProps {
  /** Open the Time-Travel scrubber drawer */
  onOpenTimeTravel?: () => void;
  /** Clear all undo history (with confirm flow handled by parent) */
  onClearHistory?: () => void;
  /** Whether undo is currently available — disables Clear when false */
  canClear?: boolean;
}

export const ActivityView: React.FC<ExtendedActivityViewProps> = ({
  composer,
  searchQuery = "",
  error,
  onRetry,
  onOpenTimeTravel,
  onClearHistory,
  canClear,
}) => {
  const { historyStack, isLoading } = useHistoryState(composer);
  const reducedMotion = useReducedMotion();

  const [expandedGroupId, setExpandedGroupId] = React.useState<string | null>(null);
  const [showAllIds, setShowAllIds] = React.useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
  const [confirmingClear, setConfirmingClear] = React.useState(false);

  const scrollHostRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = React.useRef<any>(null);
  const [measuredHeight, setMeasuredHeight] = React.useState<number>(0);

  // Restore-animation timer tracking (F4).
  const restoreTimerRef = React.useRef<number | null>(null);
  const restoreCanvasRef = React.useRef<HTMLElement | null>(null);

  const filteredHistory = React.useMemo(() => {
    if (!searchQuery.trim()) return historyStack;
    const q = searchQuery.toLowerCase();
    return historyStack.filter(
      (entry) =>
        entry.label.toLowerCase().includes(q) ||
        entry.changes.some(
          (c) =>
            c.property.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        )
    );
  }, [historyStack, searchQuery]);

  const dateGroups = React.useMemo(() => groupByDate(filteredHistory), [filteredHistory]);
  const allEntries = React.useMemo(() => dateGroups.flatMap((g) => g.items), [dateGroups]);

  // Flatten dateGroups into a single row stream: date-header rows + entry rows.
  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [];
    let globalIndex = 0;
    for (const group of dateGroups) {
      out.push({ kind: "date-header", label: group.label, key: `h:${group.label}` });
      for (const entry of group.items) {
        out.push({
          kind: "entry",
          entry,
          globalIndex,
          isCurrent: globalIndex === 0,
        });
        globalIndex += 1;
      }
    }
    return out;
  }, [dateGroups]);

  // Per-entry collapsed change groups. Memoized so expand toggles don't recompute.
  const collapsedByEntry = React.useMemo(() => {
    const map = new Map<string, CollapsedChange[]>();
    for (const entry of allEntries) {
      if (entry.changes.length > 0) {
        map.set(entry.id, collapseIdenticalChanges(entry.changes));
      }
    }
    return map;
  }, [allEntries]);

  const toggleExpand = React.useCallback((id: string) => {
    setExpandedGroupId((prev) => (prev === id ? null : id));
    setShowAllIds(new Set());
  }, []);

  const toggleShowAll = React.useCallback((id: string) => {
    setShowAllIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // F1 — Row sizing based on kind + expansion state + show-all state.
  const getItemSize = React.useCallback(
    (index: number): number => {
      const row = rows[index];
      if (!row) return ROW_H_COLLAPSED;
      if (row.kind === "date-header") return ROW_H_DATE_HEADER;
      const { entry } = row;
      if (expandedGroupId !== entry.id || entry.changes.length === 0) {
        return ROW_H_COLLAPSED;
      }
      const collapsed = collapsedByEntry.get(entry.id) ?? [];
      const showAll = showAllIds.has(entry.id);
      const visibleCount = showAll
        ? collapsed.length
        : Math.min(collapsed.length, MAX_VISIBLE_CHANGES);
      const hasMore = collapsed.length > MAX_VISIBLE_CHANGES;
      const diffPad = 10;
      return (
        ROW_H_COLLAPSED +
        diffPad +
        visibleCount * ROW_H_CHANGE +
        (hasMore ? ROW_H_SHOW_ALL_BTN : 0)
      );
    },
    [rows, expandedGroupId, showAllIds, collapsedByEntry]
  );

  // Reset virtual-list size caches whenever any row's size might have changed.
  React.useEffect(() => {
    listRef.current?.resetAfterIndex?.(0, true);
  }, [rows, expandedGroupId, showAllIds, collapsedByEntry]);

  // F1 — Measure container height via ResizeObserver.
  React.useLayoutEffect(() => {
    const host = scrollHostRef.current;
    if (!host) return;
    const update = () => setMeasuredHeight(host.clientHeight);
    update();
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    if (!RO) {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new RO(update);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Keyboard nav (j/k/g/G/Enter/Esc) — unchanged semantics, operates on entry list.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (allEntries.length === 0) return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, allEntries.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "g":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setFocusedIndex(0);
          }
          break;
        case "G":
          e.preventDefault();
          setFocusedIndex(allEntries.length - 1);
          break;
        case "Enter":
        case " ": {
          e.preventDefault();
          const entry = allEntries[focusedIndex];
          if (entry && entry.changes.length > 0) toggleExpand(entry.id);
          break;
        }
        case "Escape":
          e.preventDefault();
          setExpandedGroupId(null);
          setShowAllIds(new Set());
          setConfirmingClear(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [allEntries, focusedIndex, toggleExpand]);

  // Scroll focused entry into view via react-window's scrollToItem.
  React.useEffect(() => {
    if (!listRef.current || rows.length === 0) return;
    let rowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.kind === "entry" && r.globalIndex === focusedIndex) {
        rowIndex = i;
        break;
      }
    }
    if (rowIndex >= 0) {
      listRef.current.scrollToItem?.(rowIndex, "smart");
    }
  }, [focusedIndex, rows]);

  const handleClearClick = React.useCallback(() => {
    if (confirmingClear) {
      onClearHistory?.();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
    }
  }, [confirmingClear, onClearHistory]);

  // F4 — Timestamp click = smooth restore with opacity crossfade.
  const cancelPendingRestore = React.useCallback(() => {
    if (restoreTimerRef.current !== null) {
      window.clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  }, []);

  const clearCanvasAnim = React.useCallback(() => {
    const canvas = restoreCanvasRef.current;
    if (canvas) {
      canvas.style.transition = "";
      canvas.style.opacity = "";
      restoreCanvasRef.current = null;
    }
  }, []);

  const handleTimestampClick = React.useCallback(
    (entryId: string) => {
      if (!composer) return;

      // Cancel any in-flight animation so a second click jumps immediately.
      cancelPendingRestore();

      if (reducedMotion) {
        clearCanvasAnim();
        composer.history.restoreEntry(entryId);
        return;
      }

      const canvas = document.getElementById(CANVAS_ID) as HTMLElement | null;
      if (!canvas) {
        composer.history.restoreEntry(entryId);
        return;
      }

      restoreCanvasRef.current = canvas;
      canvas.style.transition = `opacity ${CROSSFADE_MS}ms ease-out`;
      canvas.style.opacity = "0";

      restoreTimerRef.current = window.setTimeout(() => {
        composer.history.restoreEntry(entryId);
        if (canvas) canvas.style.opacity = "1";
        restoreTimerRef.current = window.setTimeout(() => {
          clearCanvasAnim();
          restoreTimerRef.current = null;
        }, CROSSFADE_MS);
      }, CROSSFADE_MS);
    },
    [composer, reducedMotion, cancelPendingRestore, clearCanvasAnim]
  );

  // Unmount cleanup: kill any pending restore timer + reset canvas styles.
  React.useEffect(() => {
    return () => {
      cancelPendingRestore();
      clearCanvasAnim();
    };
  }, [cancelPendingRestore, clearCanvasAnim]);

  const renderHeader = () => (
    <div className="activity-header">
      <span className="activity-header-label">Undo History</span>
      <div style={{ display: "flex", gap: 6 }}>
        {onClearHistory && (
          confirmingClear ? (
            <>
              <button
                onClick={handleClearClick}
                className="action-btn danger"
                aria-label="Confirm clear history"
              >
                Clear all
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                className="action-btn"
                aria-label="Cancel clear"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleClearClick}
              className="action-btn"
              disabled={!canClear}
              aria-label="Clear undo history"
              title="Clear undo history"
            >
              Clear
            </button>
          )
        )}
        {onOpenTimeTravel && (
          <button
            type="button"
            className="tt-btn"
            onClick={onOpenTimeTravel}
            aria-label="Open Time-Travel scrubber (Ctrl+Shift+T)"
            title="Time-Travel (Ctrl+Shift+T)"
          >
            <TimeTravelIcon />
            Time-Travel
          </button>
        )}
      </div>
    </div>
  );

  const renderKeyboardHints = () => (
    <div className="keyboard-hints" aria-hidden="true">
      <span className="kbd-hint">
        <kbd>j</kbd>
        <kbd>k</kbd>
        navigate
      </span>
      <span className="kbd-hint">
        <kbd>Enter</kbd>
        expand
      </span>
      <span className="kbd-hint">
        <kbd>g</kbd>
        <kbd>G</kbd>
        start/end
      </span>
    </div>
  );

  // F1 — Row renderer handed to VariableSizeList.
  const RowRenderer = React.useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = rows[index];
      if (!row) return null;

      if (row.kind === "date-header") {
        return (
          <div style={style} className="hist-date-group">
            <div className="date-group-header">{row.label}</div>
          </div>
        );
      }

      const { entry, globalIndex, isCurrent } = row;
      const isExpanded = expandedGroupId === entry.id;
      const hasChanges = entry.changes.length > 0;
      const isFocused = focusedIndex === globalIndex;
      const isCheckpoint = entry.type === "checkpoint";
      const showAll = showAllIds.has(entry.id);
      const collapsed = collapsedByEntry.get(entry.id) ?? [];
      const visibleCollapsed = showAll
        ? collapsed
        : collapsed.slice(0, MAX_VISIBLE_CHANGES);
      const hasMore = collapsed.length > MAX_VISIBLE_CHANGES;
      const timeLabel = formatTime(entry.timestamp);
      const hasUser = !!(entry.userId && entry.userId.trim().length > 0);

      const rowClass = [
        "entry-row",
        isFocused && "focused",
        isCurrent && "current",
        isExpanded && "expanded",
      ]
        .filter(Boolean)
        .join(" ");

      const entryAriaLabel = hasUser
        ? `Change by ${entry.userId} at ${timeLabel}: ${entry.label}`
        : `${entry.label} at ${timeLabel}`;

      return (
        <div style={style}>
          <div
            className={rowClass}
            data-focused={isFocused}
            role="listitem"
            tabIndex={hasChanges ? 0 : -1}
            aria-expanded={hasChanges ? isExpanded : undefined}
            aria-label={entryAriaLabel}
            onClick={() => hasChanges && toggleExpand(entry.id)}
            onMouseEnter={() => setFocusedIndex(globalIndex)}
          >
            <div className="entry-row-main">
              <div>
                <div className="entry-label">{entry.label}</div>
                <div className="entry-meta">
                  <button
                    type="button"
                    className="entry-time-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimestampClick(entry.id);
                    }}
                    aria-label={`Jump to ${timeLabel}`}
                    title={`Jump to ${timeLabel}`}
                    style={STYLE_TIME_BTN}
                  >
                    <span className="entry-time">{timeLabel}</span>
                  </button>
                  <span style={STYLE_RELATIVE_TIME}>
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                  {hasUser && (
                    <span
                      title={entry.userId ?? undefined}
                      aria-hidden="true"
                      style={STYLE_USER_CHIP}
                    >
                      {getInitial(entry.userId!)}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="entry-badge current-badge">Current</span>
                  )}
                  {isCheckpoint && !isCurrent && (
                    <span className="entry-badge checkpoint">Checkpoint</span>
                  )}
                  {hasChanges && (
                    <span className="entry-badge grouped">
                      {collapsed.length} change
                      {collapsed.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              {hasChanges && (
                <svg
                  className={`expand-icon${isExpanded ? " open" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>

            {isExpanded && hasChanges && (
              <div
                className="diff-preview"
                role="region"
                aria-label="Changes detail"
                onClick={(e) => e.stopPropagation()}
              >
                {visibleCollapsed.map((group, idx) => (
                  <div
                    key={`${group.property}|${group.operation}|${group.type}|${idx}`}
                    className="diff-item"
                  >
                    <span className={`diff-op ${group.operation}`}>
                      {OP_ICON[group.operation] ?? "·"}
                    </span>
                    <span className="diff-prop" title={group.sample.description}>
                      {group.property}
                    </span>
                    <span className={`diff-badge ${group.type}`}>{group.type}</span>
                    {group.count > 1 && (
                      <span
                        className="diff-count"
                        aria-label={`${group.count} occurrences`}
                        style={STYLE_DIFF_COUNT}
                      >
                        × {group.count}
                      </span>
                    )}
                  </div>
                ))}
                {hasMore && (
                  <button
                    className="action-btn"
                    style={STYLE_SHOW_ALL_BTN}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleShowAll(entry.id);
                    }}
                  >
                    {showAll
                      ? "Show less"
                      : `Show all ${collapsed.length} changes`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      rows,
      expandedGroupId,
      focusedIndex,
      showAllIds,
      collapsedByEntry,
      toggleExpand,
      toggleShowAll,
      handleTimestampClick,
    ]
  );

  if (error) {
    return (
      <div className="activity-view">
        {renderHeader()}
        <div className="empty-state" role="alert">
          <div className="empty-icon" aria-hidden="true">⚠</div>
          <p className="empty-title">Failed to load activity</p>
          {onRetry && (
            <button className="action-btn primary" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="activity-view">
        {renderHeader()}
        <div className="virtual-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="entry-row" aria-hidden="true">
              <div className="entry-row-main" style={{ padding: "8px 12px" }}>
                <div>
                  <div className="skeleton" style={{ width: "60%", height: 14 }} />
                  <div
                    className="skeleton"
                    style={{ width: "40%", height: 12, marginTop: 4 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {renderKeyboardHints()}
      </div>
    );
  }

  if (filteredHistory.length === 0) {
    return (
      <div className="activity-view">
        {renderHeader()}
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 16h4l3-6 3 12 3-6h4" />
            </svg>
          </div>
          <p className="empty-title">
            {historyStack.length === 0 ? "No undo history" : "No matching entries"}
          </p>
          <p className="empty-hint">
            {historyStack.length === 0 ? (
              <>
                Use <kbd>Ctrl+Z</kbd> to undo changes
              </>
            ) : (
              "Try a different search term"
            )}
          </p>
        </div>
        {renderKeyboardHints()}
      </div>
    );
  }

  return (
    <div className="activity-view">
      {renderHeader()}
      <div
        ref={scrollHostRef}
        className="virtual-list"
        role="list"
        style={STYLE_VIRTUAL_HOST}
      >
        {measuredHeight > 0 && (
          <VariableSizeList
            ref={listRef}
            height={measuredHeight}
            width="100%"
            itemCount={rows.length}
            itemSize={getItemSize}
            overscanCount={5}
            itemKey={(index: number) => {
              const r = rows[index];
              return r ? (r.kind === "date-header" ? r.key : r.entry.id) : index;
            }}
          >
            {RowRenderer}
          </VariableSizeList>
        )}
      </div>
      {renderKeyboardHints()}
    </div>
  );
};
