/**
 * Display Controls — board 17's "Display  Block · Flex · Grid · None".
 *
 * One segmented row; None is a first-class choice (R-DD-9). The inline modes
 * (inline-block, inline, inline-flex, inline-grid) wait behind Layout's More
 * settings as one "Other" select, so nothing the old ▾ chip offered is lost.
 * The one writer of `display`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ButtonGroup, SelectRow } from "../../shared/controls";

export interface DisplayControlsProps {
  display: string;
  onChange: (property: string, value: string) => void;
  /** Layout's More settings is open: show the inline modes. */
  advanced?: boolean;
}

const SEGMENTS = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
  { value: "none", label: "None" },
];

const INLINE_MODES = [
  { value: "inline-block", label: "Inline block" },
  { value: "inline", label: "Inline" },
  { value: "inline-flex", label: "Inline flex" },
  { value: "inline-grid", label: "Inline grid" },
];

export const DisplayControls: React.FC<DisplayControlsProps> = ({ display, onChange, advanced = false }) => {
  const inline = INLINE_MODES.some((m) => m.value === display);
  return (
    <>
      <ButtonGroup label="Display" property="display" value={display} options={SEGMENTS} onChange={(v) => onChange("display", v)} />
      {(advanced || inline) && (
        <SelectRow
          label="Inline"
          property="display"
          placeholder="Off"
          value={inline ? display : ""}
          options={INLINE_MODES}
          onChange={(v) => onChange("display", v || "block")}
        />
      )}
    </>
  );
};

export default DisplayControls;
