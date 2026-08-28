/**
 * Button — the single pre-themed flowbite-react `Button` wrapper, third
 * member of the closed wrapper set (grown deliberately 2026-08-28, design-
 * debt arc; the gate's manifest edit in the same commit is the checkpoint).
 *
 * What it adds and nothing more:
 *   · `variant` — the five-role vocabulary two independent audits found
 *     missing: primary (flowbite default — ALREADY the brand accent via the
 *     Flowbite primary scale), secondary (light), ghost, link, danger (red).
 *     The ghost-link 6-class incantation was copy-pasted across 22 files;
 *     `variant="link"` is that recipe, once, in buttonTheme.ts.
 *   · BK_BUTTON_THEME merged under any caller theme (caller key wins).
 *
 * Existing `color=` call sites (~850) pass through untouched — variant only
 * maps when given, so this wrapper changes zero shipped pixels on its own.
 *
 * `forwardRef` reaches the real `<button>`, same contract as TextInput.
 */
import * as React from "react";
import { Button as FlowbiteButton, type ButtonProps as FlowbiteButtonProps } from "flowbite-react";
import { BK_BUTTON_THEME } from "./buttonTheme";
import { mergeTheme } from "./mergeTheme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "danger";

export type ButtonProps = FlowbiteButtonProps & {
  /** Role vocabulary; omitted = the caller's `color` (or flowbite default). */
  variant?: ButtonVariant;
};

const VARIANT_COLOR: Record<ButtonVariant, string | undefined> = {
  primary: undefined, // flowbite default IS the brand primary
  secondary: "light",
  ghost: "ghost",
  link: "link",
  danger: "red",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, color, theme, ...props },
  ref,
) {
  const resolvedColor = variant ? VARIANT_COLOR[variant] : color;
  return (
    <FlowbiteButton
      ref={ref}
      {...(resolvedColor !== undefined ? { color: resolvedColor } : {})}
      theme={mergeTheme(BK_BUTTON_THEME, theme)}
      {...props}
    />
  );
});
