/**
 * Canvas Spot Spacing
 * Interactive spacing editor for elements
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { SpacingIndicator } from "../../../shared/types/canvas";
import "./CanvasSpotSpacing.css";

export interface CanvasSpotSpacingProps {
  composer: Composer | null;
  elementId: string;
  indicators: SpacingIndicator[];
  onUpdate?: (elementId: string, type: "margin" | "padding", side: string, value: number) => void;
}

export const CanvasSpotSpacing: React.FC<CanvasSpotSpacingProps> = ({
  composer,
  elementId,
  indicators,
  onUpdate,
}) => {
  const [editing, setEditing] = React.useState<string | null>(null);
  const [tempValue, setTempValue] = React.useState<number>(0);

  const handleIndicatorClick = (indicator: SpacingIndicator) => {
    setEditing(`${indicator.type}-${indicator.side}`);
    setTempValue(indicator.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setTempValue(value);
  };

  const handleValueCommit = (indicator: SpacingIndicator) => {
    if (onUpdate) {
      onUpdate(elementId, indicator.type, indicator.side, tempValue);
    } else if (composer) {
      const element = composer.elements.getElement(elementId);
      if (element) {
        const styleKey = `${indicator.type}-${indicator.side}`;
        element.setStyle(styleKey, `${tempValue}px`);
      }
    }
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, indicator: SpacingIndicator) => {
    if (e.key === "Enter") {
      handleValueCommit(indicator);
    } else if (e.key === "Escape") {
      setEditing(null);
    }
  };

  if (indicators.length === 0) return null;

  return (
    <div className="aqb-canvas-spot-spacing">
      {indicators.map((indicator, index) => {
        const isEditing = editing === `${indicator.type}-${indicator.side}`;
        const color = indicator.type === "margin" ? "#00d4aa" : "#7c3aed";

        return (
          <div
            key={`${indicator.type}-${indicator.side}-${index}`}
            className={`aqb-spacing-indicator aqb-spacing-indicator--${indicator.type} aqb-spacing-indicator--${indicator.side}`}
            style={{
              position: "absolute",
              left: `${indicator.position.x}px`,
              top: `${indicator.position.y}px`,
              width: `${indicator.position.width}px`,
              height: `${indicator.position.height}px`,
              borderColor: color,
            }}
            onClick={() => handleIndicatorClick(indicator)}
          >
            {indicator.position.width > 20 && indicator.position.height > 20 && (
              <div className="aqb-spacing-indicator-label" style={{ backgroundColor: color }}>
                {isEditing ? (
                  <input
                    type="number"
                    value={tempValue}
                    onChange={handleValueChange}
                    onBlur={() => handleValueCommit(indicator)}
                    onKeyDown={(e) => handleKeyDown(e, indicator)}
                    autoFocus
                    className="aqb-spacing-indicator-input"
                  />
                ) : (
                  <span>{indicator.value}px</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CanvasSpotSpacing;
