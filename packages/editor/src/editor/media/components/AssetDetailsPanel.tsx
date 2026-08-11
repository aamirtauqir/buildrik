/**
 * AssetDetailsPanel — D5 Stage 2 extraction (audit-remediation 2026-05-08).
 *
 * The RIGHT-rail "details + versions + used in" panel lifted out of
 * LibraryManager. Bundles its tab state (`detailTab`) and the
 * replace-all picker modal (`replaceAllPickerOpen`) together because
 * the picker only exists while a selectedItem is active — they're a
 * single concern from the panel's perspective.
 *
 * Pre-extraction: lines 611-778 (RIGHT JSX) + 862-922 (replace-all
 * picker overlay) of LibraryManager.tsx.
 *
 * `versions`, `usageCount`, and `selectedItem` are computed by the
 * orchestrator (they depend on `state.libraryItems` and the composer's
 * usage map) and passed in as props.
 *
 * @license BSD-3-Clause
 */

import { Download, FolderOpen, Pencil, Replace, Sparkles, Trash2, X } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine/Composer";
import type { LibraryItem } from "../../sidebar/tabs/media/data/mediaTypes";
import { formatBytes } from "@shared/utils/helpers/number";
import {
  Button,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalRoot,
  ModalTitle,
  Textarea,
  VersionRow,
} from "@/editor/chrome-ui";

/** Small dense button matching the panel's `mgr-btn` chrome. */
const MINI_BTN = "tw:h-6 tw:px-2 tw:py-0 tw:text-[10px]";
const MUTED_SM = "tw:text-xs tw:text-[var(--bk-ink-disabled)]";
// P7 — alt-text upper bound matches the server prompt's "Under 125 characters" rule.
const ALT_TEXT_MAX = 125;

// ─── Toast contract (matches @/editor/chrome-ui useToast) ───────────────────────

type ToastTone = "info" | "success" | "error" | "warning";
interface ToastInput {
  description: string;
  tone?: ToastTone;
  duration?: number;
}

// ─── Props ────────────────────────────────────────────────────────────────

export interface AssetDetailsPanelProps {
  selectedItem: LibraryItem | null;
  versions: LibraryItem[];
  usageCount: number;
  /** All library items (for the replace-all picker). */
  libraryItems: LibraryItem[];
  /** Pass-through to set the highlighted version row in versions tab. */
  onSelectAsset(key: string): void;
  /** Insert into canvas (orchestrator's state.insertToCanvas). */
  onInsert(key: string): void;
  /** "Edit" button on image assets — orchestrator routes to image editor. */
  onEditImage(item: LibraryItem): void | Promise<void>;
  /** "Rename" button on non-image assets — opens rename overlay. */
  onOpenRename(item: LibraryItem): void;
  /** Delete request (orchestrator's state.requestDelete). */
  onRequestDelete(key: string): void;
  /** Composer for replaceAcross + (transitively) the version revert button. */
  composer: Composer;
  addToast(t: ToastInput): void;
  /**
   * P7 — write user-typed alt text back to the engine. Implementations
   * should also clear `generatedMetadata.altText` so the provenance chip
   * disappears once the user edits (the chip is misleading if the text
   * is no longer the AI's output).
   */
  onUpdateAltText?(key: string, altText: string): void;
  /**
   * P7 — fire `media.generateAltText` for this asset. Returns the result
   * so the panel can show a toast; null on failure or when the server
   * preserved an existing user-typed alt text.
   */
  onRegenerateAltText?(key: string): Promise<{ altText: string; skipped: boolean } | null>;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AssetDetailsPanel({
  selectedItem,
  versions,
  usageCount,
  libraryItems,
  onSelectAsset,
  onInsert,
  onEditImage,
  onOpenRename,
  onRequestDelete,
  composer,
  addToast,
  onUpdateAltText,
  onRegenerateAltText,
}: AssetDetailsPanelProps) {
  const [detailTab, setDetailTab] = React.useState<"details" | "versions" | "used">("details");
  const [replaceAllPickerOpen, setReplaceAllPickerOpen] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);

  if (!selectedItem) {
    return (
      <div className="mgr-details">
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-8">
          <div className="tw:text-center tw:text-[var(--bk-ink-disabled)]">
            <FolderOpen size={32} className="tw:mb-3 tw:opacity-40" />
            {/* Board 1163:13947 — "see", and the sentence ends. */}
            <div className="tw:text-[13px]">Select an asset to see details.</div>
          </div>
        </div>
      </div>
    );
  }

  const replaceCandidates = libraryItems.filter(
    (i) => i.key !== selectedItem.key && i.type === selectedItem.type,
  );

