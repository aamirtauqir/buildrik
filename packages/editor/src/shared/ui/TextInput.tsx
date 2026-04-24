/**
 * TextInput — compact single-line text field for inspector/sidebar controls.
 *
 * Phase 2 primitive port (new). Ported from drop's `.text-input` pattern
 * (editor.css:237-245): 24px height, subtle bg by default, transparent border
 * that appears on hover, cobalt-accent focus ring.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual size — sm = narrowest, md = default inspector row, lg = form section. */
  inputSize?: "sm" | "md" | "lg";
  /** Show focus ring even without focus (for validation error state). */
  invalid?: boolean;
}

type Size = NonNullable<TextInputProps["inputSize"]>;

const heightPx: Record<Size, number> = { sm: 20, md: 24, lg: 28 };
const fontSize: Record<Size, string> = {
  sm: "var(--bd-text-2xs)",
  md: "var(--bd-text-xs)",
  lg: "var(--bd-text-sm)",
};

const Input = styled.input<{ s: Size; inv: boolean }>`
  width: 100%;
  padding: 0 var(--bd-space-2);
  height: ${(p) => heightPx[p.s]}px;
  background: var(--bd-bg-subtle);
  border: 1px solid ${(p) => (p.inv ? "var(--bd-error)" : "transparent")};
  border-radius: var(--bd-radius-sm);
  font-family: var(--bd-font);
  font-size: ${(p) => fontSize[p.s]};
  font-weight: var(--bd-weight-medium);
  color: var(--bd-fg-primary);
  outline: none;
  transition: var(--bd-transition-colors);
  box-sizing: border-box;

  &::placeholder {
    color: var(--bd-fg-muted);
  }

  &:hover:not(:disabled):not(:focus) {
    background: var(--bd-bg-card);
    border-color: var(--bd-border);
  }

  &:focus {
    background: var(--bd-bg-card);
    border-color: ${(p) => (p.inv ? "var(--bd-error)" : "var(--bd-accent)")};
    box-shadow: var(--bd-glow-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ inputSize = "md", invalid = false, className, type = "text", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        s={inputSize}
        inv={invalid}
        type={type}
        aria-invalid={invalid || undefined}
        className={className}
        {...props}
      />
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
