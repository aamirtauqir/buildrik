/**
 * Aquibra Zoom Control
 * Canvas zoom controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  CanvasButton,
  CANVAS_COLORS,
  DROPDOWN_STYLE,
  INPUT_STYLE,
  ZOOM_PRESETS,
  ZOOM_LIMITS,
  SIZES,
  Z_INDEX,
} from "../shared";

export interface ZoomControlProps {
  zoom: number;
  onChange: (zoom: number) => void;
  min?: number;
  max?: number;
  step?: number;
  presets?: readonly number[];
  className?: string;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({
  zoom,
  onChange,
  min = ZOOM_LIMITS.min,
  max = ZOOM_LIMITS.max,
  step = ZOOM_LIMITS.step,
  presets = ZOOM_PRESETS,
  className,
}) => {
  const [showPresets, setShowPresets] = React.useState(false);

  const handleZoomIn = () => onChange(Math.min(max, zoom + step));
  const handleZoomOut = () => onChange(Math.max(min, zoom - step));
  const handleFit = () => onChange(100);

  return (
    <div
      className={`aqb-zoom-control ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SIZES.padding.xs,
        padding: SIZES.padding.xs,
        background: "var(--aqb-bg-panel-secondary)",
        borderRadius: SIZES.borderRadius.lg,
      }}
    >
      {/* Zoom out */}
      <CanvasButton
        onClick={handleZoomOut}
        icon="−"
        disabled={zoom <= min}
        variant="ghost"
        size="sm"
        style={{ width: 28, height: 28, fontSize: 16 }}
      />

      {/* Zoom value with dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowPresets(!showPresets)}
          style={{
            ...INPUT_STYLE,
            minWidth: 60,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {zoom}%
        </button>

        {/* Presets dropdown */}
        {showPresets && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: Z_INDEX.backdrop,
              }}
              onClick={() => setShowPresets(false)}
            />
            {/* Dropdown menu */}
            <div
              style={{
                ...DROPDOWN_STYLE,
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: SIZES.padding.xs,
              }}
            >
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    onChange(preset);
                    setShowPresets(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: `${SIZES.padding.sm}px ${SIZES.padding.xl}px`,
                    background: zoom === preset ? CANVAS_COLORS.bgHover : "transparent",
                    border: "none",
                    color: CANVAS_COLORS.textPrimary,
                    fontSize: 12,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Zoom in */}
      <CanvasButton
        onClick={handleZoomIn}
        icon="+"
        disabled={zoom >= max}
        variant="ghost"
        size="sm"
        style={{ width: 28, height: 28, fontSize: 16 }}
      />

      {/* Fit to screen */}
      <CanvasButton
        onClick={handleFit}
        icon="⊡"
        title="Fit to screen (100%)"
        variant="ghost"
        size="sm"
        style={{ width: 28, height: 28 }}
      />
    </div>
  );
};

export default ZoomControl;
