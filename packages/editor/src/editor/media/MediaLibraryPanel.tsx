/**
 * MediaLibraryPanel — the picker. Clone 3397:18325 "Choose an image".
 *
 * Opened by the inspector for ONE element's media field (`allowedTypes`,
 * `forLabel`). Title · `For <element> · <Kind>` · a segmented Library /
 * Upload / From URL · `Search library` over the field · 3-column cards
 * (thumb · name · `used ×N` / `Unused`, the usage from the canvas) with the
 * selected one on an accent border · the hint line · Cancel · `Use selected
 * image` (primary, disabled with nothing selected). Clicking a card SELECTS
 * it; only the primary hands it to the element and closes (3721:45178).
 *
 * Upload (3685:19960 → 3685:20037): the file chosen reads `<name> · Ready to
 * upload` with `Upload image` as the primary; once it lands the picker is
 * back on Library with the new file selected and the hint says so. From URL
 * (edge `Action / From URL|CLIC|OVE>3397:18835`): the Import image from URL
 * dialog opens OVER the picker — the same component the library uses; an
 * import lands the same way an upload does (3721:45102), a refusal is the
 * Image could not be imported dialog with its Edit URL door.
 *
 * Displaces V1 1164:4713 and drops what the Clone does not draw and nothing
 * depended on: the Optimize tab (the library rail's Optimize is the door),
 * the Grid/List toggle, click-to-close single select, the per-card delete
 * with its own confirm, the video preview modal and the `multiple` mode no
 * caller ever set. The hint reads the upload gate's own tables
 * (`acceptedMedia.ts`), not a hand-written "max 10 MB each".
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap) at the Clone's 720.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { MediaAsset, MediaAssetType } from "../../shared/types/media";
import { Button, ModalBody, ModalContent, ModalRoot, Spinner, TextInput } from "@/editor/chrome-ui";
import { useMediaManager } from "../shell/hooks";
import { acceptedFormats, acceptedLimit, acceptedMimes, kindLabel, kindNoun } from "@shared/constants/media";
import { displayNameFor } from "../sidebar/tabs/media/data/mediaUtils";
import { ImportUrlModal } from "./components/ImportUrlModal";
import { ImportResultModal, type ImportResult } from "./components/ImportResultModal";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./components/libraryModal";
import { fetchUrlAsFile } from "./fetchUrlAsFile";

export interface MediaLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (asset: MediaAsset) => void;
  allowedTypes?: MediaAssetType[];
  title?: string;
  /** The element the picker was opened for ("Menu preview") — `For <it> · Image`. */
  forLabel?: string;
  composer?: Composer | null;
}

const EVERY_PICKER_KIND: MediaAssetType[] = ["image", "video", "audio", "icon", "svg"];

/* The three doors sit in a row at the Clone's width; active = filled accent,
   the rest the family's quiet grey (3685:20037 / 3721:45102, the later
   section — 3397:18325's tinted Library loses to them). */
const TAB = "tw:min-w-29";
const LABEL = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink)]";
const HINT = "tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const GRID = "tw:grid tw:max-h-80 tw:grid-cols-3 tw:gap-2 tw:overflow-auto";
const CARD =
  "tw:flex tw:flex-col tw:gap-1 tw:rounded-lg tw:border-2 tw:p-1.5 tw:text-left tw:cursor-pointer " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const CARD_OFF = "tw:border-transparent tw:hover:bg-[var(--bk-bg-subtle)]";
const CARD_ON = "tw:border-[var(--bk-accent)]";
const THUMB = "tw:block tw:aspect-video tw:w-full tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:object-cover";
const NAME = "tw:truncate tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink)]";
const USAGE = "tw:flex tw:items-center tw:gap-1 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const DOT = "tw:inline-block tw:size-1.5 tw:rounded-full";
const PANEL =
  "tw:flex tw:min-h-30 tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-dashed " +
  "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:p-6 tw:text-center tw:text-[length:var(--bk-text-13)] tw:leading-5";

