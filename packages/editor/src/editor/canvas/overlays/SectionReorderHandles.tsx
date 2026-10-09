/**
 * SectionReorderHandles
 * Renders grab handles on section boundaries and a drop indicator line
 * during section reordering.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SectionBoundary, SectionDragState } from "../hooks/useSectionReorder";

// ─── Types ─────────────────────��────────────────────────────────────────────

export interface SectionReorderHandlesProps {
  /** Computed section boundaries */
  boundaries: SectionBoundary[];
  /** Current drag state (null when idle) */
  dragState: SectionDragState | null;
  /** Which boundary is hovered */
  hoveredBoundary: string | null;
  /** Start drag for a section */
  onStartDrag: (sectionId: string, index: number) => void;
  /** Update drag target based on mouse Y */
  onUpdateDrag: (clientY: number) => void;
  /** Complete drag */
  onCompleteDrag: () => void;
  /** Cancel drag */
  onCancelDrag: () => void;
  /** Set hovered boundary */
  onHoverBoundary: (id: string | null) => void;
}

// ─── Styles ──────────────────────────────────────────────────────��──────────

const HANDLE_SIZE = 24;
const HANDLE_HIT_AREA = 40;

const containerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 900,
};

function getHandleStyle(
  top: number,
  isHovered: boolean,
  isDragging: boolean
): React.CSSProperties {
  return {
    position: "absolute",
    left: 4,
    top: top - HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: 4,
    background: "var(--bk-accent)",
    cursor: isDragging ? "grabbing" : "grab",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    gap: 1.5,
    padding: 4,
    /* Only a visible grip takes the pointer (L1-011). */
    pointerEvents: isHovered || isDragging ? "auto" : "none",
    transition: "opacity 0.15s ease, transform 0.15s ease, background 0.15s ease",
    opacity: isHovered || isDragging ? 1 : 0,
    transform: isHovered || isDragging ? "scale(1)" : "scale(0.8)",
    boxShadow: isDragging
      ? "0 2px 8px var(--bk-alpha-accent-30)"
      : "var(--bk-shadow-drag)",
  };
}

/* Boards 4428:44400: the drop cue is the dragged section's own footprint —
   an accent slot of its height at the landing spot, "↑ Hero moves here". */
function getDropSlotStyle(top: number, height: number): React.CSSProperties {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    top,
    height,
    background: "var(--bk-accent)",
    color: "var(--bk-accent-on)",
    font: "500 11px/16px var(--bk-font-ui)",
    padding: "8px 12px",
    boxSizing: "border-box",
    pointerEvents: "none",
  };
}

const dotStyle = (isHovered: boolean): React.CSSProperties => ({
  width: 3,
  height: 3,
  borderRadius: "var(--bk-radius-full)",
  background: isHovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)",
});

// ─── Component ─────────────────────────────────────────────────────���────────

export function SectionReorderHandles({
  boundaries,
  dragState,
  hoveredBoundary,
  onStartDrag,
  onUpdateDrag,
  onCompleteDrag,
  onCancelDrag,
  onHoverBoundary,
}: SectionReorderHandlesProps) {
  const isDragging = dragState !== null;

  // Global mouse handlers during drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      onUpdateDrag(e.clientY);
    };

    const handleMouseUp = () => {
      onCompleteDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancelDrag();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDragging, onUpdateDrag, onCompleteDrag, onCancelDrag]);

  /* Hover by proximity, not by an invisible div: a 48×40 pointer-active hit
     area sat on the left edge of every top-level element and ate its clicks
     and right-clicks (L1-011). The pointer near a section's top-left edge
     hovers its grip; nothing blocks the page until then. */
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hoveredRef = React.useRef(hoveredBoundary);
  hoveredRef.current = hoveredBoundary;
  React.useEffect(() => {
    if (isDragging || boundaries.length < 2) return;
    const onMove = (e: MouseEvent) => {
      const box = containerRef.current?.getBoundingClientRect();
      const scale = box && containerRef.current?.offsetWidth ? box.width / containerRef.current.offsetWidth : 1;
      const x = (e.clientX - (box?.left ?? 0)) / scale;
      const y = (e.clientY - (box?.top ?? 0)) / scale;
      const near =
        x >= 0 && x <= HANDLE_HIT_AREA + 8
          ? boundaries.find((b) => Math.abs(y - b.rect.top) <= HANDLE_HIT_AREA / 2)?.sectionId ?? null
          : null;
      if (near !== hoveredRef.current) onHoverBoundary(near);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isDragging, boundaries, onHoverBoundary]);

  // Compute drop line position from drag state.
  // Must run before any early return so the hook order stays stable across
  // renders — otherwise React throws "Rendered more hooks than during the
  // previous render" the first time boundaries grow past the early-return
  // threshold (e.g. dropping the first section onto a blank canvas).
  const dropSlot = React.useMemo(() => {
    if (!dragState || boundaries.length === 0) return null;
    const { toIndex, fromIndex, sectionId } = dragState;
    const dragged = boundaries.find((b) => b.sectionId === sectionId);
    if (!dragged) return null;
    const last = boundaries[boundaries.length - 1];
    const top = toIndex >= boundaries.length ? last.rect.top + last.rect.height : boundaries[toIndex].rect.top;
    return { top, height: dragged.rect.height, text: `${toIndex > fromIndex ? "↓" : "↑"} ${dragged.label} moves here` };
  }, [dragState, boundaries]);

  if (boundaries.length < 2) return null;

  return (
    <div ref={containerRef} style={containerStyle} aria-hidden>
      {/* A grab handle on every section's top edge — the first one too
          (board 4428:44400 drags Hero, the page's first section). */}
      {boundaries.map((boundary) => {
        const isHovered = hoveredBoundary === boundary.sectionId;
        const isDragTarget =
          isDragging && dragState?.sectionId === boundary.sectionId;

        return (
          <React.Fragment key={boundary.sectionId}>
            {/* Visible grab handle */}
            <div
              style={getHandleStyle(
                boundary.rect.top,
                isHovered || isDragTarget,
                isDragTarget
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStartDrag(boundary.sectionId, boundary.index);
              }}
              role="button"
              aria-label={`Drag to reorder section ${boundary.index + 1}`}
              tabIndex={-1}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={dotStyle(isHovered || isDragTarget)} />
              ))}
            </div>
          </React.Fragment>
        );
      })}

      {isDragging && dropSlot && (
        <div style={getDropSlotStyle(dropSlot.top, dropSlot.height)} data-testid="section-drop-slot">
          {dropSlot.text}
        </div>
      )}
    </div>
  );
}
