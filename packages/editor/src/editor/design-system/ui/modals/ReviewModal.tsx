/**
 * ReviewModal — shows diff of all pending token changes before applying.
 *
 * Was a hand-rolled `position:absolute; inset:0` scrim with a panel inside it,
 * and `cancelRef.current?.focus()` standing in for a focus trap. That gave it
 * no ESC, no focus containment, no `aria-modal`, and a scrim that covered only
 * the Design tab rather than the decision it was blocking. ModalRoot owns all
 * four.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "../../types";
import { Button, ModalContent, ModalRoot, ModalTitle } from "@/editor/chrome-ui";

export interface ReviewModalProps {
  colorTokens: DesignToken[];
  colorDiff: Record<string, { tokenId: string; previousValue: string; currentValue: string }>;
  typeTokens: DesignToken[];
  typeSavedTokens: DesignToken[];
  spacingTokens: DesignToken[];
  spacingSavedTokens: DesignToken[];
  onConfirm: () => void;
  onClose: () => void;
  /** Board 1172:4840's third door — throw the staged edits away. */
  onDiscardAll?: () => void;
  /** How many places on the site are bound to the tokens being changed. */
  usageCount?: number;
}

/* Four `rgba(255,255,255,0.0x)` values in here were dark-theme leftovers —
   white at 3-10% on a white panel is nothing, so the diff rows had no plate and
   the swatches had no outline. Real tokens now. */
/* 1172:4842 and its two siblings: `--color/bg-subtle`, a 10px gap, 10/6
   inset, radius 6. It sat on `--bk-gray-50`, one step lighter than the board,
   which on a white dialog left the rows with almost no plate at all. */
const DIFF_ROW = "tw:flex tw:items-center tw:gap-2.5 tw:px-2.5 tw:py-1.5 tw:bg-[var(--bk-bg-subtle)] tw:rounded-md tw:mb-1";
const SECTION_HEAD =
  "tw:text-xs tw:font-bold tw:text-[var(--bk-ink-muted)] tw:mb-2 tw:uppercase tw:tracking-[0.07em]";
const SECTION = "tw:mb-3.5";
/* 11/16 — 1172:4843. `text-xs` is 12 with a 16 line only by accident. */
const NAME = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)] tw:flex-1";
/* `--bk-ink-soft`, NOT the board's `--color/ink-muted` (1172:4845 and its two
   siblings). The board fills the diff row `--color/bg-subtle` and then writes
   the old value on it in ink-muted — that pair MEASURES 4.39:1, under the 4.5
   AA floor, and adopting the fill without adopting the text colour is the only
   way to have the row the board draws and a legible value inside it. Nine rows
   x two nodes = 18 failures the moment the fill landed; measure.mjs caught all
   eighteen. Same substitution DesignTabFooter and the Beginner note document
   for this exact pair. */
const WAS = "tw:text-[11px] tw:leading-4 tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink-soft)] tw:line-through";
const NOW = "tw:text-[11px] tw:leading-4 tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-success-text)]";
const SWATCH = "tw:size-5 tw:rounded tw:border tw:border-[var(--bk-gray-200)] tw:flex-none";

