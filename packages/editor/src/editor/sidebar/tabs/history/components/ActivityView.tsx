/**
 * ActivityView — Undo/redo activity timeline
 * Pixel-aligned with the History Tab prototype:
 *   virtual-list of 44-tall rows (virtualized via react-window) — board
 *   4418:73791: "label · author" left, the time in mono right (a restore)
 *   diff-preview with diff-item rows (operation icon + property + change-type badge)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Kbd, Button, ConfirmDialog } from "@/editor/chrome-ui";
// react-window 1.8.x ships JS only; stub the minimal surface we use.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — module has no bundled .d.ts (see @types/react-window stub)
import { VariableSizeList } from "react-window";
import { useHistoryState } from "../../../../../shared/hooks/useHistoryState";
import { useReducedMotion } from "../../../../../shared/hooks/useReducedMotion";
import { collapseIdenticalChanges, type CollapsedChange } from "../helpers";
import type { ActivityViewProps } from "../types";
import type { HistoryDisplayEntry } from "../../../../../engine/historyTypes";
const MAX_VISIBLE_CHANGES = 5;

// Row sizing constants (see spec §2.5). 44 is board 163:48's change row; the
// rows are contiguous there, so the virtual slot IS the row and `.entry-row`
// carries no vertical margin.
const ROW_H_COLLAPSED = 44;
const ROW_H_CHANGE = 24;
const ROW_H_SHOW_ALL_BTN = 32;

const OP_ICON: Record<string, string> = {
  add: "+",
  remove: "−",
  replace: "~",
  info: "·",
};

// Canonical canvas id — see VersionTimelineManager.ts:904
const CANVAS_ID = "editor-canvas";
const CROSSFADE_MS = 300;


function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

const STYLE_DIFF_COUNT: React.CSSProperties = {
  marginLeft: 6,
  fontSize: 11,
  color: "var(--bk-ink-muted)",
  fontVariantNumeric: "tabular-nums",
};

const STYLE_SHOW_ALL_BTN: React.CSSProperties = {
  marginTop: 6,
  alignSelf: "flex-start",
};

const STYLE_VIRTUAL_HOST: React.CSSProperties = { flex: 1, minHeight: 0 };

/* Board 4418:73791 draws the Session list with no header band: "Undo
   History · Clear · Time-Travel" moved to the History panel's ⋯ (HistoryTab),
   which owns the clear confirm. */
