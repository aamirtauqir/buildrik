/**
 * ApplyStyleReview — ⋯ "Apply style to all {H3 headings} on this page (N)"
 * reviewed as the tab's whole body (2L9 255:87335 S11, S12 result):
 *
 *   Apply style to headings
 *   On Home · Desktop · Default state
 *   3 eligible headings · 1 locked heading skipped
 *   ☑ Typography  ☐ Spacing  ☐ Fill  ☐ Border
 *   Typography overrides on the 3 eligible headings will be replaced.
 *   Other categories and breakpoints stay unchanged.
 *   [ Apply Typography to 3 ]   [ Cancel ]
 *
 * The counts are `findStylePeers` (eligible, locked, inside a component);
 * the categories the source sets at this breakpoint + state are the ones
 * offered (`sourceStyleCategories`), Typography first when it has any.
 * Apply copies exactly the chosen categories through `applyStyleToPeers`
 * (one transaction), then "Applied to N … · Undo", and the tab shows the
 * result under the first applied category's section (S12) — what changed
 * and what was left alone — until history moves past that step.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, Checkbox, Label, useToast } from "@/editor/chrome-ui";
import { applyStyleToPeers, findStylePeers, sourceStyleCategories, type StyleCategory } from "@/engine/commands/stylePeers";
import { peerKindLabel } from "@/editor/shared/elementActions";
import { BREAKPOINTS } from "@/shared/constants/breakpoints";
import { EVENTS } from "@/shared/constants/events";
import type { BreakpointId } from "@/shared/types/breakpoints";
import type { PseudoStateId } from "@/shared/types";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";

export interface ApplyStyleReviewProps {
  composer: Composer;
  elementId: string;
  breakpoint: BreakpointId;
  pseudo: PseudoStateId;
  onClose: () => void;
}

const CATEGORIES: ReadonlyArray<{ id: StyleCategory; label: string }> = [
  { id: "typography", label: "Typography" },
  { id: "spacing", label: "Spacing" },
  { id: "fill", label: "Fill" },
  { id: "border", label: "Border" },
];

/** "H3 headings" → "H3 heading" for one. */
const nounFor = (plural: string, n: number) => (n === 1 ? plural.replace(/s$/, "") : plural);
/** "Typography", "Typography and Spacing", "Typography, Spacing and Fill". */
const andList = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

const NOTE = "tw:m-0 tw:py-1.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** Section each category's rows live in — where S12's result sits. */
const CATEGORY_SECTION: Record<StyleCategory, string> = { typography: "typography", spacing: "spacing", fill: "fill", border: "border" };

/** The last Apply style, while it is still the newest history step. */
interface ApplyResult {
  elementId: string;
  breakpoint: BreakpointId;
  pseudo: PseudoStateId;
  undoCount: number;
  sectionIds: readonly string[];
  title: string;
  body: string;
}

let result: ApplyResult | null = null;
const HISTORY_MOVES = [EVENTS.HISTORY_RECORDED, EVENTS.HISTORY_UNDO, EVENTS.HISTORY_REDO, EVENTS.HISTORY_CLEARED] as const;
const listeners = new Set<() => void>();
const setResult = (next: ApplyResult | null) => {
  result = next;
  listeners.forEach((l) => l());
};

/** The result to show for this element here, or null — another element,
 *  breakpoint or state, or any newer history step (an Undo, a new edit),
 *  ends it. */
export function useApplyStyleResult(
  composer: Composer | null | undefined,
  elementId: string,
  breakpoint: BreakpointId,
  pseudo: PseudoStateId,
): ApplyResult | null {
  const subscribe = React.useCallback(
    (l: () => void) => {
      listeners.add(l);
      for (const ev of HISTORY_MOVES) composer?.on(ev, l);
      return () => {
        listeners.delete(l);
        for (const ev of HISTORY_MOVES) composer?.off(ev, l);
      };
    },
    [composer],
  );
  return React.useSyncExternalStore(subscribe, () =>
    result && composer && result.elementId === elementId && result.breakpoint === breakpoint && result.pseudo === pseudo && composer.history.getUndoCount() === result.undoCount
      ? result
      : null,
  );
}

