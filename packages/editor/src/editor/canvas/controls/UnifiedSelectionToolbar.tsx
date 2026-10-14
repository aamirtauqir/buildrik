/**
 * UnifiedSelectionToolbar — board 5936:44788 ("Canvas · selected · Hero").
 *
 * Three buttons pinned inside the selected element's top-right corner (outside,
 * above it, when the element is too small to hold them — L1-003):
 * Duplicate (⌘D) · Delete (⌫) · More (⋯). More opens the same element menu a
 * right-click opens (G2-024: one menu, not a second dropdown of its own), at
 * the button.
 *
 * What the old bottom-left pill carried and where it went:
 *   - Select parent / ancestor dropdown → Layers and the ← key.
 *   - + Add child → the Add panel (it opened a legacy picker modal).
 *   - Copy · Wrap · Move up/down → the element menu (More).
 *   - ✦ Edit with AI → the inspector header's ✦ AI.
 *
 * Surface: the board's ink pill (library "Selection toolbar": color/ink, r8,
 * pad 4, gap 4, 24px IconButtons with white icons, More on the accent fill).
 * The owner lifted decision #25's NO BLACK RULE for this control 2026-09-24.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import type { Composer } from "@/engine";
import { Z_LAYERS } from "@/shared/constants/canvas";
import { IconButton } from "@/editor/chrome-ui";
import { canvasScale } from "../utils/canvasScale";

export interface UnifiedSelectionToolbarProps {
  composer: Composer;
  /** ID of the selected element */
  elementId: string;
  /** Reference to canvas container */
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Opens the element menu (the right-click menu) at a viewport point. */
  onOpenMenu: (elementId: string, point: { x: number; y: number }) => void;
}

/** Inset from the element's top-right corner (board 5936:44788). */
const INSET = 8;
/** The pill's height (24px buttons + 4px padding) and its gap to a small element. */
const PILL_H = 32;
const OUTSIDE_GAP = 4;
/* L1-003 / L2-007: the board draws the inset pill on a Hero. Inside a button
   or a line of text it covered the element, and a second click — to edit the
   text — landed on Duplicate or Delete. Below this size it goes outside. */
const INSIDE_MIN_H = 2 * PILL_H + 2 * INSET;
const INSIDE_MIN_W = 2 * 88;

const PILL = "tw:relative tw:flex tw:items-center tw:gap-1 tw:p-1 tw:rounded-lg tw:bg-[var(--bk-ink)]";
/* Board 5940:148012: 11/16 medium gray-500, 4px under the pill. The board
   runs it rightward from the pill's left edge, past the element; here the
   page frame clips anything past its edge, so it ends at the pill's right
   edge instead and runs leftward over the element. */
const CAPTION =
  "tw:absolute tw:right-0 tw:top-9 tw:m-0 tw:whitespace-pre tw:text-[11px] tw:leading-4 tw:font-medium " +
  "tw:text-[var(--bk-gray-500)] tw:[font-family:var(--bk-font-ui)] tw:pointer-events-none";
/* On-ink IconButton: white glyph, a white-10% hover instead of the light
   chrome's grey. */
const ON_INK = "tw:text-white tw:hover:bg-white/10 tw:hover:text-white";
const ON_ACCENT = "tw:text-white tw:bg-[var(--bk-accent)] tw:hover:bg-[var(--bk-accent-hover)] tw:hover:text-white";

