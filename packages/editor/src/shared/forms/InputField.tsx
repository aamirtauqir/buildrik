/**
 * InputField — labelled input wrapper.
 * Internal: composes vibcoder <FormField> + <Input>.
 * Bare path (no label/error/hint) renders just <Input>.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input, FormField } from "@/editor/shared/vibcoder";

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

const ICON_PAD = 32;

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  hint,
  leftIcon,
  className,
  id,
  style,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const inputStyle = leftIcon ? { paddingLeft: ICON_PAD, ...style } : style;
  const inputEl = <Input {...props} id={inputId} error={!!error} style={inputStyle} />;

  const inputWithIcon = leftIcon ? (
    <div style={{ position: "relative" }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--buildrick-text-tertiary)",
          display: "inline-flex",
        }}
      >
        {leftIcon}
      </span>
      {inputEl}
    </div>
  ) : (
    inputEl
  );

  if (!label && !error && !hint) {
    return className ? <div className={className}>{inputWithIcon}</div> : inputWithIcon;
  }

  return (
    <FormField
      label={label ?? ""}
      htmlFor={inputId}
      error={error}
      helper={hint}
      disabled={props.disabled}
      className={className}
    >
      {inputWithIcon}
    </FormField>
  );
};

export default InputField;
