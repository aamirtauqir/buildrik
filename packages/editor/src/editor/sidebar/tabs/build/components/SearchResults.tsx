/**
 * SearchResults — board 4418:100087 (Insert · searching).
 *
 * ONE flat list across sources: 32h rows — label 13 ink, a grey source chip
 * right after it ([Element] / [Block] / [Component]), then "+ Add" (12 medium
 * accent) and a 28-wide ⠿ grip at the right edge. No results header, no
 * category sections. Every row inserts on click and drags onto the canvas.
 * Pure render — matching lives in utils/search.ts.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { InsertSearchHit } from "../utils/search";
import type { BlockDragStartFn, DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import type { ComponentDefinition } from "@/shared/types/components";
import { Button } from "@/editor/chrome-ui";

interface SearchResultsProps {
  query: string;
  hits: InsertSearchHit[];
  onDragStart: DragStartFn;
  onBlockDragStart: BlockDragStartFn;
  onElClick: ElClickFn;
  onBlockInsert: (block: BlockDefinition) => void;
  onSavedInsert: (component: ComponentDefinition) => void;
  onClearSearch: () => void;
}

/** The board's chip names the kind of thing a row inserts. Built-in and saved
 *  components are both "Component". */
const CHIP: Record<InsertSearchHit["group"], string> = {
  ELEMENTS: "Element",
  BLOCKS: "Block",
  COMPONENTS: "Component",
  SAVED: "Component",
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  hits,
  onDragStart,
  onBlockDragStart,
  onElClick,
  onBlockInsert,
  onSavedInsert,
  onClearSearch,
}) => {
  if (!hits.length) {
    // Board 138:106: two lines only — muted fact (curly quotes, trailing
    // period), accent "Clear search" link. No icon, no button chrome.
    return (
      <div
        /* Board 138:150 puts the block's type contract on the CONTAINER —
           13 on a 20 line box — and lets both lines inherit it. The size was
           only ever on the message paragraph, so the box itself measured the
           inherited 16/normal. Nothing moves on screen; the container now
           states what it draws. */
        className="tw:flex tw:flex-col tw:items-center tw:gap-[10px] tw:px-6 tw:pt-12 tw:text-[13px] tw:leading-[20px]"
        role="status"
        aria-live="polite"
        data-testid="insert-no-results"
      >
        <p className="tw:m-0 tw:text-center tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink-muted)]" data-testid="insert-no-results-text">
          Nothing matches &lsquo;{query}&rsquo;.
        </p>
        <Button
          type="button"
          color="light"
          size="xs"
          variant="link"
          data-testid="insert-clear-search"
          onClick={onClearSearch}
        >
          Clear search
        </Button>
      </div>
    );
  }

  const activate = (hit: InsertSearchHit) => {
    if (hit.group === "ELEMENTS") onElClick(hit.el);
    else if (hit.group === "SAVED") onSavedInsert(hit.component);
    else onBlockInsert(hit.block);
  };

  const dragStart = (e: React.DragEvent, hit: InsertSearchHit) => {
    if (hit.group === "ELEMENTS") onDragStart(e, hit.el);
    else if (hit.group === "SAVED") {
      // The canvas drop reads a saved component by id (useDropExecution).
      e.dataTransfer.setData("application/x-aquibra-component", hit.component.id);
      e.dataTransfer.effectAllowed = "copy";
    } else onBlockDragStart(e, hit.block);
  };

  return (
    <div role="status" aria-live="polite" data-testid="insert-search-results">
      {hits.map((hit) => (
        <div
          key={hit.key}
          role="button"
          tabIndex={0}
          draggable
          aria-label={`Add ${hit.label} (${CHIP[hit.group]})`}
          className="tw:flex tw:items-center tw:h-[var(--bk-size-row)] tw:pl-[16px] tw:pr-[16px] tw:rounded-[4px] tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]"
          data-testid={`insert-hit-${hit.key}`}
          onClick={() => activate(hit)}
          onDragStart={(e) => dragStart(e, hit)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activate(hit);
            }
          }}
        >
          <span
            className="tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink)]"
            data-testid={`insert-hit-label-${hit.key}`}
          >
            {hit.label}
          </span>
          <span
            className="tw:ml-[6px] tw:shrink-0 tw:inline-flex tw:items-center tw:h-[22px] tw:px-[8px] tw:rounded-[var(--bk-radius-full)] tw:bg-[var(--bk-gray-100)] tw:text-[11px] tw:leading-[16px] tw:font-medium tw:text-[var(--bk-ink-soft)]"
            data-testid={`insert-hit-chip-${hit.key}`}
          >
            {CHIP[hit.group]}
          </span>
          {/* The whole row inserts; "+ Add" is its visible affordance, so the
              click bubbles to the row rather than being a second control. */}
          <span
            aria-hidden="true"
            className="tw:ml-auto tw:pl-[8px] tw:shrink-0 tw:text-[12px] tw:leading-[18px] tw:font-medium tw:text-[var(--bk-accent)]"
            data-testid={`insert-hit-add-${hit.key}`}
          >
            + Add
          </span>
          <span
            aria-hidden="true"
            className="tw:ml-[4px] tw:w-[28px] tw:shrink-0 tw:text-center tw:text-[12px] tw:text-[var(--bk-gray-400)] tw:cursor-grab"
            data-testid={`insert-hit-grip-${hit.key}`}
          >
            ⠿
          </span>
        </div>
      ))}
    </div>
  );
};
