/**
 * NumericStepper — numeric input with -/+ buttons and optional unit suffix.
 *
 * Week 1 Commit 9 — extracted from prototype comp-inputs.html (.stepper)
 * per P0c audit T3. Used heavily in the inspector for numeric CSS values
 * (padding, margin, size, radius) where inline ad-hoc recreations had
 * been spreading across multiple sections.
 *
 * API:
 *   value       — number (controlled)
 *   onChange    — (value: number) => void
 *   min/max/step — standard numeric bounds
 *   unit        — optional string suffix (e.g. "px", "%", "em")
 *   size        — sm | md | lg (default md = prototype size)
 *   disabled    — disables both buttons + input
 *
 * Buttons clamp against min/max. Keyboard Up/Down also step.
 * Mono font on the value field matches the inspector's numeric treatment.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  id?: string;
}

type Size = NonNullable<NumericStepperProps["size"]>;

const heightPx: Record<Size, number> = { sm: 28, md: 32, lg: 40 };
const buttonWidth: Record<Size, number> = { sm: 26, md: 30, lg: 36 };
const inputFontSize: Record<Size, string> = {
  sm: "var(--bd-text-sm)",
  md: "var(--bd-text-sm-plus)",
  lg: "var(--bd-text-md)",
};

const Shell = styled.div<{ s: Size; disabled: boolean }>`
  display: inline-flex;
  align-items: stretch;
  height: ${(p) => heightPx[p.s]}px;
  background: var(--bd-bg-card);
  border: 1px solid var(--bd-border-medium);
  border-radius: var(--bd-radius-md);
  overflow: hidden;
  transition: var(--bd-transition-colors);
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  pointer-events: ${(p) => (p.disabled ? "none" : "auto")};

  &:focus-within {
    border-color: var(--bd-accent);
    box-shadow: var(--bd-glow-primary);
  }
`;

const StepButton = styled.button<{ s: Size }>`
  width: ${(p) => buttonWidth[p.s]}px;
  background: transparent;
  border: none;
  color: var(--bd-fg-muted);
  cursor: pointer;
  font-family: var(--bd-font);
  font-weight: var(--bd-weight-semibold);
  font-size: var(--bd-text-md);
  line-height: 1;
  padding: 0;
  transition: var(--bd-transition-colors);

  &:hover:not(:disabled) {
    background: var(--bd-bg-hover);
    color: var(--bd-fg-primary);
  }

  &:active:not(:disabled) {
    background: var(--bd-bg-pressed);
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ValueInput = styled.input<{ s: Size }>`
  flex: 1;
  min-width: 40px;
  padding: 0 var(--bd-space-1);
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  font-family: var(--bd-mono);
  font-size: ${(p) => inputFontSize[p.s]};
  font-weight: var(--bd-weight-medium);
  color: var(--bd-fg-primary);

  /* Hide native spinner — we render our own buttons. */
  -moz-appearance: textfield;
  appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const Unit = styled.span`
  padding: 0 var(--bd-space-3);
  display: inline-flex;
  align-items: center;
  border-left: 1px solid var(--bd-border);
  font-family: var(--bd-mono);
  font-size: var(--bd-text-xs);
  font-weight: var(--bd-weight-medium);
  color: var(--bd-fg-muted);
`;

export const NumericStepper: React.FC<NumericStepperProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  size = "md",
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel,
}) => {
  const clamp = React.useCallback(
    (n: number) => {
      if (typeof min === "number" && n < min) return min;
      if (typeof max === "number" && n > max) return max;
      return n;
    },
    [min, max]
  );

  const stepTo = React.useCallback(
    (delta: number) => {
      if (disabled) return;
      onChange(clamp(value + delta));
    },
    [value, onChange, clamp, disabled]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
      onChange(0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) onChange(clamp(parsed));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      stepTo(step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      stepTo(-step);
    }
  };

  const decrDisabled = disabled || (typeof min === "number" && value <= min);
  const incrDisabled = disabled || (typeof max === "number" && value >= max);

  return (
    <Shell s={size} disabled={disabled} className={className}>
      <StepButton
        s={size}
        type="button"
        onClick={() => stepTo(-step)}
        disabled={decrDisabled}
        aria-label="Decrease"
        tabIndex={-1}
      >
        −
      </StepButton>
      <ValueInput
        id={id}
        s={size}
        type="number"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        inputMode="numeric"
      />
      {unit && <Unit>{unit}</Unit>}
      <StepButton
        s={size}
        type="button"
        onClick={() => stepTo(step)}
        disabled={incrDisabled}
        aria-label="Increase"
        tabIndex={-1}
      >
        +
      </StepButton>
    </Shell>
  );
};

export default NumericStepper;