  return (
    <>
      <div className="mgr-details">
        <div className="mgr-det-head">
          <div className="mgr-det-filename">{selectedItem.name}</div>
          <div className="mgr-det-sub">
            {selectedItem.type.toUpperCase()} · {formatBytes(selectedItem.size)}
          </div>
        </div>
        <div className="mgr-det-preview">
          {selectedItem.type === "img" || selectedItem.type === "vid" ? (
            <img src={selectedItem.src} alt={selectedItem.name} />
          ) : selectedItem.type === "ico" ? (
            <img src={selectedItem.src} alt={selectedItem.name} className="tw:size-16" />
          ) : selectedItem.type === "fnt" ? (
            <span className="tw:text-5xl tw:font-bold tw:text-gray-900">Aa Bb</span>
          ) : null}
        </div>
        <div className="mgr-det-tabs">
          <Button
            className={`mgr-det-tab${detailTab === "details" ? " active" : ""}`}
            onClick={() => setDetailTab("details")}
          >
            Details
          </Button>
          {versions.length > 1 && (
            <Button
              className={`mgr-det-tab${detailTab === "versions" ? " active" : ""}`}
              onClick={() => setDetailTab("versions")}
            >
              Versions · {versions.length}
            </Button>
          )}
          <Button
            className={`mgr-det-tab${detailTab === "used" ? " active" : ""}`}
            onClick={() => setDetailTab("used")}
          >
            Used in · {usageCount}
          </Button>
        </div>
        <div className="mgr-det-body">
          {detailTab === "details" && (
            <>
              <div className="mgr-kv">
                <span className="mgr-kv-key">Type</span>
                <span className="mgr-kv-val">{selectedItem.type.toUpperCase()}</span>
                {selectedItem.width && selectedItem.height && (
                  <>
                    <span className="mgr-kv-key">Dimensions</span>
                    <span className="mgr-kv-val">
                      {selectedItem.width} × {selectedItem.height} px
                    </span>
                  </>
                )}
                <span className="mgr-kv-key">File size</span>
                <span className="mgr-kv-val">{formatBytes(selectedItem.size)}</span>
                <span className="mgr-kv-key">MIME</span>
                <span className="mgr-kv-val">{selectedItem.mimeType}</span>
                <span className="mgr-kv-key">Added</span>
                <span className="mgr-kv-val">
                  {new Date(selectedItem.createdAt).toLocaleDateString()}
                </span>
              </div>
              {selectedItem.type === "img" && onUpdateAltText && (
                <AltTextSection
                  item={selectedItem}
                  regenerating={regenerating}
                  onUpdateAltText={onUpdateAltText}
                  onRegenerateAltText={onRegenerateAltText}
                  setRegenerating={setRegenerating}
                  addToast={addToast}
                />
              )}
            </>
          )}
          {detailTab === "versions" && (
            <div className="mgr-version-list">
              {versions.map((v, i) => (
                <VersionRow
                  key={v.key}
                  title={v.name}
                  meta={`${formatBytes(v.size)} · ${new Date(v.createdAt).toLocaleString()}`}
                  current={i === 0}
                  selected={v.key === selectedItem.key}
                  onClick={() => onSelectAsset(v.key)}
                  leading={
                    <span className="mgr-version-thumb">
                      {v.thumb ? (
                        <img src={v.thumb || v.src} alt={v.name} />
                      ) : (
                        <span className="tw:text-[10px]">{v.type.toUpperCase()}</span>
                      )}
                    </span>
                  }
                  actions={
                    i > 0 && v.key !== selectedItem.key ? (
                      <Button
                        className={`mgr-btn ${MINI_BTN}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Revert: replace all usages of current version with this one.
                          if (versions[0]) {
                            composer.mediaOps.replaceAcross(versions[0].src, v.src);
                            addToast({ description: `Reverted to ${v.name}`, tone: "success" });
                          }
                        }}
                      >
                        Revert
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
          {detailTab === "used" && (
            <div>
              <div className="mgr-used-head">
                Used in <span className="mgr-used-count">{usageCount} places</span>
              </div>
              {usageCount === 0 ? (
                <div className={`tw:p-2 ${MUTED_SM}`}>Not used on any page yet</div>
              ) : (
                <div className={`tw:p-2 ${MUTED_SM}`}>
                  {usageCount} element{usageCount !== 1 ? "s" : ""} reference this asset
                </div>
              )}
            </div>
          )}
          <div className="mgr-det-actions">
            <Button className="mgr-btn" onClick={() => onInsert(selectedItem.key)}>
              <Download size={12} />
              Insert
            </Button>
            {/* Bug #1 fix: Edit → image editor for images, rename overlay otherwise. */}
            <Button
              className="mgr-btn"
              onClick={() => {
                if (selectedItem.type === "img") {
                  onEditImage(selectedItem);
                } else {
                  onOpenRename(selectedItem);
                }
              }}
            >
              <Pencil size={12} />
              {selectedItem.type === "img" ? "Edit" : "Rename"}
            </Button>
            {/* Bug #5 fix: Replace all opens library picker instead of URL prompt. */}
            {usageCount > 0 && (
              <Button className="mgr-btn" onClick={() => setReplaceAllPickerOpen(true)}>
                <Replace size={12} />
                Replace all
              </Button>
            )}
            <Button
              className="mgr-btn danger"
              onClick={() => onRequestDelete(selectedItem.key)}
            >
              <Trash2 size={12} />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Replace-all picker modal — co-located with the panel that
          launches it because it only exists while selectedItem is set. */}
      <ModalRoot open={replaceAllPickerOpen} onOpenChange={setReplaceAllPickerOpen}>
        <ModalContent size="lg">
          <ModalTitle>
            Replace "{selectedItem.name}" across {usageCount} use
            {usageCount !== 1 ? "s" : ""}
          </ModalTitle>
          <ModalClose aria-label="Close replace picker">
            <X size={18} />
          </ModalClose>
          <ModalBody>
            <p className={`tw:mb-3 ${MUTED_SM}`}>
              Pick a replacement asset. All canvas usages will be swapped atomically
              (one undo reverses everything).
            </p>
            <div className="med-grid" data-cols="3">
              {replaceCandidates.map((i) => (
                <div
                  key={i.key}
                  className="med-img-card"
                  onClick={() => {
                    const result = composer.mediaOps.replaceAcross(selectedItem.src, i.src);
                    if (result.replaced.length > 0) {
                      addToast({
                        description: `Replaced in ${result.replaced.length} element${result.replaced.length > 1 ? "s" : ""}`,
                        tone: "success",
                      });
                    }
                    if (result.failed.length > 0) {
                      addToast({
                        description: `${result.failed.length} replacement${result.failed.length > 1 ? "s" : ""} failed`,
                        tone: "error",
                      });
                    }
                    setReplaceAllPickerOpen(false);
                  }}
                >
                  <div className="med-img-card-bg">
                    {i.thumb || i.type === "img" || i.type === "vid" ? (
                      <img src={i.thumb || i.src} alt={i.name} loading="lazy" />
                    ) : null}
                  </div>
                  <div className="tw:px-1.5 tw:py-1 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-[11px] tw:text-[var(--bk-ink-soft)]">
                    {i.name}
                  </div>
                </div>
              ))}
            </div>
            {replaceCandidates.length === 0 && (
              <div className="stock-empty">
                No other {selectedItem.type === "img" ? "images" : "assets of the same type"} in
                your library.
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </ModalRoot>
    </>
  );
}

// ─── AltTextSection (P7) ──────────────────────────────────────────────────

interface AltTextSectionProps {
  item: LibraryItem;
  regenerating: boolean;
  setRegenerating(v: boolean): void;
  onUpdateAltText(key: string, altText: string): void;
  onRegenerateAltText?(key: string): Promise<{ altText: string; skipped: boolean } | null>;
  addToast(t: ToastInput): void;
}

function AltTextSection({
  item,
  regenerating,
  setRegenerating,
  onUpdateAltText,
  onRegenerateAltText,
  addToast,
}: AltTextSectionProps) {
  const provenance = item.generatedAltMeta;

  const handleRegenerate = async () => {
    if (!onRegenerateAltText) return;
    setRegenerating(true);
    try {
      const result = await onRegenerateAltText(item.key);
      if (!result) {
        addToast({ description: "Couldn't generate alt text — try again later", tone: "error" });
        return;
      }
      if (result.skipped) {
        addToast({
          description: "Kept your alt text instead of overwriting",
          tone: "info",
        });
        return;
      }
      addToast({ description: "Alt text regenerated", tone: "success" });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div data-testid="alt-text-section" className="tw:flex tw:flex-col tw:gap-1.5 tw:mt-4">
      <label
        htmlFor={`alt-text-${item.key}`}
        className="tw:text-[11px] tw:font-semibold tw:text-[var(--bk-ink-soft)]"
      >
        Alt text
      </label>
      <Textarea
        className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
        id={`alt-text-${item.key}`}
        value={item.altText ?? ""}
        maxLength={ALT_TEXT_MAX}
        rows={2}
        placeholder="Describe this image for screen readers"
        onChange={(e) => onUpdateAltText(item.key, e.target.value)}
      />
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-[10px] tw:text-[var(--bk-ink-disabled)]">
        {provenance ? (
          <span data-testid="alt-text-provenance" className="tw:flex tw:items-center tw:gap-1">
            <Sparkles size={10} />
            AI-generated by {provenance.model} on{" "}
            {new Date(provenance.generatedAt).toLocaleDateString()}
          </span>
        ) : (
          <span>{(item.altText ?? "").length} / {ALT_TEXT_MAX}</span>
        )}
        {onRegenerateAltText && (
          <Button
            data-testid="alt-text-regenerate"
            className={`mgr-btn ${MINI_BTN}`}
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <Sparkles size={10} />
            {regenerating ? "Generating…" : provenance ? "Regenerate" : "Generate"}
          </Button>
        )}
      </div>
    </div>
  );
}
