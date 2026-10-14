/**
 * Type-block bodies — layout primitives: Flex (+ stack) and Grid (+ columns).
 *
 * Board 16: the Flex block is the flex controls themselves — Direction, the
 * 3×3 align grid with its label, Wrap, Gap — always visible (DD-5), the same
 * `FlexControls` Layout shows for a container set to Flex. Grid draws the
 * same `GridControls` as a container set to Grid. The Columns type keeps its
 * attribute-driven rows (column count / gap live on `data-columns` /
 * `data-gap`, which its renderer reads).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { FlexControls } from "@/editor/inspector/sections/layout/FlexControls";
import { GridControls } from "@/editor/inspector/sections/layout/GridControls";
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

const Flex: React.FC<TypeBlockBodyProps> = ({ styles, onChange, onBatchChange }) => (
  <FlexControls styles={styles} onChange={onChange} onBatchChange={onBatchChange} />
);

const Grid: React.FC<TypeBlockBodyProps> = (p) =>
  p.element.type === "columns" ? (
    <PropertyRows composer={p.composer} element={p.element} targetIds={p.targetIds} rows={COLUMNS_ROWS} />
  ) : (
    <GridControls styles={p.styles} onChange={p.onChange} />
  );

export const LAYOUT_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  flex: Flex,
  grid: Grid,
};
