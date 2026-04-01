/**
 * SearchResults — grouped search results with zero-results state
 * Pure render component — never calls searchElements() internally
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { SearchGroup } from "../catalog/types";
import type { DragStartFn, ElClickFn, ToggleFavFn } from "../hooks/useBuildTab";
import { ElCard } from "./ElCard";

interface SearchResultsProps {
  query: string;
  groups: SearchGroup[];
  favs: Set<string>;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onToggleFav: ToggleFavFn;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  groups,
  favs,
  onDragStart,
  onElClick,
  onToggleFav,
}) => {
  if (!groups.length) {
    return (
      <div className="bld-search-empty" role="status" aria-live="polite">
        <span>🔍</span>
        <span>No elements matching &ldquo;{query}&rdquo;</span>
        <span className="bld-search-empty-hint">
          Try: heading, button, hero, form, image, grid
        </span>
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
                isFav={favs.has(el.name)}
                onDragStart={onDragStart}
                onClick={onElClick}
                onToggleFav={onToggleFav}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
