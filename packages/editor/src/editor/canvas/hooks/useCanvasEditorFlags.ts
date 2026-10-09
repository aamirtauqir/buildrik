/**
 * Editor-only flags on the canvas DOM: `data-locked` (the lock styling,
 * Canvas.css) and `data-hidden` (the Layers eye). Neither is document
 * content — the serializer never emits them — so they are derived here, from
 * the engine's lock state and the Layers panel's stored hidden set, after
 * every canvas render.
 *
 * The canvas body is `dangerouslySetInnerHTML`, rebuilt on every document
 * edit. The Layers panel used to set these attributes on DOM nodes itself and
 * re-apply them only on a page switch, so the next edit anywhere un-hid a
 * hidden layer (clickable again, while its row still said hidden) and dropped
 * the lock styling; the canvas-menu Lock never set it at all (audit
 * 2026-10-08 P1-5).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer, Element } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { loadSetFromStorage } from "@/editor/panels/layers/hooks/layersPersistence";

function setFlag(node: globalThis.Element, name: string, on: boolean): void {
  if (on) node.setAttribute(name, "true");
  else node.removeAttribute(name);
}

export function useCanvasEditorFlags({
  canvasRef,
  composer,
  content,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  composer: Composer | null;
  content: string;
}): void {
  const applyAll = React.useCallback(() => {
    const root = canvasRef.current;
    if (!root || !composer) return;
    const pageId = composer.elements.getActivePage()?.id;
    const hidden = pageId ? loadSetFromStorage(pageId, "hidden") : new Set<string>();
    root.querySelectorAll("[data-buildrick-id]").forEach((node) => {
      const id = node.getAttribute("data-buildrick-id") ?? "";
      setFlag(node, "data-locked", Boolean(composer.elements.getElement(id)?.isLocked()));
      setFlag(node, "data-hidden", hidden.has(id));
    });
  }, [canvasRef, composer]);

  // After every render of the canvas HTML, before paint.
  React.useLayoutEffect(applyAll, [applyAll, content]);

  // A lock change does not change the HTML, so it would not re-render.
  React.useEffect(() => {
    if (!composer) return;
    const onUpdated = (el: Element) => {
      const node = canvasRef.current?.querySelector(`[data-buildrick-id="${el.getId()}"]`);
      if (node) setFlag(node, "data-locked", el.isLocked());
    };
    composer.on(EVENTS.ELEMENT_UPDATED, onUpdated);
    composer.on(EVENTS.HISTORY_UNDO, applyAll);
    composer.on(EVENTS.HISTORY_REDO, applyAll);
    return () => {
      composer.off(EVENTS.ELEMENT_UPDATED, onUpdated);
      composer.off(EVENTS.HISTORY_UNDO, applyAll);
      composer.off(EVENTS.HISTORY_REDO, applyAll);
    };
  }, [composer, canvasRef, applyAll]);
}
