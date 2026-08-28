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
 * (6, 56). They render from `assetSource`. This note used to say the badge
 * only failed for server-loaded assets, because `MediaAsset` has no such
 * column — which was true and was not the bug. `toLibraryItem` simply never
 * copied the field, so the badge was unreachable for every asset in every
 * session, including one saved from Stock a second earlier. Fixed in the
 * mapper 2026-08-17 after a live save produced a badgeless tile.
 *
 * Two gaps survive that fix, both real: the field is browser-only, so a
 * reload that rehydrates from the server drops it; and `"ai"` still has NO
 * writer anywhere in the repo — nothing ever sets it. `AI` is rendered here
 * because the day something generates an asset, this is the code that has to
 * already be right.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
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
  /** Selection mode is on — the card shows its check state (board 145:300). */
  selectable?: boolean;
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
  selectable = false,
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
  /*
    Click inserts; double-click opens the detail. Both were bound bare, and a
    double-click fires click, click, dblclick — so opening an asset's details
    dropped TWO copies of it on the page first. Measured on a blank project:
    0 user inserts read as "Used in 2 places", 1 as 3, 2 as 4 — a constant +2
    from the dblclick that opened the panel to read the number.

    So the click waits out the double-click window and cancels if a second one
    lands. Only when `onDoubleClick` is wired: selection mode has no
    double-click and its clicks should stay instant.
  */
  const clickTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => { if (clickTimer.current) clearTimeout(clickTimer.current); },
    [],
  );

  const handleClick = () => {
    if (!onDoubleClick) { onClick(item.key); return; }
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      onClick(item.key);
    }, 250);
  };

  const handleDoubleClick = () => {
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
    onDoubleClick?.(item.key);
  };

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
      onClick={handleClick}
      onDoubleClick={onDoubleClick ? handleDoubleClick : undefined}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, item.key) : undefined}
      aria-label={`${item.name} asset`}
      aria-pressed={selectable ? isSelected : undefined}
      data-testid="media-card"
    >
      <span className="med-asset-cell__thumb tw:relative tw:flex tw:items-center tw:justify-center tw:w-34 tw:h-19 tw:shrink-0 tw:overflow-hidden tw:rounded tw:bg-gray-100 tw:text-gray-500">
        {/* An image with no pre-cut thumb still IS an image — it used to fall
            through to the font branch and render "Aa" in place of the photo
            (walked live 2026-08-28: every fixture image showed the specimen).
            The specimen is for FONTS only; anything else unknown gets a
            neutral file glyph, never a fake typeface preview. */}
        {item.type === "img" && (item.thumb || item.src) ? (
          <img
            src={item.thumb || item.src}
            alt=""
            className="med-asset-cell__img tw:h-full tw:w-full tw:object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : item.type === "vid" ? (
          <Play size={18} aria-hidden="true" />
        ) : item.type === "ico" ? (
          <FileType size={18} aria-hidden="true" />
        ) : item.type === "fnt" ? (
          <span className="tw:text-[16px]" style={{ fontFamily: item.name }}>
            Aa
          </span>
        ) : (
          <FileType size={18} aria-hidden="true" />
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
        {selectable ? (
          <span
            className={[
              "tw:flex tw:h-4 tw:w-4 tw:flex-none tw:items-center tw:justify-center tw:rounded tw:border tw:text-[10px]",
              isSelected ? "tw:border-blue-700 tw:bg-blue-700 tw:text-white" : "tw:border-gray-300 tw:text-transparent",
            ].join(" ")}
            aria-hidden="true"
            data-testid="media-card-check"
          >
            ✓
          </span>
        ) : null}
        <span className="med-asset-cell__name tw:min-w-0 tw:flex-1 tw:truncate tw:text-left tw:text-[12px] tw:font-normal tw:leading-[18px] tw:text-gray-900">
          {item.displayName ?? item.name}
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
