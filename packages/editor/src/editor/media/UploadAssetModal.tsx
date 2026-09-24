/**
 * UploadAssetModal — "Upload an image", boards 4418:149160 → 4418:149235
 * (Upload) and 4418:160887 (From URL).
 *
 * Audit G3-061: picking an existing file is the Assets drawer's pick mode
 * (board 6764:59051, `sidebar/tabs/media/components/PickModePanel.tsx`); this
 * modal is what that drawer's `↑ Upload` and `From URL` links open. It
 * replaced the 3-tab "Choose an image" modal (Library · Upload · From URL),
 * whose Library tab was a second grid for the same job.
 *
 * Title · `For <element> · <Kind>` · the Upload | From URL segment · the drop
 * panel (`<name> · Ready to upload`, primary `Upload image`) · the hint from
 * the upload gate's own tables (`acceptedMedia.ts` — never a hand-written
 * "up to 10 MB") · Cancel. Once a file lands the panel becomes the cards —
 * the new file first and selected, then the two most recent of the field's
 * kind with their canvas usage — and the primary becomes `Use selected
 * image`. From URL opens the Import image from URL dialog over this one (the
 * library's own component); an import lands exactly like an upload, a
 * refusal is the Image could not be imported dialog with its Edit URL door.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { MediaAsset, MediaAssetType } from "../../shared/types/media";
import { Button, ModalBody, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";
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

export type UploadPane = "upload" | "url";

export interface UploadAssetModalProps {
  open: boolean;
  /** Which link opened it — `From URL` opens the import dialog straight away. */
  pane?: UploadPane;
  onClose: () => void;
  /** `Use selected image` — the asset goes to the field the pick is for. */
  onUse: (asset: MediaAsset) => void;
  allowedTypes?: MediaAssetType[];
  /** The element the pick is for ("Menu preview") — `For <it> · Image`. */
  forLabel?: string;
  composer?: Composer | null;
}

/* The segment: one bordered pill, the active half on the quiet grey. */
const SEGMENT = "tw:flex tw:w-[252px] tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:p-0.5";
const SEGMENT_BTN =
  "tw:h-7 tw:flex-1 tw:rounded tw:border-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-ink)] " +
  "tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const SEGMENT_ON = "tw:bg-[var(--bk-bg-subtle)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]";
const SEGMENT_OFF = "tw:bg-transparent tw:enabled:hover:bg-[var(--bk-bg-subtle)]";
const HINT = "tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const PANEL =
  "tw:flex tw:min-h-45 tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg " +
  "tw:bg-[var(--bk-bg-subtle)] tw:p-6 tw:text-center tw:text-[length:var(--bk-text-13)] tw:leading-5";
const GRID = "tw:grid tw:grid-cols-3 tw:gap-2";
const CARD =
  "tw:flex tw:flex-col tw:gap-1 tw:rounded-lg tw:border-2 tw:p-1.5 tw:text-left tw:cursor-pointer " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const CARD_OFF = "tw:border-transparent tw:hover:bg-[var(--bk-bg-subtle)]";
const CARD_ON = "tw:border-[var(--bk-accent)]";
const THUMB = "tw:block tw:aspect-video tw:w-full tw:rounded-md tw:bg-[var(--bk-gray-200)] tw:object-cover";
const NAME = "tw:truncate tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink)]";
const USAGE = "tw:flex tw:items-center tw:gap-1 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const DOT = "tw:inline-block tw:size-1.5 tw:rounded-full";

