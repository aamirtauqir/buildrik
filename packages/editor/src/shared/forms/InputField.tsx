/**
 * InputField — labelled input wrapper.
 * Internal: composes ui <FormField> + flowbite's <TextInput>.
 * Bare path (no label/error/hint) renders just <TextInput>.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FormField } from "@/editor/chrome-ui";
import { TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/chrome-ui/textInputTheme";

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
  style,
  ...props
}) => {
  const inputStyle = leftIcon ? { paddingLeft: ICON_PAD, ...style } : style;

  const withIcon = (input: React.ReactNode) =>
    leftIcon ? (
      <div style={{ position: "relative" }}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--bk-ink-muted)",
            display: "inline-flex",
          }}
        >
          {leftIcon}
        </span>
        {input}
      </div>
    ) : (
      input
    );

  if (!label && !error && !hint) {
    const bare = withIcon(
      <TextInput {...props} theme={BK_TEXT_INPUT_THEME} aria-invalid={!!error || undefined} style={inputStyle} />,
    );
    return className ? <div className={className}>{bare}</div> : <>{bare}</>;
  }

  return (
    <FormField label={label ?? ""} hint={hint} error={error} className={className}>
      {(wiring) => withIcon(<TextInput {...props} {...wiring} theme={BK_TEXT_INPUT_THEME} style={inputStyle} />)}
    </FormField>
  );
};

export default InputField;
