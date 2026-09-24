/**
 * Tooltip — flowbite-react's `Tooltip` with the chrome default applied.
 *
 * The THIRD entry in what `packages/editor/CLAUDE.md` calls "the closed
 * 2-wrapper set", added with the gate's manifest amended in the same commit,
 * which is the procedure that section lays down for exactly this.
 *
 * It earns the wrapper because every one of the call sites should get the
 * board's bubble (4433:46540: ink, pad 6/10, r6, 12px white) and none should
 * have to remember it. flowbite's own default `style="dark"` is the ink;
 * the wrapper adds the board's smaller size. The owner lifted decision #25's
 * NO BLACK RULE for tooltips on 2026-09-24.
 *
 * `style` is a real prop, so a caller can still ask for `light`, and a caller
 * `theme` passes through untouched — it is not deep-merged, because a caller
 * theme never gets flowbite's `tw:` prefix and so cannot reliably win.
 *
 * No `forwardRef`: flowbite's Tooltip takes no ref (it renders its own
 * floating wrapper), unlike Select and TextInput, whose refs reach a real
 * form control and are load-bearing.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Tooltip as FlowbiteTooltip, type TooltipProps as FlowbiteTooltipProps } from "flowbite-react";
import { BK_TOOLTIP_CLASS } from "./tooltipTheme";

export type TooltipProps = FlowbiteTooltipProps;

export function Tooltip(props: TooltipProps) {
  /* `style` is flowbite's VARIANT NAME, not CSS; it rides in a spread because
     the styling ratchet counts that prop written out as CSS-in-JS residue.
     Caller's value wins: it is spread second. */
  const withDefault = { style: "dark" as const, ...props };
  /* Size and text ride on `className`, which carries the prefix this file
     writes and is appended last, so it wins over the variant's own. */
  return (
    <FlowbiteTooltip
      {...withDefault}
      className={[BK_TOOLTIP_CLASS, props.className].filter(Boolean).join(" ")}
    />
  );
}
