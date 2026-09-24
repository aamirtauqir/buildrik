/**
 * Custom width — board 5930:44824 (G2-014), opened from the breakpoint menu's
 * "Custom width…" row. Sets the canvas preview width only; the page's content
 * and its breakpoint styles are untouched (the breakpoint that width falls in
 * is what the caller shows).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, FormField, Modal, TextField } from "@/editor/chrome-ui";

/** Narrowest phone to a wide desktop — outside it the preview is meaningless. */
export const CUSTOM_WIDTH_RANGE = { min: 240, max: 2560 } as const;

export interface CustomWidthModalProps {
  open: boolean;
  /** Pre-filled width in px. */
  initialWidth: number;
  onClose: () => void;
  onApply: (width: number) => void;
}

export function CustomWidthModal({ open, initialWidth, onClose, onApply }: CustomWidthModalProps) {
  const [value, setValue] = React.useState(String(initialWidth));
  React.useEffect(() => {
    if (open) setValue(String(initialWidth));
  }, [open, initialWidth]);

  const width = Number.parseInt(value, 10);
  const valid = Number.isFinite(width) && width >= CUSTOM_WIDTH_RANGE.min && width <= CUSTOM_WIDTH_RANGE.max;
  const apply = () => {
    if (!valid) return;
    onApply(width);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Custom width"
      testId="custom-width-modal"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={apply} disabled={!valid}>
            Apply
          </Button>
        </>
      }
    >
      <FormField
        label="Preview width"
        hint="Changes the preview width only, not page content."
        error={valid || value === "" ? undefined : `Between ${CUSTOM_WIDTH_RANGE.min} and ${CUSTOM_WIDTH_RANGE.max} px`}
      >
        {(wiring) => (
          <TextField
            {...wiring}
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") apply();
            }}
            autoFocus
            data-testid="custom-width-input"
          />
        )}
      </FormField>
    </Modal>
  );
}
