/**
 * ContextRow — what a write on the Style / Effects tab is overriding: one
 * line each for "N :hover overrides · Reset" (board 27) and
 * "Tablet · N overrides · Revert" (board 28). WHERE the write lands — the
 * breakpoint and the state picker — is the InspectorHeader's "Editing" row
 * (2L9 Task 1.4); this row draws nothing when there is nothing to reset.
 *
 * Reset / Revert open a review first (2L9 S13, S15): the layer's exact
 * properties and values, what removing them reveals ("reveals each
 * property’s Default-state value" / "reveals Desktop: padding 24 px, …"),
 * then "Remove {Hover} overrides" or "Keep overrides". One Undo restores.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { PseudoStateId } from "@/shared/types";
import type { OverrideEntry } from "../shared/controls/InspectorFieldContext";

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
  /** The layer's properties, for the review before removal. */
  entries?: (kind: "breakpoint" | "pseudo") => OverrideEntry[];
}

/** "Hover", "Focus" — the state as the review names it. */
const stateName = (s: PseudoStateId) => s.charAt(0).toUpperCase() + s.slice(1);
/** `border-radius` → `Border radius`. */
const propName = (p: string) => {
  const words = p.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};
const showValue = (v: string) => v.replace(/^(-?[\d.]+)(px|%|rem|em)$/, "$1 $2");

const ACTION =
  "tw:h-7 tw:border-0 tw:px-2 tw:text-[12px] tw:font-medium tw:focus:ring-0";

function Review({
  title,
  entries,
  consequence,
  removeLabel,
  onRemove,
  onKeep,
}: {
  title: string;
  entries: OverrideEntry[];
  consequence: string;
  removeLabel: string;
  onRemove: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:py-2" role="group" aria-label={title} data-testid="inspector-override-review">
      <div className="tw:flex tw:items-center tw:justify-between tw:text-[12px] tw:font-semibold tw:text-[var(--bk-ink)]">
        <span>{title}</span>
        <span className="tw:font-normal tw:text-[var(--bk-ink-muted)]">{entries.length} set</span>
      </div>
      {entries.map((e) => (
        <div key={e.property} className="tw:flex tw:items-center tw:justify-between tw:text-[12px] tw:leading-5" data-testid="inspector-override-entry">
          <span className="tw:text-[var(--bk-ink-soft)]">{propName(e.property)}</span>
          <span className="tw:text-[var(--bk-ink)]">{showValue(e.value)}</span>
        </div>
      ))}
      <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-override-consequence">
        {consequence}
      </p>
      <div className="tw:flex tw:gap-2 tw:pt-1">
        <Button color="red" size="xs" className={ACTION} onClick={onRemove} data-testid="inspector-override-remove">
          {removeLabel}
        </Button>
        <Button color="light" size="xs" className={ACTION} onClick={onKeep} data-testid="inspector-override-keep">
          Keep overrides
        </Button>
      </div>
    </div>
  );
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
  const [reviewing, setReviewing] = React.useState<"pseudo" | "breakpoint" | null>(null);
  const showState = p.state !== "normal" && p.stateOverrideCount > 0;
  const showBreakpoint = Boolean(p.breakpointName) && p.breakpointOverrideCount > 0;
  /* The layer emptied or changed under the review: close it. */
  React.useEffect(() => {
    if ((reviewing === "pseudo" && !showState) || (reviewing === "breakpoint" && !showBreakpoint)) setReviewing(null);
  }, [reviewing, showState, showBreakpoint]);
  if (!showState && !showBreakpoint) return null;

  if (reviewing && p.entries) {
    const entries = p.entries(reviewing);
    if (reviewing === "pseudo") {
      const name = stateName(p.state);
      return (
        <Review
          title={`${name} overrides`}
          entries={entries}
          consequence={`Removing ${entries.length === 1 ? "this" : "these"} ${entries.length} ${name} propert${entries.length === 1 ? "y" : "ies"} reveals each property’s Default-state value. Other states stay unchanged.`}
          removeLabel={`Remove ${name} overrides`}
          onRemove={() => {
            setReviewing(null);
            p.onResetState();
          }}
          onKeep={() => setReviewing(null)}
        />
      );
    }
    const reveals = entries
      .filter((e) => e.fallback)
      .map((e) => `${propName(e.property).toLowerCase()} ${showValue(e.fallback)}`)
      .join(", ");
    return (
      <Review
        title={`${p.breakpointName} overrides`}
        entries={entries}
        consequence={`Removing ${p.breakpointName} overrides reveals Desktop${reveals ? `: ${reveals}` : ""}. Other breakpoints and states are retained.`}
        removeLabel={`Remove ${p.breakpointName} overrides`}
        onRemove={() => {
          setReviewing(null);
          p.onRevertBreakpoint();
        }}
        onKeep={() => setReviewing(null)}
      />
    );
  }
  const askState = () => (p.entries ? setReviewing("pseudo") : p.onResetState());
  const askBreakpoint = () => (p.entries ? setReviewing("breakpoint") : p.onRevertBreakpoint());
  return (
    <div className="tw:flex tw:flex-col" data-testid="inspector-context-row">
      {showState ? (
        <div className={LINE} data-testid="inspector-state-overrides">
          <span className={NOTE}>{plural(p.stateOverrideCount, `${pseudoStateLabel(p.state)} override`)} ·</span>{" "}
          <Button color="light" size="xs" className={LINK} data-testid="inspector-state-reset" onClick={askState}>
            Reset
          </Button>
        </div>
      ) : null}
      {showBreakpoint ? (
        <div className={LINE} data-testid="inspector-bp-line">
          <span className={NOTE}>
            {p.breakpointName} · {plural(p.breakpointOverrideCount, "override")} ·
          </span>{" "}
          <Button color="light" size="xs" className={LINK} data-testid="inspector-bp-revert" onClick={askBreakpoint}>
            Revert
          </Button>
        </div>
      ) : null}
    </div>
  );
}
