/**
 * CatAccordion — category accordion matching .pen Quick-Grid design.
 * Clean row: name + chevron-right, no icon/sub/thumbnail.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CatEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { flatCatalogByCatId } from "../catalog/catalog";
import { ElCard } from "./ElCard";

interface CatAccordionProps {
  cat: CatEntry;
  isOpen: boolean;
  onToggle: () => void;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
}

export const CatAccordion: React.FC<CatAccordionProps> = ({
  cat,
  isOpen,
  onToggle,
  onDragStart,
  onElClick,
}) => {
  const bodyId = `bld-cat-body-${cat.id}`;
  const flatElements = flatCatalogByCatId[cat.id] ?? [];

  // Scroll the row into view after the accordion finishes expanding.
  // Guards first mount (e.g., Basic default-open) via wasOpenRef so we
  // don't yank the viewport when the panel first renders.
  const rowRef = React.useRef<HTMLDivElement>(null);
  const wasOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const timer = setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 280);
      wasOpenRef.current = isOpen;
      return () => clearTimeout(timer);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="bld-cat-item">
      <div
        ref={rowRef}
        className={`bld-cat-row${isOpen ? " open" : ""}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        <span className="bld-cat-chev" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
        <span className="bld-cat-name">{cat.name}</span>
        <span className="bld-cat-spacer" />
        <span className="bld-cat-count">{flatElements.length}</span>
      </div>
      <div id={bodyId} className={`bld-cat-body${isOpen ? " open" : ""}`}>
        <div className="bld-cat-body-inner">
          {/*
            Conditional mount: closed accordions don't render their element
            grid at all. CSS max-height:0 hides a collapsed panel visually,
            but mounted children still pay React render + effect cost. Only
            mount the grid when the accordion is actually open.
          */}
          {isOpen && (
            <div className="bld-el-grid">
              {flatElements.map((el) => (
                <ElCard
                  key={el.name}
                  el={el}
                  onDragStart={onDragStart}
                  onClick={onElClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
