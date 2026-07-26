/**
 * SearchResults — grouped search results with zero-results state
 * Pure render component — never calls searchElements() internally
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";
import type { SearchGroup } from "../catalog/types";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { ElCard } from "./ElCard";

interface SearchResultsProps {
  query: string;
  groups: SearchGroup[];
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onClearSearch: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  groups,
  onDragStart,
  onElClick,
  onClearSearch,
}) => {
  if (!groups.length) {
    return (
      <div className="bld-no-results" role="status" aria-live="polite">
        {/* Sparkle icon — small square, slate-400 tint */}
        <svg className="bld-no-results-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <p className="bld-no-results-headline">Nothing matches "{query}"</p>
        <Button className="bld-clear-search" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    );
  }

  const totalCount = groups.reduce((sum, g) => sum + g.elements.length, 0);

  return (
    <div className="bld-search-results" role="status" aria-live="polite">
      <div className="bld-search-total">
        {totalCount} result{totalCount !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
      </div>
      {groups.map((group) => (
        <div key={group.catId} className="bld-search-group">
          <div className="bld-search-group-hdr">
            <span>{group.catName}</span>
            <span className="bld-search-group-count">{group.elements.length}</span>
          </div>
          <div className="bld-el-grid">
            {group.elements.map((el) => (
              <ElCard
                key={`${el.catId}-${el.name}`}
                el={el}
                onDragStart={onDragStart}
                onClick={onElClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
