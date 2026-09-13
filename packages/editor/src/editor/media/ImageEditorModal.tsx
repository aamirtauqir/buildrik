/**
 * ImageEditorModal — Clone 3397:39917 "S3.6 · media · image-editor" (960 ×
 * 740, section 4184:26629), which re-draws V1's 1124:4527.
 *
 * Head: `Edit image` · `<library name> · <intrinsic W × H>` · the tab chips
 * Crop / Adjust / Resize / Optimise. Body: LEFT the preview well with the
 * mono status `<out W × H> · <crop preset> · <format>` and `Reset all`,
 * RIGHT the active tab's controls (`image-editor/ImageEditorTabs.tsx`).
 * Foot: the draft note · Cancel · Save version. One draft
 * (`image-editor/imageEdits.ts`) survives every tab switch — the foot says
 * so.
 *
 * The model is the Clone's: Save creates a VERSION of the same asset and
 * applying it to the site is a separate step. So a successful save does not
 * close the dialog — it turns into the Saved state (3681:20026): no tab row,
 * the saved bytes in the well, `Version saved` with the edits summary, and
 * `‹ Back to editor` / `Done`. Done hands off to the host's `onDone` (P6-V
 * opens Asset versions from it) and closes.
 *
 * Cancel on a dirty draft asks first (3695:45549 `DiscardEditsModal`);
 * Escape and the scrim go through the same door. A rejected `onSave` opens
 * 3695:45542 `SaveFailedModal` over the untouched draft; Retry re-runs the
 * SAME bytes and snapshot.
 *
 * Save version is disabled only while the Resize entry is invalid — a
 * plain re-encode with no edit is a legitimate version (it is what the
 * library's Optimize door asks for), and every unsaved board draws the
 * button enabled on a clean draft.
 *
 * Mounted through `OverlayMount` with its own frame rather than
 * `ModalContent`: the shared frame caps at 80vh, which is 720 on the 900-high
 * canvas this card is drawn for, and two `max-h` utilities on one element
 * resolve by stylesheet order, not by intent.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { Button, OverlayMount } from "@/editor/chrome-ui";
import { estimateSize, loadImage } from "@/engine/media/MediaOptimizerHelpers";
import { DiscardEditsModal } from "./components/DiscardEditsModal";
import { SaveFailedModal } from "./components/SaveFailedModal";
import {
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
} from "./components/libraryModal";
import {
  ASPECT_CHIPS,
  EDITOR_TABS,
  INITIAL_DRAFT,
  buildCssFilter,
  describeEdits,
  isDraftDirty,
  outputSize,
  snapshotEdits,
  sourceFormatOf,
  statusLine,
  validateResize,
  type EditsSnapshot,
  type ImageDraft,
  type ImageEditorTab,
  type OutputSize,
} from "./image-editor/imageEdits";
import { AdjustControls, CropControls, OptimiseControls, ResizeControls } from "./image-editor/ImageEditorTabs";
import { renderImageEdits } from "./image-editor/renderImageEdits";

export type { EditsSnapshot, ImageEditorTab } from "./image-editor/imageEdits";
export { describeEdits } from "./image-editor/imageEdits";

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  /** The file's library name — the head prints `<name> · <W × H>`. */
  fileName?: string;
  /**
   * Receives the encoded version and the edits it was made with. A returned
   * promise is awaited: resolve → the Saved state, reject → the failure
   * dialog with the draft kept. A one-argument handler from before the
   * Clone (`(dataUrl) => …`) still type-checks and still gets the bytes.
   */
  onSave: (dataUrl: string, edits: EditsSnapshot) => void | Promise<void>;
  /** The Saved state's Done — the host opens Asset versions from here. */
  onDone?: () => void;
  /** Which tab opens first; the library's Optimize door asks for "optimise". */
  initialTab?: ImageEditorTab;
}

interface SavedVersion {
  dataUrl: string;
  edits: EditsSnapshot;
}

const ESTIMATE_DEBOUNCE_MS = 300;

// ── Classes ─────────────────────────────────────────────────────────────────

const FRAME =
  "tw:z-[60] tw:flex tw:h-[740px] tw:max-h-[calc(100vh-2rem)] tw:w-[960px] tw:max-w-[calc(100vw-2rem)] tw:flex-col " +
  "tw:overflow-hidden tw:rounded-xl tw:bg-[var(--bk-bg-elevated)] tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)]";
