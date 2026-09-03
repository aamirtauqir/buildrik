/**
 * GroupSection — one Insert group, boards 1069:4529/4707/4790/4970: a
 * 28-pixel header (▾/▸ chevron, caps label, live count right-aligned) over
 * 28-pixel list rows indented to the label.
 *
 * Replaces CatAccordion in the default view. CatAccordion's category IA
 * survives only inside SearchResults grouping.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FlatElEntry } from "../catalog/types";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import type { ComponentDefinition } from "../../../../../shared/types/components";
import type { InsertGroup } from "../catalog/groups";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { Button, Tooltip } from "@/editor/chrome-ui";

interface GroupSectionProps {
  group: InsertGroup;
  isOpen: boolean;
  onToggle: () => void;
  elements?: FlatElEntry[];
  blocks?: BlockDefinition[];
  /** COMPONENTS (board 1069:4790): the registry's component blocks as rows. */
  components?: BlockDefinition[];
  /** MINE (board 1069:4970): the user's own components as plain rows. */
  mine?: ComponentDefinition[];
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onBlockInsert?: (block: BlockDefinition) => void;
  onMineInsert?: (component: ComponentDefinition) => void;
}

/** Board 1069:4979 group header: dense row · ▾/▸ 11 · LABEL 11/600 caps tracking .5 · count 11/400 right.
 *
 *  The count is --bk-ink-muted, not the board's ink-placeholder. That token is
 *  #9CA3AF — the SAME value as --bk-border-strong and --bk-border-input — so
 *  the board asks a border colour to paint a number: 2.54:1 on white, measured
 *  on four counts, against a 4.5 floor. --bk-ink-muted measures 4.83 and is the
 *  chrome-furniture ink DESIGN.md:518 already names for exactly this. */
const HeaderRow: React.FC<{ group: InsertGroup; isOpen: boolean; onToggle: () => void }> = ({
  group, isOpen, onToggle,
}) => (
  <Button
    type="button"
    color="light"
    className="tw:flex tw:items-center tw:justify-start tw:w-full tw:h-[var(--bk-size-row-dense)] tw:pl-[var(--bk-space-12)] tw:pr-[var(--bk-space-16)] tw:gap-[6px] tw:bg-transparent tw:border-0 tw:rounded-none tw:cursor-pointer tw:text-left tw:shadow-none"
    aria-expanded={isOpen}
    data-testid={`insert-group-${group.id}`}
    onClick={onToggle}
  >
    <span className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)]" aria-hidden="true">
      {isOpen ? "▾" : "▸"}
    </span>
    <span className="tw:flex-1 tw:text-[11px] tw:leading-[16px] tw:font-semibold tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">
      {group.label}
    </span>
    {group.count != null && (
      <span className="tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-muted)] tw:tabular-nums">
        {group.count}
      </span>
    )}
  </Button>
);

/** Board 1069:4999 list row: dense · rounded-4 · 14 icon · 13/400 label,
 *  indented past the group chevron. `pinned` switches to board 1069:5011's
 *  ⌥ Paste HTML… band, which is a full-height row at the panel inset with
 *  12/400 soft-ink text and no icon slot. Exported for BuildTab. */
export const Row: React.FC<{
  label: string;
  /**
   * The element's own glyph — `ElEntry.iconHtml`, the inner markup of a
   * `viewBox="0 0 24 24"` svg. Rows without one (blocks, components, the
   * user's own) keep the plain square.
   */
  iconHtml?: string;
  /** Board 1069:5011 draws the Paste-HTML row with no icon slot at all. */
  noIcon?: boolean;
  /** Pinned band (board 1069:5011): standard row height, panel inset, 12/400 soft. */
  pinned?: boolean;
  /** Board 138:198: disabled row = "Soon" tag + reason tooltip + no insert.
   *  "Disabled without a reason is a bug" — the Button component doc. */
  disabled?: boolean;
  disabledReason?: string;
  testId: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick: () => void;
}> = ({ label, iconHtml, noIcon, pinned, disabled, disabledReason, testId, draggable, onDragStart, onClick }) => {
  const row = (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      draggable={disabled ? false : draggable}
      className={`tw:flex tw:items-center tw:gap-[8px] tw:rounded-[4px] tw:select-none ${
        pinned
          ? "tw:h-[var(--bk-size-row)] tw:px-[var(--bk-space-16)]"
          : "tw:h-[var(--bk-size-row-dense)] tw:pl-[var(--bk-space-28)] tw:pr-[var(--bk-space-16)]"
      } ${
        disabled
          ? "tw:cursor-not-allowed"
          : "tw:cursor-pointer hover:tw:bg-[var(--bk-bg-subtle)]"
      }`}
      data-testid={testId}
      onClick={disabled ? undefined : onClick}
      onDragStart={disabled ? undefined : onDragStart}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
      }}
    >
      {/* Every element row drew the same solid square — a founder
          call from 2026-08-06, taken from the board's List-row icon. It made 53
          element types visually identical in the first panel a user opens, and
          it is the top row of this arc's ledger.

          The artwork was never missing. `ElEntry.iconHtml` carries a distinct
          hand-drawn glyph for every catalog entry — 59 entries, 53 distinct —
          and nothing has ever rendered one. The inspector, meanwhile, shows a
          real per-type lucide glyph for the SAME element (`ProInspector.tsx`
          via `elementIcons.tsx`), so the product disagreed with itself about
          whether an element has a face.

          Reverting is this block. The square is still what a row with no
          artwork of its own gets — board 1069:4999 draws it at 14 on soft ink. */}
      {noIcon ? null : iconHtml ? (
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]"
          aria-hidden="true"
          /* Static markup compiled into the bundle from our own catalog — no
             user input reaches this, and no request fetches it. */
          dangerouslySetInnerHTML={{ __html: iconHtml }}
        />
      ) : (
        <span className="tw:size-[14px] tw:rounded-[2px] tw:bg-[var(--bk-ink-soft)] tw:shrink-0" aria-hidden="true" />
      )}
      <span
        className={`tw:flex-1 tw:min-w-0 tw:truncate ${
          pinned
            ? "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]"
            : "tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink)]"
        }`}
      >
        {label}
        {disabled && (
          <span className="tw:ml-[var(--bk-space-12)] tw:text-[13px] tw:text-[var(--bk-ink-muted)]">Soon</span>
        )}
      </span>
    </div>
  );

  // Board 138:198: the disabled row's tooltip IS the reason ("Video blocks
  // need a media provider connected" is that board's sample). Ink bg, white
  // 12px — the Tooltip primitive's dark style.
  return disabled && disabledReason ? (
    <Tooltip content={disabledReason} placement="bottom" arrow={false}>
      {row}
    </Tooltip>
  ) : (
    row
  );
};

