/**
 * Vibcoder ColorPicker — anchored hex color picker.
 *
 * Engine: react-colorful (HexColorPicker — saturation+hue) inside
 * @radix-ui/react-popover (positioning, click-outside, Esc, portal).
 *
 * Skin: bd-color-picker CSS classes from src/themes/components/organisms/color-picker.css.
 *
 * Sibling exports (Contract C):
 *   ColorPicker        — root with open + onOpenChange + value + onChange
 *   ColorPickerSwatch  — visual swatch trigger (asChild per E1)
 *   ColorPickerInput   — text input for direct hex entry, syncs with picker
 *
 * Variants discovered via vibcoder-variants.mjs organisms/color-picker:
 *   bd-color-picker:        variants = wide  (sizes the panel to 280px)
 *   bd-color-picker__strip: variants = alpha, hue (visual strips, not used by
 *                                        the react-colorful engine — see below)
 *
 * CSS↔Engine alignment note (Phase 3 finding for M5):
 *   The vendored color-picker.css designs a bespoke visual structure
 *   (.bd-color-picker__sat saturation canvas, __strip hue/alpha strips,
 *   __swatch+hex row, __recents). react-colorful renders its own DOM
 *   (.react-colorful with its own pointer/saturation widgets) which does NOT
 *   map 1:1 to those subclasses. The wrapper applies .bd-color-picker on the
 *   Popover content (panel chrome + 240/280px width) and renders react-colorful
 *   inside; the bespoke __sat/__strip/__swatch-row visuals are not produced by
 *   the engine. Acceptable for Phase 3 — the picker is functional. M5 may
 *   ship a hand-built picker matching the full source CSS if chrome consumers
 *   need the bespoke visuals.
 *
 * E4: react-colorful types (Color, etc.) NOT re-exported. Public API is
 *   vibcoder-shaped: `value: string` (hex), `onChange: (hex: string) => void`.
 * E1: ColorPickerSwatch accepts asChild + forwards to Radix.Popover.Trigger.
 * E3: portals through OverlayMount via container prop on Radix.Popover.Portal.
 * B: always-controlled (open + onOpenChange + value + onChange required, no defaults).
 *
 * @license BSD-3-Clause
 */
import * as RadixPopover from "@radix-ui/react-popover";
import { HexColorPicker } from "react-colorful";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useOverlayContainer } from "./OverlayMount";

export type ColorPickerSize = "default" | "wide";

export interface ColorPickerProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  value: string;
  onChange: (hex: string) => void;
  /** Optional size — `wide` widens panel (per source CSS). Default omitted. */
  size?: ColorPickerSize;
  children: ReactNode;
}

export interface ColorPickerSwatchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  asChild?: boolean;
  value: string;
  children?: ReactNode;
}

export interface ColorPickerInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({
  open,
  onOpenChange,
  value,
  onChange,
  size,
  children,
}: ColorPickerProps) {
  const container = useOverlayContainer();
  const classes = [
    "bd-color-picker",
    size === "wide" && "bd-color-picker--wide",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      {children}
      <RadixPopover.Portal container={container ?? undefined}>
        <RadixPopover.Content className={classes} sideOffset={8}>
          <HexColorPicker color={value} onChange={onChange} />
          <div className="bd-color-picker__swatch-row">
            <span
              className="bd-color-picker__swatch"
              style={{ background: value }}
            />
            <ColorPickerInput value={value} onChange={onChange} />
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
ColorPicker.displayName = "ColorPicker";

export const ColorPickerSwatch = forwardRef<
  HTMLButtonElement,
  ColorPickerSwatchProps
>(({ asChild, value, children, className, style, ...rest }, ref) => {
  if (asChild) {
    return (
      <RadixPopover.Trigger asChild ref={ref}>
        {children}
      </RadixPopover.Trigger>
    );
  }
  const classes = ["bd-color-picker__swatch", className].filter(Boolean).join(" ");
  const swatchStyle: CSSProperties = { ...style, background: value };
  return (
    <RadixPopover.Trigger
      ref={ref}
      type="button"
      className={classes}
      style={swatchStyle}
      aria-label={`Current color ${value}`}
      {...rest}
    >
      {children}
    </RadixPopover.Trigger>
  );
});
ColorPickerSwatch.displayName = "ColorPickerSwatch";

export const ColorPickerInput = forwardRef<
  HTMLInputElement,
  ColorPickerInputProps
>(({ value, onChange, className, ...rest }, ref) => {
  const classes = ["bd-color-picker__hex-value", className]
    .filter(Boolean)
    .join(" ");
  return (
    <input
      ref={ref}
      type="text"
      className={classes}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      {...rest}
    />
  );
});
ColorPickerInput.displayName = "ColorPickerInput";
