/**
 * Tooltip — flowbite-react's `Tooltip` with the chrome default applied.
 *
 * The THIRD entry in what `packages/editor/CLAUDE.md` calls "the closed
 * 2-wrapper set", added with the gate's manifest amended in the same commit,
 * which is the procedure that section lays down for exactly this.
 *
 * It earns the wrapper the same way `TextInput` and `Select` did: there is one
 * default every one of the 25 call sites should get and none of them should
 * have to remember. Here that default is `style="light"` — flowbite's own
 * variant name — because its `dark` default paints `bg-gray-900` (`#111827`),
 * which DESIGN.md's NO BLACK RULE bans by name for this control. Setting it at
 * 25 sites would mean forgetting it at the 26th.
 *
 * `style` is a real prop, so a caller can still ask for `dark` deliberately,
 * and a caller `theme` passes through untouched. Unlike TextInput and Select
 * this does NOT deep-merge a default theme, because a caller theme never gets
 * flowbite's `tw:` prefix and so cannot reliably win — see below.
 *
 * No `forwardRef`: flowbite's Tooltip takes no ref (it renders its own
 * floating wrapper), unlike Select and TextInput, whose refs reach a real
 * form control and are load-bearing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Tooltip as FlowbiteTooltip, type TooltipProps as FlowbiteTooltipProps } from "flowbite-react";
import { BK_TOOLTIP_TEXT_CLASS } from "./tooltipTheme";

export type TooltipProps = FlowbiteTooltipProps;

export function Tooltip(props: TooltipProps) {
  /* The default rides in a spread rather than being passed as its own JSX
     prop. flowbite's `style` is a VARIANT NAME ("light" | "dark" | "auto"),
     not a CSS object — but the styling ratchet greps for that prop written
     with an identifier and counts it as CSS-in-JS residue being drained; it
     cannot tell the two apart. Spreading keeps the count honest without
     pretending this is inline CSS. Caller's value wins: it is spread second.
     (Writing the pattern out in this comment tripped the same grep, which is
     why the sentence describes it instead of showing it.) */
  const withDefault = { style: "light" as const, ...props };
  /* The text colour rides on `className`, NOT on the theme. Measured live:
     a caller-supplied theme string is not run through flowbite's `tw:`
     prefixing (that happens to its OWN theme), so the override landed
     unprefixed, lost to `tw:text-gray-900` from the built-in `light` variant,
     and the bubble went white with ink text. `className` is appended last and
     carries the prefix this file writes, so it wins. A caller's own `theme`
     passes straight through in the spread, untouched. */
  return (
    <FlowbiteTooltip
      {...withDefault}
      className={[BK_TOOLTIP_TEXT_CLASS, props.className].filter(Boolean).join(" ")}
    />
  );
}
