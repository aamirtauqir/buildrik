/**
 * useSelectionReadout — the "{Type} · {name}" + "W × H" readout the canvas
 * toolbar prints at its right end (board 5936:44788: "Section · Hero ·
 * 680 × 250"). One source for every surface that prints it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { getLayerPreview } from "@/editor/panels/layers/data/layerUtils";
import { useProjectLoading } from "@/editor/shell/hooks/useProjectLoading";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";


/**
 * The selected element's rendered size, read from the canvas DOM. Re-read per
 * render — a render is driven by selection/zoom changes, exactly when size may
 * move. Null when the node is not in the DOM (jsdom, mid-mount).
 */
function elementDims(id: string | undefined): string | null {
  if (!id || typeof document === "undefined") return null;
  const node = document.querySelector<HTMLElement>(`[data-buildrick-id="${CSS.escape(id)}"]`);
  if (!node) return null;
  const w = Math.round(node.offsetWidth);
  const h = Math.round(node.offsetHeight);
  if (!w && !h) return null;
  return `${w} × ${h}`;
}

/* SELECTION_ADDED / _REMOVED are the ones multi-select fires — addToSelection
   emits neither SELECTION_CHANGED nor ELEMENT_SELECTED. */
const SELECTION_EVENTS = [
  EVENTS.SELECTION_CHANGED,
  EVENTS.SELECTION_ADDED,
  EVENTS.SELECTION_REMOVED,
  EVENTS.ELEMENT_SELECTED,
  EVENTS.SELECTION_CLEARED,
] as const;

const INSTANCE_EVENTS = [
  EVENTS.COMPONENT_INSTANTIATED,
  EVENTS.INSTANCE_DETACHED,
  EVENTS.COMPONENT_UPDATED,
  EVENTS.COMPONENT_DELETED,
] as const;

export function useSelectionReadout(
  composer: Composer | null,
  selectedElement: { id: string; type: string } | null
): { label: string; dims: string | null } {
  const projectLoading = useProjectLoading(composer);
  const pageId = composer?.elements?.getActivePage?.()?.id;

  const [renamed, setRenamed] = React.useState<{ id: string; name: string | null } | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const onRenamed = (p: { id: string; name: string | null }) => setRenamed(p);
    composer.on(EVENTS.ELEMENT_RENAMED, onRenamed);
    return () => {
      composer.off(EVENTS.ELEMENT_RENAMED, onRenamed);
    };
  }, [composer]);

  const customName = React.useMemo(() => {
    if (!selectedElement || !pageId) return null;
    if (renamed && renamed.id === selectedElement.id) return renamed.name;
    // The name Layers shows: a custom layer name, else a text layer's copy.
    const el = composer?.elements.getElement(selectedElement.id);
    return getLayerName(el) ?? getLayerPreview(el) ?? null;
  }, [selectedElement, pageId, renamed, composer]);

  const [selectionCount, setSelectionCount] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => setSelectionCount(composer.selection?.getSelectedIds?.().length ?? 0);
    sync();
    for (const evt of SELECTION_EVENTS) composer.on(evt, sync);
    return () => {
      for (const evt of SELECTION_EVENTS) composer.off(evt, sync);
    };
  }, [composer]);

  // Board 4418:166980: an instance reads "Component instance · {master}".
  // Re-read when an element becomes / stops being an instance or a master is renamed.
  const [, setInstanceTick] = React.useState(0);
  React.useEffect(() => {
    if (!composer) return;
    const bump = () => setInstanceTick((n) => n + 1);
    for (const evt of INSTANCE_EVENTS) composer.on(evt, bump);
    return () => {
      for (const evt of INSTANCE_EVENTS) composer.off(evt, bump);
    };
  }, [composer]);
  const instance = selectedElement ? composer?.components?.getInstanceByElementId?.(selectedElement.id) : undefined;
  const master = instance ? composer?.components?.getComponent?.(instance.componentId) : undefined;

  const label = projectLoading
    ? "Loading…"
    : selectionCount > 1
      ? `${selectionCount} elements selected`
      : master
        ? `Component instance · ${master.name}`
        : selectedElement
          ? `${elementTypeLabel(selectedElement.type)}${customName ? ` · ${customName}` : ""}`
        : "Nothing selected";
  return { label, dims: elementDims(selectedElement?.id) };
}
