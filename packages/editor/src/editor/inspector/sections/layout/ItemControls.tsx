/**
 * ItemControls — how an element sits inside a flex or grid PARENT, as its
 * own section while the parent is one (2L9 247:22853 "Flex item": Grow ·
 * Shrink · Basis · Order · Align self; a grid child (A02): Column · Row
 * · Align self · Justify self). Before 2L9 these sat in Size, Grow and Align
 * self on the face and the rest behind More settings; the board draws the
 * group whole.
 *
 * The one writer of flex-grow, flex-shrink, flex-basis, order, grid-column,
 * grid-row, align-self and justify-self.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputRow, Section, SelectRow } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";

type ParentLayout = "flex" | "grid";

interface ItemControlsProps {
  parent: ParentLayout;
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

const SELF_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "baseline", label: "Baseline" },
];
const GRID_SELF_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "stretch", label: "Stretch" },
];
const numberOrEmpty = (v: string) => (v === "" || /^\d*\.?\d+$/.test(v) ? v : null);

function ItemControls({ parent, styles, onChange }: ItemControlsProps) {
  const write = (property: string) => (v: string) => {
    const next = numberOrEmpty(v);
    if (next !== null) onChange(property, next);
  };

  if (parent === "grid") {
    /* 2L9 A02: Column / Row are the written placement ("2 / span 2"). */
    return (
      <>
        <InputRow label="Column" property="grid-column" placeholder="auto" value={styles["grid-column"] || ""} onChange={(v) => onChange("grid-column", v)} />
        <InputRow label="Row" property="grid-row" placeholder="auto" value={styles["grid-row"] || ""} onChange={(v) => onChange("grid-row", v)} />
        <SelectRow label="Align self" property="align-self" value={styles["align-self"] || "auto"} options={GRID_SELF_OPTIONS} onChange={(v) => onChange("align-self", v)} />
        <SelectRow label="Justify self" property="justify-self" value={styles["justify-self"] || "auto"} options={GRID_SELF_OPTIONS} onChange={(v) => onChange("justify-self", v)} />
      </>
    );
  }

  return (
    <>
      <InputRow label="Grow" type="number" property="flex-grow" placeholder="0" value={styles["flex-grow"] || ""} onChange={write("flex-grow")} />
      <InputRow label="Shrink" type="number" property="flex-shrink" placeholder="1" value={styles["flex-shrink"] || ""} onChange={write("flex-shrink")} />
      <InputRow label="Basis" property="flex-basis" placeholder="auto" value={styles["flex-basis"] || ""} onChange={(v) => onChange("flex-basis", v)} />
      <InputRow label="Order" type="number" property="order" placeholder="0" value={styles.order || ""} onChange={(v) => (v === "" || /^-?\d+$/.test(v)) && onChange("order", v)} />
      <SelectRow label="Align self" property="align-self" value={styles["align-self"] || "auto"} options={SELF_OPTIONS} onChange={(v) => onChange("align-self", v)} />
    </>
  );
}

export const FlexItemSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => (
  <Section title="Flex item" isOpen={isOpen} onToggle={onToggle} id="inspector-section-flex-item">
    <ItemControls parent="flex" styles={styles} onChange={onChange} />
  </Section>
);

export const GridItemSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => (
  <Section title="Grid item" isOpen={isOpen} onToggle={onToggle} id="inspector-section-grid-item">
    <ItemControls parent="grid" styles={styles} onChange={onChange} />
  </Section>
);
