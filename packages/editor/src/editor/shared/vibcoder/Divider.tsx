/**
 * Vibcoder Divider wrapper.
 * Renders the `bd-divider` rule from src/themes/components/atoms/divider.css,
 * with optional `bd-divider-label` composite when a label is provided.
 *
 * Variant union from `vibcoder-variants.mjs atoms/divider`:
 *   the script bucketed every modifier under "variants", but semantically:
 *     orientation: vertical (default = horizontal — omit modifier)
 *     style:       dashed, dotted (default = solid — omit modifier)
 *     tone:        strong (default = default — omit modifier)
 *     inset:       boolean
 *
 * Composite shape:
 *   - Bare divider renders `<hr role="separator">` — semantic HTML, no
 *     children allowed.
 *   - When `label` is set, renders `<div class="bd-divider-label" role="separator">`
 *     because `<hr>` cannot have children. The CSS draws the surrounding
 *     hairline rules via ::before / ::after pseudo-elements on the div.
 *
 * The `bd-divider-label` class is a STANDALONE composite rule in vendored CSS
 * (NOT nested under `.bd-divider`), so the labelled form does NOT also emit
 * `bd-divider`. Variant modifiers (orientation/style/tone/inset) only apply
 * to the bare form — the labelled composite owns its own style.
 *
 * A11y: bare divider is `<hr role="separator" aria-orientation="…">`.
 * Labelled composite is `<div role="separator" aria-orientation="…" aria-label={label}>`.
 *
 * forwardRef targets the rendered element (HTMLElement supersets both <hr> and <div>).
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerStyle = "solid" | "dashed" | "dotted";
export type DividerTone = "default" | "strong";

export interface DividerProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  orientation?: DividerOrientation;
  /** Visual style of the rule. Default = solid (no modifier). */
  dividerStyle?: DividerStyle;
  /** Tone for line color. Default = border, "strong" = border-medium. */
  tone?: DividerTone;
  /** When true, applies `bd-divider--inset` (margin-inset hairline). */
  inset?: boolean;
  /**
   * Optional centered label (renders as composite with surrounding rules).
   * When set, renders `<div class="bd-divider-label">` instead of `<hr>`.
   */
  label?: string;
}

export const Divider = forwardRef<HTMLElement, DividerProps>(
  (
    {
      orientation = "horizontal",
      dividerStyle = "solid",
      tone = "default",
      inset = false,
      label,
      className,
      ...rest
    },
    ref,
  ) => {
    const ariaOrientation = orientation;
    if (label !== undefined) {
      // Labelled composite: standalone class, owns its own visual rules.
      // Variant modifiers do NOT apply to the labelled form (vendored CSS
      // does not chain `.bd-divider-label` with the rule modifiers).
      const classes = ["bd-divider-label", className].filter(Boolean).join(" ");
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role="separator"
          aria-orientation={ariaOrientation}
          aria-label={label}
          className={classes}
          {...rest}
        >
          {label}
        </div>
      );
    }
    const classes = [
      "bd-divider",
      // horizontal is base default — no `bd-divider--horizontal` rule exists
      orientation !== "horizontal" && `bd-divider--${orientation}`,
      // solid is base default — no `bd-divider--solid` rule exists
      dividerStyle !== "solid" && `bd-divider--${dividerStyle}`,
      // default tone is base default — no `bd-divider--default` rule exists
      tone !== "default" && `bd-divider--${tone}`,
      inset && "bd-divider--inset",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <hr
        ref={ref as React.Ref<HTMLHRElement>}
        role="separator"
        aria-orientation={ariaOrientation}
        className={classes}
        {...rest}
      />
    );
  },
);
Divider.displayName = "Divider";
