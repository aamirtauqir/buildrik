/**
 * ItemControls — how an element sits inside a flex or grid PARENT: the
 * flex-item (grow, shrink, basis, order) and grid-item (column / row span)
 * properties, plus align-self / justify-self.
 *
 * Home (v4): inside the Size section, shown only while the parent is a flex
 * or grid container (`cssContext.isFlexItem` / `isGridItem`). These are
 * SHAPE properties — how big the element is and where it sits in the space
 * its parent gives it — which is Size's job in DD-15's define → shape →
 * paint; the boards draw no separate "Flex item" section, and a section of
 * its own would add a header to every child of every flex row. Grow and
 * Align self are on the face; the rest wait behind Size's More settings.
 *
 * The one writer of flex-grow, flex-shrink, flex-basis, order, grid-column,
 * grid-row, align-self and justify-self.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputRow, SelectRow } from "@/editor/inspector/shared/controls";

export type ParentLayout = "flex" | "grid";

export interface ItemControlsProps {
  parent: ParentLayout;
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Size's More settings is open. */
  advanced: boolean;
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
const SPAN_OPTIONS = [
  { value: "span 1", label: "1" },
  { value: "span 2", label: "2" },
  { value: "span 3", label: "3" },
  { value: "span 4", label: "4" },
  { value: "1 / -1", label: "Full row" },
];

const numberOrEmpty = (v: string) => (v === "" || /^\d*\.?\d+$/.test(v) ? v : null);

export function ItemControls({ parent, styles, onChange, advanced }: ItemControlsProps) {
  const write = (property: string) => (v: string) => {
    const next = numberOrEmpty(v);
    if (next !== null) onChange(property, next);
  };

  if (parent === "grid") {
    const withCurrent = (value: string) =>
      value && !SPAN_OPTIONS.some((o) => o.value === value) ? [...SPAN_OPTIONS, { value, label: value }] : SPAN_OPTIONS;
    return (
      <>
        <SelectRow
          label="Column span"
          property="grid-column"
          value={styles["grid-column"] || ""}
          options={withCurrent(styles["grid-column"] || "")}
          placeholder="Auto"
          onChange={(v) => onChange("grid-column", v)}
        />
        <SelectRow
          label="Row span"
          property="grid-row"
          value={styles["grid-row"] || ""}
          options={withCurrent(styles["grid-row"] || "")}
          placeholder="Auto"
          onChange={(v) => onChange("grid-row", v)}
        />
        {advanced && (
          <>
            <SelectRow label="Align self" property="align-self" value={styles["align-self"] || ""} options={GRID_SELF_OPTIONS} onChange={(v) => onChange("align-self", v)} />
            <SelectRow label="Justify self" property="justify-self" value={styles["justify-self"] || ""} options={GRID_SELF_OPTIONS} onChange={(v) => onChange("justify-self", v)} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <InputRow label="Grow" type="number" property="flex-grow" placeholder="0" value={styles["flex-grow"] || ""} onChange={write("flex-grow")} />
      <SelectRow label="Align self" property="align-self" value={styles["align-self"] || ""} options={SELF_OPTIONS} onChange={(v) => onChange("align-self", v)} />
      {advanced && (
        <>
          <InputRow label="Shrink" type="number" property="flex-shrink" placeholder="1" value={styles["flex-shrink"] || ""} onChange={write("flex-shrink")} />
          <InputRow label="Basis" property="flex-basis" placeholder="auto" value={styles["flex-basis"] || ""} onChange={(v) => onChange("flex-basis", v)} />
          <InputRow label="Order" type="number" property="order" placeholder="0" value={styles.order || ""} onChange={(v) => (v === "" || /^-?\d+$/.test(v)) && onChange("order", v)} />
        </>
      )}
    </>
  );
}
