import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * ZoomControls - Canvas zoom slider and controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton } from "@/editor/shared/vibcoder/IconButton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from "@/editor/shared/vibcoder";
import { ZOOM_PRESETS } from "./shared";

export interface ZoomControlsProps {
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange: (zoom: number) => void;
  onFitToScreen?: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  minZoom = 10,
  maxZoom = 400,
  onZoomChange,
  onFitToScreen,
}) => {
  const [showPresets, setShowPresets] = React.useState(false);

  const handleZoomIn = () => {
    const nextZoom = Math.min(zoom + 10, maxZoom);
    onZoomChange(nextZoom);
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(zoom - 10, minZoom);
    onZoomChange(nextZoom);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZoomChange(Number(e.target.value));
  };

  const handlePresetSelect = (preset: number) => {
    onZoomChange(preset);
    setShowPresets(false);
  };

  return (
    <div style={containerStyles}>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            size="sm"
            aria-label="Zoom Out"
            onClick={handleZoomOut}
            disabled={zoom <= minZoom}
          ><ZoomOutIcon /></IconButton>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Zoom Out</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <div style={sliderContainerStyles}>
        <Input
          type="range"
          min={minZoom}
          max={maxZoom}
          value={zoom}
          onChange={handleSliderChange}
          style={sliderStyles}
        />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton
            size="sm"
            aria-label="Zoom In"
            onClick={handleZoomIn}
            disabled={zoom >= maxZoom}
          ><ZoomInIcon /></IconButton>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Zoom In</TooltipContent>
        </TooltipPortal>
      </Tooltip>
      <div style={dividerStyles} />
      <Button
        onClick={() => setShowPresets(!showPresets)}
        style={percentButtonStyles}
        title="Zoom presets"
      >
        {Math.round(zoom)}%
      </Button>
      {onFitToScreen && (
        <>
          <div style={dividerStyles} />
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                size="sm"
                aria-label="Fit to Screen"
                onClick={onFitToScreen}
              ><FitIcon /></IconButton>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>Fit to Screen</TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </>
      )}
      {showPresets && (
        <div style={presetsDropdownStyles}>
          {ZOOM_PRESETS.map((preset) => (
            <Button
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              style={{
                ...presetItemStyles,
                background: zoom === preset ? "var(--buildrick-accent)" : "transparent",
              }}
            >
              {preset}%
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// Icons
function ZoomInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="6" cy="6" r="4" />
      <path d="M9 9l3 3M6 4v4M4 6h4" strokeLinecap="round" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="6" cy="6" r="4" />
      <path d="M9 9l3 3M4 6h4" strokeLinecap="round" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 5V2h3M12 5V2H9M2 9v3h3M12 9v3H9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="6" height="6" rx="1" />
    </svg>
  );
}

// Styles
const containerStyles: React.CSSProperties = {
  position: "absolute",
  bottom: 16,
  right: 16,
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 10px",
  background: "var(--buildrick-surface-2)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: "var(--buildrick-radius-lg)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  zIndex: 100,
};

const sliderContainerStyles: React.CSSProperties = {
  width: 80,
  display: "flex",
  alignItems: "center",
};

const sliderStyles: React.CSSProperties = {
  width: "100%",
  height: 4,
  appearance: "none",
  background: "var(--buildrick-surface-4)",
  borderRadius: 2,
  outline: "none",
  cursor: "pointer",
};

const dividerStyles: React.CSSProperties = {
  width: 1,
  height: 16,
  background: "var(--buildrick-border)",
  margin: "0 4px",
};

const percentButtonStyles: React.CSSProperties = {
  minWidth: 48,
  padding: "4px 8px",
  background: "transparent",
  border: "none",
  borderRadius: "var(--buildrick-radius-sm)",
  color: "var(--buildrick-text-secondary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
};

const presetsDropdownStyles: React.CSSProperties = {
  position: "absolute",
  bottom: "100%",
  right: 0,
  marginBottom: 8,
  display: "flex",
  flexDirection: "column",
  padding: 4,
  background: "var(--buildrick-surface-2)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: "var(--buildrick-radius-md)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
};

const presetItemStyles: React.CSSProperties = {
  padding: "6px 12px",
  border: "none",
  borderRadius: "var(--buildrick-radius-sm)",
  color: "var(--buildrick-text-primary)",
  fontSize: 12,
  cursor: "pointer",
  textAlign: "right",
};

export default ZoomControls;
