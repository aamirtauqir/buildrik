/**
 * Type-block bodies — layout primitives: Flex (+ stack) and Grid (+ columns)
 * (board 16). Lane L2-C replaces these with the board layout (`FlexControls`
 * / `GridControls`, "Align Center / Center" label).
 *
 * W1 composes the controls the Flexbox section already had — Direction, the
 * alignment grid, Wrap, Gap — so the block is always visible (no tier, DD-5)
 * instead of arriving as a separate "Flexbox" section.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { AlignmentSection, DirectionControls, GapControls } from "../../flexbox";
import { ButtonGroup, InlineInput } from "../../../shared/controls";
import { PropertyRows, type PropertyConfig } from "../PropertyField";

const COLUMNS_ROWS: readonly PropertyConfig[] = [
  {
    id: "data-columns",
    label: "Columns",
    type: "select",
    options: ["2", "3", "4", "5", "6"].map((v) => ({ value: v, label: v })),
  },
  {
    id: "data-gap",
    label: "Gap",
    type: "select",
    options: [
      { value: "0", label: "None" },
      { value: "8px", label: "8px" },
      { value: "16px", label: "16px" },
      { value: "24px", label: "24px" },
      { value: "32px", label: "32px" },
    ],
  },
];

const WRAP = [
  { value: "nowrap", label: "No wrap" },
  { value: "wrap", label: "Wrap" },
];

const Flex: React.FC<TypeBlockBodyProps> = ({ styles, onChange, onBatchChange, mixedKeys }) => (
  <>
    <DirectionControls currentDirection={styles["flex-direction"]} onChange={onChange} mixedKeys={mixedKeys} />
    <AlignmentSection styles={styles} onChange={onChange} mixedKeys={mixedKeys} />
    <ButtonGroup label="Wrap" value={styles["flex-wrap"] || "nowrap"} onChange={(v) => onChange("flex-wrap", v)} options={WRAP} />
    <GapControls styles={styles} onChange={onChange} onBatchChange={onBatchChange} disabled={() => false} mixedKeys={mixedKeys} />
  </>
);

const Grid: React.FC<TypeBlockBodyProps> = (p) => {
  if (p.element.type === "columns") {
    return <PropertyRows composer={p.composer} element={p.element} targetIds={p.targetIds} rows={COLUMNS_ROWS} />;
  }
  return (
    <>
      <InlineInput label="Columns" value={p.styles["grid-template-columns"] || ""} onChange={(v) => p.onChange("grid-template-columns", v)} placeholder="1fr 1fr 1fr" />
      <InlineInput label="Rows" value={p.styles["grid-template-rows"] || ""} onChange={(v) => p.onChange("grid-template-rows", v)} placeholder="auto" />
      <InlineInput label="Gap" value={p.styles.gap || ""} onChange={(v) => p.onChange("gap", v)} placeholder="0" />
    </>
  );
};

export const LAYOUT_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  flex: Flex,
  grid: Grid,
};

