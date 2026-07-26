/**
 * Textarea — sibling of Input.
 * `mono` is for the code fields (custom head/body scripts, CSP, global CSS),
 * which are unreadable in a proportional face.
 * @license BSD-3-Clause
 */
import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  fixed?: boolean;
  mono?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, fixed, mono, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={["bk-textarea", fixed && "bk-textarea--fixed", mono && "bk-textarea--mono", className]
        .filter(Boolean)
        .join(" ")}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
});
