/**
 * OverrideDot — the 6px accent dot beside a field or section header that is
 * overridden here (R-DD-14, boards 26–28). A real control, not decoration: a
 * 24px target announced as "Overridden on Tablet" (§16), opening a menu whose
 * one row puts the value back ("Reset to Desktop").
 *
 * W1 draws the breakpoint kind; lane L2-D2 adds :state and master.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuItem, Popover } from "@/editor/chrome-ui";
import type { OverrideKind } from "./InspectorFieldContext";

export interface OverrideDotProps {
  kind: OverrideKind;
  /** "Tablet", ":hover", the component's name. */
  label: string;
  /** Drop the override. Absent = the dot only announces. */
  onReset?: () => void;
}

const SAYS: Record<OverrideKind, (l: string) => string> = {
  breakpoint: (l) => `Overridden on ${l}`,
  pseudo: (l) => `Overridden on ${l}`,
  master: () => "Overrides master",
};

const RESET: Record<OverrideKind, string> = {
  breakpoint: "Reset to Desktop",
  pseudo: "Reset to Base",
  master: "Reset to master",
};

export function OverrideDot({ kind, label, onReset }: OverrideDotProps) {
  const [open, setOpen] = React.useState(false);
  const says = SAYS[kind](label);
  const dot = (
    <IconButton
      label={says}
      size="sm"
      data-testid={`inspector-override-dot-${kind}`}
      aria-haspopup={onReset ? "menu" : undefined}
      aria-expanded={onReset ? open : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (onReset) setOpen((v) => !v);
      }}
      className="tw:size-6 tw:shrink-0"
    >
      <span aria-hidden="true" className="tw:block tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-accent)]" />
    </IconButton>
  );
  if (!onReset) return dot;
  return (
    <Popover open={open} onClose={() => setOpen(false)} trigger={dot} placement="bottom" label={says}>
      <Menu label={says}>
        <MenuItem
          onClick={() => {
            setOpen(false);
            onReset();
          }}
        >
          {RESET[kind]}
        </MenuItem>
      </Menu>
    </Popover>
  );
}
