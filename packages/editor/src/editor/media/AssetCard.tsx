/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * Asset Card Component
 * Displays a single media asset in the library
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset } from "../../shared/types/media";
import { Button } from "@/editor/chrome-ui";

const THUMB = "tw:block tw:w-full tw:h-25 tw:object-cover tw:bg-[var(--bk-bg-subtle)]";
const THUMB_FALLBACK = `${THUMB} tw:relative tw:flex tw:items-center tw:justify-center tw:text-3xl`;
/** Overlay control on the thumbnail — white on a dark scrim, so it stays
 *  legible over any asset. */
const OVERLAY_BTN = "tw:absolute tw:border-0 tw:text-white tw:text-xs";

export interface AssetCardProps {
  asset: MediaAsset;
  isSelected: boolean;
  onSelect: (asset: MediaAsset) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onPreviewVideo?: (asset: MediaAsset) => void;
  /** Enable dragging to canvas */
  draggable?: boolean;
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render thumbnail based on asset type
 */
const AssetThumbnail: React.FC<{
  asset: MediaAsset;
  onPreviewVideo?: (asset: MediaAsset) => void;
}> = ({ asset, onPreviewVideo }) => {
  if (asset.type === "image" || asset.type === "svg") {
    return <img src={asset.thumbnailSrc || asset.src} alt={asset.name} className={THUMB} />;
  }

  if (asset.type === "video") {
    return (
      <div className={THUMB_FALLBACK}>
        {asset.thumbnailSrc && (
          <img src={asset.thumbnailSrc} alt={asset.name} className={`${THUMB} tw:absolute tw:inset-0`} />
        )}
        <span className="tw:relative tw:z-[1]">🎬</span>
        {onPreviewVideo && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewVideo(asset);
            }}
            title="Preview video"
            className={`${OVERLAY_BTN} tw:bottom-1 tw:left-1 tw:z-[2] tw:px-2 tw:py-1 tw:rounded tw:bg-black/70`}
          >
            ▶ Preview
          </Button>
        )}
      </div>
    );
  }

  // Audio or other types
  return <div className={THUMB_FALLBACK}>{asset.type === "audio" ? "🎵" : "📁"}</div>;
};

/**
 * Single asset card component
 */
export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  onSelect,
  onDelete,
  onPreviewVideo,
  draggable = true,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Set drag data for canvas drop
    const dragData = {
      type: "media-asset",
      assetType: asset.type,
      src: asset.src,
      name: asset.name,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.setData("text/plain", asset.src);
    e.dataTransfer.effectAllowed = "copy";

    // Create custom drag image using safe DOM methods
    const ghost = document.createElement("div");
    ghost.style.cssText = `
      position: absolute;
      left: -9999px;
      padding: 8px 12px;
      background: var(--bk-accent);
      border-radius: var(--bk-radius-lg);
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const icon = document.createElement("span");
    icon.style.fontSize = "16px";
    icon.textContent = asset.type === "image" ? "🖼️" : asset.type === "video" ? "🎬" : "📁";
    ghost.appendChild(icon);

    const label = document.createElement("span");
    label.textContent = asset.name;
    ghost.appendChild(label);

    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);

    // Clean up ghost after drag
    requestAnimationFrame(() => {
      document.body.removeChild(ghost);
    });
  };

  return (
    <div
      onClick={() => onSelect(asset)}
      draggable={draggable && (asset.type === "image" || asset.type === "video")}
      onDragStart={handleDragStart}
      className={`tw:relative tw:overflow-hidden tw:rounded-lg tw:bg-[var(--bk-bg-panel)] ${
        draggable ? "tw:cursor-grab" : "tw:cursor-pointer"
      } ${
        isSelected
          ? "tw:border-2 tw:border-[var(--bk-accent)] tw:[box-shadow:0_0_0_2px_var(--bk-alpha-accent-15)]"
          : "tw:border tw:border-gray-200"
      }`}
    >
      <AssetThumbnail asset={asset} onPreviewVideo={onPreviewVideo} />
      <div className="tw:p-2">
        <div className="tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-xs tw:font-medium">
          {asset.name}
        </div>
        <div className="tw:mt-0.5 tw:text-xs tw:text-[var(--bk-ink-muted)]">
          {formatSize(asset.size)}
          {asset.width && asset.height && ` • ${asset.width}×${asset.height}`}
        </div>
      </div>
      {/* The destructive control on every asset card was a bare "✕" glyph with
          no accessible name, so a screen reader announced the delete button on
          each tile as the multiplication sign. The name has to carry WHICH
          file, because the grid repeats this button once per asset. */}
      <Button
        aria-label={`Delete ${asset.name}`}
        title={`Delete ${asset.name}`}
        onClick={(e) => onDelete(asset.id, e)}
        className={`${OVERLAY_BTN} tw:top-1 tw:right-1 tw:flex tw:items-center tw:justify-center tw:size-6 tw:p-0 tw:rounded-full tw:bg-black/60`}
      >
        ✕
      </Button>
    </div>
  );
};

export default AssetCard;
