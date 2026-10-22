/**
 * ContextRow — what a write on the Style / Effects tab is overriding: one
 * line each for "N :hover overrides · Reset" (board 27) and
 * "Tablet · N overrides · Revert" (board 28). WHERE the write lands — the
 * breakpoint and the state picker — is the InspectorHeader's "Editing" row
 * (2L9 Task 1.4); this row draws nothing when there is nothing to reset.
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/chrome-ui";
import type { PseudoStateId } from "@/shared/types";

const pseudoStateLabel = (s: PseudoStateId): string => (s === "normal" ? "Base" : `:${s}`);

export interface ContextRowProps {
  state: PseudoStateId;
  /** How many properties the picked state overrides. */
  stateOverrideCount: number;
  onResetState: () => void;
  /** "Tablet" — null on Desktop. */
  breakpointName: string | null;
  breakpointOverrideCount: number;
  onRevertBreakpoint: () => void;
}

/* A 24px target (WCAG 2.5.8) drawn as the board's 16px text link: the box is
   24 tall and wide, the negative margin gives the extra 8 back to the line,
   and nothing but the text paints. */
const LINK =
  "tw:h-6 tw:min-h-0 tw:min-w-6 tw:-my-1 tw:justify-center tw:border-0 tw:bg-transparent tw:p-0 tw:text-[11px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)] " +
  "tw:hover:bg-transparent tw:hover:text-[var(--bk-ink)] tw:hover:underline";
const NOTE = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:whitespace-nowrap";
/* Boards 27 / 28: each line is its own note row, 8 · 16 —
   the boards' one-line note padding (board 26 draws its note the same). */
const LINE = "tw:flex tw:items-center tw:gap-1 tw:px-4 tw:py-2";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function ContextRow(p: ContextRowProps) {
  const showState = p.state !== "normal" && p.stateOverrideCount > 0;
  const showBreakpoint = Boolean(p.breakpointName) && p.breakpointOverrideCount > 0;
  if (!showState && !showBreakpoint) return null;
  return (
    <div className="tw:flex tw:flex-col" data-testid="inspector-context-row">
      {showState ? (
        <div className={LINE} data-testid="inspector-state-overrides">
          <span className={NOTE}>{plural(p.stateOverrideCount, `${pseudoStateLabel(p.state)} override`)} ·</span>{" "}
          <Button color="light" size="xs" className={LINK} data-testid="inspector-state-reset" onClick={p.onResetState}>
            Reset
          </Button>
        </div>
      ) : null}
      {showBreakpoint ? (
        <div className={LINE} data-testid="inspector-bp-line">
          <span className={NOTE}>
            {p.breakpointName} · {plural(p.breakpointOverrideCount, "override")} ·
          </span>{" "}
          <Button color="light" size="xs" className={LINK} data-testid="inspector-bp-revert" onClick={p.onRevertBreakpoint}>
            Revert
          </Button>
        </div>
      ) : null}
    </div>
  );
}
