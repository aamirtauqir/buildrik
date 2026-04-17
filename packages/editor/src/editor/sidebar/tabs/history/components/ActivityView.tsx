/**
 * ActivityView — Undo/redo activity timeline
 * Pixel-aligned with the History Tab prototype:
 *   activity-header (label + Time-Travel button)
 *   virtual-list with sticky date-group-header
 *   entry-row → entry-row-main → entry-label / entry-meta / entry-badge
 *   diff-preview with diff-item rows (operation icon + property + change-type badge)
 *   keyboard-hints footer
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { VersionHistoryManager } from "../../../../../engine/VersionHistoryManager";
import { useHistoryState } from "../../../../../shared/hooks/useHistoryState";
import { useReducedMotion } from "../../../../../shared/hooks/useReducedMotion";
import { formatRelativeTime, groupByDate } from "../helpers";
import { TimeTravelIcon } from "../icons";
import type { ActivityViewProps } from "../types";

const MAX_VISIBLE_CHANGES = 5;

const OP_ICON: Record<string, string> = {
  add: "+",
  remove: "−",
  replace: "~",
  info: "·",
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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

  const containerRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    if (!containerRef.current) return;
    const focusedEl = containerRef.current.querySelector(
      "[data-focused='true']"
    ) as HTMLElement | null;
    focusedEl?.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [focusedIndex, reducedMotion]);

  const handleClearClick = React.useCallback(() => {
    if (confirmingClear) {
      onClearHistory?.();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
    }
  }, [confirmingClear, onClearHistory]);

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
      <div ref={containerRef} className="virtual-list" role="list">
        {dateGroups.map(({ label, items: groupItems }) => (
          <div key={label} className="hist-date-group">
            <div className="date-group-header">{label}</div>
            {groupItems.map((entry) => {
              const isExpanded = expandedGroupId === entry.id;
              const hasChanges = entry.changes.length > 0;
              const globalIndex = allEntries.findIndex((e) => e.id === entry.id);
              const isFocused = focusedIndex === globalIndex;
              const isCurrent = globalIndex === 0;
              const isCheckpoint = entry.type === "checkpoint";
              const showAll = showAllIds.has(entry.id);
              const visibleChanges = showAll
                ? entry.changes
                : entry.changes.slice(0, MAX_VISIBLE_CHANGES);
              const hasMore = entry.changes.length > MAX_VISIBLE_CHANGES;

              const rowClass = [
                "entry-row",
                isFocused && "focused",
                isCurrent && "current",
                isExpanded && "expanded",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={entry.id}
                  className={rowClass}
                  data-focused={isFocused}
                  role="listitem"
                  tabIndex={hasChanges ? 0 : -1}
                  aria-expanded={hasChanges ? isExpanded : undefined}
                  onClick={() => hasChanges && toggleExpand(entry.id)}
                  onMouseEnter={() => setFocusedIndex(globalIndex)}
                >
                  <div className="entry-row-main">
                    <div>
                      <div className="entry-label">{entry.label}</div>
                      <div className="entry-meta">
                        <span className="entry-time">{formatTime(entry.timestamp)}</span>
                        <span style={{ fontSize: 11, color: "var(--aqb-text-muted)" }}>
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                        {isCurrent && (
                          <span className="entry-badge current-badge">Current</span>
                        )}
                        {isCheckpoint && !isCurrent && (
                          <span className="entry-badge checkpoint">Checkpoint</span>
                        )}
                        {hasChanges && (
                          <span className="entry-badge grouped">
                            {entry.changes.length} change
                            {entry.changes.length !== 1 ? "s" : ""}
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
                      {visibleChanges.map((change, idx) => {
                        const op = (change.operation || "info") as keyof typeof OP_ICON;
                        const type = VersionHistoryManager.classifyProperty(change.property);
                        return (
                          <div key={idx} className="diff-item">
                            <span className={`diff-op ${op}`}>{OP_ICON[op] ?? "·"}</span>
                            <span className="diff-prop" title={change.description}>
                              {change.property}
                            </span>
                            <span className={`diff-badge ${type}`}>{type}</span>
                          </div>
                        );
                      })}
                      {hasMore && (
                        <button
                          className="action-btn"
                          style={{ marginTop: 6, alignSelf: "flex-start" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShowAll(entry.id);
                          }}
                        >
                          {showAll
                            ? "Show less"
                            : `Show all ${entry.changes.length} changes`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {renderKeyboardHints()}
    </div>
  );
};
