/**
 * Vibcoder ColorTrigger wrapper — swatch + readonly hex value affordance
 * that OPENS a color picker.
 * Renders the bd-color-trigger composite from
 * src/themes/components/molecules/color-trigger.css.
 *
 * Phase 2 ships ColorTrigger as a SURFACE only — the button that
 * displays the current color and reports open/closed state. The actual
 * color-picker organism lands in Phase 3 and will wire its picker to
 * `value` + `onChange` here.
 *
 * Slots (from CSS):
 *   __swatch  the color chip (background = inline style from value)
 *   __hash    optional "#" prefix glyph
 *   __hex     readonly hex value text
 *   __alpha   optional alpha % suffix
 *
 * Contract B (always-controlled state) — Phase 2 mandate:
 *   value         REQUIRED — hex/rgba string. Drives swatch background +
 *                 the rendered hex text.
 *   onChange      REQUIRED — fires when caller's wired-up picker emits
 *                 a new value. Wrapper does NOT call this directly;
 *                 Phase 3 ColorPicker organism wires it. Required at
 *                 the type level so callers can't ship a ColorTrigger
 *                 that silently drops picker output.
 *   open          OPTIONAL — controlled trigger state. When defined,
 *                 emits aria-expanded={open} + .is-open class.
 *   onOpenChange  OPTIONAL — fires onClick with the toggled open value.
 *                 Caller-owned open state. NO internal useState here.
 *
 * Contract D (trigger wiring) — implementer choice DOCUMENTED:
 *   ColorTrigger IS the trigger element (renders the <button> itself).
 *   No asChild / cloneElement / render-prop / ref-forwarding decision
 *   surfaces here — the wrapper IS the button. Phase 3 popover-trigger
 *   molecules (Popover) will need that decision; ColorTrigger is the
 *   simpler "self-rendered button" case. The Phase 3 ColorPicker
 *   organism composes ColorTrigger as its trigger child.
 *
 * Variant + size union from `vibcoder-variants.mjs molecules/color-trigger`:
 *   sizes:    sm (small swatch), lg (large swatch); md is base default
 *   variants: add (dashed "+", no fill), inline (no padding for inspector)
 *
 * Why no internal useState (per Contract B): editor chrome owns picker
 * open state in Composer + React state hooks. Uncontrolled wrappers
 * hide state from coordination (close-all-popovers-on-navigate, persist
 * which swatch is open across re-renders). Slider already proved this
 * contract works in Phase 1.
 *
 * forwardRef on the <button>.
 *
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ColorTriggerSize = "sm" | "lg";
export type ColorTriggerVariant = "add" | "inline";

export interface ColorTriggerProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "value" | "onChange"
  > {
  /** Hex/rgba color string. Drives swatch background + hex text. */
  value: string;
  /**
   * Fires when the caller's wired-up picker emits a new color value.
   * Required so a ColorTrigger can never silently drop picker output.
   * Wrapper does not call this directly — Phase 3 ColorPicker organism
   * wires it through.
   */
  onChange: (value: string) => void;
  /** Controlled open state. When defined, emits aria-expanded + .is-open. */
  open?: boolean;
  /** Fires onClick with the toggled open value when `open` is provided. */
  onOpenChange?: (open: boolean) => void;
  /** Optional alpha % suffix (e.g., "80%"). */
  alpha?: string;
  /** Show the leading "#" hash glyph. */
  showHash?: boolean;
  size?: ColorTriggerSize;
  variant?: ColorTriggerVariant;
}

export const ColorTrigger = forwardRef<HTMLButtonElement, ColorTriggerProps>(
  (
    {
      value,
      onChange: _onChange,
      open,
      onOpenChange,
      alpha,
      showHash,
      size,
      variant,
      className,
      type = "button",
      onClick,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-color-trigger",
      size && `bd-color-trigger--${size}`,
      variant && `bd-color-trigger--${variant}`,
      open && "is-open",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-expanded={open}
        onClick={(e) => {
          onClick?.(e);
          if (onOpenChange) onOpenChange(!open);
        }}
        {...rest}
      >
        <span
          className="bd-color-trigger__swatch"
          style={{ background: value }}
        />
        {showHash && (
          <span className="bd-color-trigger__hash" aria-hidden="true">
            #
          </span>
        )}
        <span className="bd-color-trigger__hex">{value}</span>
        {alpha && <span className="bd-color-trigger__alpha">{alpha}</span>}
      </button>
    );
  },
);
ColorTrigger.displayName = "ColorTrigger";
