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

import { Sparkles, X } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine/Composer";
import type { LibraryItem } from "../../sidebar/tabs/media/data/mediaTypes";
import { formatBytes } from "@shared/utils/helpers/number";
import {
  Button,
  IconButton,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalRoot,
  ModalTitle,
  TextInput,
  Textarea,
  VersionRow,
} from "@/editor/chrome-ui";
import { LIBRARY_MODAL_BTN_SECONDARY } from "./libraryModal";

/** Small dense button matching the panel's `mgr-btn` chrome. */
const MINI_BTN = "tw:h-6 tw:px-2 tw:py-0 tw:text-[length:var(--bk-text-11)]";
/* The rail's tag chip — the same pill the folder rail draws (1160:44 /
   3695:45155: 8/3, full radius, --bk-border edge on bg-panel, 11 ink-soft),
   with a 16 × inside it. A span, not a button: the × is the control. */
const TAG_CHIP =
  "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] " +
  "tw:py-[3px] tw:pl-2 tw:pr-1 tw:text-[length:var(--bk-text-11)] tw:leading-[14px] tw:text-[var(--bk-ink-soft)]";
const TAG_CHIP_REMOVE = "tw:h-4 tw:w-4 tw:rounded-full tw:text-[var(--bk-ink-muted)]";
/** A tag is one word or two, never a sentence. */
const TAG_MAX = 24;
const MUTED_SM = "tw:text-xs tw:text-[var(--bk-ink-disabled)]";
/* The rail's full-width 32 buttons (3705:20396 / 4215:26635 / 3699:20381):
   flowbite `xs` IS h-8; the accent fill is `.mgr-btn-primary`'s own, and the
   quiet grey Clear selection is the same fill as the dialogs' Cancel. */
const RAIL_PRIMARY = "mgr-btn-primary tw:w-full tw:shrink-0 tw:justify-center";
const RAIL_QUIET = `${LIBRARY_MODAL_BTN_SECONDARY} tw:w-full tw:shrink-0`;
/* 4215:26635 / 3699:20381 — the checked files, one 12 line each. */
const FILE_LIST = "tw:m-0 tw:mt-2 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink)]";
// P7 — alt-text upper bound matches the server prompt's "Under 125 characters" rule.
const ALT_TEXT_MAX = 125;

/** "PNG" / "MP4" / "WOFF2" — the filename's own extension, else the MIME subtype. */
function fileExt(item: LibraryItem): string {
  const fromName = (item.displayName ?? item.name).match(/\.([a-z0-9]+)$/i)?.[1];
  const raw = fromName ?? item.mimeType.split("/")[1]?.split("+")[0] ?? item.type;
  return (raw === "jpeg" ? "jpg" : raw).toUpperCase();
}

/** "220 KB" / "1.1 MB" — one decimal only past a megabyte, as the board prints. */
function shortBytes(bytes: number): string {
  return formatBytes(bytes, bytes >= 1024 * 1024 ? 1 : 0);
}

