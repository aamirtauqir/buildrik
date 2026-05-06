/**
 * TextareaField — labelled textarea wrapper.
 * Internal: composes vibcoder <FormField> + <Textarea>.
 * Bare path (no label/error/hint) renders just <Textarea>.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Textarea, FormField } from "@/editor/shared/vibcoder";

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  error,
  hint,
  className,
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const textarea = <Textarea {...props} id={fieldId} error={!!error} />;

  if (!label && !error && !hint) {
    return className ? <div className={className}>{textarea}</div> : textarea;
  }

  return (
    <FormField
      label={label ?? ""}
      htmlFor={fieldId}
      error={error}
      helper={hint}
      disabled={props.disabled}
      className={className}
    >
      {textarea}
    </FormField>
  );
};

export default TextareaField;
