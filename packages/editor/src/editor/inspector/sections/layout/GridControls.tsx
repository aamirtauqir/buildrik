/**
 * GridControls — a grid container's controls: Layout when Display is Grid
 * (board 17: "Columns [3]", "Gap [24 px]") and the Grid type block.
 *
 * Columns is a count: it writes `repeat(N, 1fr)`. Anything the count cannot
 * say — a custom track list, rows, flow, item alignment, content alignment,
 * row / column gap — sits behind More settings, so nothing the old Grid
 * section could do is lost.
 *
 * The one writer of grid-template-columns, grid-template-rows,
 * grid-auto-flow, justify-items, and justify-content / align-content /
 * align-items on a GRID container.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlignmentGrid, InputRow, InputWithUnit, MoreSettingsToggle, SelectRow } from "../../shared/controls";
import { GapRow } from "./GapRow";

export interface GridControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** The owner's More settings state (Layout). Absent = the controls keep
   *  their own toggle (the Grid type block). */
  advanced?: boolean;
}

/** How many columns a template holds; "" when it cannot be counted (auto-fit). */
export function columnCount(template: string | undefined): string {
  if (!template || template === "none") return "";
  if (/auto-fit|auto-fill/.test(template)) return "";
  const repeat = template.match(/^repeat\(\s*(\d+)\s*,/);
  if (repeat) return repeat[1];
  return String(template.trim().split(/\s+(?![^(]*\))/).filter(Boolean).length);
}

const FLOW_OPTIONS = [
  { value: "row", label: "Row" },
  { value: "column", label: "Column" },
  { value: "row dense", label: "Row, dense" },
  { value: "column dense", label: "Column, dense" },
];
const CONTENT_OPTIONS = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
];

/** Board 17's "Columns [3]": the inspector's number field, a count written
 *  as repeat(N, 1fr). A count under 1 or over 24 is not written. */
function ColumnsRow({ value, onChange }: { value: string; onChange: (property: string, value: string) => void }) {
  return (
    <InputWithUnit
      label="Columns"
      property="grid-template-columns"
      noUnit
      placeholder="1"
      value={value}
      onChange={(v) => {
        if (v === "") return onChange("grid-template-columns", "");
        const n = Number(v);
        if (Number.isInteger(n) && n >= 1 && n <= 24) onChange("grid-template-columns", `repeat(${n}, 1fr)`);
      }}
    />
  );
}

export function GridControls({ styles, onChange, advanced }: GridControlsProps) {
  const [ownMore, setOwnMore] = React.useState(false);
  const more = advanced ?? ownMore;
  const count = columnCount(styles["grid-template-columns"]);
  return (
    <>
      <ColumnsRow value={count} onChange={onChange} />
      <GapRow styles={styles} onChange={onChange} advanced={more} />
      {more && (
        <>
          <InputRow
            label="Column tracks"
            property="grid-template-columns"
            placeholder="1fr 1fr 1fr"
            value={styles["grid-template-columns"] || ""}
            onChange={(v) => onChange("grid-template-columns", v)}
          />
          <InputRow
            label="Rows"
            property="grid-template-rows"
            placeholder="auto"
            value={styles["grid-template-rows"] || ""}
            onChange={(v) => onChange("grid-template-rows", v)}
          />
          <SelectRow label="Flow" property="grid-auto-flow" value={styles["grid-auto-flow"] || ""} options={FLOW_OPTIONS} onChange={(v) => onChange("grid-auto-flow", v)} />
          <div className="bdi-row-ctrl">
            <span className="bdi-lb">Items</span>
            <div className="bdi-row-content">
              <AlignmentGrid
                justifyItems={styles["justify-items"] || "stretch"}
                alignItems={styles["align-items"] || "stretch"}
                onChange={onChange}
              />
            </div>
          </div>
          <SelectRow label="Justify" property="justify-content" value={styles["justify-content"] || ""} options={CONTENT_OPTIONS} onChange={(v) => onChange("justify-content", v)} />
          <SelectRow label="Align rows" property="align-content" value={styles["align-content"] || ""} options={CONTENT_OPTIONS} onChange={(v) => onChange("align-content", v)} />
        </>
      )}
      {advanced === undefined && <MoreSettingsToggle isOpen={ownMore} onToggle={() => setOwnMore((v) => !v)} />}
    </>
  );
}