/** "Aug 4" — the board's added-on date. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
  /** Clone 3695:19968 / 4215:26635 — while the library is in select mode the
   *  rail is about the CHECKED set, not one file: "No assets selected" with
   *  its hint, or "N assets selected" with the filenames, Move to folder
   *  (primary) and Clear selection. Exactly one checked file is that file's
   *  full rail (3705:21059) — the orchestrator passes it as `selectedItem`
   *  with `bulk` null; Phase 1's "1 asset selected" hint (3695:20154) is
   *  displaced by the later section. */
  bulk?: { names: string[]; onMove(): void; onClear(): void } | null;
  /** Clone 3699:20381 / 3683:19964 — the result of the last move, on top of
   *  every other state until the selection or the scope changes: "Moved to
   *  <Folder>", which files moved and which were already there, the file
   *  list, View destination (primary) and Clear selection. */
  moveResult?: {
    folderName: string;
    names: string[];
    moved: string[];
    alreadyThere: string[];
    onView(): void;
    onClear(): void;
  } | null;
  /** Clone 4207:26629 — the rail is dimmed and inert while an asset is
   *  being dragged over the folders. */
  dimmed?: boolean;
  versions: LibraryItem[];
  usageCount: number;
  /** Page names the asset is placed on — the USED IN line names them
   *  ("1 place — Menu preview"). Empty when the pages cannot be traced. */
  usedIn: string[];
  /** All library items (for the replace-all picker). */
  libraryItems: LibraryItem[];
  /** Pass-through to set the highlighted version row in versions tab. */
  onSelectAsset(key: string): void;
  /** Insert into canvas (orchestrator's state.insertToCanvas). */
  onInsert(key: string): void;
  /** "Edit" button on image assets — orchestrator routes to image editor. */
  onEditImage(item: LibraryItem): void | Promise<void>;
  /** "Optimize" on image assets. The optimizer used to be a tab on the PICKER
   *  modal (`MediaLibraryPanel`), so the only way to reach it was to be
   *  mid-way through choosing an image for an element — the manager, where a
   *  user actually manages assets, had no optimize control at all. */
  onOptimizeImage?(item: LibraryItem): void;
  /** "Rename" button on non-image assets — opens rename overlay. */
  onOpenRename(item: LibraryItem): void;
  /** Delete request (orchestrator's state.requestDelete). */
  onRequestDelete(key: string): void;
  /** Clone 3708:20650 — the delete confirm's "Replace instead" opens THIS
   *  rail's replace-across picker for the asset, so the orchestrator may own
   *  the picker's open state. Omitted, the panel keeps it itself. */
  replacePickerOpen?: boolean;
  onReplacePickerOpenChange?(open: boolean): void;
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
  /**
   * BLOCKERS C3 (authority `code:tag-writer`) — write the file's whole tag
   * list back. The Clone draws the TAGS chips (3695:45155) and the tag filter
   * (3721:43697) but no editor, and nothing wrote a tag; the block only
   * renders when the orchestrator hands it this writer.
   */
  onUpdateTags?(key: string, tags: string[]): void;
  /**
   * Clone 3696:21550 / 3705:21059 — a font's `Manage font` opens the Site
   * fonts dialog (3686:42317) on THIS file. The orchestrator answers it
   * with the composer event the dialog listens for; the row is drawn only
   * when it does.
   */
  onManageFont?(item: LibraryItem): void;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AssetDetailsPanel({
  selectedItem,
  bulk = null,
  moveResult = null,
  dimmed = false,
  versions,
  usageCount,
  usedIn,
  libraryItems,
  onSelectAsset,
  onInsert,
  onEditImage,
  onOptimizeImage,
  onOpenRename,
  onRequestDelete,
  replacePickerOpen,
  onReplacePickerOpenChange,
  composer,
  addToast,
  onUpdateAltText,
  onRegenerateAltText,
  onUpdateTags,
  onManageFont,
}: AssetDetailsPanelProps) {
  const [localPickerOpen, setLocalPickerOpen] = React.useState(false);
  const replaceAllPickerOpen = replacePickerOpen ?? localPickerOpen;
  const setReplaceAllPickerOpen = onReplacePickerOpenChange ?? setLocalPickerOpen;
  const [regenerating, setRegenerating] = React.useState(false);
  /* 4207:26629 — dimmed and inert while an asset is dragged over the folders:
     the drop is the only thing the pointer is doing. */
  const railClass = `mgr-details${dimmed ? " tw:pointer-events-none tw:opacity-50" : ""}`;

  if (moveResult) {
    const { moved, alreadyThere } = moveResult;
    /* 3699:20381 names the files when some were already in the destination;
       3683:19964 counts them when every one moved. */
    const body =
      alreadyThere.length === 0
        ? `${moved.length} ${moved.length === 1 ? "asset" : "assets"} moved successfully. Their existing site placements are unchanged.`
        : `${moved.length > 0 ? `${moved.join(", ")} moved; ` : ""}${alreadyThere.join(", ")} ${
            alreadyThere.length === 1 ? "was" : "were"
          } already here. Site placements are unchanged.`;
    return (
      <div className={railClass} data-testid="mgr-details" data-dimmed={dimmed || undefined}>
        <div className="mgr-det-body" data-testid="mgr-det-move-result">
          <h3 className="mgr-det-heading" data-testid="mgr-det-move-result-title">
            Moved to {moveResult.folderName}
          </h3>
          <p className="mgr-det-hint" data-testid="mgr-det-move-result-body">
            {body}
          </p>
          <ul className={FILE_LIST} data-testid="mgr-det-files">
            {moveResult.names.map((name) => (
              <li key={name} className="tw:truncate">{name}</li>
            ))}
          </ul>
          <div className="mgr-det-actions mgr-det-actions--inline" data-testid="mgr-det-bulk-actions">
            <Button size="xs" className={RAIL_PRIMARY} data-testid="mgr-det-view-destination" onClick={moveResult.onView}>
              View destination
            </Button>
            <Button size="xs" variant="secondary" className={RAIL_QUIET} data-testid="mgr-det-clear-selection" onClick={moveResult.onClear}>
              Clear selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (bulk) {
    const n = bulk.names.length;
    return (
      <div className={railClass} data-testid="mgr-details" data-dimmed={dimmed || undefined}>
        <div className="mgr-det-body" data-testid="mgr-det-bulk">
          <h3 className="mgr-det-heading">{n === 0 ? "No assets selected" : `${n} ${n === 1 ? "asset" : "assets"} selected`}</h3>
          <p className="mgr-det-hint">
            {n === 0
              ? "Select a file to inspect it. Select checkboxes to manage multiple assets."
              : `Actions apply to ${n === 2 ? "both" : `all ${n}`} selected files. Moving files only changes library organisation.`}
          </p>
          {/* 4215:26635 — the files, then Move to folder (primary) and Clear
              selection, right under the hint. Delete stays in the bar. */}
          {n > 0 && (
            <>
              <ul className={FILE_LIST} data-testid="mgr-det-files">
                {bulk.names.map((name) => (
                  <li key={name} className="tw:truncate">{name}</li>
                ))}
              </ul>
              <div className="mgr-det-actions mgr-det-actions--inline" data-testid="mgr-det-bulk-actions">
                <Button size="xs" className={RAIL_PRIMARY} data-testid="mgr-det-move-to-folder" onClick={bulk.onMove}>
                  Move to folder
                </Button>
                <Button size="xs" variant="secondary" className={RAIL_QUIET} data-testid="mgr-det-clear-selection" onClick={bulk.onClear}>
                  Clear selection
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className={railClass} data-testid="mgr-details" data-dimmed={dimmed || undefined}>
        {/* Clone 3695:45155 — one line at the rail's top, no icon, where the
            details will appear. --bk-ink-disabled on white is 1.47:1, so the
            line is ink-soft. */}
        <div className="tw:p-4 tw:text-[13px] tw:text-[var(--bk-ink-soft)]">
          Select an asset to see details.
        </div>
      </div>
    );
  }

  const replaceCandidates = libraryItems.filter(
    (i) => i.key !== selectedItem.key && i.type === selectedItem.type,
  );

  /* Clone 3695:20340 — one column, top to bottom: preview · filename · meta
     line · ALT TEXT · VERSIONS · USED IN · stacked actions. The V1 rail's
     three tabs and its Type/Dimensions/MIME grid are displaced: the meta line
     says the same in one row ("1600 × 1200 · 220 KB · PNG · added Aug 4"),
     and a version or a usage is on screen without a tab click first. */
  const ext = fileExt(selectedItem);
  const isImage = selectedItem.type === "img" || selectedItem.type === "ico";
  const isFont = selectedItem.type === "fnt";
  /* 3696:21550 (Phase 5): a font's line says which of the model's two states
     it is in — uploaded (in the library) or added (a site font the pickers
     offer) — since the two look identical in the grid. */
  const metaLine =
    selectedItem.width && selectedItem.height
      ? `${selectedItem.width} × ${selectedItem.height} · ${shortBytes(selectedItem.size)} · ${ext} · added ${shortDate(selectedItem.createdAt)}`
      : isFont
        ? `${selectedItem.siteFont ? "Site font · added" : "Uploaded · not added"} · ${ext}`
        : `Selected asset · ${ext}`;
  const usedLine =
    usageCount === 0
      ? "Not used on this site"
      : usedIn.length > 0
        ? `${usageCount} ${usageCount === 1 ? "place" : "places"} — ${usedIn.join(", ")}`
        : `Used in ${usageCount} ${usageCount === 1 ? "place" : "places"}`;

  return (
    <>
      <div className={railClass} data-testid="mgr-details" data-dimmed={dimmed || undefined}>
        <div className="mgr-det-body">
          <div className="mgr-det-preview">
            {selectedItem.type === "img" ? (
              <img src={selectedItem.src} alt={selectedItem.name} />
            ) : selectedItem.type === "vid" ? (
              /* A video is not an <img>: that rendered a broken image with the
                 filename as its alt (measured, Clone walk 2026-09-13). The
                 first frame is the preview the board's grey tile stands for. */
              <video src={selectedItem.src} muted playsInline preload="metadata" data-testid="mgr-det-video" />
            ) : selectedItem.type === "ico" ? (
              <img src={selectedItem.src} alt={selectedItem.name} className="tw:size-16" />
            ) : isFont ? (
              <span className="tw:text-5xl tw:font-bold tw:text-[var(--bk-ink)]">Aa Bb</span>
            ) : null}
          </div>
          <div className="mgr-det-filename">{selectedItem.displayName ?? selectedItem.name}</div>
          <div className="mgr-det-meta" data-testid="mgr-det-meta">{metaLine}</div>

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

          {onUpdateTags && <TagsSection item={selectedItem} onUpdateTags={onUpdateTags} />}

          {versions.length > 1 && (
            <section className="mgr-det-section" data-testid="mgr-det-versions">
              <h4 className="mgr-det-label">Versions</h4>
              <div className="mgr-version-list">
                {versions.map((v, i) => (
                  <VersionRow
                    key={v.key}
                    title={v.name}
                    meta={i === 0 ? "" : shortDate(v.createdAt)}
                    current={i === 0}
                    selected={v.key === selectedItem.key}
                    onClick={() => onSelectAsset(v.key)}
                    leading={
                      <span className="mgr-version-thumb">
                        {v.thumb ? (
                          <img src={v.thumb || v.src} alt={v.name} />
                        ) : (
                          <span className="tw:text-[length:var(--bk-text-11)]">{v.type.toUpperCase()}</span>
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
            </section>
          )}

          <section className="mgr-det-section" data-testid="mgr-det-used">
            <h4 className="mgr-det-label">Used in</h4>
            <p className="mgr-det-used-line">{usedLine}</p>
          </section>
        </div>

        {/* Per type (phase1-journeys.md, J-B table): images and SVGs get the
            full set; a video has no Edit image; a font is neither inserted
            nor replaced across the site — Manage font · Rename · Delete
            (3696:21550 / 3705:21059; Manage font opens the Site fonts
            dialog, 3686:42317, on this file, and is drawn in the board's
            quiet fill). Insert to canvas is the PRIMARY: 3705:20396 and
            4207:26629 (the later section) draw it filled, over
            3695:20340's outlined one. */}
        <div className="mgr-det-actions" data-testid="mgr-det-actions">
          {!isFont && (
            <Button size="xs" className={RAIL_PRIMARY} onClick={() => onInsert(selectedItem.key)}>
              Insert to canvas
            </Button>
          )}
          {isFont && onManageFont && (
            <Button
              size="xs"
              variant="secondary"
              className={RAIL_QUIET}
              onClick={() => onManageFont(selectedItem)}
              data-testid="mgr-det-manage-font"
            >
              Manage font
            </Button>
          )}
          {isImage ? (
            <div className="mgr-det-actions-row">
              <Button className="mgr-btn" onClick={() => onEditImage(selectedItem)}>
                Edit image
              </Button>
              <Button className="mgr-btn" onClick={() => onOpenRename(selectedItem)}>
                Rename
              </Button>
            </div>
          ) : (
            <Button className="mgr-btn" onClick={() => onOpenRename(selectedItem)}>
              Rename
            </Button>
          )}
          {!isFont && (
            <Button
              className="mgr-btn"
              disabled={usageCount === 0}
              title={usageCount === 0 ? "Nothing on the site uses this asset yet" : undefined}
              onClick={() => setReplaceAllPickerOpen(true)}
            >
              Replace across site…
            </Button>
          )}
          {/* Not on the Clone. The optimiser's only other door is the picker
              modal, which is reachable only mid-way through choosing an image
              for an element; Phase 6 folds Optimise into the editor dialog and
              this row goes with it. */}
          {selectedItem.type === "img" && onOptimizeImage && (
            <Button className="mgr-btn" onClick={() => onOptimizeImage(selectedItem)}>
              Optimize
            </Button>
          )}
          <Button className="mgr-btn danger" onClick={() => onRequestDelete(selectedItem.key)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Replace-all picker modal — co-located with the panel that
          launches it because it only exists while selectedItem is set. */}
      <ModalRoot open={replaceAllPickerOpen} onOpenChange={setReplaceAllPickerOpen}>
        <ModalContent size="lg">
          <ModalTitle>
            Replace "{selectedItem.displayName ?? selectedItem.name}" across {usageCount} use
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
    <div data-testid="alt-text-section" className="mgr-det-section">
      <label htmlFor={`alt-text-${item.key}`} className="mgr-det-label">
        Alt text
      </label>
      <Textarea
        className="tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700"
        id={`alt-text-${item.key}`}
        value={item.altText ?? ""}
        maxLength={ALT_TEXT_MAX}
        rows={2}
        placeholder="Add a description for this image"
        onChange={(e) => onUpdateAltText(item.key, e.target.value)}
      />
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-disabled)]">
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

// ─── TagsSection (BLOCKERS C3, authority code:tag-writer) ───────────────────

interface TagsSectionProps {
  item: LibraryItem;
  onUpdateTags(key: string, tags: string[]): void;
}

/**
 * The file's tags as chips with ×, and an Add tag field: Enter adds the
 * entry lower-cased and trimmed, capped at TAG_MAX, never empty, never a
 * duplicate (a repeat just clears the field — the chip is already there).
 * Under ALT TEXT, above VERSIONS / USED IN; drawn for every file type.
 */
function TagsSection({ item, onUpdateTags }: TagsSectionProps) {
  const [draft, setDraft] = React.useState("");
  const tags = item.tags ?? [];

  const add = () => {
    const tag = draft.trim().toLowerCase().slice(0, TAG_MAX);
    if (!tag) return;
    setDraft("");
    if (tags.includes(tag)) return;
    onUpdateTags(item.key, [...tags, tag]);
  };

  return (
    <section className="mgr-det-section" data-testid="mgr-det-tags">
      <label htmlFor={`tag-input-${item.key}`} className="mgr-det-label">
        Tags
      </label>
      {tags.length > 0 && (
        <div className="tw:flex tw:flex-wrap tw:gap-1.5" data-testid="mgr-det-tag-list">
          {tags.map((tag) => (
            <span key={tag} className={TAG_CHIP} data-testid={`mgr-det-tag-${tag}`}>
              {tag}
              <IconButton
                size="sm"
                label={`Remove tag ${tag}`}
                className={TAG_CHIP_REMOVE}
                onClick={() =>
                  onUpdateTags(
                    item.key,
                    tags.filter((t) => t !== tag),
                  )
                }
              >
                <X size={10} />
              </IconButton>
            </span>
          ))}
        </div>
      )}
      <TextInput
        id={`tag-input-${item.key}`}
        data-testid="mgr-det-tag-input"
        value={draft}
        maxLength={TAG_MAX}
        placeholder="Add tag"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          add();
        }}
      />
    </section>
  );
}
