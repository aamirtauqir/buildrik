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
import { Button, ConfirmDialog, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, Spinner, Tabs } from "@/editor/chrome-ui";
import { useMediaManager } from "../shell/hooks";
import { AssetCard } from "./AssetCard";
import { OptimizationPanel } from "./OptimizationPanel";
import { VideoPreview } from "./VideoPreview";

const EMPTY = "tw:p-15 tw:text-center tw:text-gray-500";
const PAD = "tw:p-5";
/** Both scroll containers cap at the same height as the panel body. */
const GRID = "tw:grid tw:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] tw:gap-3 tw:p-1 tw:max-h-100 tw:overflow-auto";
const LIST = "tw:flex tw:flex-col tw:gap-2 tw:max-h-100 tw:overflow-auto";
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
  /**
   * Board 1164:4713 subtitles the modal with the element that asked for it
   * ("for Hero · Image"). A picker opened from a selection with no idea what
   * it is picking for is the same modal as the library, and the user has to
   * remember which one they are in.
   */
  forLabel?: string;
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
  title = "Choose an image",
  forLabel,
  composer = null,
}) => {
  const {
    assets: allAssets,
    isLoading,
    uploadFile,
    deleteAsset,
    updateAsset,
    getAssets,
  } = useMediaManager(composer);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState("library");
  const [viewMode, setViewMode] = React.useState<MediaViewMode>("grid");
  const [previewVideo, setPreviewVideo] = React.useState<MediaAsset | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const confirmDeleteAsset = async () => {
    if (!pendingDeleteId) return;
    await deleteAsset(pendingDeleteId);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(pendingDeleteId);
      return next;
    });
    setPendingDeleteId(null);
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

  const filteredAssets = assets.filter((asset) => allowedTypes.includes(asset.type));

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg">
        <ModalTitle>
          {title}
          {forLabel ? (
            <span className="tw:ml-2 tw:text-[12px] tw:font-normal tw:text-[var(--bk-ink-muted)]">
              for {forLabel}
            </span>
          ) : null}
        </ModalTitle>
        <ModalClose aria-label="Close modal" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ModalClose>
        <ModalBody>
    <Tabs
      tabs={[
        { id: "library", label: "Library" },
        { id: "upload", label: "Upload" },
        { id: "url", label: "From URL" },
        { id: "optimize", label: "Optimize" },
      ]}
      value={activeTab}
      onChange={setActiveTab}
    />

    <div className="tw:flex tw:flex-col tw:gap-4 tw:min-h-100">
      {activeTab === "library" && (
        <>
          {/* Toolbar */}
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:flex-1">
              <InputField
                placeholder="Search library…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="tw:flex tw:gap-1">
              <Button
                color={viewMode === "grid" ? undefined : "light"}
                size="xs"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? undefined : "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"}
              >
                Grid
              </Button>
              <Button
                color={viewMode === "list" ? undefined : "light"}
                size="xs"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? undefined : "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"}
              >
                List
              </Button>
            </div>
          </div>

          {/* Assets Display */}
          {isLoading || uploading ? (
            <div className={EMPTY}>
              <Spinner size="lg" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className={EMPTY}>
              <div className="tw:mb-3 tw:text-5xl">📁</div>
              <div>No assets found</div>
              <div className="tw:mt-1 tw:text-xs">Upload files to get started</div>
            </div>
          ) : (
            <div className={viewMode === "grid" ? GRID : LIST}>
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
        <div className={PAD}>
          <FileField
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleUpload}
            maxSize={10 * 1024 * 1024}
          />
        </div>
      )}

      {activeTab === "url" && (
        <div className="tw:px-6 tw:py-10 tw:text-center">
          <div className="tw:mb-4 tw:text-4xl">🔗</div>
          <div className="tw:mb-2 tw:font-semibold">Import from URL — coming soon</div>
          <div className="tw:text-[13px] tw:leading-normal tw:text-gray-500">
            Paste an image or video URL to import it directly.
            <br />
            This feature is launching soon.
          </div>
        </div>
      )}

      {activeTab === "optimize" && (
        <div className={PAD}>
          {selectedIds.size > 0 ? (
            <>
              {(() => {
                const selectedAsset = assets.find((a) => selectedIds.has(a.id));
                if (selectedAsset && selectedAsset.type === "image") {
                  return (
                    <OptimizationPanel
                      imageSrc={selectedAsset.src}
                      onOptimized={async (src) => {
                        await updateAsset(selectedAsset.id, {
                          src,
                          updatedAt: new Date().toISOString(),
                        });
                        setActiveTab("library");
                      }}
                      onClose={() => setActiveTab("library")}
                    />
                  );
                }
                return (
                  <div
                    className="tw:p-10 tw:text-center tw:text-gray-500"
                  >
                    Select an image to optimize
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="tw:p-10 tw:text-center tw:text-gray-500">
              <div className="tw:mb-3 tw:text-5xl">🖼️</div>
              <div>Select an image from the Library to optimize</div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Footer with selection info */}
    {selectedIds.size > 0 && (
      <div className="tw:flex tw:items-center tw:justify-between tw:mt-4 tw:pt-4 tw:border-t tw:border-gray-200">
        <span className="tw:text-[13px] tw:text-[var(--bk-ink-soft)]">
          {selectedIds.size} selected
        </span>
        <Button onClick={handleConfirmSelection}>Use Selected</Button>
      </div>
    )}

    {/*
      Board 1164:4713's footnote. It names the limits BEFORE a file is picked
      — including that From URL is still a stub, which this tab really is
      (it renders "coming soon"). A tab that looks live and is not is worse
      than one that says so.
    */}
    <p className="tw:mt-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
      Upload tab accepts image/video/audio · max 10 MB each · From URL launches soon
    </p>

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

    {/* Delete confirmation — shared ConfirmDialog substrate (P5, was a
        hand-rolled fixed overlay at zIndex 9999 with no focus trap). */}
    <ConfirmDialog
      open={pendingDeleteId != null}
      onClose={() => setPendingDeleteId(null)}
      onConfirm={() => void confirmDeleteAsset()}
      title="Delete file?"
      message={`"${filteredAssets.find((a) => a.id === pendingDeleteId)?.name ?? "This file"}" will be permanently deleted. This cannot be undone.`}
      confirmLabel="Delete"
      destructive
    />
        </ModalBody>
      </ModalContent>
    </ModalRoot>
  );
};

export default MediaLibraryPanel;