export const UnifiedSelectionToolbar: React.FC<UnifiedSelectionToolbarProps> = ({
  composer,
  elementId,
  canvasRef,
  onDuplicate,
  onDelete,
  onOpenMenu,
}) => {
  const [anchor, setAnchor] = React.useState<{ right: number; top: number; scale: number; outside: boolean } | null>(null);
  /* Pulls the pill back onto the scrollable canvas viewport when `anchor`
     alone would place it past the viewport's right edge (see the effect
     below). Reset to 0 every time `anchor` gets a fresh raw value — it is
     re-derived from THIS anchor, never carried over from the last one. */
  const [shiftX, setShiftX] = React.useState(0);
  const moreRef = React.useRef<HTMLButtonElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas.querySelector(`[data-buildrick-id="${elementId}"]`) as HTMLElement | null;
    const update = () => {
      const target = canvas.querySelector(`[data-buildrick-id="${elementId}"]`) as HTMLElement | null;
      if (!target) return setAnchor(null);
      const c = canvas.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      /* The overlay layer is scaled with the canvas; positions are in canvas
         (unscaled) units, so undo the zoom the rects carry. */
      const scale = canvasScale(canvas);
      const right = (r.right - c.left) / scale + (canvas.scrollLeft || 0);
      const top = (r.top - c.top) / scale + (canvas.scrollTop || 0);
      const outside = r.height / scale < INSIDE_MIN_H || r.width / scale < INSIDE_MIN_W;
      /* Outside: above the element, or under it when the page has no room
         above (the pill is chrome — 1:1 at any zoom, so its size is unscaled). */
      const above = top - (PILL_H + OUTSIDE_GAP) / scale;
      setAnchor({
        right: outside ? right : right - INSET / scale,
        top: !outside ? top + INSET / scale : above >= 0 ? above : top + r.height / scale + OUTSIDE_GAP / scale,
        scale,
        outside,
      });
      /* A fresh raw anchor means the last frame's viewport correction no
         longer applies — the effect below re-measures from scratch. */
      setShiftX(0);
    };
    update();
    const observer = new ResizeObserver(update);
    if (el) observer.observe(el);
    /* Same late-DOM case as SelectionBoxOverlay: re-anchor when the canvas
       HTML re-renders (an insert selects before its element exists). */
    const content = new MutationObserver(update);
    content.observe(canvas, { childList: true, subtree: true });
    window.addEventListener("scroll", update, { capture: true, passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      observer.disconnect();
      content.disconnect();
      window.removeEventListener("scroll", update, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", update);
    };
  }, [elementId, canvasRef]);

  /* A wide (page-width) element's toolbar can anchor past the RIGHT edge of
     `.bd-canvas-scroll`'s currently-scrolled-into-view window — still a valid
     DOM position (nothing clips `.buildrick-canvas` itself, it's simply wider
     than its scrollable ancestor), but invisible/unclickable there: the pill
     sits scrolled out of view, and whatever paints at that screen point next
     (Inspector at 4418:… boards, once the canvas column ends) receives the
     click instead. `getContextMenuActions`/the click handler never saw
     anything wrong because nothing threw — the button was simply never
     reachable. Measured live: a full-width root selection anchored the pill
     at screen x 1272-1360 while `.bd-canvas-scroll`'s visible window ended at
     1116, handing every click in that gap to the Inspector's row underneath.
     Shift, don't reposition from scratch: this runs AFTER the raw anchor's
     own render (same layout effect timing tooltips/popovers use), so the
     correction lands before paint — no visible flash. */
  React.useLayoutEffect(() => {
    if (!anchor) return;
    const canvas = canvasRef.current;
    const toolbar = toolbarRef.current;
    if (!canvas || !toolbar) return;
    const viewport = canvas.closest<HTMLElement>(".bd-canvas-scroll") ?? canvas;
    const viewportRect = viewport.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const overflow = toolbarRect.right - viewportRect.right;
    if (overflow > 0.5) {
      setShiftX(-(overflow / anchor.scale));
    }
    // Deliberately only `anchor` — `shiftX` is this effect's own output, not
    // an input; including it would re-measure an already-corrected position
    // relative to itself and either no-op or (with rounding) oscillate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, canvasRef]);

  if (!anchor || !composer.elements.getElement(elementId)) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={toolbarRef}
      data-testid="selection-toolbar"
      className={`bd-canvas-toolbar ${PILL}`}
      onMouseDown={stop}
      onClick={stop}
      style={{
        position: "absolute",
        left: anchor.right + shiftX,
        top: anchor.top,
        /* Chrome, not page: it stays 1:1 however far the page is zoomed. */
        transform: `translateX(-100%) scale(${1 / anchor.scale})`,
        transformOrigin: "100% 0",
        zIndex: Z_LAYERS.floatingToolbar,
        pointerEvents: "auto",
      }}
    >
      <IconButton size="sm" className={ON_INK} label="Duplicate (⌘D)" data-testid="selection-toolbar-duplicate" onClick={onDuplicate}>
        <Copy size={14} aria-hidden="true" />
      </IconButton>
      <IconButton size="sm" className={ON_INK} label="Delete (⌫)" data-testid="selection-toolbar-delete" onClick={onDelete}>
        <Trash2 size={14} aria-hidden="true" />
      </IconButton>
      <IconButton
        ref={moreRef}
        size="sm"
        className={ON_ACCENT}
        label="More"
        aria-haspopup="menu"
        data-testid="selection-toolbar-more"
        onClick={() => {
          const b = moreRef.current?.getBoundingClientRect();
          onOpenMenu(elementId, b ? { x: b.left, y: b.bottom + 4 } : { x: 0, y: 0 });
        }}
      >
        <MoreHorizontal size={14} aria-hidden="true" />
      </IconButton>
      {/* The board's caption under the pill: what each glyph does and its key.
          Absolute, so the pill (not the caption) sets the anchor. */}
      {/* Outside a small element the caption would lie over the element's own
          content, which is exactly what moving the pill out avoids. */}
      {anchor.outside ? null : (
        <p aria-hidden="true" data-testid="selection-toolbar-caption" className={CAPTION}>
          {"⧉ Duplicate ⌘D  ·  🗑 Delete ⌫  ·  ⋯ More"}
        </p>
      )}
    </div>
  );
};

export default UnifiedSelectionToolbar;
