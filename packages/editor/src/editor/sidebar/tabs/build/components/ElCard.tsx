/**
 * ElCard — element grid card with drag, click, keyboard nav, and fav star
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FlatElEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn, ToggleFavFn } from "../hooks/useBuildTab";
import { SvgIcon } from "./SvgIcon";

interface ElCardProps {
  el: FlatElEntry;
  isFav: boolean;
  onDragStart: DragStartFn;
  onClick: ElClickFn;
  onToggleFav: ToggleFavFn;
  showRemove?: boolean;
}

export const ElCard: React.FC<ElCardProps> = ({
  el,
  isFav,
  onDragStart,
  onClick,
  onToggleFav,
  showRemove = false,
}) => {
  const [dragging, setDragging] = React.useState(false);
  const isDisabled = el.disabled === true;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(el);
    }
  };

  const handleClick = () => {
    if (!isDisabled) onClick(el);
  };

  const titleText = isDisabled
    ? `${el.name} — Coming Soon`
    : `${el.name} — ${el.description}\nDrag to canvas or click to add below selection`;

  return (
    <div
      className={`bld-el-card${dragging ? " bld-el-card--dragging" : ""}${isDisabled ? " bld-el-card--disabled" : ""}`}
      draggable={!isDisabled}
      onDragStart={(e) => {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        setDragging(true);
        onDragStart(e, el);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={
        isDisabled
          ? `${el.name} — Coming Soon`
          : `${el.name} — ${el.description}. Drag to canvas or click to add.`
      }
      aria-disabled={isDisabled || undefined}
      title={titleText}
    >
      <div className="bld-el-drag-handle" aria-hidden="true">⠿</div>
      <div className="bld-el-icon">
        <SvgIcon html={el.iconHtml} />
      </div>
      <span className="bld-el-name">{el.name}</span>

      {isDisabled ? (
        <span className="bld-el-soon" aria-hidden="true">Soon</span>
      ) : showRemove ? (
        <button
          className="bld-fav-remove"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(el.name);
          }}
          aria-label={`Remove ${el.name} from favorites`}
        >
          <svg viewBox="0 0 12 12">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      ) : (
        <button
          className={`bld-el-fav${isFav ? " bld-el-fav--on" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(el.name);
          }}
          aria-label={isFav ? `Remove ${el.name} from favorites` : `Add ${el.name} to favorites`}
          aria-pressed={isFav}
        >
          <svg viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      )}
    </div>
  );
};
