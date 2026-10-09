/**
 * Canvas Spot Spacing
 * Interactive spacing editor for elements
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextField } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { writeCanvasStyles } from "@/engine/commands/commandOperations";
import type { SpacingIndicator } from "@/shared/types/canvas";
import "./CanvasSpotSpacing.css";

export interface CanvasSpotSpacingProps {
  composer: Composer | null;
  elementId: string;
  indicators: SpacingIndicator[];
}

export const CanvasSpotSpacing: React.FC<CanvasSpotSpacingProps> = ({
  composer,
  elementId,
  indicators,
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

  /* At the active breakpoint, through the lock gate, one undo step — it
     wrote the base styles at every device, unchecked (audit 2026-10-08
     P1-2/P1-3). The never-passed `onUpdate` override went with it. */
  const handleValueCommit = (indicator: SpacingIndicator) => {
    if (composer) {
      writeCanvasStyles(composer, composer.elements.getElement(elementId), "style-change", {
        [`${indicator.type}-${indicator.side}`]: `${tempValue}px`,
      });
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
    <div className="bd-canvas-spot-spacing">
      {indicators.map((indicator, index) => {
        const isEditing = editing === `${indicator.type}-${indicator.side}`;
        const color = indicator.type === "margin" ? "#00d4aa" : "var(--bk-accent-pressed)";

        return (
          <div
            key={`${indicator.type}-${indicator.side}-${index}`}
            className={`bd-spacing-indicator bd-spacing-indicator--${indicator.type} bd-spacing-indicator--${indicator.side}`}
            style={{
              position: "absolute",
              left: `${indicator.position.x}px`,
              top: `${indicator.position.y}px`,
              width: `${indicator.position.width}px`,
              height: `${indicator.position.height}px`,
              borderColor: color,
            }}
            onClick={() => handleIndicatorClick(indicator)}
            /* G2-050: the strip lies over the element's own padding, so its
               right-click is the element's — it used to swallow it and no
               menu opened on a selected element's padding. */
            onContextMenu={(e) => {
              const target = document.querySelector(`[data-buildrick-id="${elementId}"]`);
              if (!target) return;
              e.preventDefault();
              // Stop here: bubbling on, the canvas would read the strip as
              // "no element" and close the menu the forward just opened.
              e.stopPropagation();
              target.dispatchEvent(
                new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, button: 2 })
              );
            }}
          >
            {indicator.position.width > 20 && indicator.position.height > 20 && (
              <div className="bd-spacing-indicator-label" style={{ backgroundColor: color }}>
                {isEditing ? (
                  <TextField
                    type="number"
                    value={tempValue}
                    onChange={handleValueChange}
                    onBlur={() => handleValueCommit(indicator)}
                    onKeyDown={(e) => handleKeyDown(e, indicator)}
                    autoFocus
                    className="bd-spacing-indicator-input"
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
