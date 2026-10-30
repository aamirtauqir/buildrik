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
 * (one transaction), then "Applied to N … · Undo".
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, Checkbox, Label, useToast } from "@/editor/chrome-ui";
import { applyStyleToPeers, findStylePeers, sourceStyleCategories, type StyleCategory } from "@/engine/commands/stylePeers";
import { peerKindLabel } from "@/editor/shared/elementActions";
import { BREAKPOINTS } from "@/shared/constants/breakpoints";
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
    if (n > 0) {
      addToast({
        /* 2L9 S12: "Applied to 3 headings." */
        description: `Applied to ${n} ${nounFor(noun, n)}.`,
        action: { label: "Undo", onClick: composer.history.captureUndo() },
      });
    }
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
          : "Choose what to apply."}
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
          Apply {andList(names) || "style"} to {peers.length}
        </Button>
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onClose} data-testid="inspector-apply-style-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}
