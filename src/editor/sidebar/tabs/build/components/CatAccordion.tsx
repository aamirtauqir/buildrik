/**
 * CatAccordion — category accordion with multi-open support
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CatEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn, ToggleFavFn } from "../hooks/useBuildTab";
import { flatCatalog } from "../catalog/catalog";
import { ElCard } from "./ElCard";
import { SvgIcon } from "./SvgIcon";

interface CatAccordionProps {
  cat: CatEntry;
  isOpen: boolean;
  onToggle: () => void;
  favs: Set<string>;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  onToggleFav: ToggleFavFn;
}

export const CatAccordion: React.FC<CatAccordionProps> = ({
  cat,
  isOpen,
  onToggle,
  favs,
  onDragStart,
  onElClick,
  onToggleFav,
}) => {
  const bodyId = `bld-cat-body-${cat.id}`;
  const flatElements = flatCatalog.filter((el) => el.catId === cat.id);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="bld-cat-item">
      <div
        className={`bld-cat-row${isOpen ? " open" : ""}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        <div className="bld-cat-icon">
          <SvgIcon html={cat.iconHtml} />
        </div>
        <div className="bld-cat-info">
          <div className="bld-cat-name">{cat.name}</div>
          <div className="bld-cat-sub">{cat.sub}</div>
        </div>
        <span className="bld-cat-count">{cat.elements.length}</span>
        <svg className="bld-cat-chev" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
      <div id={bodyId} className={`bld-cat-body${isOpen ? " open" : ""}`}>
        <div className="bld-cat-body-inner">
          <div className="bld-el-grid">
            {flatElements.map((el) => (
              <ElCard
                key={el.name}
                el={el}
                isFav={favs.has(el.name)}
                onDragStart={onDragStart}
                onClick={onElClick}
                onToggleFav={onToggleFav}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
