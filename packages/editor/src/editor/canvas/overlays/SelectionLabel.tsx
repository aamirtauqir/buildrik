/**
 * Selection tag — library "Canvas selection tag" (board 5940:148012,
 * "Section · Hero"): accent fill, white 11/16, 20 high, pad 0/6, hugging its
 * text, placed at (−2, −24) above the selected element's top-left.
 *
 * It lives in canvas units, so it scales with the page exactly as the
 * library's Zoom=50/33 variants draw it (10 h at 50%).
 *
 * It used to be a chrome pill with a select-parent button and an ancestor
 * dropdown. Selecting a parent or an ancestor lives in the inspector ⋯
 * (Select parent), the ← key and Layers. It reads "Type · layer name" when
 * the element carries one (G2-139), the same name Layers and the header show.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_INDEX } from "../../../shared/constants/canvas";
import { canvasScale } from "../utils/canvasScale";
import { getElementNameFromType } from "../utils/elementInfo";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";

export interface SelectionLabelProps {
  composer: Composer;
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

/** The canvas's accent tag (selection tag, Add-drag "Drop into" tag). */
export const CANVAS_TAG_CLASS =
  "tw:flex tw:items-center tw:h-5 tw:px-1.5 tw:whitespace-nowrap tw:bg-[var(--bk-accent)] " +
  "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-accent-on)] tw:[font-family:var(--bk-font-ui)] tw:pointer-events-none";

export const SelectionLabel: React.FC<SelectionLabelProps> = ({ composer, elementId, canvasRef }) => {
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = () => {
      const el = canvas.querySelector(`[data-buildrick-id="${elementId}"]`);
      if (!el) return setPos(null);
      const c = canvas.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const zs = canvasScale(canvas);
      setPos({
        left: (r.left - c.left) / zs + (canvas.scrollLeft || 0),
        top: (r.top - c.top) / zs + (canvas.scrollTop || 0),
      });
    };
    update();
    const el = canvas.querySelector(`[data-buildrick-id="${elementId}"]`);
    const ro = new ResizeObserver(update);
    if (el) ro.observe(el);
    const mo = new MutationObserver(update);
    mo.observe(canvas, { childList: true, subtree: true });
    window.addEventListener("scroll", update, { capture: true, passive: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", update, { capture: true } as EventListenerOptions);
    };
  }, [elementId, canvasRef]);

  const element = composer.elements.getElement(elementId);
  if (!pos || !element) return null;
  const type = getElementNameFromType(element.getType?.() || "element", element.getTagName?.()?.toLowerCase());
  const layerName = getLayerName(element);
  const name = layerName ? `${type} · ${layerName}` : type;

  return (
    <div
      data-testid="canvas-selection-tag"
      className={CANVAS_TAG_CLASS}
      style={{ position: "absolute", left: pos.left - 2, top: pos.top - 24, zIndex: Z_INDEX.floatingToolbar }}
    >
      {name}
    </div>
  );
};

export default SelectionLabel;
