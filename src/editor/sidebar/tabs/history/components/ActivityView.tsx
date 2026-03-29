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
import {
  emptyStateStyles,
  emptyStateTitleStyles,
  emptyStateDescStyles,
  activityListStyles,
  historyEntryContainerStyles,
  historyEntryRowStyles,
  expandIconContainerStyles,
  checkpointDotStyles,
  historyEntryInfoStyles,
  historyEntryLabelStyles,
  checkpointBadgeStyles,
  historyEntryMetaStyles,
  changeCountStyles,
  currentIndicatorStyles,
  diffContainerStyles,
} from "../styles";
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
      <div style={emptyStateStyles}>
        <ActivityIcon />
        <p style={emptyStateTitleStyles}>
          {historyStack.length === 0 ? "No undo history" : "No matching entries"}
        </p>
        <p style={emptyStateDescStyles}>
          {historyStack.length === 0
            ? "Changes you make can be undone here"
            : "Try a different search term"}
        </p>
      </div>
    );
  }

  return (
    <div style={activityListStyles}>
      {filteredHistory.map((entry, index) => {
        const isExpanded = expandedIds.has(entry.id);
        const hasChanges = entry.changes.length > 0;

        return (
          <div key={entry.id} style={historyEntryContainerStyles}>
            {/* Entry Header Row */}
            <div
              style={{
                ...historyEntryRowStyles,
                cursor: hasChanges ? "pointer" : "default",
              }}
              onClick={() => hasChanges && toggleExpand(entry.id)}
              role={hasChanges ? "button" : undefined}
              aria-expanded={hasChanges ? isExpanded : undefined}
              tabIndex={hasChanges ? 0 : undefined}
            >
              {/* Expand/Collapse Icon */}
              <div style={expandIconContainerStyles}>
                {hasChanges ? (
                  <ChevronIcon expanded={isExpanded} />
                ) : (
                  <div style={checkpointDotStyles} />
                )}
              </div>

              {/* Entry Info */}
              <div style={historyEntryInfoStyles}>
                <div style={historyEntryLabelStyles}>
                  {entry.label}
                  {entry.type === "checkpoint" && (
                    <span style={checkpointBadgeStyles}>checkpoint</span>
                  )}
                </div>
                <div style={historyEntryMetaStyles}>
                  {formatRelativeTime(entry.timestamp)}
                  {entry.changes.length > 0 && (
                    <span style={changeCountStyles}>
                      - {entry.changes.length} change{entry.changes.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Undo to here indicator (first entry = most recent) */}
              {index === 0 && <div style={currentIndicatorStyles}>Current</div>}
            </div>

            {/* Expanded Diff Details */}
            {isExpanded && hasChanges && (
              <div style={diffContainerStyles}>
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