/** S12: "Applied to 3 headings" and what that left alone. */
export function ApplyStyleResultNote({ result: r }: { result: ApplyResult }) {
  return (
    <div className="tw:px-3 tw:pb-3 tw:pt-4" role="status" data-testid="inspector-apply-style-result">
      <p className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">{r.title}</p>
      <p className={NOTE}>{r.body}</p>
    </div>
  );
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ApplyStyleReview({ composer, elementId, breakpoint, pseudo, onClose }: ApplyStyleReviewProps) {
  const { addToast } = useToast();
  const source = composer.elements.getElement(elementId);
  const offered = React.useMemo(
    () => (source ? sourceStyleCategories(composer, source, { breakpoint, pseudo }) : []),
    [composer, source, breakpoint, pseudo],
  );
  const [chosen, setChosen] = React.useState<StyleCategory[]>(() =>
    offered.includes("typography") ? ["typography"] : offered.slice(0, 1),
  );
  if (!source) return null;

  const { peers, skippedLocked, skippedInInstance } = findStylePeers(composer, source);
  const kind = peerKindLabel(source);
  /* "headings" — the kind without its level, lower case, for the title and the skipped count. */
  const noun = kind.replace(/^H[1-6] /, "").toLowerCase();
  const page = composer.elements.getActivePage()?.name ?? "this page";
  const where = `${BREAKPOINTS[breakpoint]?.name ?? breakpoint} · ${pseudo === "normal" ? "Default" : pseudo.charAt(0).toUpperCase() + pseudo.slice(1)} state`;
  const counts = [
    `${peers.length} eligible ${nounFor(noun, peers.length)}`,
    skippedLocked > 0 ? `${skippedLocked} locked ${nounFor(noun, skippedLocked)} skipped` : null,
    skippedInInstance > 0 ? `${skippedInInstance} inside a component skipped` : null,
  ].filter(Boolean);
  const names = CATEGORIES.filter((c) => chosen.includes(c.id)).map((c) => c.label);

  const apply = () => {
    const n = applyStyleToPeers(composer, source, peers, { breakpoint, pseudo, categories: chosen });
    onClose();
    if (n === 0) return;
    const undo = composer.history.captureUndo();
    /* 2L9 S12: "Only Desktop typography changed. The locked heading and
       every Tablet and Mobile value stayed unchanged." — from this apply's
       own breakpoint, state, categories and skipped counts. */
    const bpName = BREAKPOINTS[breakpoint]?.name ?? breakpoint;
    const others = (Object.keys(BREAKPOINTS) as BreakpointId[]).filter((b) => b !== breakpoint).map((b) => BREAKPOINTS[b].name);
    const left = [
      skippedLocked === 1 ? `the locked ${nounFor(noun, 1)}` : skippedLocked > 1 ? `the ${skippedLocked} locked ${noun}` : null,
      skippedInInstance > 0 ? `the ${skippedInInstance} inside a component` : null,
      others.length ? `every ${andList(others)} value` : null,
    ].filter((x): x is string => !!x);
    const state = pseudo === "normal" ? "" : ` ${pseudo}`;
    setResult({
      elementId: source.getId(),
      breakpoint,
      pseudo,
      undoCount: composer.history.getUndoCount(),
      sectionIds: CATEGORIES.filter((c) => chosen.includes(c.id)).map((c) => CATEGORY_SECTION[c.id]),
      title: `Applied to ${n} ${nounFor(noun, n)}`,
      body: `Only ${bpName}${state} ${andList(names).toLowerCase()} changed.${left.length ? ` ${capitalise(andList(left))} stayed unchanged.` : ""}`,
    });
    addToast({
      description: `Applied to ${n} ${nounFor(noun, n)}.`,
      action: { label: "Undo", onClick: undo },
    });
  };

  return (
    <div className="tw:flex tw:flex-col tw:px-3 tw:pb-3" role="group" aria-label={`Apply style to ${noun}`} data-testid="inspector-apply-style-review">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Apply style to {noun}</div>
      <p className={NOTE}>
        On {page} · {where}
      </p>
      <p className={NOTE} data-testid="inspector-apply-style-counts">
        {counts.join(" · ")}
      </p>
      <div className="tw:flex tw:flex-col" role="group" aria-label="Categories">
        {CATEGORIES.map((c) => {
          const id = `apply-style-${c.id}`;
          const has = offered.includes(c.id);
          return (
            <div key={c.id} className="tw:flex tw:h-10 tw:items-center tw:gap-2 tw:px-2">
              <Checkbox
                id={id}
                color="blue"
                disabled={!has}
                checked={chosen.includes(c.id)}
                onChange={(e) => setChosen((xs) => (e.target.checked ? [...xs, c.id] : xs.filter((x) => x !== c.id)))}
              />
              <Label htmlFor={id} className="tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)]">
                {c.label}
              </Label>
            </div>
          );
        })}
      </div>
      <p className={NOTE}>
        {names.length
          ? `${andList(names)} overrides on the ${peers.length} eligible ${nounFor(noun, peers.length)} will be replaced. Other categories and breakpoints stay unchanged.`
          : /* 2L9 S19 (255:91321): nothing chosen writes nothing, and no history. */
            "Select at least one category. No properties are selected and nothing will change."}
      </p>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:pt-1">
        <Button
          variant="primary"
          size="xs"
          className={`${WIDE_BUTTON} tw:text-white!`}
          disabled={names.length === 0 || peers.length === 0}
          onClick={apply}
          data-testid="inspector-apply-style-apply"
        >
          {names.length ? `Apply ${andList(names)} to ${peers.length}` : "Apply style"}
        </Button>
        {names.length === 0 && offered.length > 0 ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setChosen([offered[0]])} data-testid="inspector-apply-style-select-first">
            Select {CATEGORIES.find((c) => c.id === offered[0])?.label ?? offered[0]}
          </Button>
        ) : null}
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onClose} data-testid="inspector-apply-style-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}
