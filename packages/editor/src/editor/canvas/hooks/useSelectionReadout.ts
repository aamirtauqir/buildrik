/**
 * useSelectionReadout — what the canvas bar says about the selection. One
 * source for every surface that prints it.
 * - `path`: design-2l9 board 7:18654's two-level "{Parent} / {Element}"
 *   ("Home / Hero" for a section on the page, the page alone with nothing
 *   selected) — the bar's text.
 * - `label` + `dims`: "{Type} · {name}" and "W × H" (board 5936:44788) — its
 *   tooltip.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { getLayerPreview } from "@/editor/panels/layers/data/layerUtils";
import { useProjectLoading } from "@/editor/shell/hooks/useProjectLoading";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { useInsertDrag } from "../insertDrag";


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
): { label: string; dims: string | null; path: string } {
  const projectLoading = useProjectLoading(composer);
  const activePage = composer?.elements?.getActivePage?.();
  const pageId = activePage?.id;

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

  // Board 4418:100890: during an Add drag the bar says where the drop lands.
  const insert = useInsertDrag(composer);
  if (insert.label && insert.target) {
    const { path, after } = insert.target;
    const inserting = `Inserting ${insert.label} → ${path}${after ? ` · after ${after}` : ""}`;
    return { label: inserting, dims: null, path: inserting };
  }

  const label = projectLoading
    ? "Loading…"
    : selectionCount > 1
      ? `${selectionCount} elements selected`
      : master
        ? `Component instance · ${master.name}`
        : selectedElement && activePage?.root?.id === selectedElement.id
          ? `Page · ${activePage.name}`
        : selectedElement
          ? `${elementTypeLabel(selectedElement.type)}${customName ? ` · ${customName}` : ""}`
        : "Nothing selected";
  const isRoot = Boolean(selectedElement && activePage?.root?.id === selectedElement.id);
  const pageName = activePage?.name ?? "";
  const selfName = master ? master.name : customName ?? (selectedElement ? elementTypeLabel(selectedElement.type) : "");
  const parent = selectedElement && !isRoot ? composer?.elements.getElement(selectedElement.id)?.getParent?.() : null;
  const parentName = !parent
    ? pageName
    : parent.getId() === activePage?.root?.id
      ? pageName
      : getLayerName(parent) ?? getLayerPreview(parent) ?? elementTypeLabel(parent.getType());
  const path =
    projectLoading || selectionCount > 1
      ? label
      : !selectedElement || isRoot
        ? pageName || label
        : [parentName, selfName].filter(Boolean).join(" / ");
  return { label, dims: elementDims(selectedElement?.id), path };
}
