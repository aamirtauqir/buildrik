/**
 * Vibcoder Label wrapper.
 * Renders the `bd-label` class from src/themes/components/atoms/label.css
 * with optional `__required` marker and `__info` interactive sub-element.
 *
 * Variant union from `vibcoder-variants.mjs atoms/label`:
 *   variants: inline (default = block flow — omit modifier)
 *   sizes:    sm  (default = text-sm — omit modifier)
 *
 * Sub-elements (rendered conditionally):
 *   __required  trailing red asterisk (CSS `::before { content: "*" }`).
 *               Marked `aria-hidden="true"` because "asterisk" reads poorly
 *               for screen readers — callers should set `aria-required="true"`
 *               on the actual input control instead.
 *   __info      14px info-icon trigger button. Composes with `<Icon name="info">`.
 *               Pass `info={true}` for the bare button or `info={{...}}` for
 *               control over click handler and `aria-label`.
 *
 * Disabled state: `disabled` prop adds `data-disabled` attr (CSS uses
 * `[data-disabled]` selector). NOTE: `<label>` does NOT have a native
 * `disabled` HTML attribute — `disabled` here means "the label OF a disabled
 * control should look disabled." Callers are responsible for actually
 * disabling the underlying `<input>`.
 *
 * forwardRef targets the `<label>` (htmlFor wiring + measurement consumers).
 *
 * @license BSD-3-Clause
 */
import { type LabelHTMLAttributes, forwardRef } from "react";
import { Icon } from "./Icon";

export type LabelSize = "sm";

export interface LabelInfoProps {
  onClick?: () => void;
  "aria-label"?: string;
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  /**
   * When truthy, renders an info-icon trigger after the label content.
   * Pass `true` for a bare button or an object to customize click + aria-label.
   */
  info?: boolean | LabelInfoProps;
  size?: LabelSize;
  inline?: boolean;
  /**
   * When true, applies `data-disabled` for visual disabled state. Note: this
   * is a visual marker only — `<label>` has no native `disabled` HTML attr,
   * so callers must also disable the underlying control.
   */
  disabled?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (
    { required = false, info = false, size, inline = false, disabled = false, className, children, ...rest },
    ref,
  ) => {
    const classes = [
      "bd-label",
      size && `bd-label--${size}`,
      inline && "bd-label--inline",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    const infoProps: LabelInfoProps =
      info && typeof info === "object" ? info : {};
    return (
      <label
        ref={ref}
        className={classes}
        data-disabled={disabled || undefined}
        {...rest}
      >
        {children}
        {required && <span className="bd-label__required" aria-hidden="true" />}
        {info && (
          <button
            type="button"
            className="bd-label__info"
            onClick={infoProps.onClick}
            aria-label={infoProps["aria-label"] ?? "More info"}
          >
            <Icon name="info" />
          </button>
        )}
      </label>
    );
  },
);
Label.displayName = "Label";
