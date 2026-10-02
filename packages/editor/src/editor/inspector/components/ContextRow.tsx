/**
 * ContextRow — WHERE a write on the Style / Effects tab lands (R-DD-14):
 * a chip row — "State: Base ▾" (board 32's menu — Base, :hover, :focus,
 * :active, :disabled; a dot on states that carry overrides) and, only off
 * Desktop, the breakpoint chip "Tablet · N overrides" — then one line each
 * for "N :hover overrides · Reset" (board 27) and "Tablet · Revert"
 * (board 28). Replaced the "Applies to" row, the scope and state
 * dropdowns, the pseudo banner and the breakpoint-override strip.
 *
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Button, Menu, MenuItem, MenuLabel, Popover } from "@/editor/chrome-ui";
import type { PseudoStateId } from "@/shared/types";

const STATES: readonly { id: PseudoStateId; label: string }[] = [
  { id: "normal", label: "Base" },
  { id: "hover", label: ":hover" },
  { id: "focus", label: ":focus" },
  { id: "active", label: ":active" },
  { id: "disabled", label: ":disabled" },
];

const pseudoStateLabel = (s: PseudoStateId): string => STATES.find((x) => x.id === s)?.label ?? s;

export interface ContextRowProps {
  state: PseudoStateId;
  onStateChange: (s: PseudoStateId) => void;
  /** States that carry overrides at this breakpoint. */
  statesWithOverrides: ReadonlySet<PseudoStateId>;
  /** How many properties the picked state overrides. */
  stateOverrideCount: number;
  onResetState: () => void;
  /** "Tablet" — null on Desktop. */
  breakpointName: string | null;
  breakpointOverrideCount: number;
  onRevertBreakpoint: () => void;
}

const CHIP =
  "tw:h-6 tw:gap-1.5 tw:rounded-[4px] tw:border-0 tw:px-1.5 tw:text-[12px] tw:font-normal tw:leading-4";
/* A 24px target (WCAG 2.5.8) drawn as the board's 16px text link: the box is
   24 tall and wide, the negative margin gives the extra 8 back to the line,
   and nothing but the text paints. */
const LINK =
  "tw:h-6 tw:min-h-0 tw:min-w-6 tw:-my-1 tw:justify-center tw:border-0 tw:bg-transparent tw:p-0 tw:text-[11px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)] " +
  "tw:hover:bg-transparent tw:hover:text-[var(--bk-ink)] tw:hover:underline";
const NOTE = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap";
/* Boards 27 / 28: each line is its own note row under the chips, 8 · 16 —
   the boards' one-line note padding (board 26 draws its note the same). */
const LINE = "tw:flex tw:items-center tw:gap-1 tw:px-4 tw:py-2";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function ContextRow(p: ContextRowProps) {
  const [open, setOpen] = React.useState(false);
  const base = p.state === "normal";
  return (
    <div className="tw:flex tw:flex-col" data-testid="inspector-context-row">
      {/* 28 tall like the boards' "Style context" row: their 20px chip in 4px
          padding is a 24px target here, so the padding is 2. */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:px-3 tw:py-0.5" data-testid="inspector-context-chips">
        <Popover
          open={open}
          onClose={() => setOpen(false)}
          label="Edit styles for"
          /* Board 32: the menu opens beside the column, over the canvas. */
          beside=".layout-shell__inspector"
          trigger={
            <Button
              color="light"
              size="xs"
              data-testid="inspector-state-chip"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`${CHIP} ${base ? "tw:bg-transparent tw:text-[var(--bk-ink-soft)]" : "tw:bg-[var(--bk-accent-subtle)] tw:text-[var(--bk-accent-text)]"}`}
            >
              State: {pseudoStateLabel(p.state)}
              <ChevronDown size={12} aria-hidden="true" />
            </Button>
          }
        >
          <Menu label="Edit styles for" className="tw:min-w-[140px]">
            <MenuLabel className="tw:!normal-case tw:!tracking-normal">Edit styles for</MenuLabel>
            {STATES.map((s) => (
              <MenuItem
                key={s.id}
                radio
                selected={s.id === p.state}
                data-testid={`inspector-state-opt-${s.id === "normal" ? "base" : s.id}`}
                onClick={() => {
                  setOpen(false);
                  p.onStateChange(s.id);
                }}
              >
                {s.label}
                {p.statesWithOverrides.has(s.id) ? (
                  <span
                    aria-label="has overrides"
                    className="tw:ml-2 tw:inline-block tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-accent)]"
                  />
                ) : null}
              </MenuItem>
            ))}
          </Menu>
        </Popover>
        {p.breakpointName ? (
          <span
            className={`${CHIP} tw:inline-flex tw:items-center tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]`}
            data-testid="inspector-bp-chip"
          >
            {p.breakpointName}
            {p.breakpointOverrideCount > 0 ? ` · ${plural(p.breakpointOverrideCount, "override")}` : ""}
          </span>
        ) : null}
      </div>
      {!base && p.stateOverrideCount > 0 ? (
        <div className={LINE} data-testid="inspector-state-overrides">
          <span className={NOTE}>{plural(p.stateOverrideCount, `${pseudoStateLabel(p.state)} override`)} ·</span>{" "}
          <Button color="light" size="xs" className={LINK} data-testid="inspector-state-reset" onClick={p.onResetState}>
            Reset
          </Button>
        </div>
      ) : null}
      {p.breakpointName && p.breakpointOverrideCount > 0 ? (
        <div className={LINE} data-testid="inspector-bp-line">
          <span className={NOTE}>{p.breakpointName} ·</span>{" "}
          <Button color="light" size="xs" className={LINK} data-testid="inspector-bp-revert" onClick={p.onRevertBreakpoint}>
            Revert
          </Button>
        </div>
      ) : null}
    </div>
  );
}
