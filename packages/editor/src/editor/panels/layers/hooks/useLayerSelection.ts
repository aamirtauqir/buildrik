/**
 * useLayerSelection - Mirrors Composer selection state.
 *
 * Composer.selection is the single source of truth. Local selectedIds
 * is a read-only mirror updated via composer events. User actions (click,
 * shift+click, meta+click) call composer methods only — composer emits
 * `selection:changed` / `selection:cleared` and the mirror updates.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { flattenTree } from "../data/layerUtils";
import type { LayerItem } from "../types";

export interface UseLayerSelectionReturn {
  selectedIds: Set<string>;
  hoveredLayerId: string | null;
  selectLayer: (id: string, modifiers: { shift?: boolean; meta?: boolean }) => void;
  selectSingle: (id: string) => void;
  clearSelection: () => void;
  handleLayerMouseEnter: (id: string) => void;
  handleLayerMouseLeave: () => void;
}

export function useLayerSelection(
  composer: Composer | null,
  layers: LayerItem[],
  _expandedIds: Set<string>
): UseLayerSelectionReturn {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => {
    if (!composer) return new Set();
    return new Set(composer.selection.getSelectedIds());
  });
  const [hoveredLayerId, setHoveredLayerId] = React.useState<string | null>(null);
  const selectedIdsRef = React.useRef(selectedIds);
  React.useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Mirror composer selection — composer is SSOT
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => setSelectedIds(new Set(composer.selection.getSelectedIds()));
    sync();
    composer.on(EVENTS.SELECTION_CHANGED, sync);
    composer.on(EVENTS.SELECTION_CLEARED, sync);
    return () => {
      composer.off(EVENTS.SELECTION_CHANGED, sync);
      composer.off(EVENTS.SELECTION_CLEARED, sync);
    };
  }, [composer]);

  const selectSingle = React.useCallback(
    (id: string) => {
      if (!composer) return;
      const el = composer.elements.getElement(id);
      if (el) composer.selection.select(el);
    },
    [composer]
  );

  const selectLayer = React.useCallback(
    (id: string, modifiers: { shift?: boolean; meta?: boolean } = {}) => {
      if (!composer) return;
      if (modifiers.meta && !modifiers.shift) {
        const el = composer.elements.getElement(id);
        if (el) composer.selection.toggle(el);
        return;
      }
      if (modifiers.shift) {
        const flat = flattenTree(layers);
        const prevArr = [...selectedIdsRef.current];
        const lastId = prevArr[prevArr.length - 1];
        let rangeIds: string[];
        if (!lastId) {
          rangeIds = [id];
        } else {
          const startIdx = flat.findIndex((n) => n.id === lastId);
          const endIdx = flat.findIndex((n) => n.id === id);
          if (startIdx === -1 || endIdx === -1) {
            rangeIds = [id];
          } else {
            const [lo, hi] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
            rangeIds = flat.slice(lo, hi + 1).map((n) => n.id);
          }
        }
        rangeIds.forEach((rid) => {
          const el = composer.elements.getElement(rid);
          if (el) composer.selection.addToSelection(el);
        });
        return;
      }
      selectSingle(id);
    },
    [layers, selectSingle, composer]
  );

  const clearSelection = React.useCallback(() => {
    if (composer) composer.selection.clear();
  }, [composer]);

  const handleLayerMouseEnter = React.useCallback((id: string) => {
    setHoveredLayerId(id);
    const el = document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement | null;
    if (el) el.classList.add("bd-layer-hover-highlight");
  }, []);

  const handleLayerMouseLeave = React.useCallback(() => {
    if (hoveredLayerId) {
      const el = document.querySelector(`[data-buildrick-id="${hoveredLayerId}"]`) as HTMLElement | null;
      if (el) el.classList.remove("bd-layer-hover-highlight");
    }
    setHoveredLayerId(null);
  }, [hoveredLayerId]);

  return {
    selectedIds,
    hoveredLayerId,
    selectLayer,
    selectSingle,
    clearSelection,
    handleLayerMouseEnter,
    handleLayerMouseLeave,
  };
}
