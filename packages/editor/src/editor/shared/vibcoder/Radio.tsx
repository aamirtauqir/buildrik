/**
 * Vibcoder Radio + RadioGroup wrappers.
 *
 * Renders the `bd-radio` composite from src/themes/components/atoms/radio.css:
 *   <label class="bd-radio">
 *     <input class="bd-radio__input" type="radio" name="…" />
 *     <span class="bd-radio__label">…</span>   (only if `label` prop set)
 *   </label>
 *
 * RadioGroup is a thin container — it threads `name=` to every child Radio so
 * the browser's native exclusion semantics kick in. Selection state still lives
 * with the consumer (controlled component, via `checked` + `onChange` per item)
 * — RadioGroup does NOT manage selected state. This matches Checkbox's pattern
 * of "wrapper carries class, consumer carries data."
 *
 * Sizes / variants mirror Checkbox: sm | md (default) | lg, plus `error` state.
 *
 * forwardRef targets the inner `<input>` — semantically meaningful focus target.
 *
 * @license BSD-3-Clause
 */
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

export type RadioSize = "sm" | "md" | "lg";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  size?: RadioSize;
  error?: boolean;
  /** Optional text label rendered as `bd-radio__label` next to the dot. */
  label?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ size = "md", error = false, label, className, ...rest }, ref) => {
    const labelClasses = [
      "bd-radio",
      // md is base default — no `bd-radio--md` rule exists in vendored CSS
      size !== "md" && `bd-radio--${size}`,
      error && "bd-radio--error",
      className,
    ].filter(Boolean).join(" ");

    return (
      <label className={labelClasses}>
        <input
          ref={ref}
          type="radio"
          className="bd-radio__input"
          aria-invalid={error || undefined}
          {...rest}
        />
        {label !== undefined && <span className="bd-radio__label">{label}</span>}
      </label>
    );
  }
);
Radio.displayName = "Radio";

export interface RadioGroupProps {
  /** Shared `name=` attribute injected into every child Radio. Required —
   *  native exclusion semantics depend on it. */
  name: string;
  /** Layout direction. Default vertical. Horizontal for inline picker rows. */
  orientation?: "vertical" | "horizontal";
  /** Accessible label for the group (rendered as `aria-label`). */
  "aria-label"?: string;
  /** `aria-labelledby` for groups with a visible heading. */
  "aria-labelledby"?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * RadioGroup — `<div role="radiogroup">` that threads `name=` to children.
 * Walks `children` via React cloning to inject `name` only if a child is a
 * Radio element. Non-Radio children pass through untouched.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  orientation = "vertical",
  className,
  children,
  ...ariaProps
}) => {
  const classes = [
    "bd-radio-group",
    orientation === "horizontal" && "bd-radio-group--horizontal",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div role="radiogroup" className={classes} {...ariaProps}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        if (child.type !== Radio) return child;
        const radioChild = child as ReactElement<RadioProps>;
        // Only inject if consumer didn't already set name= explicitly.
        if (radioChild.props.name !== undefined) return radioChild;
        return cloneElement(radioChild, { name });
      })}
    </div>
  );
};
RadioGroup.displayName = "RadioGroup";
