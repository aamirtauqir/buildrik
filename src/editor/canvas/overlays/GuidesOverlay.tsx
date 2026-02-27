/**
 * GuidesOverlay Component
 * Renders draggable guides on the canvas
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Z_LAYERS } from "../../../shared/constants/canvas";
import type { CanvasGuide } from "../../../shared/types/canvas";
import { canvasTokens } from "../../../styles/tokens";

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
  const position = guide.position * scale;

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

  const color = guide.color || canvasTokens.colors.primary.default;

  if (guide.type === "horizontal") {
    return (
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: position - HIT_AREA / 2,
          height: HIT_AREA,
          cursor: guide.locked ? "not-allowed" : "ns-resize",
          zIndex: Z_LAYERS.guides,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: HIT_AREA / 2,
            height: 1,
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
        left: position - HIT_AREA / 2,
        width: HIT_AREA,
        cursor: guide.locked ? "not-allowed" : "ew-resize",
        zIndex: Z_LAYERS.guides,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: HIT_AREA / 2,
          width: 1,
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
