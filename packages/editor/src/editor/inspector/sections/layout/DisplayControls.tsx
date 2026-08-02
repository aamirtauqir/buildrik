/**
 * Display Controls - Display mode selection with visual previews
 * @license BSD-3-Clause
 */

import * as React from "react";
import { HelpTooltip, Button } from "@/editor/chrome-ui";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { CLUSTER_CAPTION, TIP_BOX, cardBtnClass } from "./classes";
import { DisplayPreview } from "./previews";
// ============================================================================
// TYPES
// ============================================================================

export interface DisplayControlsProps {
  display: string;
  onChange: (property: string, value: string) => void;
  mixedKeys?: ReadonlySet<string>;
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

export const DisplayControls: React.FC<DisplayControlsProps> = ({ display, onChange, mixedKeys }) => {
  const isGrid = display === "grid" || display === "inline-grid";
  const isFlex = display === "flex" || display === "inline-flex";

  return (
    <>
      {/* Section label with help tooltip */}
      <div className={`${CLUSTER_CAPTION} tw:mb-2`}>
        {mixedKeys?.has("display") && <MixedValueBadge compact />}
        Display Mode
        <HelpTooltip
          content="Controls how this element flows in the layout. Block takes full width, Flex enables flexible alignment, Grid creates 2D layouts."
          position="right"
        />
      </div>
      {/* Display mode buttons */}
      <div className="tw:grid tw:grid-cols-3 tw:gap-1 tw:mb-3">
        {DISPLAY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="xs"
            className={`${cardBtnClass(display === option.value)} tw:min-h-[42px]`}
            onClick={() => onChange("display", option.value)}
            title={option.tooltip}
          >
            <DisplayPreview type={option.value} />
            <span>{option.label}</span>
          </Button>
        ))}
      </div>
      {/* Tip for Flex/Grid */}
      {(isFlex || isGrid) && (
        <div className={TIP_BOX}>
          {isFlex ? "See Flexbox section for flex controls" : "See Grid controls below"}
        </div>
      )}
    </>
  );
};

export default DisplayControls;
