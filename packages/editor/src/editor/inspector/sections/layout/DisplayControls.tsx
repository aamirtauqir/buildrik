/**
 * Display Controls — board 32:2's Display row.
 *
 * One labelled row of glyph buttons, the same 88px label column every other
 * row uses. It used to be a 3x2 grid of 42px labelled cards under a "Display
 * Mode" caption with its own help tooltip — about 250px of panel for a
 * property that is one row on every board that draws it, and it pushed
 * Spacing and Typography below the fold on a 900px screen.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { cardBtnClass } from "./classes";
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
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">
        {mixedKeys?.has("display") && <MixedValueBadge compact />}
        Display
      </label>
      <div className="tw:grid tw:grid-cols-6 tw:gap-[2px]" role="group" aria-label="Display">
        {DISPLAY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="xs"
            className={`${cardBtnClass(display === option.value)} tw:min-h-6 tw:min-w-0 tw:px-0 tw:py-1`}
            onClick={() => onChange("display", option.value)}
            title={`${option.label} — ${option.tooltip}`}
            aria-label={option.label}
            aria-pressed={display === option.value}
          >
            <DisplayPreview type={option.value} />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DisplayControls;
