/**
 * useBulkSelect — Multi-select state for the pages list.
 *
 * Supports:
 * - Ctrl/Cmd+click → toggle individual page
 * - Shift+click → select contiguous range
 * - Space key on focused row → toggle
 * - Escape → clear all
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface UseBulkSelectReturn {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string, opts?: { shift?: boolean; orderedIds?: string[] }) => void;
  clearSelection: () => void;
  hasSelection: boolean;
  selectedCount: number;
}

export function useBulkSelect(): UseBulkSelectReturn {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  // Track last-clicked id for shift-range selection
  const lastClickedRef = React.useRef<string | null>(null);

  const toggleSelect = React.useCallback(
    (id: string, opts: { shift?: boolean; orderedIds?: string[] } = {}) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (opts.shift && lastClickedRef.current && opts.orderedIds) {
          // Select contiguous range between lastClicked and id
          const ids = opts.orderedIds;
          const a = ids.indexOf(lastClickedRef.current);
          const b = ids.indexOf(id);
          if (a !== -1 && b !== -1) {
            const [lo, hi] = a < b ? [a, b] : [b, a];
            for (let i = lo; i <= hi; i++) next.add(ids[i]);
            return next;
          }
        }

        // Plain toggle
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        lastClickedRef.current = id;
        return next;
      });
    },
    []
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    lastClickedRef.current = null;
  }, []);

  const isSelected = React.useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  return {
    selectedIds,
    isSelected,
    toggleSelect,
    clearSelection,
    hasSelection: selectedIds.size > 0,
    selectedCount: selectedIds.size,
  };
}
