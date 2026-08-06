/**
 * SearchResults — board 138:53 (Insert · searching).
 *
 * ONE flat list across sources: 32h rows, label 13 ink left, source-group
 * tag 11 caps ink-soft right (tracking .5). No results header, no category
 * sections, no cards — the board draws search flat and cross-source.
 * Pure render — matching lives in utils/search.ts.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { InsertSearchHit } from "../utils/search";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import { Button } from "@/editor/chrome-ui";

interface SearchResultsProps {
  query: string;
  hits: InsertSearchHit[];
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onBlockInsert: (block: BlockDefinition) => void;
  onClearSearch: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  hits,
  onDragStart,
  onElClick,
  onBlockInsert,
  onClearSearch,
}) => {
  if (!hits.length) {
    // Board 138:106: two lines only — muted fact (curly quotes, trailing
    // period), accent "Clear search" link. No icon, no button chrome.
    return (
      <div
        className="tw:flex tw:flex-col tw:items-center tw:gap-[10px] tw:px-6 tw:pt-12"
        role="status"
        aria-live="polite"
        data-testid="insert-no-results"
      >
        <p className="tw:m-0 tw:text-center tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink-muted)]">
          Nothing matches &lsquo;{query}&rsquo;.
        </p>
        <Button
          type="button"
          color="light"
          size="xs"
          className="tw:min-h-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-accent-text)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
          data-testid="insert-clear-search"
          onClick={onClearSearch}
        >
          Clear search
        </Button>
      </div>
    );
  }

  const activate = (hit: InsertSearchHit) =>
    hit.group === "ELEMENTS" ? onElClick(hit.el) : onBlockInsert(hit.block);

  return (
    <div role="status" aria-live="polite" data-testid="insert-search-results">
      {hits.map((hit) => (
        <div
          key={hit.key}
          role="button"
          tabIndex={0}
          draggable={hit.group === "ELEMENTS"}
          className="tw:flex tw:items-center tw:h-[var(--bk-size-row)] tw:px-[16px] tw:gap-[8px] tw:rounded-[4px] tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]"
          data-testid={`insert-hit-${hit.key}`}
          onClick={() => activate(hit)}
          onDragStart={hit.group === "ELEMENTS" ? (e) => onDragStart(e, hit.el) : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activate(hit);
            }
          }}
        >
          <span className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-[20px] tw:text-[var(--bk-ink)]">
            {hit.label}
          </span>
          <span className="tw:text-[11px] tw:leading-[16px] tw:tracking-[0.5px] tw:text-[var(--bk-ink-soft)]">
            {hit.group}
          </span>
        </div>
      ))}
    </div>
  );
};
