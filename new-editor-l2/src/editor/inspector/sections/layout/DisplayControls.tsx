/**
 * Display Controls - Display mode selection with visual previews
 * @license BSD-3-Clause
 */

import * as React from "react";
import { HelpTooltip } from "../../../../shared/ui/HelpTooltip";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { DisplayPreview } from "./previews";
import { cardBtn, tipBoxStyle } from "./styles";

// ============================================================================
// TYPES
// ============================================================================

export interface DisplayControlsProps {
  display: string;
  onChange: (property: string, value: string) => void;
}

// ============================================================================
// DISPLAY OPTIONS
// ============================================================================

const DISPLAY_OPTIONS = [
  { value: "block", label: "Block", tooltip: "Full width, stacks vertically" },
  { value: "flex", label: "Flex", tooltip: "Flexible box layout" },
  { value: "grid", label: "Grid", tooltip: "2D grid layout" },
  { value: "inline-block", label: "I-Block", tooltip: "Inline with block properties" },
  { value: "inline", label: "Inline", tooltip: "Flows with text" },
  { value: "none", label: "None", tooltip: "Hidden from view" },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const DisplayControls: React.FC<DisplayControlsProps> = ({ display, onChange }) => {
  const isGrid = display === "grid" || display === "inline-grid";
  const isFlex = display === "flex" || display === "inline-flex";

  return (
    <>
      {/* Section label with help tooltip */}
      <div
        style={{
          fontSize: 10,
          color: INSPECTOR_TOKENS.textTertiary,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
        }}
      >
        Display Mode
        <HelpTooltip
          content="Controls how this element flows in the layout. Block takes full width, Flex enables flexible alignment, Grid creates 2D layouts."
          position="right"
        />
      </div>

      {/* Display mode buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
          marginBottom: 12,
        }}
      >
        {DISPLAY_OPTIONS.map((option) => (
          <button
            key={option.value}
            style={cardBtn(display === option.value)}
            onClick={() => onChange("display", option.value)}
            title={option.tooltip}
          >
            <DisplayPreview type={option.value} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Tip for Flex/Grid */}
      {(isFlex || isGrid) && (
        <div style={tipBoxStyle}>
          {isFlex ? "See Flexbox section for flex controls" : "See Grid controls below"}
        </div>
      )}
    </>
  );
};

export default DisplayControls;
