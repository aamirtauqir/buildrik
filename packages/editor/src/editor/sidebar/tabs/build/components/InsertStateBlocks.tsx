/**
 * Insert panel state blocks — boards 775:4053 (loading) and 781:4154
 * (load-error), fetched 2026-08-06. One home so BuildTab, the probe and any
 * future async source (COMPONENTS/TEMPLATES/MINE) render the same block —
 * conformance recipes measure these testIds. Mirrors LayersStateBlocks, the
 * 08-04 precedent for exactly this pair of boards.
 *
 * The catalog itself is static today, so BuildTab cannot *be* loading yet —
 * the states exist because the board contract demands them and the navigate
 * groups go async next. The probe host renders them for the eye and the
 * harness until then.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, SkeletonBlock, BK_LINK_BUTTON_CLASS } from "@/editor/chrome-ui";

/*
  Board `775:4053`. Six rows on the list's own row height (h-8). Indent ladder
  16/32 only — Insert's list is one level deep, unlike the Layers tree's
  16/32/48. Bar widths are the board's own uneven set; identical bars read as
  a graphic, uneven ones read as text that is coming. Icon square 12px
  radius 3 (board exact).
*/
const SKELETON_ROWS: ReadonlyArray<{ pl: string; bar: string }> = [
  { pl: "tw:pl-4", bar: "tw:w-[132px]" },
  { pl: "tw:pl-8", bar: "tw:w-[96px]" },
  { pl: "tw:pl-8", bar: "tw:w-[150px]" },
  { pl: "tw:pl-4", bar: "tw:w-[110px]" },
  { pl: "tw:pl-8", bar: "tw:w-[86px]" },
  { pl: "tw:pl-8", bar: "tw:w-[124px]" },
];

const SK_ICON =
  "tw:size-3 tw:shrink-0 tw:animate-pulse tw:rounded-[3px] tw:bg-gray-100 tw:motion-reduce:animate-none";

export const InsertLoadingSkeleton: React.FC = () => (
  <div data-testid="insert-loading" aria-busy="true" aria-label="Loading element library">
    {/* Row 0 written out (not mapped): check-anchors greps for the literal
        data-testid strings a recipe names. */}
    <div className={`tw:flex tw:h-8 tw:items-center tw:gap-2 ${SKELETON_ROWS[0].pl}`} data-testid="insert-sk-row">
      <div aria-hidden="true" className={SK_ICON} data-testid="insert-sk-icon" />
      <SkeletonBlock className={`tw:h-2.5 ${SKELETON_ROWS[0].bar}`} data-testid="insert-sk-bar" />
    </div>
    {SKELETON_ROWS.slice(1).map((row, i) => (
      <div key={i} className={`tw:flex tw:h-8 tw:items-center tw:gap-2 ${row.pl}`}>
        <div aria-hidden="true" className={SK_ICON} />
        <SkeletonBlock className={`tw:h-2.5 ${row.bar}`} />
      </div>
    ))}
  </div>
);

/*
  Board `781:4154`. "You can still edit what's already on the canvas." carries
  the load: a dead element library looks like the whole editor broke, and the
  copy scopes the harm to the one list that failed. Same shape as Layers
  (781:4217), Media (453:3952) and Content (453:4013): error fact, harm scope,
  retry.
*/
export const InsertLoadError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="tw:flex tw:flex-col tw:gap-1.5 tw:px-6 tw:pb-8 tw:pt-9" data-testid="insert-load-error" role="alert">
    <p className="tw:text-[13px] tw:leading-5 tw:text-red-700">Couldn&rsquo;t load the element library.</p>
    <p className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">You can still edit what&rsquo;s already on the canvas.</p>
    <Button
      type="button"
      color="light"
      size="xs"
      className={`${BK_LINK_BUTTON_CLASS} tw:self-start`}
      data-testid="insert-load-retry"
      onClick={onRetry}
    >
      Try again
    </Button>
  </div>
);
