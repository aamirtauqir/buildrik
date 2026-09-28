/**
 * FlexControls — a flex container's controls, drawn the same wherever a flex
 * container is edited: the Flex type block (board 16) and Layout when a
 * container's Display is Flex. Always visible — no tier (DD-5).
 *
 * Board 16: Direction Row · Column, the 3×3 align grid with its label
 * ("Align / Center / Center"), Wrap, Gap. More settings holds what the grid
 * cannot say: reverse order, distribute (space-between …), stretch /
 * baseline, align content, row / column gap.
 *
 * The one writer of flex-direction, flex-wrap, justify-content (flex),
 * align-items (flex) and align-content (flex).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Checkbox, Label } from "@/editor/chrome-ui";
import { ButtonGroup, MoreSettingsToggle, SelectRow } from "../../shared/controls";
import { GapRow } from "./GapRow";

export interface FlexControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** One undo step for the grid's two-property write. */
  onBatchChange?: (changes: Record<string, string>) => void;
  /** The owner's More settings state (Layout). Absent = the controls keep
   *  their own toggle (the Flex type block). */
  advanced?: boolean;
}

const DIRECTIONS = [
  { value: "row", label: "Row" },
  { value: "column", label: "Column" },
];

/* The grid's three stops on each axis. */
const STOPS = ["flex-start", "center", "flex-end"] as const;
const MAIN_NAMES: Record<string, string> = { "flex-start": "Left", start: "Left", center: "Center", "flex-end": "Right", end: "Right" };
const CROSS_NAMES: Record<string, string> = { "flex-start": "Top", start: "Top", center: "Center", "flex-end": "Bottom", end: "Bottom" };
const OTHER_NAMES: Record<string, string> = {
  "space-between": "Space between",
  "space-around": "Space around",
  "space-evenly": "Space evenly",
  stretch: "Stretch",
  baseline: "Baseline",
  normal: "Stretch",
};

const stopIndex = (v: string | undefined): number => {
  if (v === "center") return 1;
  if (v === "flex-end" || v === "end") return 2;
  if (!v || v === "flex-start" || v === "start" || v === "normal" || v === "stretch") return 0;
  return -1;
};

const JUSTIFY_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
  { value: "space-evenly", label: "Space evenly" },
];
const ALIGN_ITEMS_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "baseline", label: "Baseline" },
];
const ALIGN_CONTENT_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
];

/* Board 16: 32 × 28 cells, 4 apart. */
const CELL =
  "tw:w-8 tw:h-7 tw:min-w-0 tw:min-h-0 tw:p-0 tw:rounded-[4px] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] " +
  "tw:flex tw:items-center tw:justify-center tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0 " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const CELL_ON = "tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)] tw:hover:bg-[var(--bk-accent)]";
/* The section body already insets 12; board 16's align grid and Wrap sit
   at 16, so the row adds 4 — not a second 12. */
const ROW = "tw:flex tw:items-center tw:gap-2 tw:px-1 tw:min-h-7";
const LABEL = "tw:w-[108px] tw:shrink-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** The 3×3 grid + its words. Row: columns = justify, rows = align; column swaps. */
function AlignGrid({ styles, onBatchChange }: { styles: Record<string, string>; onBatchChange: (c: Record<string, string>) => void }) {
  const isColumn = (styles["flex-direction"] || "row").startsWith("column");
  const justify = styles["justify-content"] || "flex-start";
  const align = styles["align-items"] || "stretch";
  const j = stopIndex(justify);
  const a = stopIndex(align);
  /* x = the grid's column (horizontal), y = its row (vertical). */
  const [x, y] = isColumn ? [a, j] : [j, a];
  const horizontal = isColumn ? align : justify;
  const vertical = isColumn ? justify : align;
  const words = `${OTHER_NAMES[vertical] ?? CROSS_NAMES[vertical] ?? vertical} / ${OTHER_NAMES[horizontal] ?? MAIN_NAMES[horizontal] ?? horizontal}`;

  return (
    <div className={`${ROW} tw:items-start tw:py-1`}>
      <div role="group" aria-label="Align" className="tw:grid tw:grid-cols-[repeat(3,2rem)] tw:gap-1 tw:shrink-0">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const on = row === y && col === x;
            const name = `${CROSS_NAMES[STOPS[row]]} ${MAIN_NAMES[STOPS[col]]}`;
            return (
              <Button
                key={`${row}-${col}`}
                size="xs"
                color="light"
                data-testid={`inspector-flex-align-${row}-${col}`}
                aria-label={`Align ${name.toLowerCase()}`}
                aria-pressed={on}
                className={`${CELL} ${on ? CELL_ON : ""}`}
                onClick={() =>
                  onBatchChange(
                    isColumn
                      ? { "justify-content": STOPS[row], "align-items": STOPS[col] }
                      : { "justify-content": STOPS[col], "align-items": STOPS[row] },
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className={`tw:block tw:size-1 tw:rounded-full ${on ? "tw:bg-[var(--bk-bg-panel)]" : "tw:bg-[var(--bk-ink-muted)]"}`}
                />
              </Button>
            );
          }),
        )}
      </div>
      <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="inspector-flex-align-label">
        <span className="tw:block tw:text-[var(--bk-ink-muted)]">Align</span>
        {words}
      </p>
    </div>
  );
}

