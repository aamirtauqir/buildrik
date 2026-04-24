/**
 * FormInput — form-sized single-line text field for settings/pages/dialog forms.
 *
 * Week 1 primitive extraction from project/preview/comp-inputs.html (.inp).
 * Distinct from TextInput (which is inspector-sized at 20/24/28px).
 * This one is form-sized at 28/34/40px with white background and medium border.
 *
 * Size split LOCKED 2026-04-25 per P0c audit T2:
 *   TextInput — inspector (compact, --bd-bg-subtle, transparent border)
 *   FormInput — form (comfortable, --bd-bg-card, --bd-border-medium)
 *
 * Optional label + helperText + errorText slots address P0c audit T5
 * ("prototype shows .lbl above, .hint / .err-hint below; no matching API").
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visual size. Defaults to md (34px). */
  inputSize?: "sm" | "md" | "lg";
  /** Optional label rendered above the input. */
  label?: React.ReactNode;
  /** Helper text rendered below input when not in error state. */
  helperText?: React.ReactNode;
  /** Error text rendered below input when `invalid` is true. Replaces helperText. */
  errorText?: React.ReactNode;
  /** Show error ring + error border. */
  invalid?: boolean;
}

type Size = NonNullable<FormInputProps["inputSize"]>;

const sizeMap: Record<
  Size,
  { height: number; padding: string; fontSize: string }
> = {
  sm: { height: 28, padding: "6px 10px", fontSize: "var(--bd-text-sm)" },        // 12px font
  md: { height: 34, padding: "8px 12px", fontSize: "var(--bd-text-sm-plus)" },   // 13px — prototype-exact
  lg: { height: 40, padding: "10px 14px", fontSize: "var(--bd-text-md)" },       // 14px font
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--bd-space-2);
`;

const Label = styled.span`
  font-family: var(--bd-font);
  font-size: var(--bd-text-xs);
  font-weight: var(--bd-weight-medium);
  color: var(--bd-fg-secondary);
  letter-spacing: var(--bd-track-wide);
  line-height: 1.2;
`;

const Input = styled.input<{ s: Size; inv: boolean }>`
  width: 100%;
  box-sizing: border-box;
  height: ${(p) => sizeMap[p.s].height}px;
  padding: ${(p) => sizeMap[p.s].padding};
  font-family: var(--bd-font);
  font-size: ${(p) => sizeMap[p.s].fontSize};
  font-weight: var(--bd-weight-regular);
  color: var(--bd-fg-primary);
  background: var(--bd-bg-card);
  border: 1px solid ${(p) => (p.inv ? "var(--bd-error)" : "var(--bd-border-medium)")};
  border-radius: var(--bd-radius-md);
  outline: none;
  transition: var(--bd-transition-colors);

  &::placeholder {
    color: var(--bd-fg-muted);
  }

  &:hover:not(:disabled):not(:focus) {
    border-color: var(--bd-border-strong);
  }

  &:focus {
    border-color: ${(p) => (p.inv ? "var(--bd-error)" : "var(--bd-accent)")};
    box-shadow: ${(p) => (p.inv ? "0 0 0 3px var(--bd-error-tint)" : "var(--bd-glow-primary)")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Hint = styled.span<{ inv: boolean }>`
  font-family: var(--bd-font);
  font-size: var(--bd-text-xs);
  font-weight: var(--bd-weight-medium);
  color: ${(p) => (p.inv ? "var(--bd-error)" : "var(--bd-fg-muted)")};
  line-height: 1.3;
`;

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      inputSize = "md",
      label,
      helperText,
      errorText,
      invalid = false,
      className,
      id,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hintId = `${inputId}-hint`;
    const showErrorText = invalid && errorText;
    const hintContent = showErrorText ? errorText : helperText;

    return (
      <Wrapper className={className}>
        {label && <Label as="label" {...{ htmlFor: inputId }}>{label}</Label>}
        <Input
          ref={ref}
          id={inputId}
          s={inputSize}
          inv={invalid}
          type={type}
          aria-invalid={invalid || undefined}
          aria-describedby={hintContent ? hintId : undefined}
          {...props}
        />
        {hintContent && (
          <Hint id={hintId} inv={invalid}>
            {hintContent}
          </Hint>
        )}
      </Wrapper>
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
