/**
 * The inline text toolbar, placed and filled from the element being edited.
 *
 * Audit 2026-10-20 #16: it sat 52px above the element's top clamped to 8px
 * of the canvas, so on any text near the top it covered the line being typed;
 * it ran past the visible canvas (903px wide in a 752px column); and its
 * selects read "Paragraph / 10px" on a 48px H2. Now it goes above the element,
 * flips below when there is no room, stays inside the visible canvas (wrapping
 * when narrower than itself), and shows the element's own tag and size.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "@/shared/constants/canvas";
import { RichTextEditor } from "@/editor/panels/RichTextEditor";
import { canvasScale } from "../utils/canvasScale";

interface Box {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const GAP = 8;

/** Where the toolbar's top-left goes, in the same (screen) space as its inputs. */
export function placeInlineToolbar(
  anchor: { top: number; left: number; bottom: number },
  size: { width: number; height: number },
  bounds: Box,
): { top: number; left: number } {
  const above = anchor.top - GAP - size.height;
  const below = anchor.bottom + GAP;
  const lowest = bounds.bottom - GAP - size.height;
  const top =
    above >= bounds.top + GAP ? above : below <= lowest ? below : Math.max(bounds.top + GAP, lowest);
  const left = Math.max(bounds.left + GAP, Math.min(anchor.left, bounds.right - GAP - size.width));
  return { top, left };
}

/** The part of the canvas the user can see: every clipping ancestor up to
 *  and including the canvas scroller, intersected. */
function visibleBounds(from: HTMLElement): Box {
  const box: Box = { top: -Infinity, left: -Infinity, right: Infinity, bottom: Infinity };
  for (let n = from.parentElement; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.overflowX !== "visible" || cs.overflowY !== "visible") {
      const r = n.getBoundingClientRect();
      box.top = Math.max(box.top, r.top);
      box.left = Math.max(box.left, r.left);
      box.right = Math.min(box.right, r.right);
      box.bottom = Math.min(box.bottom, r.bottom);
    }
    if (n.classList.contains("bd-canvas-scroll")) break;
  }
  return box;
}

export interface InlineTextToolbarProps {
  editingId: string;
  canvasRef: React.RefObject<HTMLElement | null>;
  onCommand: (command: string, value?: string) => void;
}

export function InlineTextToolbar({ editingId, canvasRef, onCommand }: InlineTextToolbarProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [values, setValues] = React.useState<{ tag?: string; size?: number }>({});
  const [pos, setPos] = React.useState<{ top: number; left: number; maxWidth: number } | null>(null);

  const target = React.useCallback(
    () => canvasRef.current?.querySelector<HTMLElement>(`[data-buildrick-id="${editingId}"]`) ?? null,
    [canvasRef, editingId],
  );

  /* The size shown is the caret's: a span inside the heading can carry its own. */
  React.useEffect(() => {
    const read = () => {
      const el = target();
      if (!el) return;
      const node = document.getSelection()?.anchorNode;
      const at = node && el.contains(node) ? (node instanceof HTMLElement ? node : node.parentElement) : null;
      setValues({ tag: el.tagName.toLowerCase(), size: parseFloat(getComputedStyle(at ?? el).fontSize) });
    };
    read();
    document.addEventListener("selectionchange", read);
    return () => document.removeEventListener("selectionchange", read);
  }, [target]);

  React.useLayoutEffect(() => {
    const place = () => {
      const tb = ref.current;
      const el = target();
      const host = tb?.offsetParent;
      if (!tb || !el || !(host instanceof HTMLElement)) return;
      const scale = canvasScale(host);
      const bounds = visibleBounds(tb);
      const maxWidth = Math.max(0, (bounds.right - bounds.left - GAP * 2) / scale);
      tb.style.maxWidth = `${maxWidth}px`;
      const t = tb.getBoundingClientRect();
      const a = el.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      const at = placeInlineToolbar(a, { width: t.width, height: t.height }, bounds);
      setPos({ top: (at.top - h.top) / scale, left: (at.left - h.left) / scale, maxWidth });
    };
    place();
    const scroller = ref.current?.closest(".bd-canvas-scroll");
    /* Capture: the canvas frame is itself a scroller inside .bd-canvas-scroll. */
    scroller?.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      scroller?.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [target]);

  return (
    <div
      ref={ref}
      /* bd-inline-toolbar is load-bearing: useCanvasInlineEdit's blur/click
         guards match on it to keep a toolbar click from ending the edit. */
      className="bd-inline-toolbar"
      style={{
        position: "absolute",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        maxWidth: pos?.maxWidth,
        visibility: pos ? "visible" : "hidden",
        zIndex: Z_LAYERS.floatingToolbar,
        /* The overlay host is pointer-events:none by design; without this
           every control is mouse-transparent and clicks fall to the canvas. */
        pointerEvents: "auto",
      }}
      /* The standard rich-text toolbar pair. preventDefault on mousedown keeps
         focus — and the user's text selection — in the editing element. A text
         field (the link URL) is the one exception: it has to take focus.
         stopPropagation on click keeps the canvas from refocusing its wrapper,
         which blurred the editor and ended the session after every command. */
      onMouseDown={(e) => {
        if (!(e.target as HTMLElement).closest("input, textarea, select")) e.preventDefault();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <RichTextEditor onCommand={onCommand} blockTag={values.tag} fontSizePx={values.size} />
    </div>
  );
}