export function FlexControls({ styles, onChange, onBatchChange, advanced }: FlexControlsProps) {
  const [ownMore, setOwnMore] = React.useState(false);
  const more = advanced ?? ownMore;
  const wrapId = React.useId();
  const reverseId = React.useId();
  const wrapReverseId = React.useId();
  const direction = styles["flex-direction"] || "row";
  const reversed = direction.endsWith("-reverse");
  const axis = direction.startsWith("column") ? "column" : "row";
  const wrap = styles["flex-wrap"] || "nowrap";
  const batch = onBatchChange ?? ((c: Record<string, string>) => Object.entries(c).forEach(([k, v]) => onChange(k, v)));

  return (
    <>
      <ButtonGroup
        label="Direction"
        property="flex-direction"
        value={axis}
        options={DIRECTIONS}
        onChange={(v) => onChange("flex-direction", reversed ? `${v}-reverse` : v)}
      />
      <AlignGrid styles={styles} onBatchChange={batch} />
      <div className={ROW}>
        <Checkbox
          id={wrapId}
          color="blue"
          checked={wrap !== "nowrap"}
          onChange={(e) => onChange("flex-wrap", e.target.checked ? "wrap" : "nowrap")}
        />
        <Label htmlFor={wrapId} className="tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-soft)]">
          Wrap
        </Label>
      </div>
      <GapRow styles={styles} onChange={onChange} advanced={more} />
      {more && (
        <>
          <div className={ROW}>
            <span className={LABEL} aria-hidden="true" />
            <Checkbox
              id={reverseId}
              color="blue"
              checked={reversed}
              onChange={(e) => onChange("flex-direction", e.target.checked ? `${axis}-reverse` : axis)}
            />
            <Label htmlFor={reverseId} className="tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-soft)]">
              Reverse order
            </Label>
          </div>
          <SelectRow label="Justify" property="justify-content" value={styles["justify-content"] || ""} options={JUSTIFY_OPTIONS} onChange={(v) => onChange("justify-content", v)} />
          <SelectRow label="Align items" property="align-items" value={styles["align-items"] || ""} options={ALIGN_ITEMS_OPTIONS} onChange={(v) => onChange("align-items", v)} />
          {wrap !== "nowrap" && (
            <div className={ROW}>
              <span className={LABEL} aria-hidden="true" />
              <Checkbox
                id={wrapReverseId}
                color="blue"
                checked={wrap === "wrap-reverse"}
                onChange={(e) => onChange("flex-wrap", e.target.checked ? "wrap-reverse" : "wrap")}
              />
              <Label htmlFor={wrapReverseId} className="tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-soft)]">
                Reverse lines
              </Label>
            </div>
          )}
          {wrap !== "nowrap" && (
            <SelectRow
              label="Align lines"
              property="align-content"
              value={styles["align-content"] || ""}
              options={ALIGN_CONTENT_OPTIONS}
              onChange={(v) => onChange("align-content", v)}
            />
          )}
        </>
      )}
      {advanced === undefined && <MoreSettingsToggle isOpen={ownMore} onToggle={() => setOwnMore((v) => !v)} />}
    </>
  );
}
