/**
 * Aquibra Media Library Panel
 * Browse, upload, and manage media assets
 *
 * @module components/Media/MediaLibraryPanel
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { InputField, FileField } from "../../shared/forms";
import type { MediaAsset, MediaAssetType, MediaViewMode } from "../../shared/types/media";
import { Modal, Tabs, Button, Spinner } from "../../shared/ui";
import { useMediaManager } from "../shell/hooks";
import { AssetCard } from "./AssetCard";
import { ImageEditorModal } from "./ImageEditorModal";
import { mediaLibraryStyles as styles } from "./MediaLibraryStyles";
import { OptimizationPanel } from "./OptimizationPanel";
import { VideoPreview } from "./VideoPreview";

// ============================================
// Types
// ============================================

export interface MediaLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (asset: MediaAsset) => void;
  allowedTypes?: MediaAssetType[];
  multiple?: boolean;
  title?: string;
  composer?: Composer | null;
}

// ============================================
// Component
// ============================================

export const MediaLibraryPanel: React.FC<MediaLibraryPanelProps> = ({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = ["image", "video", "audio", "icon", "svg"],
  multiple = false,
  title = "Media Library",
  composer = null,
}) => {
  const {
    assets: allAssets,
    isLoading,
    uploadFile,
    deleteAsset,
    getAssets,
  } = useMediaManager(composer);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState("library");
  const [viewMode, setViewMode] = React.useState<MediaViewMode>("grid");
  const [urlInput, setUrlInput] = React.useState("");
  const [previewVideo, setPreviewVideo] = React.useState<MediaAsset | null>(null);
  const [editingAsset, setEditingAsset] = React.useState<MediaAsset | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // Get filtered assets based on search and type
  const assets = React.useMemo(() => {
    return getAssets({
      type: allowedTypes.length === 1 ? allowedTypes[0] : undefined,
      search: searchQuery || undefined,
    });
  }, [getAssets, allowedTypes, searchQuery, allAssets]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        await uploadFile(file);
      }
      setActiveTab("library");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;
    setUrlInput("");
    setActiveTab("library");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAsset(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSelect = (asset: MediaAsset) => {
    if (multiple) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) {
          next.delete(asset.id);
        } else {
          next.add(asset.id);
        }
        return next;
      });
    } else {
      onSelect?.(asset);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    const selected = assets.filter((a) => selectedIds.has(a.id));
    if (selected.length > 0 && onSelect) {
      onSelect(selected[0]);
      onClose();
    }
  };

  const handleImageEdited = (editedSrc: string) => {
    if (editingAsset) {
      // Update the asset with the new edited source
      editingAsset.src = editedSrc;
      editingAsset.updatedAt = new Date().toISOString();
    }
    setEditingAsset(null);
  };

  const filteredAssets = assets.filter((asset) => allowedTypes.includes(asset.type));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <Tabs
        tabs={[
          { id: "library", label: "Library" },
          { id: "upload", label: "Upload" },
          { id: "url", label: "From URL" },
          { id: "optimize", label: "Optimize" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div style={styles.container}>
        {activeTab === "library" && (
          <>
            {/* Toolbar */}
            <div style={styles.toolbar}>
              <div style={styles.searchInput}>
                <InputField
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={styles.viewToggle}>
                <Button
                  variant={viewMode === "grid" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>
            </div>

            {/* Assets Display */}
            {isLoading || uploading ? (
              <div style={styles.emptyState}>
                <Spinner size="lg" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
                <div>No assets found</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Upload files to get started</div>
              </div>
            ) : (
              <div style={viewMode === "grid" ? styles.grid : styles.listView}>
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedIds.has(asset.id)}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onPreviewVideo={setPreviewVideo}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "upload" && (
          <div style={styles.uploadArea}>
            <FileField
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleUpload}
              maxSize={10 * 1024 * 1024}
            />
          </div>
        )}

        {activeTab === "url" && (
          <div style={styles.uploadArea}>
            <InputField
              label="Asset URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <Button onClick={handleUrlAdd} disabled={!urlInput.trim()} style={{ marginTop: 12 }}>
              Add Asset
            </Button>
          </div>
        )}

        {activeTab === "optimize" && (
          <div style={styles.uploadArea}>
            {selectedIds.size > 0 ? (
              <>
                {(() => {
                  const selectedAsset = assets.find((a) => selectedIds.has(a.id));
                  if (selectedAsset && selectedAsset.type === "image") {
                    return (
                      <OptimizationPanel
                        imageSrc={selectedAsset.src}
                        onOptimized={(src) => {
                          selectedAsset.src = src;
                          selectedAsset.updatedAt = new Date().toISOString();
                          setActiveTab("library");
                        }}
                        onClose={() => setActiveTab("library")}
                      />
                    );
                  }
                  return (
                    <div
                      style={{ textAlign: "center", padding: 40, color: "var(--aqb-text-muted)" }}
                    >
                      Select an image to optimize
                    </div>
                  );
                })()}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: "var(--aqb-text-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
                <div>Select an image from the Library to optimize</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with selection info */}
      {multiple && selectedIds.size > 0 && (
        <div style={styles.footer}>
          <span style={{ color: "var(--aqb-text-secondary)", fontSize: 13 }}>
            {selectedIds.size} selected
          </span>
          <Button onClick={handleConfirmSelection}>Use Selected</Button>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPreview
          src={previewVideo.src}
          title={previewVideo.name}
          poster={previewVideo.thumbnailSrc}
          isModal
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}

      {/* Image Editor Modal */}
      {editingAsset && (
        <ImageEditorModal
          isOpen={!!editingAsset}
          imageSrc={editingAsset.src}
          onSave={handleImageEdited}
          onClose={() => setEditingAsset(null)}
        />
      )}
    </Modal>
  );
};

export default MediaLibraryPanel;