/** Typography and Spacing rendered byte-identical blocks. One component. */
function ValueDiffSection({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; was: string; now: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className={SECTION}>
      <div className={SECTION_HEAD}>{title}</div>
      {rows.map((r) => (
        <div key={r.id} className={DIFF_ROW}>
          <span className={NAME}>{r.name}</span>
          <span className={WAS}>{r.was}</span>
          <span className="tw:text-xs tw:text-[var(--bk-ink-soft)]">→</span>
          <span className={NOW}>{r.now}</span>
        </div>
      ))}
    </div>
  );
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  colorTokens,
  colorDiff,
  typeTokens,
  typeSavedTokens,
  spacingTokens,
  spacingSavedTokens,
  onConfirm,
  onClose,
  onDiscardAll,
  usageCount,
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    cancelRef.current?.focus();
  }, []);
  const changedEntries = Object.values(colorDiff);
  const changedTypeTokens = typeTokens.filter((t) => {
    const saved = typeSavedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });
  const changedSpacingTokens = spacingTokens.filter((t) => {
    const saved = spacingSavedTokens.find((s) => s.id === t.id);
    return saved !== undefined && t.value !== saved.value;
  });
  const totalChanges =
    changedEntries.length + changedTypeTokens.length + changedSpacingTokens.length;

  const typeRows = changedTypeTokens.map((t) => ({
    id: t.id,
    name: t.name,
    was: typeSavedTokens.find((x) => x.id === t.id)?.value ?? "—",
    now: t.value,
  }));
  const spacingRows = changedSpacingTokens.map((t) => ({
    id: t.id,
    name: t.name,
    was: spacingSavedTokens.find((x) => x.id === t.id)?.value ?? "—",
    now: t.value,
  }));

  return (
    <ModalRoot open onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="md" data-testid="brand-review-modal">
        {/* 16/14 inset — 1172:4840. A flat `p-5` spent 20 on all four sides of a
            520 dialog whose board states 16 and 14. */}
        <div className="tw:px-4 tw:py-3.5" data-testid="brand-review-body">
          {/* Board 1172:4840 counts in the title and says what applying
              reaches: "Applying updates every element bound to these tokens —
              63 places." A count in the title is the difference between
              "review changes" and knowing whether this is a typo fix or a
              rebrand. */}
          {/* 16px — 1172:4841. It shipped at 13, the same size as the row
              labels under it, so the dialog had no heading, only a first line. */}
          <ModalTitle inset={false} className="tw:mb-1">
            {/* The size lives on a SPAN, and that is not a style choice.
                `MODAL_TITLE_CLASS` is `text-[length:var(--bk-text-14)]`, and a
                caller `className` font-size is a second arbitrary utility on a
                plain <h2> — two classes, one property, resolved by stylesheet
                order rather than by writing order (CLAUDE.md, the twMerge
                trap). The `tw:text-[13px]` this file used to pass never
                applied: the heading measured 14 the whole time. */}
            <span data-testid="brand-review-title" className="tw:text-[16px] tw:leading-[normal]">
              Review {totalChanges} staged {totalChanges === 1 ? "change" : "changes"}
            </span>
          </ModalTitle>

          {/* Colour changes — the only section whose row is not name/was/now */}
          {changedEntries.length > 0 && (
            <div className={SECTION}>
              <div className={SECTION_HEAD}>Color Changes</div>
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                {changedEntries.map((diff) => {
                  const token = colorTokens.find((t) => t.id === diff.tokenId);
                  return (
                    <div key={diff.tokenId} data-testid={`brand-review-row-${diff.tokenId}`} className={`${DIFF_ROW} tw:mb-0`}>
                      {/* the two swatches ARE the token's own values — the one
                          thing here that has to stay inline */}
                      <div className={SWATCH} style={{ background: diff.previousValue }} />
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="tw:text-[var(--bk-ink-muted)]"
                        aria-hidden="true"
                      >
                        <path d="M2 6h8M8 3l3 3-3 3" strokeLinecap="round" />
                      </svg>
                      <div className={SWATCH} style={{ background: diff.currentValue }} />
                      {/* Board 1172:4840 names each row `color/accent`, not
                          `accent`. The kind is load-bearing on this screen: two
                          kinds can each own a token called "primary", and this
                          is the last confirmation before every element bound to
                          it moves. A bare name cannot say which one is about to
                          change. Falls back to the bare name when the kind is
                          unknown, which is better than printing "undefined/". */}
                      <span data-testid={`brand-review-name-${diff.tokenId}`} className={NAME}>
                        {token?.name
                          ? token.category
                            ? `${token.category}/${token.name}`
                            : token.name
                          : diff.tokenId}
                      </span>
                      {/* Board 1172:4840 prints the transition as text —
                          "`var(--bk-blue-700)` → `var(--bk-blue-800)`" — beside the row. Two swatches
                          say a colour changed; they cannot say to WHAT, and
                          this is the last screen before every element bound to
                          the token moves. */}
                      <span data-testid={`brand-review-was-${diff.tokenId}`} className={WAS}>{diff.previousValue}</span>
                      <span className="tw:text-xs tw:text-[var(--bk-ink-soft)]">→</span>
                      <span className={NOW}>{diff.currentValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <ValueDiffSection title="Typography Changes" rows={typeRows} />
          <ValueDiffSection title="Spacing Changes" rows={spacingRows} />

          {/* 11/16 — 1172:4858. */}
          <p data-testid="brand-review-consequence" className="tw:mt-3 tw:mb-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            Applying updates every element bound to these tokens
            {usageCount != null && usageCount > 0
              ? ` — ${usageCount} place${usageCount === 1 ? "" : "s"}.`
              : "."}
          </p>

          {/* 1172:4865 — the foot is its own white row with an 8px gap. */}
          <div className="tw:flex tw:gap-2 tw:justify-end tw:mt-4" data-testid="brand-review-foot">
            {onDiscardAll && (
              <Button
                color="light"
                size="xs"
                onClick={onDiscardAll}
                data-testid="brand-review-discard"
                /* 12/7 inset, radius 6, a 13px label on WHITE with a
                   `--color/error` edge — 1172:4859 / 4860. All three buttons
                   shipped pinned to `h-7` with 11px labels, which is the
                   PANEL's row size applied to a dialog's actions. */
                className="tw:h-auto tw:px-3 tw:py-[7px] tw:rounded-md tw:text-[13px] tw:leading-[normal] tw:border-[var(--bk-error)] tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-error-text)]"
              >
                Discard all
              </Button>
            )}
            <Button
              ref={cancelRef}
              color="light"
              size="xs"
              onClick={onClose}
              data-testid="brand-review-keep"
              /* 1172:4861 / 4862 — white on a `--color/border` edge, not
                 transparent on nothing. */
              className="tw:h-auto tw:px-3 tw:py-[7px] tw:rounded-md tw:text-[13px] tw:leading-[normal] tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
            >
              Keep editing
            </Button>
            {/* 1172:4863 / 4864 — `--color/accent` fill, 13px white label. */}
            <Button
              size="xs"
              data-testid="brand-review-apply"
              className="tw:h-auto tw:px-3 tw:py-[7px] tw:rounded-md tw:text-[13px] tw:leading-[normal] tw:bg-[var(--bk-accent)] tw:text-white"
              onClick={onConfirm}
            >
              Apply {totalChanges} {totalChanges === 1 ? "change" : "changes"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};
