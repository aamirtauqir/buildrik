/**
 * AssetCell — one card in the Media drawer grid. Figma `Card / media` 17:6,
 * instanced at `218:686` / `218:691` / `218:697` / `218:702` inside `144:2`.
 *
 * 136 x 104: a 136x76 thumb over an 18px filename. The component's own Figma
 * note gives the arithmetic and the reason it is not negotiable — "Two columns
 * at 320w: 16+136+16+136+16 = 320 EXACTLY. 140 was tried and overflows by 8."
 * This used to be a square tile in a 3-column grid, which is where the drawer's
 * old look came from.
 *
 * PROVENANCE BADGE. `STOCK` / `AI` sit on the thumb, ink on white, 40x14 at
 * (6, 56). They render from `assetSource`, which lives only in the browser —
 * `MediaAsset` has no such column and `updateAsset` mirrors just `folderId`, so
 * an asset loaded from the server carries no badge. That is a known gap with a
 * founder decision behind it (TODOS.md: badges are fixture-conformed until the
 * field is persisted), and `"ai"` currently has no writer at all. Both are
 * rendered here anyway because the day the field is persisted, this is the code
 * that has to already be right.
 *
 * @license BSD-3-Clause
 */
import { Play, FileType, Lock } from "lucide-react";
import type { DragEvent, MouseEvent } from "react";
import type { LibraryItem } from "../data/mediaTypes";
import { UsagePips } from "./UsagePips";
import { Button } from "@/editor/chrome-ui";

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

/** Board `I218:686;218:6` — only these two ever paint. */
const BADGE: Partial<Record<NonNullable<LibraryItem["assetSource"]>, string>> = {
  stock: "STOCK",
  ai: "AI",
};

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
  const badge = item.assetSource ? BADGE[item.assetSource] : undefined;

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
      className={[
        `med-asset-cell med-asset-cell--${item.type}`,
        isApplied && "med-asset-cell--applied",
        isLocked && "med-asset-cell--locked",
        isSelected && "med-asset-cell--selected",
        "tw:relative tw:flex tw:flex-col tw:items-start tw:gap-1 tw:w-34 tw:h-26 tw:p-0",
        "tw:border-0 tw:bg-transparent tw:enabled:hover:bg-transparent",
        "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]",
        isSelected && "tw:[box-shadow:var(--bk-shadow-focus)]",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isLocked}
      draggable={!isLocked}
      onDragStart={isLocked ? undefined : handleDragStart}
      onClick={() => onClick(item.key)}
      onDoubleClick={onDoubleClick ? () => onDoubleClick(item.key) : undefined}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, item.key) : undefined}
      aria-label={`${item.name} asset`}
      data-testid="media-card"
    >
      <span className="med-asset-cell__thumb tw:relative tw:flex tw:items-center tw:justify-center tw:w-34 tw:h-19 tw:shrink-0 tw:overflow-hidden tw:rounded tw:bg-gray-100 tw:text-gray-500">
        {item.type === "img" && item.thumb ? (
          <img
            src={item.thumb}
            alt=""
            className="med-asset-cell__img tw:h-full tw:w-full tw:object-cover"
            draggable={false}
          />
        ) : item.type === "vid" ? (
          <Play size={18} aria-hidden="true" />
        ) : item.type === "ico" ? (
          <FileType size={18} aria-hidden="true" />
        ) : (
          <span className="tw:text-[16px]" style={{ fontFamily: item.name }}>
            Aa
          </span>
        )}
        {badge ? (
          <span
            /* 40x14 at (6, 56) per `I218:686;218:6` — fixed, not padded: a
               badge that grows with its word would shift the thumb's focal
               point between STOCK and AI. */
            className="tw:absolute tw:left-1.5 tw:top-14 tw:flex tw:h-3.5 tw:w-10 tw:items-center tw:justify-center tw:rounded tw:bg-gray-900 tw:text-[11px] tw:leading-4 tw:text-white"
            data-testid="media-card-badge"
          >
            {badge}
          </span>
        ) : null}
        {isLocked ? (
          <span className="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:bg-white/60" aria-hidden="true">
            <Lock size={18} />
          </span>
        ) : null}
      </span>

      <span className="tw:flex tw:w-34 tw:items-center tw:gap-1">
        <span className="med-asset-cell__name tw:min-w-0 tw:flex-1 tw:truncate tw:text-left tw:text-[12px] tw:leading-[18px] tw:text-gray-900">
          {item.name}
        </span>
        {usageCount > 0 ? <UsagePips count={usageCount} /> : null}
      </span>

      {isApplied ? (
        <span
          className="med-asset-cell__applied-badge tw:absolute tw:right-1.5 tw:top-1.5 tw:rounded tw:bg-blue-700 tw:px-1.5 tw:text-[11px] tw:leading-4 tw:text-white"
          data-testid="media-card-applied"
        >
          APPLIED
        </span>
      ) : null}
    </Button>
  );
}
