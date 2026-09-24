/**
 * Display Controls — board 4428:141170's Display row (▭ ▤ ▦ + ▾).
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
import { BK_SELECT_BARE_VALUE_THEME, Button, Select } from "@/editor/chrome-ui";
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

/* Board 4428:141170: three segments (▭ block, ▤ flex, ▦ grid) and a ▾ chip
   for the rest — every mode stays one step away. */
const SEGMENTS = [
  { value: "block", label: "Block", tooltip: "Full width, stacks vertically" },
  { value: "flex", label: "Flex", tooltip: "Flexible box layout" },
  { value: "grid", label: "Grid", tooltip: "2D grid layout" },
] as const;

const MORE_MODES = [
  { value: "inline-block", label: "Inline block" },
  { value: "inline", label: "Inline" },
  { value: "inline-flex", label: "Inline flex" },
  { value: "inline-grid", label: "Inline grid" },
  { value: "none", label: "None (hidden)" },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const DisplayControls: React.FC<DisplayControlsProps> = ({ display, onChange, mixedKeys }) => {
  const inMore = MORE_MODES.some((m) => m.value === display);
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb">
        {mixedKeys?.has("display") && <MixedValueBadge compact />}
        Display
      </label>
      <div className="tw:flex tw:items-center tw:gap-[2px]" role="group" aria-label="Display">
        {SEGMENTS.map((option) => (
          <Button
            key={option.value}
            size="xs"
            className={`${cardBtnClass(display === option.value)} tw:min-h-6 tw:min-w-0 tw:flex-1 tw:px-0 tw:py-1`}
            onClick={() => onChange("display", option.value)}
            title={`${option.label} — ${option.tooltip}`}
            aria-label={option.label}
            aria-pressed={display === option.value}
          >
            <DisplayPreview type={option.value} />
          </Button>
        ))}
        <div className="tw:w-12 tw:flex-none">
          <Select
            aria-label="More display modes"
            theme={BK_SELECT_BARE_VALUE_THEME}
            value={inMore ? display : ""}
            onChange={(e) => e.target.value && onChange("display", e.target.value)}
          >
            <option value="">▾</option>
            {MORE_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DisplayControls;
