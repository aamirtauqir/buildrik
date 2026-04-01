/**
 * ActivityView Component
 * Displays undo history with expandable diff preview
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { HistoryDisplayEntry } from "../../../../../engine/HistoryManager";
import { EVENTS } from "../../../../../shared/constants";
import { formatRelativeTime } from "../helpers";
import { ActivityIcon, ChevronIcon } from "../icons";
import type { ActivityViewProps } from "../types";
import { DiffRow } from "./DiffRow";

export const ActivityView: React.FC<ActivityViewProps> = ({ composer, searchQuery = "" }) => {
  const [historyStack, setHistoryStack] = React.useState<HistoryDisplayEntry[]>([]);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  // Load history stack and listen for changes
  React.useEffect(() => {
    if (!composer?.history) return;

    const updateHistoryStack = () => {
      const stack = composer.history.getHistoryStack();
      setHistoryStack(stack);
    };

    // Initial load
    updateHistoryStack();

    // Listen for history changes
    composer.on(EVENTS.HISTORY_RECORDED, updateHistoryStack);
    composer.on(EVENTS.HISTORY_UNDO, updateHistoryStack);
    composer.on(EVENTS.HISTORY_REDO, updateHistoryStack);
    composer.on(EVENTS.HISTORY_CLEARED, updateHistoryStack);

    return () => {
      composer.off(EVENTS.HISTORY_RECORDED, updateHistoryStack);
      composer.off(EVENTS.HISTORY_UNDO, updateHistoryStack);
      composer.off(EVENTS.HISTORY_REDO, updateHistoryStack);
      composer.off(EVENTS.HISTORY_CLEARED, updateHistoryStack);
    };
  }, [composer]);

  // Filter history by search query
  const filteredHistory = React.useMemo(() => {
    if (!searchQuery.trim()) return historyStack;
    const query = searchQuery.toLowerCase();
    return historyStack.filter(
      (entry) =>
        entry.label.toLowerCase().includes(query) ||
        entry.changes.some(
          (c) =>
            c.property.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
        )
    );
  }, [historyStack, searchQuery]);

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (filteredHistory.length === 0) {
    return (
      <div className="aqb-ht-empty">
        <ActivityIcon />
        <p className="aqb-ht-empty__title">
          {historyStack.length === 0 ? "No undo history" : "No matching entries"}
        </p>
        <p className="aqb-ht-empty__desc">
          {historyStack.length === 0
            ? "Changes you make can be undone here"
            : "Try a different search term"}
        </p>
      </div>
    );
  }

  return (
    <div className="aqb-ht-activity-list">
      {filteredHistory.map((entry, index) => {
        const isExpanded = expandedIds.has(entry.id);
        const hasChanges = entry.changes.length > 0;

        return (
          <div key={entry.id} className="aqb-ht-entry">
            {/* Entry Header Row */}
            <div
              className={`aqb-ht-entry__row${hasChanges ? " aqb-ht-entry__row--clickable" : ""}`}
              onClick={() => hasChanges && toggleExpand(entry.id)}
              role={hasChanges ? "button" : undefined}
              aria-expanded={hasChanges ? isExpanded : undefined}
              tabIndex={hasChanges ? 0 : undefined}
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
              <div className="aqb-ht-entry__info">
                <div className="aqb-ht-entry__label">
                  {entry.label}
                  {entry.type === "checkpoint" && (
                    <span className="aqb-ht-entry__badge">checkpoint</span>
                  )}
                </div>
                <div className="aqb-ht-entry__meta">
                  {formatRelativeTime(entry.timestamp)}
                  {entry.changes.length > 0 && (
                    <span className="aqb-ht-entry__count">
                      - {entry.changes.length} change{entry.changes.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Undo to here indicator (first entry = most recent) */}
              {index === 0 && <div className="aqb-ht-entry__current">Current</div>}
            </div>

            {/* Expanded Diff Details */}
            {isExpanded && hasChanges && (
              <div className="aqb-ht-diff">
                {entry.changes.map((change, idx) => (
                  <DiffRow key={idx} change={change} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