export const MediaLibraryPanel: React.FC<MediaLibraryPanelProps> = ({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = EVERY_PICKER_KIND,
  title = "Choose an image",
  forLabel,
  composer = null,
}) => {
  const { assets: allAssets, isLoading, uploadFile, getAssets } = useMediaManager(composer);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [pane, setPane] = React.useState<"library" | "upload">("library");
  /** The file just added by Upload or From URL — the hint names it (3685:20037). */
  const [added, setAdded] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importDraft, setImportDraft] = React.useState("");
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // A reopened picker starts on Library with nothing selected — the last
  // element's choice is never this element's.
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedId(null);
      setPane("library");
      setAdded(null);
      setPendingFile(null);
      setUploadError(null);
      setImportOpen(false);
      setImportResult(null);
    }
  }, [isOpen]);

  const single = allowedTypes.length === 1;
  const kind = kindLabel(allowedTypes);
  const noun = single ? kindNoun(allowedTypes[0]) : "file";
  const searchPlaceholder = single && (allowedTypes[0] === "image" || allowedTypes[0] === "video") ? `Search ${noun}s…` : "Search library…";

  const assets = React.useMemo(
    () =>
      getAssets({
        type: single ? allowedTypes[0] : undefined,
        search: searchQuery || undefined,
      }).filter((a) => allowedTypes.includes(a.type)),
    // `allAssets` is the subscription's tick — the same store the getter reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getAssets, allowedTypes, searchQuery, single, allAssets],
  );

  const selected = selectedId === null ? null : (assets.find((a) => a.id === selectedId) ?? null);

  const usageOf = (asset: MediaAsset): number | null => (composer ? composer.mediaOps.getUsages(asset.src).count : null);

  /* An upload or an import that landed: back on Library, the new file
     selected, the search cleared so it is on screen (3685:20037 / 3721:45102). */
  const landAsset = (asset: MediaAsset) => {
    setSearchQuery("");
    setPane("library");
    setSelectedId(asset.id);
    setAdded(displayNameFor(asset.name, asset.mimeType));
    setPendingFile(null);
    setUploadError(null);
  };

  const chooseFile = (files: FileList | File[] | null) => {
    const file = files ? Array.from(files)[0] : undefined;
    if (!file) return;
    setPendingFile(file);
    setUploadError(null);
  };

  const uploadPending = async () => {
    if (!pendingFile || uploading) return;
    setUploading(true);
    try {
      const result = await uploadFile(pendingFile);
      if (result.success && result.asset) landAsset(result.asset);
      else setUploadError(result.error ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const importFromUrl = async (url: string) => {
    try {
      const file = await fetchUrlAsFile(url, allowedTypes);
      const result = await uploadFile(file);
      if (result.success && result.asset) landAsset(result.asset);
      else setImportResult({ kind: "failed", url, accepts: allowedTypes, reason: result.error });
    } catch {
      setImportResult({ kind: "failed", url, accepts: allowedTypes });
    }
  };

  const useSelected = () => {
    if (!selected) return;
    onSelect?.(selected);
    onClose();
  };

  const tab = (id: "library" | "upload" | "url", label: string, pressed: boolean, onClick: () => void) => (
    <Button
      type="button"
      size="xs"
      variant={pressed ? undefined : "secondary"}
      aria-pressed={pressed}
      className={`${TAB} ${pressed ? LIBRARY_MODAL_BTN_PRIMARY : LIBRARY_MODAL_BTN_SECONDARY}`}
      data-testid={`picker-tab-${id}`}
      onClick={onClick}
    >
      {label}
    </Button>
  );

  return (
    <ModalRoot open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg" srTitle={title} data-testid="picker">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="picker-title">
          {title}
        </h2>
        <ModalBody className="tw:flex tw:min-h-0 tw:flex-col tw:gap-3">
          <p className={LIBRARY_MODAL_BODY} data-testid="picker-for-label">
            {forLabel ? `For ${forLabel} · ${kind}` : kind}
          </p>

          <div role="group" aria-label="Source" className="tw:flex tw:gap-2" data-testid="picker-tabs">
            {tab("library", "Library", pane === "library" && !importOpen, () => setPane("library"))}
            {tab("upload", "Upload", pane === "upload" && !importOpen, () => setPane("upload"))}
            {tab("url", "From URL", importOpen, () => {
              setImportDraft("");
              setImportOpen(true);
            })}
          </div>

          <p className={LABEL} data-testid="picker-search-label">
            Search library
          </p>
          <TextInput
            type="search"
            placeholder={searchPlaceholder}
            aria-label="Search library"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="picker-search"
            className="tw:-mt-2"
          />

          {pane === "library" ? (
            isLoading ? (
              <div className="tw:flex tw:min-h-30 tw:items-center tw:justify-center">
                <Spinner size="lg" />
              </div>
            ) : assets.length === 0 ? (
              <p className={PANEL} data-testid="picker-empty">
                {searchQuery
                  ? `Nothing matches "${searchQuery}".`
                  : `No ${noun}s in your library yet. Upload one or import it from a URL.`}
              </p>
            ) : (
              <div className={GRID} data-testid="picker-grid">
                {assets.map((asset) => {
                  const pressed = asset.id === selectedId;
                  const count = usageOf(asset);
                  const thumb = asset.thumbnailSrc || (asset.type === "image" || asset.type === "svg" ? asset.src : undefined);
                  return (
                    <div
                      key={asset.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={pressed}
                      data-testid={`picker-card-${asset.id}`}
                      className={`${CARD} ${pressed ? CARD_ON : CARD_OFF}`}
                      onClick={() => setSelectedId(asset.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(asset.id);
                        }
                      }}
                    >
                      {thumb ? <img src={thumb} alt="" className={THUMB} /> : <span className={THUMB} aria-hidden="true" />}
                      {/* The library's name — the engine stores the stem. */}
                      <span className={NAME}>{displayNameFor(asset.name, asset.mimeType)}</span>
                      {count !== null ? (
                        <span className={USAGE} data-testid={`picker-card-usage-${asset.id}`}>
                          <span
                            className={`${DOT} ${count > 0 ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-gray-300)]"}`}
                            aria-hidden="true"
                          />
                          {count > 0 ? `used ×${count}` : "Unused"}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div
              className={PANEL}
              data-testid="picker-upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                chooseFile(e.dataTransfer.files);
              }}
            >
              <TextInput
                ref={fileInputRef}
                type="file"
                accept={acceptedMimes(allowedTypes).join(",")}
                className="tw:hidden"
                onChange={(e) => {
                  chooseFile(e.target.files);
                  e.target.value = "";
                }}
                data-testid="picker-upload-input"
              />
              {pendingFile ? (
                <span className="tw:text-[var(--bk-ink)]" data-testid="picker-upload-ready">
                  {pendingFile.name} · Ready to upload
                </span>
              ) : (
                <span className="tw:text-[var(--bk-ink-soft)]">Drop {noun === "file" ? "a file" : `an ${noun}`} here, or</span>
              )}
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className={LIBRARY_MODAL_BTN_SECONDARY}
                data-testid="picker-upload-choose"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {pendingFile ? "Choose a different file" : "Choose file"}
              </Button>
              {uploadError ? (
                <span className="tw:text-[var(--bk-error-text)]" role="alert" data-testid="picker-upload-error">
                  {uploadError}
                </span>
              ) : null}
            </div>
          )}

          <p className={HINT} data-testid="picker-hint">
            {added && pane === "library"
              ? `${kind} added · ${added} selected. Use it to update this ${noun} element.`
              : `${acceptedFormats(allowedTypes)} · ${acceptedLimit(allowedTypes)} for this ${noun} field.`}
          </p>
        </ModalBody>

        <div className={LIBRARY_MODAL_FOOT} data-testid="picker-foot">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={onClose}
            data-testid="picker-cancel"
          >
            Cancel
          </Button>
          {pane === "upload" ? (
            <Button
              type="button"
              size="xs"
              className={LIBRARY_MODAL_BTN_PRIMARY}
              onClick={() => void uploadPending()}
              disabled={!pendingFile || uploading}
              data-testid="picker-upload-go"
            >
              {uploading ? "Uploading…" : `Upload ${noun}`}
            </Button>
          ) : (
            <Button
              type="button"
              size="xs"
              className={LIBRARY_MODAL_BTN_PRIMARY}
              onClick={useSelected}
              disabled={!selected}
              data-testid="picker-use"
            >
              Use selected {noun}
            </Button>
          )}
        </div>

        <ImportUrlModal
          open={importOpen}
          initialUrl={importDraft}
          onClose={() => setImportOpen(false)}
          onImport={importFromUrl}
        />
        <ImportResultModal
          result={importResult}
          onClose={() => setImportResult(null)}
          onViewAsset={() => setPane("library")}
          onEditUrl={(url) => {
            setImportDraft(url);
            setImportOpen(true);
          }}
        />
      </ModalContent>
    </ModalRoot>
  );
};

export default MediaLibraryPanel;
