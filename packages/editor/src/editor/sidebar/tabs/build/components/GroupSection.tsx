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
import { Button } from "@/editor/chrome-ui";
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

/** Board list row: 32h · rounded-4 · 12px icon · 13/400 label. */
const Row: React.FC<{
  label: string;
  iconHtml?: string;
  testId: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onClick: () => void;
}> = ({ label, iconHtml, testId, draggable, onDragStart, onClick }) => (
  <div
    role="button"
    tabIndex={0}
    draggable={draggable}
    className="tw:flex tw:items-center tw:h-[var(--bk-size-row)] tw:px-[16px] tw:gap-[8px] tw:rounded-[4px] tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]"
    data-testid={testId}
    onClick={onClick}
    onDragStart={onDragStart}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
    }}
  >
    {iconHtml ? (
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
    </span>
  </div>
);

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
        testId={`insert-el-${el.name}`}
        draggable
        onDragStart={(e) => onDragStart(e, el)}
        onClick={() => onElClick(el)}
      />
    ))}
    {isOpen && group.id === "blocks" && blocks?.map((b) => (
      <Row
        key={b.id}
        label={b.label}
        testId={`insert-block-${b.id}`}
        onClick={() => onBlockInsert?.(b)}
      />
    ))}
  </div>
);

export default GroupSection;
