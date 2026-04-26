/**
 * Vibcoder Checkbox wrapper.
 * Renders the `bd-checkbox` composite from src/themes/components/atoms/checkbox.css:
 *   <label class="bd-checkbox">
 *     <input class="bd-checkbox__input" type="checkbox" />
 *     <span class="bd-checkbox__label">…</span>   (only if `label` prop set)
 *   </label>
 *
 * Variant + size + state union sourced from `vibcoder-variants.mjs atoms/checkbox`:
 *   sizes: sm, lg  (md is base default — no `bd-checkbox--md` rule exists)
 *   variants: error  (state, demoted to boolean prop per Tag pattern)
 *
 * forwardRef targets the inner `<input>` — semantically meaningful focus target.
 * Consumers attach focus/blur handlers to the input, NOT the label wrapper.
 *
 * `indeterminate` is an HTMLInputElement DOM property, NOT an HTML attribute.
 * Set imperatively via useEffect after mount + on prop change. Pattern proven
 * by every checkbox library (Radix, MUI, shadcn).
 *
 * Native attrs (`checked`, `defaultChecked`, `onChange`, `disabled`, `name`,
 * `value`, etc.) pass through via `...rest`. Native `disabled` triggers the
 * vendored `:disabled` selector + composes with `--error` rules per CSS.
 *
 * @license BSD-3-Clause
 */
import {
  type InputHTMLAttributes,
  type ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  size?: CheckboxSize;
  error?: boolean;
  /** Sets the input's DOM `indeterminate` property (no HTML attr equivalent). */
  indeterminate?: boolean;
  /** Optional text label rendered as `bd-checkbox__label` next to the box. */
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ size = "md", error = false, indeterminate = false, label, className, ...rest }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);
    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const labelClasses = [
      "bd-checkbox",
      // md is base default — no `bd-checkbox--md` rule exists in vendored CSS
      size !== "md" && `bd-checkbox--${size}`,
      error && "bd-checkbox--error",
      className,
    ].filter(Boolean).join(" ");

    return (
      <label className={labelClasses}>
        <input
          ref={innerRef}
          type="checkbox"
          className="bd-checkbox__input"
          aria-invalid={error || undefined}
          {...rest}
        />
        {label !== undefined && <span className="bd-checkbox__label">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
