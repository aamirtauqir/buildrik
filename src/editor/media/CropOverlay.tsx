/**
 * Crop Overlay Component
 * Interactive crop region with handles and aspect ratio presets
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CropConfig, AspectRatioPreset } from "../../shared/types/media";
import { ASPECT_RATIO_PRESETS } from "../../shared/types/media";

// ============================================================================
// TYPES
// ============================================================================

export interface CropOverlayProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  crop: CropConfig | null;
  onCropChange: (crop: CropConfig) => void;
  aspectRatio: AspectRatioPreset;
  onAspectRatioChange: (preset: AspectRatioPreset) => void;
}

interface DragState {
  type: "move" | "resize";
  handle?: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
  startX: number;
  startY: number;
  startCrop: CropConfig;
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100%",
    maxHeight: 360,
    overflow: "hidden",
    background: "#1a1a2e",
    borderRadius: 8,
  },
  image: {
    width: "100%",
    height: "auto",
    display: "block",
    opacity: 0.4,
  },
  cropRegion: {
    position: "absolute",
    border: "2px solid #89b4fa",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
    cursor: "move",
  },
  handle: {
    position: "absolute",
    width: 12,
    height: 12,
    background: "#fff",
    border: "2px solid #89b4fa",
    borderRadius: 2,
  },
  presetBar: {
    display: "flex",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  presetBtn: {
    padding: "4px 10px",
    fontSize: 12,
    background: "var(--aqb-bg-panel-secondary)",
    border: "1px solid var(--aqb-border)",
    borderRadius: 4,
    color: "var(--aqb-text)",
    cursor: "pointer",
  },
  presetBtnActive: {
    background: "var(--aqb-primary)",
    borderColor: "var(--aqb-primary)",
    color: "#fff",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const CropOverlay: React.FC<CropOverlayProps> = ({
  imageSrc,
  imageWidth,
  imageHeight,
  crop,
  onCropChange,
  aspectRatio,
  onAspectRatioChange,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const [displayScale, setDisplayScale] = React.useState(1);

  // Initialize crop to center 80% of image
  React.useEffect(() => {
    if (!crop && imageWidth > 0 && imageHeight > 0) {
      const defaultCrop: CropConfig = {
        x: imageWidth * 0.1,
        y: imageHeight * 0.1,
        width: imageWidth * 0.8,
        height: imageHeight * 0.8,
        unit: "pixels",
      };
      onCropChange(defaultCrop);
    }
  }, [imageWidth, imageHeight, crop, onCropChange]);

  // Calculate display scale when container mounts
  React.useEffect(() => {
    if (containerRef.current && imageWidth > 0) {
      const containerWidth = containerRef.current.clientWidth;
      setDisplayScale(containerWidth / imageWidth);
    }
  }, [imageWidth]);

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "move" | "resize",
    handle?: DragState["handle"]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!crop) return;

    setDragState({
      type,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    });
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!dragState || !crop) return;

      const dx = (e.clientX - dragState.startX) / displayScale;
      const dy = (e.clientY - dragState.startY) / displayScale;

      const newCrop = { ...dragState.startCrop };

      if (dragState.type === "move") {
        newCrop.x = Math.max(0, Math.min(imageWidth - newCrop.width, dragState.startCrop.x + dx));
        newCrop.y = Math.max(0, Math.min(imageHeight - newCrop.height, dragState.startCrop.y + dy));
      } else if (dragState.type === "resize" && dragState.handle) {
        const handle = dragState.handle;

        // Calculate new dimensions based on handle
        if (handle.includes("w")) {
          const newX = Math.max(0, dragState.startCrop.x + dx);
          const newWidth = dragState.startCrop.width - (newX - dragState.startCrop.x);
          if (newWidth >= 20) {
            newCrop.x = newX;
            newCrop.width = newWidth;
          }
        }
        if (handle.includes("e")) {
          const newWidth = Math.min(imageWidth - newCrop.x, dragState.startCrop.width + dx);
          if (newWidth >= 20) newCrop.width = newWidth;
        }
        if (handle.includes("n")) {
          const newY = Math.max(0, dragState.startCrop.y + dy);
          const newHeight = dragState.startCrop.height - (newY - dragState.startCrop.y);
          if (newHeight >= 20) {
            newCrop.y = newY;
            newCrop.height = newHeight;
          }
        }
        if (handle.includes("s")) {
          const newHeight = Math.min(imageHeight - newCrop.y, dragState.startCrop.height + dy);
          if (newHeight >= 20) newCrop.height = newHeight;
        }

        // Apply aspect ratio constraint
        if (aspectRatio.ratio > 0) {
          const targetRatio = aspectRatio.ratio;

          if (handle === "e" || handle === "w") {
            newCrop.height = newCrop.width / targetRatio;
          } else if (handle === "n" || handle === "s") {
            newCrop.width = newCrop.height * targetRatio;
          } else {
            // Corner handles - adjust based on which direction has more change
            if (Math.abs(dx) > Math.abs(dy)) {
              newCrop.height = newCrop.width / targetRatio;
            } else {
              newCrop.width = newCrop.height * targetRatio;
            }
          }

          // Ensure we stay within bounds
          if (newCrop.x + newCrop.width > imageWidth) {
            newCrop.width = imageWidth - newCrop.x;
            newCrop.height = newCrop.width / targetRatio;
          }
          if (newCrop.y + newCrop.height > imageHeight) {
            newCrop.height = imageHeight - newCrop.y;
            newCrop.width = newCrop.height * targetRatio;
          }
        }
      }

      onCropChange(newCrop as CropConfig);
    },
    [dragState, crop, displayScale, imageWidth, imageHeight, aspectRatio, onCropChange]
  );

  const handleMouseUp = React.useCallback(() => {
    setDragState(null);
  }, []);

  React.useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  if (!crop) return null;

  const cropStyle: React.CSSProperties = {
    ...styles.cropRegion,
    left: crop.x * displayScale,
    top: crop.y * displayScale,
    width: crop.width * displayScale,
    height: crop.height * displayScale,
  };

  const handles: Array<{ pos: DragState["handle"]; style: React.CSSProperties }> = [
    { pos: "nw", style: { top: -6, left: -6, cursor: "nw-resize" } },
    { pos: "ne", style: { top: -6, right: -6, cursor: "ne-resize" } },
    { pos: "sw", style: { bottom: -6, left: -6, cursor: "sw-resize" } },
    { pos: "se", style: { bottom: -6, right: -6, cursor: "se-resize" } },
    { pos: "n", style: { top: -6, left: "50%", marginLeft: -6, cursor: "n-resize" } },
    { pos: "s", style: { bottom: -6, left: "50%", marginLeft: -6, cursor: "s-resize" } },
    { pos: "w", style: { left: -6, top: "50%", marginTop: -6, cursor: "w-resize" } },
    { pos: "e", style: { right: -6, top: "50%", marginTop: -6, cursor: "e-resize" } },
  ];

  return (
    <div>
      {/* Aspect Ratio Presets */}
      <div style={styles.presetBar}>
        {ASPECT_RATIO_PRESETS.slice(0, 6).map((preset) => (
          <button
            key={preset.id}
            onClick={() => onAspectRatioChange(preset)}
            style={{
              ...styles.presetBtn,
              ...(aspectRatio.id === preset.id ? styles.presetBtnActive : {}),
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Crop Area */}
      <div ref={containerRef} style={styles.container}>
        <img src={imageSrc} alt="Crop preview" style={styles.image} />

        {/* Crop Region */}
        <div style={cropStyle} onMouseDown={(e) => handleMouseDown(e, "move")}>
          {/* Crop handles */}
          {handles.map(({ pos, style }) => (
            <div
              key={pos}
              style={{ ...styles.handle, ...style }}
              onMouseDown={(e) => handleMouseDown(e, "resize", pos)}
            />
          ))}

          {/* Crop info */}
          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: 4,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 3,
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {Math.round(crop.width)} × {Math.round(crop.height)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropOverlay;
