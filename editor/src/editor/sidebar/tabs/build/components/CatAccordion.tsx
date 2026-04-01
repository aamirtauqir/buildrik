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

/** Tiny CSS thumbnail previews for each category */
const CAT_THUMBNAILS: Record<string, React.ReactNode> = {
  basic: (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      <span style={{ width: 18, height: 6, borderRadius: 1, background: "var(--aqb-text-muted)", opacity: 0.5 }} />
      <span style={{ width: 12, height: 8, borderRadius: 2, background: "var(--aqb-primary)", opacity: 0.5 }} />
    </span>
  ),
  layout: (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 1, alignItems: "center" }}>
      <span style={{ width: 10, height: 12, borderRadius: 1, border: "1px solid var(--aqb-text-muted)", opacity: 0.4 }} />
      <span style={{ width: 10, height: 12, borderRadius: 1, border: "1px solid var(--aqb-text-muted)", opacity: 0.4 }} />
    </span>
  ),
  media: (
    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}>
      <span style={{ width: 16, height: 12, borderRadius: 2, background: "var(--aqb-text-muted)", opacity: 0.3, position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", bottom: 0, left: 2, width: 4, height: 4, borderRadius: "50%", background: "var(--aqb-text-muted)", opacity: 0.6 }} />
      </span>
    </span>
  ),
  form: (
    <span aria-hidden="true" style={{ display: "inline-flex", flexDirection: "column", gap: 1, alignItems: "stretch" }}>
      <span style={{ width: 20, height: 4, borderRadius: 1, border: "1px solid var(--aqb-text-muted)", opacity: 0.4 }} />
      <span style={{ width: 20, height: 4, borderRadius: 1, border: "1px solid var(--aqb-text-muted)", opacity: 0.4 }} />
    </span>
  ),
  navigation: (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      <span style={{ width: 6, height: 1, background: "var(--aqb-text-muted)", opacity: 0.5 }} />
      <span style={{ width: 6, height: 1, background: "var(--aqb-text-muted)", opacity: 0.5 }} />
      <span style={{ width: 6, height: 1, background: "var(--aqb-text-muted)", opacity: 0.5 }} />
    </span>
  ),
};

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
        {CAT_THUMBNAILS[cat.id] && (
          <span className="bld-cat-thumb">{CAT_THUMBNAILS[cat.id]}</span>
        )}
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
