/**
 * useLayerSelection - Manages multi-select state and canvas hover highlighting.
 *
 * Responsibilities:
 * - Single, meta (toggle), and shift (range) selection
 * - Sync selection to Composer engine
 * - Hover highlight via DOM class + layer hover state
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
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
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [hoveredLayerId, setHoveredLayerId] = React.useState<string | null>(null);
  // Ref keeps shift-click range anchor current without adding selectedIds to selectLayer deps
  const selectedIdsRef = React.useRef(selectedIds);
  React.useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  const selectSingle = React.useCallback(
    (id: string) => {
      setSelectedIds(new Set([id]));
      if (!composer) return;
      const el = composer.elements.getElement(id);
      if (el) composer.selection.select(el);
    },
    [composer]
  );

  const selectLayer = React.useCallback(
    (id: string, modifiers: { shift?: boolean; meta?: boolean } = {}) => {
      if (modifiers.meta && !modifiers.shift) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        if (composer) {
          const el = composer.elements.getElement(id);
          if (el) composer.selection.toggle(el);
        }
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
        setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
        if (composer) {
          rangeIds.forEach((rid) => {
            const el = composer.elements.getElement(rid);
            if (el) composer.selection.addToSelection(el);
          });
        }
        return;
      }
      selectSingle(id);
    },
    [layers, selectSingle, composer]
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    if (composer) composer.selection.clear();
  }, [composer]);

  const handleLayerMouseEnter = React.useCallback((id: string) => {
    setHoveredLayerId(id);
    const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement | null;
    if (el) el.classList.add("aqb-layer-hover-highlight");
  }, []);

  const handleLayerMouseLeave = React.useCallback(() => {
    if (hoveredLayerId) {
      const el = document.querySelector(`[data-aqb-id="${hoveredLayerId}"]`) as HTMLElement | null;
      if (el) el.classList.remove("aqb-layer-hover-highlight");
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
