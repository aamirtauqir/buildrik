/**
 * Advanced layout rows (2L9 A03 247:22310): Overflow X · Overflow Y · Box
 * sizing · Visibility · Float · Clear — one select each, in the column
 * every other Style row uses. The one writer of overflow-x / overflow-y,
 * box-sizing, visibility, float and clear. An authored `overflow`
 * shorthand reads into both axes until an axis is written.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow } from "@/editor/inspector/shared/controls";

export interface OverflowVisibilityControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

const opts = (pairs: readonly (readonly [string, string])[]) => pairs.map(([value, label]) => ({ value, label }));

const OVERFLOW = opts([["visible", "Visible"], ["hidden", "Hidden"], ["clip", "Clip"], ["scroll", "Scroll"], ["auto", "Auto"]]);
const BOX_SIZING = opts([["content-box", "Content box"], ["border-box", "Border box"]]);
const VISIBILITY = opts([["visible", "Visible"], ["hidden", "Hidden"], ["collapse", "Collapse"]]);
const FLOAT = opts([["none", "None"], ["left", "Left"], ["right", "Right"]]);
const CLEAR = opts([["none", "None"], ["left", "Left"], ["right", "Right"], ["both", "Both"]]);

export const AdvancedLayoutRows: React.FC<OverflowVisibilityControlsProps> = ({ styles, onChange }) => {
  const row = (label: string, property: string, options: { value: string; label: string }[], fallback = "") => (
    <SelectRow label={label} property={property} value={styles[property] || fallback} options={options} onChange={(v) => onChange(property, v)} />
  );
  return (
    <>
      {row("Overflow X", "overflow-x", OVERFLOW, styles.overflow ?? "")}
      {row("Overflow Y", "overflow-y", OVERFLOW, styles.overflow ?? "")}
      {row("Box sizing", "box-sizing", BOX_SIZING)}
      {row("Visibility", "visibility", VISIBILITY)}
      {row("Float", "float", FLOAT)}
      {row("Clear", "clear", CLEAR)}
    </>
  );
};