export function UploadAssetModal({
  open,
  pane = "upload",
  onClose,
  onUse,
  allowedTypes = ["image"],
  forLabel,
  composer = null,
}: UploadAssetModalProps) {
  const { uploadFile, getAssets } = useMediaManager(composer);
  const [landed, setLanded] = React.useState<MediaAsset | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importDraft, setImportDraft] = React.useState("");
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Every opening starts clean; `From URL` opens its dialog at once.
  React.useEffect(() => {
    if (!open) return;
    setLanded(null);
    setSelectedId(null);
    setPendingFile(null);
    setUploadError(null);
    setImportResult(null);
    setImportDraft("");
    setImportOpen(pane === "url");
  }, [open, pane]);

  const single = allowedTypes.length === 1;
  const kind = kindLabel(allowedTypes);
  const noun = single ? kindNoun(allowedTypes[0]) : "file";
  const article = /^[aeiou]/i.test(noun) ? "an" : "a";

  /* The landed file first, then the two most recent of the field's kind —
     a saved version (`versionOf`) is never a card of its own. */
  const cards = React.useMemo(() => {
    if (!landed) return [];
    const others = getAssets({ type: single ? allowedTypes[0] : undefined })
      .filter((a) => a.id !== landed.id && allowedTypes.includes(a.type) && !a.versionOf)
      .slice(0, 2);
    return [landed, ...others];
  }, [landed, getAssets, allowedTypes, single]);
  const selected = cards.find((a) => a.id === selectedId) ?? null;

  const usageOf = (asset: MediaAsset): number | null => (composer ? composer.mediaOps.getUsages(asset.src).count : null);

  const land = (asset: MediaAsset) => {
    setLanded(asset);
    setSelectedId(asset.id);
    setPendingFile(null);
    setUploadError(null);
  };

  const chooseFile = (files: FileList | File[] | null) => {
    const file = files ? Array.from(files)[0] : undefined;
    if (!file) return;
    setLanded(null);
    setPendingFile(file);
    setUploadError(null);
  };

  const uploadPending = async () => {
    if (!pendingFile || uploading) return;
    setUploading(true);
    try {
      const result = await uploadFile(pendingFile);
      if (result.success && result.asset) land(result.asset);
      else setUploadError(result.error ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const importFromUrl = async (url: string) => {
    try {
      const file = await fetchUrlAsFile(url, allowedTypes);
      const result = await uploadFile(file);
      if (result.success && result.asset) land(result.asset);
      else setImportResult({ kind: "failed", url, accepts: allowedTypes, reason: result.error });
    } catch {
      setImportResult({ kind: "failed", url, accepts: allowedTypes });
    }
  };

  const useSelected = () => {
    if (!selected) return;
    onUse(selected);
    onClose();
  };

  const segment = (id: UploadPane, label: string, onClick: () => void) => {
    const pressed = id === "url" ? importOpen : !importOpen;
    return (
      <Button
        type="button"
        size="xs"
        color="light"
        aria-pressed={pressed}
        className={`${SEGMENT_BTN} ${pressed ? SEGMENT_ON : SEGMENT_OFF}`}
        data-testid={`picker-tab-${id}`}
        onClick={onClick}
      >
        {label}
      </Button>
    );
  };

  const heading = `Upload ${article} ${noun}`;

  return (
    <ModalRoot open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="table" srTitle={heading} data-testid="picker">
        <h2 className={`${LIBRARY_MODAL_TITLE} tw:px-6 tw:pt-6 tw:pb-3`} data-testid="picker-title">
          {heading}
        </h2>
        <ModalBody className="tw:flex tw:min-h-0 tw:flex-col tw:gap-3">
          <p className={`${LIBRARY_MODAL_BODY} tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-soft)]`} data-testid="picker-for-label">
            {forLabel ? `For ${forLabel} · ${kind}` : kind}
          </p>

          <div role="group" aria-label="Source" className={SEGMENT} data-testid="picker-tabs">
            {segment("upload", "Upload", () => setImportOpen(false))}
            {segment("url", "From URL", () => {
              setImportDraft("");
              setImportOpen(true);
            })}
          </div>

          {landed ? (
            <div className={GRID} data-testid="picker-grid">
              {cards.map((asset) => {
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
                <span className="tw:text-[var(--bk-ink-soft)]">Drop {noun === "file" ? "a file" : `${article} ${noun}`} here, or</span>
              )}
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className={`${LIBRARY_MODAL_BTN_SECONDARY} tw:bg-[var(--bk-bg-card)]`}
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
            {landed
              ? `${kind} added · ${displayNameFor(landed.name, landed.mimeType)} selected. Use it to update this ${noun} element.`
              : `${acceptedFormats(allowedTypes)} · ${acceptedLimit(allowedTypes)} for this ${noun} field.`}
          </p>
        </ModalBody>

        <div className={`${LIBRARY_MODAL_FOOT} tw:justify-end tw:px-6 tw:pb-6`} data-testid="picker-foot">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className={`${LIBRARY_MODAL_BTN_SECONDARY} tw:min-w-21`}
            onClick={onClose}
            data-testid="picker-cancel"
          >
            Cancel
          </Button>
          {landed ? (
            <Button
              type="button"
              size="xs"
              className={`${LIBRARY_MODAL_BTN_PRIMARY} tw:min-w-34`}
              onClick={useSelected}
              disabled={!selected}
              data-testid="picker-use"
            >
              Use selected {noun}
            </Button>
          ) : (
            <Button
              type="button"
              size="xs"
              className={`${LIBRARY_MODAL_BTN_PRIMARY} tw:min-w-34`}
              onClick={() => void uploadPending()}
              disabled={!pendingFile || uploading}
              data-testid="picker-upload-go"
            >
              {uploading ? "Uploading…" : `Upload ${noun}`}
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
          onViewAsset={() => setImportResult(null)}
          onEditUrl={(url) => {
            setImportDraft(url);
            setImportOpen(true);
          }}
        />
      </ModalContent>
    </ModalRoot>
  );
}
