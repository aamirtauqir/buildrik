/**
 * ZoomControls - Canvas zoom slider and controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ZOOM_PRESETS } from "./shared";
import { Button, Tooltip, TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/ui/textInputTheme";

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
      <Tooltip content="Zoom Out" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
        <Button
          color="light"
          size="xs"
          aria-label="Zoom Out"
          onClick={handleZoomOut}
          disabled={zoom <= minZoom} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        ><ZoomOutIcon /></Button>
      </Tooltip>
      <div style={sliderContainerStyles}>
        <TextInput theme={BK_TEXT_INPUT_THEME}
          type="range"
          min={minZoom}
          max={maxZoom}
          value={zoom}
          onChange={handleSliderChange}
          style={sliderStyles}
        />
      </div>
      <Tooltip content="Zoom In" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
        <Button
          color="light"
          size="xs"
          aria-label="Zoom In"
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
        ><ZoomInIcon /></Button>
      </Tooltip>
      <div style={dividerStyles} />
      <Button
        color="light"
        onClick={() => setShowPresets(!showPresets)}
        style={percentButtonStyles}
        title="Zoom presets" className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
      >
        {Math.round(zoom)}%
      </Button>
      {onFitToScreen && (
        <>
          <div style={dividerStyles} />
          <Tooltip content="Fit to Screen" placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
            <Button
              color="light"
              size="xs"
              aria-label="Fit to Screen"
              onClick={onFitToScreen} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            ><FitIcon /></Button>
          </Tooltip>
        </>
      )}
      {showPresets && (
        <div style={presetsDropdownStyles}>
          {ZOOM_PRESETS.map((preset) => (
            <Button
              key={preset}
              color="light"
              onClick={() => handlePresetSelect(preset)}
              style={{
                ...presetItemStyles,
                background: zoom === preset ? "var(--bk-accent)" : "transparent",
              }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
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
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: "var(--bk-radius-lg)",
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
  background: "var(--bk-gray-200)",
  borderRadius: 2,
  outline: "none",
  cursor: "pointer",
};

const dividerStyles: React.CSSProperties = {
  width: 1,
  height: 16,
  background: "var(--bk-border)",
  margin: "0 4px",
};

const percentButtonStyles: React.CSSProperties = {
  minWidth: 48,
  padding: "4px 8px",
  background: "transparent",
  border: "none",
  borderRadius: "var(--bk-radius-sm)",
  color: "var(--bk-ink-soft)",
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
  background: "var(--bk-bg-subtle)",
  border: "1px solid var(--bk-border)",
  borderRadius: "var(--bk-radius-lg)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
};

const presetItemStyles: React.CSSProperties = {
  padding: "6px 12px",
  border: "none",
  borderRadius: "var(--bk-radius-sm)",
  color: "var(--bk-ink)",
  fontSize: 12,
  cursor: "pointer",
  textAlign: "right",
};

export default ZoomControls;
