/**
 * TextareaField — labelled textarea wrapper.
 * Internal: composes ui <FormField> + <Textarea>.
 * Bare path (no label/error/hint) renders just <Textarea>.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FormField, Textarea } from "@/editor/ui";

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
  ...props
}) => {
  if (!label && !error && !hint) {
    const bare = <Textarea {...props} error={!!error} />;
    return className ? <div className={className}>{bare}</div> : bare;
  }

  return (
    <FormField label={label ?? ""} hint={hint} error={error} className={className}>
      {(wiring) => <Textarea {...props} {...wiring} error={!!error} />}
    </FormField>
  );
};

export default TextareaField;