export const GroupSection: React.FC<GroupSectionProps> = ({
  group, isOpen, onToggle, elements, blocks, components, mine, onDragStart, onElClick, onBlockInsert, onMineInsert,
}) => (
  <div data-testid={`insert-section-${group.id}`}>
    <HeaderRow group={group} isOpen={isOpen} onToggle={onToggle} />
    {isOpen && group.id === "elements" && elements?.map((el) => (
      <Row
        key={`${el.catId}-${el.name}`}
        label={el.name}
        iconHtml={el.iconHtml}
        disabled={el.disabled}
        disabledReason={el.disabled ? el.description : undefined}
        testId={`insert-el-${el.name}`}
        draggable
        onDragStart={(e) => onDragStart(e, el)}
        onClick={() => onElClick(el)}
      />
    ))}
    {/* Board 138:2: BLOCKS is a CARD GRID, not rows — `Card / media` (17:6):
        136×104, 136×76 thumb (4:3) on bg-subtle + a 12px label. Thumb is the
        block's preview when it has one, empty until then — the board names it
        "thumb/site-preview (empty until first publish)".

        The note here used to read "Two columns at 320w: 16+136+16+136+16 = 320
        EXACTLY". That arithmetic is right about the PANEL and wrong about its
        content box, and being one pixel out cost the grid entirely — see the
        note on the grid container below. */}
    {/* Board 1069:4790 (components-expanded): registry component blocks as
        plain rows — same Row treatment, same onBlockClick insert path
        (BlockDefinition extends BlockData). */}
    {isOpen && group.id === "components" && components?.map((c) => (
      <Row
        key={c.id}
        label={c.label}
        testId={`insert-component-${c.id}`}
        onClick={() => onBlockInsert?.(c)}
      />
    ))}
    {/* Board 1069:4970 (mine-expanded): the user's own components as plain
        dense rows — same Row treatment as ELEMENTS. Empty registry = no rows;
        the group header's live count already says 0. */}
    {isOpen && group.id === "mine" && mine?.map((c) => (
      <Row
        key={c.id}
        label={c.name}
        testId={`insert-mine-${c.id}`}
        onClick={() => onMineInsert?.(c)}
      />
    ))}
    {/* A GRID, because the flex-wrap version missed two columns by ONE pixel
        and nobody could see why. Board 138:2 draws two cards side by side and
        the arithmetic under it reads 16 + 136 + 16 + 136 + 16 = 320 — right
        about the panel, wrong about its content box: `.ls-panel` carries a
        `border-right: 1px`, so clientWidth is 319 and the content box 287, one
        short of the 288 two fixed cards need. Measured live: 50 cards, 50
        rows, one card per row, a 5700px column. `auto-fill` with a min under
        the card width cannot lose that way, and it earns the expanded drawer
        (560/700) more columns instead of two marooned cards. */}
    {isOpen && group.id === "blocks" && (
      <div className="tw:grid tw:grid-cols-[repeat(auto-fill,minmax(128px,1fr))] tw:gap-[8px] tw:px-[var(--bk-space-16)] tw:py-[var(--bk-space-4)]">
        {blocks?.map((b) => (
          <div
            key={b.id}
            role="button"
            tabIndex={0}
            className="tw:flex tw:flex-col tw:gap-[6px] tw:min-w-0 tw:cursor-pointer tw:select-none"
            data-testid={`insert-block-${b.id}`}
            onClick={() => onBlockInsert?.(b)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onBlockInsert?.(b); }
            }}
          >
            {b.preview ? (
              <img
                src={b.preview}
                alt=""
                className="tw:h-[80px] tw:w-[136px] tw:rounded-[var(--bk-radius-md)] tw:object-cover"
              />
            ) : (
              <div className="tw:h-[80px] tw:w-[136px] tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-bg-subtle)]" aria-hidden="true" />
            )}
            <p className="tw:m-0 tw:text-[11px] tw:leading-[16px] tw:text-[var(--bk-ink-soft)] tw:truncate">
              {b.label}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default GroupSection;
