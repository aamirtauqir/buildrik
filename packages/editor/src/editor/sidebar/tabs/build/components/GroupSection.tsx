/**
 * GroupSection — one board-137:2 group: 32h header (▾/▸ chevron, caps label,
 * live count in Geist Mono right-aligned) + 32h rounded-4 list rows.
 *
 * Replaces CatAccordion in the default view. CatAccordion's category IA
 * survives only inside SearchResults grouping.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FlatElEntry } from "../catalog/types";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import type { InsertGroup } from "../catalog/groups";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { Button, Tooltip } from "@/editor/chrome-ui";
import { SvgIcon } from "./SvgIcon";

interface GroupSectionProps {
  group: InsertGroup;
  isOpen: boolean;
  onToggle: () => void;
  elements?: FlatElEntry[];
  blocks?: BlockDefinition[];
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onBlockInsert?: (block: BlockDefinition) => void;
}

/** Board group header: 32h · ▾/▸ 12px @16 · LABEL 11/500 caps tracking .5 · count mono 11 right. */
const HeaderRow: React.FC<{ group: InsertGroup; isOpen: boolean; onToggle: () => void }> = ({
  group, isOpen, onToggle,
}) => (
  <Button
    type="button"
    color="light"
    className="tw:flex tw:items-center tw:justify-start tw:w-full tw:h-[var(--bk-size-row)] tw:px-[16px] tw:gap-0 tw:bg-transparent tw:border-0 tw:rounded-none tw:cursor-pointer tw:text-left tw:shadow-none"
    aria-expanded={isOpen}
    data-testid={`insert-group-${group.id}`}
    onClick={onToggle}
  >
    <span className="tw:w-[16px] tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" aria-hidden="true">
      {isOpen ? "▾" : "▸"}
    </span>
    <span className="tw:flex-1 tw:text-[11px] tw:leading-[16px] tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]">
      {group.label}
    </span>
    {group.count != null && (
      <span className="tw:font-[family-name:var(--bk-font-mono)] tw:text-[11px] tw:leading-[16px] tw:font-medium tw:text-[var(--bk-ink-muted)] tw:tabular-nums">
        {group.count}
      </span>
    )}
  </Button>
);

/** Board list row: 32h · rounded-4 · 12px icon · 13/400 label. Exported for
 *  the board's icon-less pinned rows (⌥ Paste HTML…) in BuildTab. */
export const Row: React.FC<{
  label: string;
  iconHtml?: string;
  /** Board 233:1123 draws the Paste-HTML row with no icon slot at all. */
  noIcon?: boolean;
  /** Board 138:198: disabled row = "Soon" tag + reason tooltip + no insert.
   *  "Disabled without a reason is a bug" — the Button component doc. */
  disabled?: boolean;
  disabledReason?: string;
  testId: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick: () => void;
}> = ({ label, iconHtml, noIcon, disabled, disabledReason, testId, draggable, onDragStart, onClick }) => {
  const row = (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      draggable={disabled ? false : draggable}
      className={`tw:flex tw:items-center tw:h-[var(--bk-size-row)] tw:px-[16px] tw:gap-[8px] tw:rounded-[4px] tw:select-none ${
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
      {noIcon ? null : iconHtml ? (
        // .bld-el-icon owns the glyph contract: 12px box, ink-muted colour, and
        // stroke:currentColor/1.5/round for the stroke-only glyphs (bare <line>
        // icons render fill:black/stroke:none — i.e. INVISIBLE — without it).
        // Bypassing this class is exactly how Text/List/Divider/Spacer vanished.
        <span className="bld-el-icon" aria-hidden="true">
          <SvgIcon html={iconHtml} />
        </span>
      ) : (
        <span className="tw:size-[12px] tw:rounded-[2px] tw:bg-[var(--bk-ink-muted)] tw:shrink-0" aria-hidden="true" />
      )}
      <span className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink)]">
        {label}
        {disabled && (
          <span className="tw:ml-[12px] tw:text-[13px] tw:text-[var(--bk-ink-muted)]">Soon</span>
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
  group, isOpen, onToggle, elements, blocks, onDragStart, onElClick, onBlockInsert,
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
        136×104, 136×76 thumb (4:3) on bg-subtle + a 12px label. Two columns at
        320w: 16+136+16+136+16 = 320 EXACTLY ("140 was tried and overflows by
        8"). Thumb is the block's preview when it has one, empty until then —
        the board names it "thumb/site-preview (empty until first publish)". */}
    {isOpen && group.id === "blocks" && (
      <div className="tw:flex tw:flex-wrap tw:gap-[16px] tw:px-[16px] tw:py-[8px]">
        {blocks?.map((b) => (
          <div
            key={b.id}
            role="button"
            tabIndex={0}
            className="tw:flex tw:flex-col tw:gap-[4px] tw:w-[136px] tw:cursor-pointer tw:select-none"
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
                className="tw:h-[76px] tw:w-[136px] tw:rounded-[var(--bk-radius-sm)] tw:object-cover"
              />
            ) : (
              <div className="tw:h-[76px] tw:w-[136px] tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-bg-subtle)]" aria-hidden="true" />
            )}
            <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)] tw:truncate">
              {b.label}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default GroupSection;
