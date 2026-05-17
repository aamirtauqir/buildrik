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

import { Button } from "@/editor/shared/vibcoder/Button";
import { Textarea } from "@/editor/shared/vibcoder/Textarea";
import { Download, FolderOpen, Pencil, Replace, Sparkles, Trash2, X } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine/Composer";
import type { LibraryItem } from "../../sidebar/tabs/media/data/mediaTypes";
import { fmtBytes } from "../utils/fmtBytes";

// P7 — alt-text upper bound matches the server prompt's "Under 125 characters" rule.
const ALT_TEXT_MAX = 125;

// ─── Toast contract (matches @/editor/shared/vibcoder useToast) ──────────

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
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div style={{ textAlign: "center", color: "var(--buildrick-text-disabled)" }}>
            <FolderOpen size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontSize: 13 }}>Select an asset to view details</div>
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
            {selectedItem.type.toUpperCase()} · {fmtBytes(selectedItem.size)}
          </div>
        </div>
        <div className="mgr-det-preview">
          {selectedItem.type === "img" || selectedItem.type === "vid" ? (
            <img src={selectedItem.src} alt={selectedItem.name} />
          ) : selectedItem.type === "ico" ? (
            <img src={selectedItem.src} alt={selectedItem.name} style={{ width: 64, height: 64 }} />
          ) : selectedItem.type === "fnt" ? (
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "var(--buildrick-text-primary)",
              }}
            >
              Aa Bb
            </span>
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
                <span className="mgr-kv-val">{fmtBytes(selectedItem.size)}</span>
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
                <div
                  key={v.key}
                  className={`mgr-version-row${v.key === selectedItem.key ? " active" : ""}`}
                  onClick={() => onSelectAsset(v.key)}
                >
                  <div className="mgr-version-thumb">
                    {v.thumb ? (
                      <img src={v.thumb || v.src} alt={v.name} />
                    ) : (
                      <span style={{ fontSize: 10 }}>{v.type.toUpperCase()}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--buildrick-text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.name}
                      {i === 0 && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 9,
                            background: "var(--buildrick-accent-tint)",
                            color: "var(--buildrick-text-primary)",
                            padding: "1px 5px",
                            borderRadius: 6,
                            fontWeight: 700,
                          }}
                        >
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--buildrick-text-disabled)" }}>
                      {fmtBytes(v.size)} · {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {i > 0 && v.key !== selectedItem.key && (
                    <Button
                      className="mgr-btn"
                      style={{ height: 24, fontSize: 10, padding: "0 8px" }}
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
                  )}
                </div>
              ))}
            </div>
          )}
          {detailTab === "used" && (
            <div>
              <div className="mgr-used-head">
                Used in <span className="mgr-used-count">{usageCount} places</span>
              </div>
              {usageCount === 0 ? (
                <div
                  style={{ fontSize: 12, color: "var(--buildrick-text-disabled)", padding: 8 }}
                >
                  Not used on any page yet
                </div>
              ) : (
                <div
                  style={{ fontSize: 12, color: "var(--buildrick-text-disabled)", padding: 8 }}
                >
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
      {replaceAllPickerOpen && (
        <div
          className="stock-modal-backdrop"
          onClick={() => setReplaceAllPickerOpen(false)}
        >
          <div
            className="stock-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(640px, 90vw)" }}
          >
            <div className="stock-modal-header">
              <h3 className="stock-modal-title">
                Replace "{selectedItem.name}" across {usageCount} use
                {usageCount !== 1 ? "s" : ""}
              </h3>
              <Button
                className="stock-modal-close"
                onClick={() => setReplaceAllPickerOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
            <div className="stock-modal-content">
              <p
                style={{
                  fontSize: 12,
                  color: "var(--buildrick-text-disabled)",
                  marginBottom: 12,
                }}
              >
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
                    <div
                      style={{
                        padding: "4px 6px",
                        fontSize: 11,
                        color: "var(--buildrick-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
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
            </div>
          </div>
        </div>
      )}
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
    <div data-testid="alt-text-section" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={`alt-text-${item.key}`}
        style={{ fontSize: 11, fontWeight: 600, color: "var(--buildrick-text-secondary)" }}
      >
        Alt text
      </label>
      <Textarea
        id={`alt-text-${item.key}`}
        value={item.altText ?? ""}
        maxLength={ALT_TEXT_MAX}
        rows={2}
        placeholder="Describe this image for screen readers"
        onChange={(e) => onUpdateAltText(item.key, e.target.value)}
        style={{
          width: "100%",
          fontSize: 12,
          padding: "6px 8px",
          borderRadius: 4,
          border: "1px solid var(--buildrick-border, #e2e8f0)",
          background: "var(--buildrick-bg-input, #fff)",
          color: "var(--buildrick-text-primary)",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 10,
          color: "var(--buildrick-text-disabled)",
        }}
      >
        {provenance ? (
          <span data-testid="alt-text-provenance" style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
            className="mgr-btn"
            style={{ height: 22, fontSize: 10, padding: "0 8px" }}
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
