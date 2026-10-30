/**
 * GuidesOverlay Component
 * Renders draggable guides on the canvas
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "@/shared/constants/canvas";
import type { CanvasGuide } from "@/shared/types/canvas";

export interface GuidesOverlayProps {
  /** Current guides */
  guides: CanvasGuide[];
  /** Current zoom level (percentage) */
  zoom: number;
  /** Callback when guide is dragged */
  onDragGuide: (id: string, position: number) => void;
  /** Callback when guide is removed */
  onRemoveGuide: (id: string) => void;
}

/** Guide hit area for easier interaction */
const HIT_AREA = 8;

/**
 * Single draggable guide
 */
const DraggableGuide: React.FC<{
  guide: CanvasGuide;
  zoom: number;
  onDrag: (position: number) => void;
  onRemove: () => void;
}> = ({ guide, zoom, onDrag, onRemove }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const scale = zoom / 100;
  /* The overlay sits inside the zoomed canvas (as SmartGuidesOverlay does),
     so a guide is placed in canvas units — multiplying by the zoom here put
     it at position × zoom², off its ruler mark at any zoom but 100% (walked
     live at 61%: a 200 guide drew at the ruler's ~120). Hit area and line
     width are divided back so they read the same on screen. */
  const position = guide.position;
  const hit = HIT_AREA / scale;
  const line = 1 / scale;

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (guide.locked) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const startPos = guide.type === "horizontal" ? e.clientY : e.clientX;
      const startGuidePos = guide.position;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = guide.type === "horizontal" ? moveEvent.clientY : moveEvent.clientX;
        const delta = (currentPos - startPos) / scale;
        onDrag(Math.max(0, startGuidePos + delta));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [guide, scale, onDrag]
  );

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRemove();
    },
    [onRemove]
  );

  /* design-2l9 145:74465 / 145:67569 / 153:79518 draw ruler guides red —
     a canvas marker, apart from the blue selection they cross. */
  const color = guide.color || "var(--bk-red-500)";

  if (guide.type === "horizontal") {
    return (
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: position - hit / 2,
          height: hit,
          cursor: guide.locked ? "not-allowed" : "ns-resize",
          zIndex: Z_LAYERS.guides,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: hit / 2,
            height: line,
            background: color,
            opacity: isDragging ? 1 : 0.8,
            boxShadow: isDragging ? `0 0 4px ${color}` : "none",
            transition: "opacity 0.15s, box-shadow 0.15s",
          }}
        />
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: position - hit / 2,
        width: hit,
        cursor: guide.locked ? "not-allowed" : "ew-resize",
        zIndex: Z_LAYERS.guides,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: hit / 2,
          width: line,
          background: color,
          opacity: isDragging ? 1 : 0.8,
          boxShadow: isDragging ? `0 0 4px ${color}` : "none",
          transition: "opacity 0.15s, box-shadow 0.15s",
        }}
      />
    </div>
  );
};

/**
 * GuidesOverlay - renders all draggable guides
 */
export const GuidesOverlay: React.FC<GuidesOverlayProps> = ({
  guides,
  zoom,
  onDragGuide,
  onRemoveGuide,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: Z_LAYERS.guides,
      }}
    >
      {guides.map((guide) => (
        <div key={guide.id} style={{ pointerEvents: "auto" }}>
          <DraggableGuide
            guide={guide}
            zoom={zoom}
            onDrag={(pos) => onDragGuide(guide.id, pos)}
            onRemove={() => onRemoveGuide(guide.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default GuidesOverlay;
