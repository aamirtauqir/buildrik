/**
 * TextareaField — labelled textarea wrapper.
 * Internal: composes ui <FormField> + <Textarea>.
 * Bare path (no label/error/hint) renders just <Textarea>.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FormField } from "@/editor/chrome-ui";
import { Textarea } from "@/editor/chrome-ui";

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// flowbite's Textarea has no `error` prop (the deleted ui/Textarea.tsx set
// aria-invalid + relied on a `.bk-textarea[aria-invalid="true"]` CSS
// attribute selector for the red border) — `wiring["aria-invalid"]`
// (FormField/Field.tsx) already carries the correct semantics for a11y, so
// only the VISUAL error state needs reproducing here, via className (which
// flowbite's Textarea, unlike Select, applies directly to the real
// <textarea> — no wrapper-div gap).
const BASE_CLASS = "tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700";
const ERROR_CLASS = "tw:bg-white tw:border-red-600 tw:focus:border-red-600 tw:focus:ring-red-600";

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  error,
  hint,
  className,
  ...props
}) => {
  const fieldClass = error ? ERROR_CLASS : BASE_CLASS;

  if (!label && !error && !hint) {
    const bare = <Textarea className={fieldClass} {...props} />;
    return className ? <div className={className}>{bare}</div> : bare;
  }

  return (
    <FormField label={label ?? ""} hint={hint} error={error} className={className}>
      {(wiring) => <Textarea className={fieldClass} {...props} {...wiring} />}
    </FormField>
  );
};

export default TextareaField;
