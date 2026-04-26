/**
 * Vibcoder FormField wrapper — slot composition canary + cross-atom imports.
 * Renders the bd-form-field composite from
 * src/themes/components/molecules/form-field.css.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   label     required structural slot → flat string prop
 *   children  variable content slot — caller passes Input / Select / Textarea
 *   helper    optional supportive text → flat string prop (muted tone)
 *   error     optional error text → flat string prop (error tone, OVERRIDES helper)
 *   required  decorative flat boolean → forwards to <Label required>
 *
 * Cross-atom imports (Contract D from Phase 2 design):
 *   Label       — sibling atom file ./Label
 *   HelperText  — sibling atom file ./HelperText
 *
 * Variant + state union from `vibcoder-variants.mjs molecules/form-field`:
 *   variants: inline, required, row
 *   states:   is-disabled (CSS class on root)
 *
 * Notes on shape:
 *   - `--required` variant adds an auto asterisk via CSS `::after`. We forward
 *     the same `required` flag to <Label> so its own `__required` marker is
 *     also rendered. Per the upstream CSS docstring, the variant is the
 *     "passthrough" path — both render together is the intended visual.
 *   - `error` and `helper` are mutex; when both are passed, error wins with
 *     tone="error". This matches the common form pattern: validation messages
 *     replace static helper hints when validation fails.
 *   - `disabled` is a visual marker on the root container only. Callers MUST
 *     also disable the underlying control passed via children (the wrapper
 *     does not clone children to inject disabled).
 *
 * forwardRef targets the root <div> — measurement consumers (popover anchor
 * for inline error, sticky-fields scroll-into-view) need it.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import { Label } from "./Label";
import { HelperText, type HelperTextTone } from "./HelperText";

export interface FormFieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  inline?: boolean;
  row?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      htmlFor,
      required,
      helper,
      error,
      inline,
      row,
      disabled,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-form-field",
      required && "bd-form-field--required",
      inline && "bd-form-field--inline",
      row && "bd-form-field--row",
      disabled && "is-disabled",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    const helperToneAndText: { tone?: HelperTextTone; text?: string } = error
      ? { tone: "error", text: error }
      : helper
        ? { text: helper }
        : {};
    return (
      <div ref={ref} className={classes} {...rest}>
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
        {children}
        {helperToneAndText.text && (
          <HelperText tone={helperToneAndText.tone}>
            {helperToneAndText.text}
          </HelperText>
        )}
      </div>
    );
  },
);
FormField.displayName = "FormField";