const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]";
const SUBTITLE = "tw:m-0 tw:mt-1 tw:text-[length:var(--bk-text-13)] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
/* The tab chips: 32 high, equal width, the selected one on the accent TINT
   (3397:39917 `Crop`, 3695:43319 `Adjust`), the rest on the quiet grey. */
const TAB_REST = `${LIBRARY_MODAL_BTN_SECONDARY} tw:w-28 tw:px-0`;
const TAB_ON =
  `${LIBRARY_MODAL_BTN_SECONDARY} tw:w-28 tw:px-0 tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)] ` +
  "tw:enabled:hover:bg-[var(--bk-accent-tint)]";
const PREVIEW_CARD =
  "tw:flex tw:min-h-0 tw:flex-col tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:p-4";
const WELL =
  "tw:relative tw:min-h-0 tw:flex-1 tw:overflow-hidden tw:rounded-[var(--bk-radius-md)] tw:border tw:border-dashed " +
  "tw:border-[var(--bk-gray-300)] tw:bg-[var(--bk-bg-subtle)]";
const STATUS =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-soft)]";
const FOOT_NOTE = "tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const SUMMARY_LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

// ── Component ───────────────────────────────────────────────────────────────

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  fileName,
  onSave,
  onDone,
  initialTab = "crop",
}) => {
  const [tab, setTab] = React.useState<ImageEditorTab>(initialTab);
  const [draft, setDraft] = React.useState<ImageDraft>(INITIAL_DRAFT);
  /* What "unchanged" means for Cancel: the draft as opened, then the draft as
     last saved — after a save there is nothing left to lose. */
  const [baseline, setBaseline] = React.useState<ImageDraft>(INITIAL_DRAFT);
  const [cropPixels, setCropPixels] = React.useState<Area>({ x: 0, y: 0, width: 0, height: 0 });
  const [intrinsic, setIntrinsic] = React.useState<OutputSize | null>(null);
  const [imageError, setImageError] = React.useState(false);
  const [originalBytes, setOriginalBytes] = React.useState(0);
  const [estimatedBytes, setEstimatedBytes] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState<SavedVersion | null>(null);
  const [failed, setFailed] = React.useState<SavedVersion | null>(null);
  const [discarding, setDiscarding] = React.useState(false);

  const patch = React.useCallback((changes: Partial<ImageDraft>) => setDraft((d) => ({ ...d, ...changes })), []);

  /* The file's own size for the head and the Resize note, and a probe for a
     dead blob: URL — the library's stored src can outlive its session. */
  React.useEffect(() => {
    if (!isOpen || !imageSrc) return;
    let alive = true;
    loadImage(imageSrc)
      .then((img) => {
        if (!alive) return;
        setIntrinsic({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        setImageError(false);
      })
      .catch(() => {
        if (alive) setImageError(true);
      });
    estimateSize(imageSrc).then((bytes) => {
      if (alive) setOriginalBytes(bytes);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, imageSrc]);

  const crop: OutputSize = React.useMemo(
    () => ({ width: Math.round(cropPixels.width), height: Math.round(cropPixels.height) }),
    [cropPixels.width, cropPixels.height],
  );
  const output = outputSize(draft, crop);
  const sourceFormat = React.useMemo(() => sourceFormatOf(fileName, imageSrc), [fileName, imageSrc]);
  const resizeValid = draft.width === "" && draft.height === "" ? true : validateResize(draft.width, draft.height).ok;
  const dirty = isDraftDirty(draft, baseline);

  /* The Optimise estimate: the draft encoded at the chosen format and quality
     through the same function Save uses, measured, dropped. Debounced so a
     slider drag does not encode on every tick. */
  React.useEffect(() => {
    if (!isOpen || tab !== "optimise" || saved || imageError || crop.width === 0) return;
    let alive = true;
    setEstimatedBytes(null);
    const timer = setTimeout(() => {
      renderImageEdits(imageSrc, draft, cropPixels)
        .then((dataUrl) => estimateSize(dataUrl))
        .then((bytes) => {
          if (alive) setEstimatedBytes(bytes);
        })
        .catch(() => {
          // The box keeps "…" — a failed estimate is not a failed save.
        });
    }, ESTIMATE_DEBOUNCE_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [isOpen, tab, saved, imageError, imageSrc, draft, cropPixels, crop.width]);

  const onCropComplete = React.useCallback((_: Area, pixels: Area) => setCropPixels(pixels), []);

  /* One save path for the button and the failure dialog's Retry: the retry
     re-sends the bytes that failed, never a re-render of a draft that may
     have moved. */
  const runSave = React.useCallback(
    async (version: SavedVersion) => {
      setSaving(true);
      try {
        await onSave(version.dataUrl, version.edits);
        setFailed(null);
        setSaved(version);
        setBaseline(draft);
      } catch {
        setFailed(version);
      } finally {
        setSaving(false);
      }
    },
    [onSave, draft],
  );

  const handleSave = React.useCallback(async () => {
    if (saving || !resizeValid) return;
    setSaving(true);
    let dataUrl: string;
    try {
      dataUrl = await renderImageEdits(imageSrc, draft, cropPixels);
    } catch {
      setSaving(false);
      setFailed({ dataUrl: "", edits: snapshotEdits(draft, output, sourceFormat) });
      return;
    }
    await runSave({ dataUrl, edits: snapshotEdits(draft, output, sourceFormat) });
  }, [saving, resizeValid, imageSrc, draft, cropPixels, output, sourceFormat, runSave]);

  const handleRetry = React.useCallback(() => {
    if (!failed) return;
    if (failed.dataUrl) void runSave(failed);
    else void handleSave();
  }, [failed, runSave, handleSave]);

  const requestCancel = React.useCallback(() => {
    if (saved) {
      onClose();
      return;
    }
    if (dirty) setDiscarding(true);
    else onClose();
  }, [saved, dirty, onClose]);

  if (!isOpen) return null;

  const subtitle = [fileName, intrinsic ? `${intrinsic.width} × ${intrinsic.height}` : null].filter(Boolean).join(" · ");

  return (
    <OverlayMount open={isOpen} onClose={requestCancel} dirty={dirty && !saved} labelledBy="image-editor-title">
      <div className={FRAME} data-testid="image-editor-card">
        {/* Head */}
        <div className="tw:shrink-0 tw:px-6 tw:pt-6 tw:pb-4">
          <h2 id="image-editor-title" className={TITLE} data-testid="image-editor-title">
            Edit image
          </h2>
          {subtitle && (
            <p className={SUBTITLE} data-testid="image-editor-subtitle">
              {subtitle}
            </p>
          )}
          {!saved && (
            <div className="tw:mt-4 tw:flex tw:gap-2" role="tablist" aria-label="Editor sections" data-testid="image-editor-tabs">
              {EDITOR_TABS.map((t) => (
                <Button
                  key={t.id}
                  size="xs"
                  variant="secondary"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? TAB_ON : TAB_REST}
                  data-testid={`image-editor-tab-${t.id}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="tw:flex tw:min-h-0 tw:flex-1 tw:gap-6 tw:bg-[var(--bk-bg-subtle)] tw:px-6 tw:py-6">
          <section className={`${PREVIEW_CARD} ${saved ? "tw:flex-1" : "tw:w-[510px] tw:shrink-0"}`} aria-label="Preview">
            <div className={WELL} data-testid="image-editor-well">
              {saved ? (
                <img src={saved.dataUrl} alt="Saved version" className="tw:size-full tw:object-contain" />
              ) : imageError ? (
                <div className="tw:flex tw:h-full tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:px-8 tw:text-center tw:text-[var(--bk-ink-soft)]">
                  <AlertTriangle size={24} aria-hidden="true" />
                  <span className="tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:text-[var(--bk-ink)]">
                    Image failed to load
                  </span>
                  <span className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                    The asset&apos;s URL may be stale. Reload the page, or upload the image again.
                  </span>
                </div>
              ) : (
                <Cropper
                  image={imageSrc}
                  crop={draft.crop}
                  zoom={draft.zoom}
                  rotation={draft.rotation}
                  aspect={ASPECT_CHIPS.find((a) => a.id === draft.aspect)?.ratio}
                  showGrid={false}
                  onCropChange={(crop: Point) => patch({ crop })}
                  onZoomChange={(zoom: number) => patch({ zoom })}
                  onCropComplete={onCropComplete}
                  style={{
                    mediaStyle: {
                      filter: buildCssFilter(draft),
                      transform: `scaleX(${draft.flipH ? -1 : 1}) scaleY(${draft.flipV ? -1 : 1})`,
                      transformOrigin: "center center",
                    },
                  }}
                />
              )}
            </div>
            <div className="tw:mt-4 tw:flex tw:h-8 tw:items-center tw:justify-between tw:border-t tw:border-[var(--bk-border)] tw:pt-4">
              <span className={STATUS} data-testid="image-editor-status">
                {statusLine(draft, crop)}
              </span>
              {!saved && (
                <Button
                  size="xs"
                  variant="ghost"
                  className={`${LIBRARY_MODAL_BTN_PRIMARY} tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`}
                  data-testid="image-editor-reset"
                  onClick={() => setDraft(INITIAL_DRAFT)}
                >
                  Reset all
                </Button>
              )}
            </div>
          </section>

          {saved ? (
            <aside className="tw:flex tw:w-[280px] tw:shrink-0 tw:flex-col tw:gap-4 tw:overflow-y-auto" data-testid="image-editor-saved">
              <div>
                <h3
                  className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:leading-6 tw:font-semibold tw:text-[var(--bk-success-text)]"
                  data-testid="image-editor-saved-title"
                >
                  Version saved
                </h3>
                <p
                  className="tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
                  data-testid="image-editor-saved-body"
                >
                  Version saved. Original retained.{" "}
                  <br />
                  Not yet applied to site.
                </p>
              </div>
              <ul className="tw:m-0 tw:mt-6 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0" data-testid="image-editor-saved-summary">
                {describeEdits(saved.edits).map((line) => (
                  <li key={line} className={SUMMARY_LINE}>
                    {line}
                  </li>
                ))}
              </ul>
            </aside>
          ) : (
            <aside className="tw:flex tw:min-h-0 tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-4 tw:overflow-y-auto" data-testid="image-editor-controls">
              {tab === "crop" && <CropControls draft={draft} patch={patch} />}
              {tab === "adjust" && <AdjustControls draft={draft} patch={patch} />}
              {tab === "resize" && <ResizeControls draft={draft} patch={patch} crop={crop} intrinsic={intrinsic} />}
              {tab === "optimise" && (
                <OptimiseControls
                  draft={draft}
                  patch={patch}
                  originalBytes={originalBytes}
                  estimatedBytes={estimatedBytes}
                />
              )}
            </aside>
          )}
        </div>

        {/* Foot */}
        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:px-6 tw:py-5">
          {saved ? (
            <>
              <span className={FOOT_NOTE} data-testid="image-editor-foot-note">
                To update site placements, use Replace across site from asset details.
              </span>
              <Button
                size="xs"
                variant="ghost"
                className={`${LIBRARY_MODAL_BTN_PRIMARY} tw:gap-1 tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`}
                data-testid="image-editor-back"
                onClick={() => setSaved(null)}
              >
                <ChevronLeft size={14} aria-hidden="true" />
                Back to editor
              </Button>
              <Button
                size="xs"
                className={LIBRARY_MODAL_BTN_PRIMARY}
                data-testid="image-editor-done"
                onClick={() => {
                  onDone?.();
                  onClose();
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <span className={FOOT_NOTE} data-testid="image-editor-foot-note">
                Your draft stays with you across tabs. Save creates a version; site placements stay unchanged.
              </span>
              <Button
                size="xs"
                variant="secondary"
                className={LIBRARY_MODAL_BTN_SECONDARY}
                data-testid="image-editor-cancel"
                onClick={requestCancel}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                className={LIBRARY_MODAL_BTN_PRIMARY}
                data-testid="image-editor-save"
                disabled={saving || !resizeValid || imageError}
                onClick={() => void handleSave()}
              >
                {saving ? "Saving…" : "Save version"}
              </Button>
            </>
          )}
        </div>
      </div>

      <DiscardEditsModal
        open={discarding}
        onKeepEditing={() => setDiscarding(false)}
        onDiscard={() => {
          setDiscarding(false);
          onClose();
        }}
      />
      <SaveFailedModal
        open={failed !== null}
        retrying={saving}
        onContinueEditing={() => setFailed(null)}
        onRetry={handleRetry}
      />
    </OverlayMount>
  );
};

export default ImageEditorModal;
