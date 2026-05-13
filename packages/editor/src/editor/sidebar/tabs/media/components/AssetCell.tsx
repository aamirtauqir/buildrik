/**
 * AssetCell — prototype-v3 §10 3-col grid cell.
 *
 * Renders one library asset (img/vid/ico/fnt) as a clickable square tile.
 * Consumed by §10 library grid, §12 expanded library area, §15 detail drawer
 * preview.
 *
 * Native `<button>` is used (not vibcoder Button) because this is a leaf
 * primitive whose visual is the thumb itself — vibcoder Button chrome
 * (padding, hover bg) would conflict with the edge-to-edge thumb fill.
 */
import { Play, FileType } from "lucide-react";
import type { MouseEvent } from "react";
import type { LibraryItem } from "../data/mediaTypes";
import { UsagePips } from "./UsagePips";

interface AssetCellProps {
  item: LibraryItem;
  onClick: (key: string) => void;
  usageCount?: number;
  isApplied?: boolean;
  isLocked?: boolean;
  isSelected?: boolean;
  onDoubleClick?: (key: string) => void;
  onContextMenu?: (e: MouseEvent, key: string) => void;
}

export function AssetCell({
  item,
  onClick,
  usageCount = 0,
  isApplied = false,
  isLocked = false,
  isSelected = false,
  onDoubleClick,
  onContextMenu,
}: AssetCellProps) {
  const className = [
    "med-asset-cell",
    `med-asset-cell--${item.type}`,
    isApplied && "med-asset-cell--applied",
    isLocked && "med-asset-cell--locked",
    isSelected && "med-asset-cell--selected",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={() => onClick(item.key)}
      onDoubleClick={onDoubleClick ? () => onDoubleClick(item.key) : undefined}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, item.key) : undefined}
      aria-label={`${item.name} asset`}
    >
      {item.type === "img" && item.thumb ? (
        <img
          src={item.thumb}
          alt=""
          className="med-asset-cell__img"
          draggable={false}
        />
      ) : item.type === "vid" ? (
        <div className="med-asset-cell__vid-preview">
          <Play size={18} aria-hidden="true" />
        </div>
      ) : item.type === "ico" ? (
        <div className="med-asset-cell__ico-preview">
          <FileType size={18} aria-hidden="true" />
        </div>
      ) : (
        <div
          className="med-asset-cell__fnt-preview"
          style={{ fontFamily: item.name }}
        >
          Aa
        </div>
      )}
      {usageCount > 0 ? <UsagePips count={usageCount} /> : null}
      {isApplied ? (
        <span className="med-asset-cell__applied-badge">APPLIED</span>
      ) : null}
      {isLocked ? (
        <div className="med-asset-cell__lock-overlay" aria-hidden="true" />
      ) : null}
    </button>
  );
}
