/**
 * UnifiedSelectionToolbar — board 5936:44788 ("Canvas · selected · Hero").
 *
 * Three buttons pinned inside the selected element's top-right corner:
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
import type { Composer } from "../../../engine";
import { Z_LAYERS } from "../../../shared/constants/canvas";
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

const PILL = "tw:flex tw:items-center tw:gap-1 tw:p-1 tw:rounded-lg tw:bg-[var(--bk-ink)]";
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
  const [anchor, setAnchor] = React.useState<{ right: number; top: number; scale: number } | null>(null);
  const moreRef = React.useRef<HTMLButtonElement>(null);

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
      setAnchor({
        right: (r.right - c.left) / scale + (canvas.scrollLeft || 0) - INSET / scale,
        top: (r.top - c.top) / scale + (canvas.scrollTop || 0) + INSET / scale,
        scale,
      });
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

  if (!anchor || !composer.elements.getElement(elementId)) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      data-testid="selection-toolbar"
      className={`bd-canvas-toolbar ${PILL}`}
      onMouseDown={stop}
      onClick={stop}
      style={{
        position: "absolute",
        left: anchor.right,
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
    </div>
  );
};

export default UnifiedSelectionToolbar;