export const ActivityView: React.FC<ActivityViewProps> = ({
  composer,
  searchQuery = "",
  error,
  onRetry,
}) => {
  const { historyStack, isLoading, canRedo } = useHistoryState(composer);
  const reducedMotion = useReducedMotion();

  const [expandedGroupId, setExpandedGroupId] = React.useState<string | null>(null);
  const [showAllIds, setShowAllIds] = React.useState<Set<string>>(new Set());
  /* -1 = nothing focused until j/k or the pointer picks a row: the board's
     first row is drawn unhighlighted. */
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
  const [pendingRestoreId, setPendingRestoreId] = React.useState<string | null>(null);

  const scrollHostRef = React.useRef<HTMLDivElement | null>(null);
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

  /* Board 4418:73791 draws the session as one run of rows, newest first — no
     Today / Yesterday bands (a session rarely spans a day, and the time on
     every row already says when). One row per entry, so the entry index IS
     the row index. */
  const allEntries = filteredHistory;

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
      const entry = allEntries[index];
      if (!entry) return ROW_H_COLLAPSED;
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
    [allEntries, expandedGroupId, showAllIds, collapsedByEntry]
  );

  // Reset virtual-list size caches whenever any row's size might have changed.
  React.useEffect(() => {
    listRef.current?.resetAfterIndex?.(0, true);
  }, [allEntries, expandedGroupId, showAllIds, collapsedByEntry]);

  /* F1 — Measure the scroll host, via a CALLBACK ref rather than a mount-time
     effect. The effect ran once, on mount, when this component was still
     rendering its loading skeleton — a branch that never renders the ref'd
     div. So `scrollHostRef.current` was null, the effect returned early, and
     with `[]` deps it never ran again: `measuredHeight` stayed 0 for the life
     of the panel and `{measuredHeight > 0 && <VariableSizeList/>}` rendered
     NOTHING. Measured in the editor with three real undo entries: History →
     All changes drew its header and an empty 430px box — no rows, and not the
     empty state either. A callback ref fires when the node actually attaches,
     which is the moment there is something to measure. */
  const roRef = React.useRef<ResizeObserver | null>(null);
  const attachScrollHost = React.useCallback((host: HTMLDivElement | null) => {
    scrollHostRef.current = host;
    roRef.current?.disconnect();
    roRef.current = null;
    if (!host) return;
    setMeasuredHeight(host.clientHeight);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setMeasuredHeight(host.clientHeight));
    ro.observe(host);
    roRef.current = ro;
  }, []);
  React.useEffect(() => () => roRef.current?.disconnect(), []);

  // Keyboard nav (j/k/g/G/Enter/Esc) — unchanged semantics, operates on entry list.
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // The restore confirm owns the keyboard while it is open — j/k must not
      // move the selection behind it, and Enter belongs to its buttons.
      if (pendingRestoreId) return;

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
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [allEntries, focusedIndex, toggleExpand, pendingRestoreId]);

  // Scroll focused entry into view via react-window's scrollToItem.
  React.useEffect(() => {
    if (!listRef.current || focusedIndex < 0) return;
    listRef.current.scrollToItem?.(focusedIndex, "smart");
  }, [focusedIndex, allEntries]);

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

  const runRestore = React.useCallback(
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

  /* The timestamp is a RESTORE, not a jump: `history.restoreEntry` truncates
     the undo stack at that point and empties the redo stack, so everything
     after it is gone for good. It shipped labelled "Jump to 14:32" and fired
     straight from the click — one stray click on a row header and the work
     after it was unrecoverable. The click now only asks; the dialog names how
     many steps go and whether any of them are unsaved. */
  const requestRestore = React.useCallback((entryId: string) => {
    setPendingRestoreId(entryId);
  }, []);

  /* Position in the newest-first stack IS the number of later steps discarded,
     and it is read off the unfiltered stack so a search box cannot undercount
     it. Derived rather than stored so a stack that moves under an open dialog
     cannot leave a stale count on screen. */
  const pendingRestore = React.useMemo(() => {
    if (!pendingRestoreId) return null;
    const discarded = historyStack.findIndex((e) => e.id === pendingRestoreId);
    if (discarded < 0) return null;
    const target = historyStack[discarded];
    return {
      id: target.id,
      label: target.label,
      time: formatTime(target.timestamp),
      discarded,
    };
  }, [pendingRestoreId, historyStack]);

  const renderRestoreConfirm = () => {
    if (!pendingRestore) return null;
    const { discarded } = pendingRestore;
    const losses: string[] = [];
    if (discarded > 0) {
      losses.push(`${discarded} later change${discarded === 1 ? "" : "s"}`);
    }
    if (canRedo) losses.push("everything you can currently redo");
    const unsaved = losses.length > 0 && composer?.isDirty() === true;

    return (
      <ConfirmDialog
        open
        tone="destructive"
        title={`Restore to ${pendingRestore.time}?`}
        message={
          <>
            This rewinds the project to <strong>{pendingRestore.label}</strong> at{" "}
            {pendingRestore.time}.{" "}
            {losses.length > 0
              ? `It permanently discards ${losses.join(" and ")}.`
              : "Nothing later is discarded."}
            {unsaved ? " Some of that work has not been saved yet." : ""}
          </>
        }
        confirmLabel={
          discarded > 0
            ? `Restore, discard ${discarded} change${discarded === 1 ? "" : "s"}`
            : `Restore to ${pendingRestore.time}`
        }
        onClose={() => setPendingRestoreId(null)}
        onConfirm={() => {
          setPendingRestoreId(null);
          runRestore(pendingRestore.id);
        }}
      />
    );
  };

  // Unmount cleanup: kill any pending restore timer + reset canvas styles.
  React.useEffect(() => {
    return () => {
      cancelPendingRestore();
      clearCanvasAnim();
    };
  }, [cancelPendingRestore, clearCanvasAnim]);

  // F1 — Row renderer handed to VariableSizeList.
  const RowRenderer = React.useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const entry = allEntries[index];
      if (!entry) return null;
      const globalIndex = index;
      const isExpanded = expandedGroupId === entry.id;
      const hasChanges = entry.changes.length > 0;
      const isFocused = focusedIndex === globalIndex;
      const showAll = showAllIds.has(entry.id);
      const collapsed = collapsedByEntry.get(entry.id) ?? [];
      const visibleCollapsed = showAll
        ? collapsed
        : collapsed.slice(0, MAX_VISIBLE_CHANGES);
      const hasMore = collapsed.length > MAX_VISIBLE_CHANGES;
      const timeLabel = formatTime(entry.timestamp);
      /* The undo stack is this browser's session, and HistoryManager stamps
         every entry with the signed-in user — so a stamped entry is always the
         viewer's own. `userId` is an account id (a cuid), never a name: it was
         drawn as its first letter in a chip, i.e. a meaningless "C". Board
         4418:73791's "label · author" reads "· You" here. */
      const author = entry.userId?.trim() ? "You" : null;

      const rowClass = [
        "entry-row",
        isFocused && "focused",
        isExpanded && "expanded",
      ]
        .filter(Boolean)
        .join(" ");

      const entryAriaLabel = author
        ? `Your change at ${timeLabel}: ${entry.label}`
        : `${entry.label} at ${timeLabel}`;

      return (
        <div style={style}>
          <div
            className={rowClass}
            data-focused={isFocused}
            data-testid={`history-change-${globalIndex}`}
            role="listitem"
            tabIndex={hasChanges ? 0 : -1}
            aria-expanded={hasChanges ? isExpanded : undefined}
            aria-label={entryAriaLabel}
            onClick={() => hasChanges && toggleExpand(entry.id)}
            onMouseEnter={() => setFocusedIndex(globalIndex)}
          >
            <div className="entry-row-main">
              <div className="entry-label" data-testid={`history-change-label-${globalIndex}`}>
                {author ? `${entry.label} · ${author}` : entry.label}
              </div>
              <Button
                type="button"
                /* flowbite's Button is 40 tall and a plain class cannot
                   reach it — only a same-property `tw:` utility survives
                   twMerge (CLAUDE.md §Chrome). */
                className="entry-time-btn tw:h-4 tw:min-h-0"
                onClick={(e) => {
                  e.stopPropagation();
                  requestRestore(entry.id);
                }}
                aria-label={`Restore the project to ${timeLabel}`}
                title={`Restore the project to ${timeLabel} — discards every later change`}
                style={STYLE_TIME_BTN}
              >
                <span className="entry-time" data-testid={`history-change-time-${globalIndex}`}>
                  {timeLabel}
                </span>
              </Button>
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
                  <Button
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
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      allEntries,
      expandedGroupId,
      focusedIndex,
      showAllIds,
      collapsedByEntry,
      toggleExpand,
      toggleShowAll,
      requestRestore,
    ]
  );

  if (error) {
    return (
      <div className="activity-view">
        <div className="empty-state" role="alert">
          <div className="empty-icon" aria-hidden="true">⚠</div>
          <p className="empty-title">Failed to load activity</p>
          {onRetry && (
            <Button className="action-btn primary" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="activity-view">
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
      </div>
    );
  }

  if (filteredHistory.length === 0) {
    return (
      <div className="activity-view">
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
                Use <Kbd>Ctrl+Z</Kbd> to undo changes
              </>
            ) : (
              "Try a different search term"
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-view">
      <div
        ref={attachScrollHost}
        className="virtual-list"
        role="list"
        style={STYLE_VIRTUAL_HOST}
      >
        {measuredHeight > 0 && (
          <VariableSizeList
            ref={listRef}
            height={measuredHeight}
            width="100%"
            itemCount={allEntries.length}
            itemSize={getItemSize}
            overscanCount={5}
            itemKey={(index: number) => allEntries[index]?.id ?? index}
          >
            {RowRenderer}
          </VariableSizeList>
        )}
      </div>
      {renderRestoreConfirm()}
    </div>
  );
};
