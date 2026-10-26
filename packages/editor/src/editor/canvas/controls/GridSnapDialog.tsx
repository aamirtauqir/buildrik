/**
 * Grid and snapping — boards 145:65011 (B3-C02) and 145:65448 (B3-C03),
 * opened from the canvas View menu's "Grid · {n} px ›". A draft: nothing
 * changes until Apply, and an invalid size keeps the current grid.
 *
 * The grid overlay and snap-to-grid are one switch in the code
 * (`Canvas.tsx` calls `composer.setSnapToGrid(showGrid)`), which is what the
 * board's "Show grid and snap" names.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, TextInput, ToggleSwitch } from "@/editor/chrome-ui";

const GRID_PRESETS: readonly number[] = [4, 8, 16];
const GRID_RANGE = { min: 1, max: 100 } as const;

export interface GridSnapDialogProps {
  open: boolean;
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

export function GridSnapDialog({ open, gridOn, gridSize, onClose, onApply }: GridSnapDialogProps) {
  const [on, setOn] = React.useState(gridOn);
  const [draft, setDraft] = React.useState(String(gridSize));
  React.useEffect(() => {
    if (!open) return;
    setOn(gridOn);
    setDraft(String(gridSize));
  }, [open, gridOn, gridSize]);

  const size = parseGridSize(draft);
  const apply = () => {
    if (size === null) return;
    onApply({ gridOn: on, gridSize: size });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Grid and snapping"
      width="sm"
      testId="grid-snap-dialog"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={apply} disabled={size === null} data-testid="grid-snap-apply">
            Apply
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Personal editor view. Existing element values stay unchanged.
        </p>
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-[var(--bk-ink)]">
          <ToggleSwitch checked={on} onChange={setOn} aria-label="Show grid and snap" data-testid="grid-snap-toggle" className="tw:focus:ring-0" />
          <span aria-hidden="true">Show grid and snap</span>
        </div>
        <div className="tw:flex tw:flex-col tw:gap-1">
          <span className="tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink-soft)]" id="grid-snap-size-label">
            Grid size
          </span>
          <div className="tw:flex tw:items-center tw:gap-2">
            <TextInput
              sizing="sm"
              inputMode="numeric"
              aria-labelledby="grid-snap-size-label"
              className="tw:w-20 tw:tabular-nums"
              value={draft}
              color={size === null ? "failure" : undefined}
              data-testid="grid-snap-size"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply();
              }}
            />
            {GRID_PRESETS.map((n) => (
              <Button
                key={n}
                variant="secondary"
                size="xs"
                aria-pressed={size === n}
                data-testid={`grid-snap-preset-${n}`}
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
      </div>
    </Modal>
  );
}
