import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";

interface SelectionContextBarProps {
  /** Display label for the canvas element requesting media (e.g., "Hero block"). */
  label?: string;
  /** Cancel selection — clears context, restores normal browse mode. */
  onCancel(): void;
}

export function SelectionContextBar({ label, onCancel }: SelectionContextBarProps) {
  return (
    <div className="med-selection-bar" role="status" aria-live="polite">
      <div className="med-selection-bar__inner">
        <div className="med-selection-bar__pulse" aria-hidden="true" />
        <div>
          <div className="med-selection-bar__title">Selecting image for:</div>
          <div className="med-selection-bar__label">{label ?? "Canvas element"}</div>
        </div>
      </div>
      <Button
        type="button"
        onClick={onCancel}
        className="med-selection-bar__cancel"
        aria-label="Cancel selection"
      >
        Cancel
      </Button>
    </div>
  );
}
