/**
 * Asset Card Component
 * Displays a single media asset in the library
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset } from "../../shared/types/media";
import { assetCardStyles as styles } from "./MediaLibraryStyles";

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
    return <img src={asset.thumbnailSrc || asset.src} alt={asset.name} style={styles.thumbnail} />;
  }

  if (asset.type === "video") {
    return (
      <div
        style={{
          ...styles.thumbnail,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          position: "relative",
        }}
      >
        {asset.thumbnailSrc && (
          <img
            src={asset.thumbnailSrc}
            alt={asset.name}
            style={{ ...styles.thumbnail, position: "absolute", inset: 0 }}
          />
        )}
        <span style={{ position: "relative", zIndex: 1 }}>🎬</span>
        {onPreviewVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreviewVideo(asset);
            }}
            title="Preview video"
            style={styles.previewBtn}
          >
            ▶ Preview
          </button>
        )}
      </div>
    );
  }

  // Audio or other types
  return (
    <div
      style={{
        ...styles.thumbnail,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
      }}
    >
      {asset.type === "audio" ? "🎵" : "📁"}
    </div>
  );
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
      background: linear-gradient(135deg, #89b4fa 0%, #b4befe 100%);
      border-radius: 8px;
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
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
        cursor: draggable ? "grab" : "pointer",
      }}
    >
      <AssetThumbnail asset={asset} onPreviewVideo={onPreviewVideo} />
      <div style={styles.info}>
        <div style={styles.name}>{asset.name}</div>
        <div style={styles.meta}>
          {formatSize(asset.size)}
          {asset.width && asset.height && ` • ${asset.width}×${asset.height}`}
        </div>
      </div>
      <button onClick={(e) => onDelete(asset.id, e)} style={styles.deleteBtn}>
        ✕
      </button>
    </div>
  );
};

export default AssetCard;
