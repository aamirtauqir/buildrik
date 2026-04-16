/**
 * ActivityView Component
 * Displays undo history with expandable diff preview
 * Phase 3: Keyboard navigation, accordion expand, "Show all N"
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useHistoryState } from "../../../../../shared/hooks/useHistoryState";
import { useReducedMotion } from "../../../../../shared/hooks/useReducedMotion";
import { formatRelativeTime, groupByDate } from "../helpers";
import { ChevronIcon } from "../icons";
import type { ActivityViewProps } from "../types";
import { DiffRow } from "./DiffRow";

const MAX_VISIBLE_CHANGES = 5;

export const ActivityView: React.FC<ActivityViewProps> = ({
  composer,
  searchQuery = "",
  error,
  onRetry,
}) => {
  const { historyStack, isLoading } = useHistoryState(composer);
  const reducedMotion = useReducedMotion();

  // Accordion: only one group expands at a time
  const [expandedGroupId, setExpandedGroupId] = React.useState<string | null>(null);
  // Track show-all state per entry
  const [showAllIds, setShowAllIds] = React.useState<Set<string>>(new Set());

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter history by search query
  const filteredHistory = React.useMemo(() => {
    if (!searchQuery.trim()) return historyStack;
    const query = searchQuery.toLowerCase();
    return historyStack.filter(
      (entry) =>
        entry.label.toLowerCase().includes(query) ||
        entry.changes.some(
          (c) =>
            c.property.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query)
        )
    );
  }, [historyStack, searchQuery]);

  // Flatten all entries for keyboard navigation
  const allEntries = React.useMemo(() => {
    const groups = groupByDate(filteredHistory);
    return groups.flatMap((g) => g.items);
  }, [filteredHistory]);

  // Keyboard navigation handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const entries = allEntries;
      if (entries.length === 0) return;

      switch (e.key) {
        case "j": // down
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, entries.length - 1));
          break;
        case "k": // up
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "g": // start
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            setFocusedIndex(0);
          }
          break;
        case "G": // end
          e.preventDefault();
          setFocusedIndex(entries.length - 1);
          break;
        case "Enter": // expand/collapse
        case " ":
          e.preventDefault();
          const entry = entries[focusedIndex];
          if (entry && entry.changes.length > 0) {
            toggleExpand(entry.id);
          }
          break;
        case "Escape": // collapse
          e.preventDefault();
          setExpandedGroupId(null);
          setShowAllIds(new Set());
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [allEntries, focusedIndex]);

  // Scroll focused item into view
  React.useEffect(() => {
    if (!containerRef.current) return;
    const focusedEl = containerRef.current.querySelector(
      "[data-focused='true']"
    ) as HTMLElement;
    if (focusedEl) {
      focusedEl.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [focusedIndex, reducedMotion]);

  // Accordion expand - one group at a time
  const toggleExpand = React.useCallback((id: string) => {
    setExpandedGroupId((prev) => (prev === id ? null : id));
    setShowAllIds(new Set()); // reset show-all on expand
  }, []);

  // Toggle show all for an entry
  const toggleShowAll = React.useCallback((id: string) => {
    setShowAllIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (error) {
    return (
      <div className="hist-error">
        <span className="hist-error__icon" aria-hidden="true">
          ⚠
        </span>
        <p>Failed to load activity</p>
        {onRetry && (
          <button className="hist-error__retry" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="aqb-ht-activity-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aqb-ht-entry">
            <div className="aqb-ht-entry__row">
              <div className="aqb-ht-entry__expand">
                <div className="aqb-ht-skeleton" style={{ width: 12, height: 12 }} />
              </div>
              <div className="aqb-ht-entry__info">
                <div className="aqb-ht-skeleton" style={{ width: "60%", height: 14 }} />
                <div className="aqb-ht-skeleton" style={{ width: "40%", height: 12, marginTop: 4 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredHistory.length === 0) {
    return (
      <div className="aqb-ht-empty">
        <div className="aqb-ht-empty__icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 16h4l3-6 3 12 3-6h4" />
          </svg>
        </div>
        <p className="aqb-ht-empty__title">
          {historyStack.length === 0 ? "No undo history" : "No matching entries"}
        </p>
        <p className="aqb-ht-empty__desc">
          {historyStack.length === 0 ? (
            <>
              Use <kbd className="aqb-ht-kbd">Ctrl+Z</kbd> to undo changes
            </>
          ) : (
            "Try a different search term"
          )}
        </p>
      </div>
    );
  }

  const dateGroups = groupByDate(filteredHistory);

  return (
    <div ref={containerRef} className="aqb-ht-activity-list" role="list">
      {/* Keyboard hints */}
      <div className="aqb-ht-keyboard-hints">
        <span>
          <kbd className="aqb-ht-kbd">j</kbd>/<kbd className="aqb-ht-kbd">k</kbd> navigate
        </span>
        <span>
          <kbd className="aqb-ht-kbd">Enter</kbd> expand
        </span>
        <span>
          <kbd className="aqb-ht-kbd">g</kbd>/<kbd className="aqb-ht-kbd">G</kbd> jump
        </span>
      </div>

      {dateGroups.map(({ label, items: groupItems }) => (
        <div key={label} className="hist-date-group">
          <div className="hist-group-label">{label}</div>
          {groupItems.map((entry, index) => {
            const isExpanded = expandedGroupId === entry.id;
            const hasChanges = entry.changes.length > 0;
            const isFirst = index === 0 && label === dateGroups[0].label;
            const globalIndex = allEntries.findIndex((e) => e.id === entry.id);
            const isFocused = focusedIndex === globalIndex;
            const showAll = showAllIds.has(entry.id);
            const visibleChanges = showAll ? entry.changes : entry.changes.slice(0, MAX_VISIBLE_CHANGES);
            const hasMore = entry.changes.length > MAX_VISIBLE_CHANGES;

            return (
              <div
                key={entry.id}
                className={`aqb-ht-entry hist-event-row${isFocused ? " aqb-ht-entry--focused" : ""}`}
                data-focused={isFocused}
                role="listitem"
              >
                {/* Entry Header Row */}
                <div
                  className={`aqb-ht-entry__row${hasChanges ? " aqb-ht-entry__row--clickable" : ""}`}
                  onClick={() => hasChanges && toggleExpand(entry.id)}
                  onMouseEnter={() => setFocusedIndex(globalIndex)}
                  role={hasChanges ? "button" : undefined}
                  aria-expanded={hasChanges ? isExpanded : undefined}
                  tabIndex={hasChanges ? 0 : -1}
                >
                  {/* Expand/Collapse Icon */}
                  <div className="aqb-ht-entry__expand">
                    {hasChanges ? (
                      <ChevronIcon expanded={isExpanded} />
                    ) : (
                      <div className="aqb-ht-entry__dot" />
                    )}
                  </div>

                  {/* Entry Info */}
                  <div className="aqb-ht-entry__info hist-event-row__text">
                    <div className="aqb-ht-entry__label">
                      {entry.label}
                      {entry.type === "checkpoint" && (
                        <span className="aqb-ht-entry__badge">checkpoint</span>
                      )}
                    </div>
                    <div className="aqb-ht-entry__meta hist-event-row__time">
                      {formatRelativeTime(entry.timestamp)}
                      {entry.changes.length > 0 && (
                        <span className="aqb-ht-entry__count">
                          {" "}· {entry.changes.length} change{entry.changes.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current indicator (first entry overall = most recent) */}
                  {isFirst && <div className="aqb-ht-entry__current">Current</div>}
                </div>

                {/* Expanded Diff Details */}
                {isExpanded && hasChanges && (
                  <div className="aqb-ht-diff" role="region" aria-label="Changes detail">
                    {visibleChanges.map((change, idx) => (
                      <DiffRow key={idx} change={change} />
                    ))}
                    {hasMore && (
                      <button
                        className="aqb-ht-show-all"
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
  );
};