/**
 * AssetCell — prototype-v3 §10 3-col grid cell.
 *
 * Renders one library asset (img/vid/ico/fnt) as a clickable square tile.
 * Consumed by §10 library grid, §12 expanded library area, §15 detail drawer
 * preview.
 *
 * Uses vibcoder Button with `variant="bare"` — strips bd-btn padding /
 * hover bg / radius / transition so the consumer's `.med-asset-cell`
 * className is the sole source of visual styling. Keeps button semantics
 * (keyboard focus, click activation, :disabled, type="button" defaulting).
 */
import { Play, FileType, Lock } from "lucide-react";
import type { DragEvent, MouseEvent } from "react";
import type { LibraryItem } from "../data/mediaTypes";
import { UsagePips } from "./UsagePips";
import { Button } from "flowbite-react";

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

  // Two drop targets read this drag:
  //  1. Folder rail (ExpandedMediaPanel) → moves the asset between folders.
  //     Reads `application/x-buildrik-media-asset-key`.
  //  2. Canvas (useDropExecution.handleInternalMediaDrop) → inserts the asset
  //     as an element. Reads `application/x-aquibra-media-src/-type/-name`.
  // The cell previously set ONLY the folder-move key, so dragging a library
  // asset onto the canvas did nothing. Carry both payloads.
  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData("application/x-buildrik-media-asset-key", item.key);
    e.dataTransfer.setData("application/x-aquibra-media-src", item.src);
    e.dataTransfer.setData("application/x-aquibra-media-type", item.type);
    e.dataTransfer.setData("application/x-aquibra-media-name", item.name);
    e.dataTransfer.setData("text/plain", item.src);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  return (
    <Button
      type="button"
      color="light"
      className={className}
      disabled={isLocked}
      draggable={!isLocked}
      onDragStart={isLocked ? undefined : handleDragStart}
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
        <div className="med-asset-cell__lock-overlay" aria-hidden="true">
          <Lock size={18} />
        </div>
      ) : null}
    </Button>
  );
}
