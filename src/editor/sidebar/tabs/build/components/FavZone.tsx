/**
 * FavZone — pinned Favorites section at bottom of Build Tab
 * Uses new FlatElEntry types (el.name, not el.n)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FlatElEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn, ToggleFavFn } from "../hooks/useBuildTab";
import { ElCard } from "./ElCard";

interface FavZoneProps {
  favs: Set<string>;
  allElements: FlatElEntry[];
  open: boolean;
  dimmed: boolean;
  onToggle: () => void;
  onRemoveFav: ToggleFavFn;
  onClearAll: () => void;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
}

export const FavZone: React.FC<FavZoneProps> = ({
  favs,
  allElements,
  open,
  dimmed,
  onToggle,
  onRemoveFav,
  onClearAll,
  onDragStart,
  onElClick,
}) => {
  const favItems = allElements.filter((el) => favs.has(el.name));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className={`bld-fav-zone${dimmed ? " dimmed" : ""}`}>
      <div
        className={`bld-fav-hdr${open ? " open" : ""}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <div className="bld-fav-icon">⭐</div>
        <span className="bld-fav-lbl">My Favorites</span>
        {favItems.length > 0 && <span className="bld-fav-badge">{favItems.length}</span>}
        {favItems.length > 0 && open && (
          <button
            className="bld-fav-clear"
            onClick={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
            aria-label="Clear all favorites"
          >
            clear
          </button>
        )}
        <svg className="bld-fav-chev" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div className={`bld-fav-body${open ? " open" : ""}`}>
        <div className="bld-fav-scroll">
          {favItems.length === 0 ? (
            <div className="bld-favs-empty">
              <span>⭐</span>
              <span>Hover an element and click ★ to favorite it</span>
            </div>
          ) : (
            <div className="bld-favs-grid">
              {favItems.map((el) => (
                <ElCard
                  key={el.name}
                  el={el}
                  isFav
                  onDragStart={onDragStart}
                  onClick={onElClick}
                  onToggleFav={onRemoveFav}
                  showRemove
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
