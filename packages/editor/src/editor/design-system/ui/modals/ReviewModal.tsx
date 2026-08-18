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
const DIFF_ROW = "tw:flex tw:items-center tw:gap-2 tw:px-2.5 tw:py-1.5 tw:bg-gray-50 tw:rounded-md tw:mb-1";
const SECTION_HEAD =
  "tw:text-xs tw:font-bold tw:text-gray-500 tw:mb-2 tw:uppercase tw:tracking-[0.07em]";
const SECTION = "tw:mb-3.5";
const NAME = "tw:text-xs tw:text-gray-900 tw:flex-1";
const WAS = "tw:text-xs tw:[font-family:var(--bk-font-mono)] tw:text-gray-500 tw:line-through";
const NOW = "tw:text-xs tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-success)]";
const SWATCH = "tw:size-5 tw:rounded tw:border tw:border-gray-200 tw:flex-none";

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
          <span className="tw:text-xs tw:text-gray-500">→</span>
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
      <ModalContent size="sm">
        <div className="tw:p-5">
          {/* Board 1172:4840 counts in the title and says what applying
              reaches: "Applying updates every element bound to these tokens —
              63 places." A count in the title is the difference between
              "review changes" and knowing whether this is a typo fix or a
              rebrand. */}
          <ModalTitle inset={false} className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-1">
            Review {totalChanges} staged {totalChanges === 1 ? "change" : "changes"}
          </ModalTitle>

          {/* Colour changes — the only section whose row is not name/was/now */}
          {changedEntries.length > 0 && (
            <div className={SECTION}>
              <div className={SECTION_HEAD}>Color Changes</div>
              <div className="tw:flex tw:flex-col tw:gap-1.5">
                {changedEntries.map((diff) => {
                  const token = colorTokens.find((t) => t.id === diff.tokenId);
                  return (
                    <div key={diff.tokenId} className={`${DIFF_ROW} tw:mb-0 tw:py-2`}>
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
                        className="tw:text-gray-500"
                        aria-hidden="true"
                      >
                        <path d="M2 6h8M8 3l3 3-3 3" strokeLinecap="round" />
                      </svg>
                      <div className={SWATCH} style={{ background: diff.currentValue }} />
                      <span className={NAME}>{token?.name ?? diff.tokenId}</span>
                      {/* Board 1172:4840 prints the transition as text —
                          "#1A56DB → #1E429F" — beside the row. Two swatches
                          say a colour changed; they cannot say to WHAT, and
                          this is the last screen before every element bound to
                          the token moves. */}
                      <span className={WAS}>{diff.previousValue}</span>
                      <span className="tw:text-xs tw:text-gray-500">→</span>
                      <span className={NOW}>{diff.currentValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <ValueDiffSection title="Typography Changes" rows={typeRows} />
          <ValueDiffSection title="Spacing Changes" rows={spacingRows} />

          <p className="tw:mt-3 tw:mb-0 tw:text-xs tw:text-gray-500">
            Applying updates every element bound to these tokens
            {usageCount != null && usageCount > 0
              ? ` — ${usageCount} place${usageCount === 1 ? "" : "s"}.`
              : "."}
          </p>

          <div className="tw:flex tw:gap-2 tw:justify-end tw:mt-4">
            {onDiscardAll && (
              <Button
                color="light"
                size="xs"
                onClick={onDiscardAll}
                className="tw:mr-auto tw:border-[var(--bk-error)] tw:bg-transparent tw:text-[var(--bk-error)]"
              >
                Discard all
              </Button>
            )}
            <Button
              ref={cancelRef}
              color="light"
              size="xs"
              onClick={onClose}
              className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              Keep editing
            </Button>
            <Button size="xs" onClick={onConfirm}>
              Apply {totalChanges} {totalChanges === 1 ? "change" : "changes"}
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};
