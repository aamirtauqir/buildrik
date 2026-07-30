/**
 * Tooltip — Figma 14:43.
 *
 * Hover AND focus open it, Escape closes it: a tooltip only reachable by mouse
 * is invisible to keyboard users. The trigger keeps aria-describedby so the
 * text is announced rather than merely drawn.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export type TooltipPlacement = "bottom" | "bottom-end" | "top";

export interface TooltipProps {
  label: string;
  children: React.ReactElement;
  id?: string;
  /** Where the tip anchors relative to the trigger. `bottom-end` for controls at the right viewport edge. */
  placement?: TooltipPlacement;
}

export function Tooltip({ label, children, id, placement = "bottom" }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const generated = React.useId();
  const tipId = id ?? generated;

  const trigger = React.cloneElement(children, {
    "aria-describedby": open ? tipId : undefined,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    },
  } as Partial<React.HTMLAttributes<HTMLElement>>);

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      {trigger}
      {open ? (
        <span role="tooltip" id={tipId} className={`bk-tooltip bk-tooltip--${placement}`}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
