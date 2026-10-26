/**
 * Grid and snapping — boards 145:65011 (B3-C02) and 145:65448 (B3-C03): a
 * 360-wide panel that opens from the canvas View control in place of the
 * View menu, with "Close" in its head (not a centred modal). A draft: nothing
 * changes until Apply, and an invalid size keeps the current grid.
 *
 * The grid overlay and snap-to-grid are one switch in the code
 * (`Canvas.tsx` calls `composer.setSnapToGrid(showGrid)`), which is what the
 * board's "Show grid and snap" names.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, TextInput, ToggleSwitch } from "@/editor/chrome-ui";

const GRID_PRESETS: readonly number[] = [4, 8, 16];
const GRID_RANGE = { min: 1, max: 100 } as const;

export interface GridSnapPanelProps {
  gridOn: boolean;
  gridSize: number;
  onClose: () => void;
  onApply: (next: { gridOn: boolean; gridSize: number }) => void;
}

/** A whole number in range, or null. "1.5" and "" are not sizes. */
function parseGridSize(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= GRID_RANGE.min && n <= GRID_RANGE.max ? n : null;
}

const PRESET = "tw:h-8 tw:w-24 tw:rounded-md tw:text-[13px] tw:font-normal tw:focus:ring-0";

export function GridSnapPanel({ gridOn, gridSize, onClose, onApply }: GridSnapPanelProps) {
  const [on, setOn] = React.useState(gridOn);
  const [draft, setDraft] = React.useState(String(gridSize));

  const size = parseGridSize(draft);
  const apply = () => {
    if (size === null) return;
    onApply({ gridOn: on, gridSize: size });
    onClose();
  };

  return (
    <div className="tw:flex tw:w-90 tw:flex-col tw:gap-4 tw:whitespace-normal tw:p-3" data-testid="grid-snap-dialog" role="dialog" aria-label="Grid and snapping">
      <div className="tw:flex tw:items-center">
        <span className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">Grid and snapping</span>
        <Button
          color="light"
          size="xs"
          data-testid="grid-snap-close"
          className="tw:ml-auto tw:h-7 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
      <p className="tw:m-0 tw:text-[13px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
        Personal editor view. Existing element values stay unchanged.
      </p>
      <div className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink)]">
        <ToggleSwitch sizing="sm" checked={on} onChange={setOn} aria-label="Show grid and snap" data-testid="grid-snap-toggle" className="tw:focus:ring-0" />
        <span aria-hidden="true">Show grid and snap</span>
      </div>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className="tw:text-[13px] tw:text-[var(--bk-ink)]" id="grid-snap-size-label">
          Grid size
        </span>
        <TextInput
          sizing="sm"
          inputMode="numeric"
          aria-labelledby="grid-snap-size-label"
          className="tw:tabular-nums tw:[&_input]:h-7 tw:[&_input]:border-transparent tw:[&_input]:bg-[var(--bk-gray-100)]"
          value={draft}
          color={size === null ? "failure" : undefined}
          data-testid="grid-snap-size"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") apply();
          }}
        />
        <div className="tw:flex tw:gap-2">
          {GRID_PRESETS.map((n) => (
            <Button
              key={n}
              variant="secondary"
              size="xs"
              aria-pressed={size === n}
              data-testid={`grid-snap-preset-${n}`}
              className={PRESET}
              onClick={() => setDraft(String(n))}
            >
              {`${n} px`}
            </Button>
          ))}
        </div>
        <span
          className={`tw:text-[11px] tw:leading-4 ${size === null ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink-muted)]"}`}
          data-testid="grid-snap-hint"
          role={size === null ? "alert" : undefined}
        >
          {size === null
            ? `Enter a whole number from ${GRID_RANGE.min} to ${GRID_RANGE.max} px. Current grid stays ${gridSize} px.`
            : `Whole number · ${GRID_RANGE.min}–${GRID_RANGE.max} px`}
        </span>
      </div>
      <div className="tw:flex tw:justify-end tw:gap-2">
        <Button variant="secondary" size="sm" className="tw:h-8 tw:w-24 tw:focus:ring-0" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" className="tw:h-8 tw:w-24 tw:focus:ring-0" onClick={apply} disabled={size === null} data-testid="grid-snap-apply">
          Apply
        </Button>
      </div>
    </div>
  );
}
