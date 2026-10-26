/**
 * Display Controls — 2L9 247:21216 / 36:2 "Display [Flex ▾]".
 *
 * One select: Block · Flex · Grid · None, then the inline modes
 * (inline-block, inline, inline-flex, inline-grid), so nothing the old
 * segmented row + "Inline" select offered is lost. The one writer of
 * `display`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow } from "@/editor/inspector/shared/controls";

export interface DisplayControlsProps {
  display: string;
  onChange: (property: string, value: string) => void;
}

const DISPLAY_OPTIONS = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
  { value: "none", label: "None" },
  { value: "inline-block", label: "Inline block" },
  { value: "inline", label: "Inline" },
  { value: "inline-flex", label: "Inline flex" },
  { value: "inline-grid", label: "Inline grid" },
];

export const DisplayControls: React.FC<DisplayControlsProps> = ({ display, onChange }) => (
  <SelectRow
    label="Display"
    property="display"
    value={display || "block"}
    options={DISPLAY_OPTIONS}
    onChange={(v) => onChange("display", v || "block")}
  />
);

export default DisplayControls;
