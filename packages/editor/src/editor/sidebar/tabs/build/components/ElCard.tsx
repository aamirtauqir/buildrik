/**
 * ElCard — element grid card with drag, click, keyboard nav, and fav star
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FlatElEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { SvgIcon } from "./SvgIcon";

interface ElCardProps {
  el: FlatElEntry;
  onDragStart: DragStartFn;
  onClick: ElClickFn;
}

export const ElCard: React.FC<ElCardProps> = ({
  el,
  onDragStart,
  onClick,
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
      <div className="bld-el-icon">
        <SvgIcon html={el.iconHtml} />
      </div>
      <span className="bld-el-name">{el.name}</span>
      {isDisabled && <span className="bld-el-soon" aria-hidden="true">Soon</span>}
    </div>
  );
};
