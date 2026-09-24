/**
 * History Tab Helpers
 * @license BSD-3-Clause
 */

import { VersionTimelineManager } from "../../../../engine/VersionTimelineManager";
import type { ChangeType, HistoryChange } from "../../../../engine/historyTypes";
import { formatRelativeTime as sharedFormatRelativeTime } from "../../../../shared/utils/relativeTime";

/**
 * Collapsed change group — one row in the diff preview.
 * Represents N raw changes that share (property, operation, classified type).
 */
export interface CollapsedChange {
  property: string;
  operation: "add" | "remove" | "replace" | "info";
  type: ChangeType;
  count: number;
  /** First raw change in the group — used for hover tooltip (description). */
  sample: HistoryChange;
}

/**
 * Collapse identical changes within one entry by (property, operation, classified-type).
 * Sorted by count descending so the most-changed property appears first.
 */
export function collapseIdenticalChanges(
  changes: readonly HistoryChange[]
): CollapsedChange[] {
  const map = new Map<string, CollapsedChange>();
  for (const change of changes) {
    const op = (change.operation || "info") as CollapsedChange["operation"];
    const type = VersionTimelineManager.classifyProperty(change.property);
    const key = `${change.property}|${op}|${type}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { property: change.property, operation: op, type, count: 1, sample: change });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function formatRelativeTime(timestamp: number): string {
  return sharedFormatRelativeTime(timestamp, { fallback: "time" });
}
