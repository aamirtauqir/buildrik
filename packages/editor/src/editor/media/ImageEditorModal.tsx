/**
 * ImageEditorModal — board S3.6 · media · image-editor (1124:4527).
 *
 * A 720-wide card on a 60% ink scrim (cargo-sheets §4: the image editor is a
 * MODAL, not a drill-in): title "Edit image — {name}", Crop / Adjust / Resize
 * text-link tabs, the full-width canvas well with live mono dimensions, the
 * active tab's controls beneath it, and a foot carrying the new-version note
 * with Reset · Cancel · Save version. Compare (hold to see the original)
 * rides the transform tool cluster — it is canvas behaviour, so it lives with
 * the canvas tools rather than inventing header chrome the board doesn't draw.
 *
 * Uses react-easy-crop + CSS filters. Non-destructive: onSave returns a data
 * URL of the edited image and the parent versions it.
 *
 * @module editor/media/ImageEditorModal
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Slider, TextInput } from "@/editor/chrome-ui";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import {
  RotateCcw, RotateCw, FlipHorizontal, FlipVertical, AlertTriangle, Eye,
} from "lucide-react";

// ============================================
// Types
// ============================================

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  /** Board title is "Edit image — {name}"; falls back to the bare title. */
  imageName?: string;
  /**
   * Audit-remediation PR1 [ModalSubmit]: accepts sync OR async handler.
   * MediaTab's real onSave is `async` (fetches the data URL, converts to
   * Blob, uploads). handleSave awaits it and surfaces errors via onError
   * without dismissing the modal.
   */
  onSave: (editedSrc: string) => void | Promise<void>;
  /** Surface async rejections from onSave. Recommended: wire to toast. */
  onError?: (err: unknown) => void;
}

type EditorTab = "crop" | "adjust" | "resize";

interface Adjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  blur: number;        // 0 to 20
  // Named filter preset layered on top of brightness/contrast/saturation.
  preset: FilterPreset;
}

type FilterPreset = "none" | "bw" | "sepia" | "cool" | "warm" | "vibrant";

interface FilterPresetDef {
  id: FilterPreset;
  label: string;
  /** CSS filter string applied AFTER user's brightness/contrast/saturation. */
  cssFilter: string;
}

const FILTER_PRESETS: FilterPresetDef[] = [
  { id: "none", label: "None", cssFilter: "" },
  { id: "bw", label: "B&W", cssFilter: "grayscale(1)" },
  { id: "sepia", label: "Sepia", cssFilter: "sepia(0.85) saturate(1.1)" },
  { id: "cool", label: "Cool", cssFilter: "hue-rotate(-15deg) saturate(1.1) brightness(1.02)" },
  { id: "warm", label: "Warm", cssFilter: "hue-rotate(15deg) saturate(1.15) brightness(1.05)" },
  { id: "vibrant", label: "Vibrant", cssFilter: "saturate(1.4) contrast(1.1)" },
];

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  preset: "none",
};

const CROP_PRESETS = [
  { label: "Free", value: undefined as number | undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
  { label: "9:16", value: 9 / 16 },
];

// ============================================
// Helpers
// ============================================

function buildCssFilter(adj: Adjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 0) parts.push(`brightness(${1 + adj.brightness / 100})`);
  if (adj.contrast !== 0) parts.push(`contrast(${1 + adj.contrast / 100})`);
  if (adj.saturation !== 0) parts.push(`saturate(${1 + adj.saturation / 100})`);
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`);
  const presetDef = FILTER_PRESETS.find((p) => p.id === adj.preset);
  if (presetDef && presetDef.cssFilter) parts.push(presetDef.cssFilter);
  return parts.length > 0 ? parts.join(" ") : "none";
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  flip: { h: boolean; v: boolean },
  adjustments: Adjustments,
  resizeW?: number,
  resizeH?: number,
): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const radians = (rotation * Math.PI) / 180;

  const cropW = pixelCrop.width;
  const cropH = pixelCrop.height;

  const outputW = resizeW || cropW;
  const outputH = resizeH || cropH;

  canvas.width = outputW;
  canvas.height = outputH;

  ctx.filter = buildCssFilter(adjustments);

  ctx.translate(outputW / 2, outputH / 2);
  ctx.rotate(radians);
  ctx.scale(flip.h ? -1 : 1, flip.v ? -1 : 1);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    cropW,
    cropH,
    -outputW / 2,
    -outputH / 2,
    outputW,
    outputH,
  );

  return canvas.toDataURL("image/webp", 0.92);
}

// ============================================
// Classes (board 1124:4527)
// ============================================

const TAB =
  "tw:border-0 tw:bg-transparent tw:p-0 tw:text-[14px] tw:leading-5 tw:enabled:hover:bg-transparent";
const TAB_ACTIVE = "tw:font-semibold tw:text-[var(--bk-blue-500)]";
const TAB_RESTING = "tw:font-medium tw:text-[var(--bk-ink-muted)] tw:enabled:hover:text-[var(--bk-ink)]";
const CHIP =
  "tw:min-h-6 tw:rounded-full tw:border-0 tw:px-2.5 tw:py-0.5 tw:text-[12px] tw:leading-4";
const CHIP_ACTIVE = "tw:bg-[var(--bk-accent-subtle,#ebf5ff)] tw:font-medium tw:text-[var(--bk-accent-text,#1a56db)]";
const CHIP_RESTING = "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-200)]";
const TOOL =
  "tw:flex tw:h-7 tw:w-9 tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] " +
  "tw:bg-white tw:p-0 tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-[var(--bk-gray-50)]";
const GHOST =
  "tw:min-h-8 tw:border-0 tw:bg-transparent tw:px-2 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink-soft)] " +
  "tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)]";
const SECTION_LABEL = "tw:mb-1 tw:block tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
const MONO_VAL =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tabular-nums tw:text-[var(--bk-ink-muted)]";

// ============================================
// Component
// ============================================

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageName,
  onSave,
  onError,
}) => {
  const [tab, setTab] = React.useState<EditorTab>("crop");
  const [saving, setSaving] = React.useState(false);
  // §17 — Before/After hold-to-compare. While true, canvas previews the
  // un-edited original (no filter, no rotation/flip transform).
  const [comparing, setComparing] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Crop state
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [aspect, setAspect] = React.useState<number | undefined>(undefined);
  const [croppedArea, setCroppedArea] = React.useState<Area>({ x: 0, y: 0, width: 0, height: 0 });

  // Transform state
  const [flipH, setFlipH] = React.useState(false);
  const [flipV, setFlipV] = React.useState(false);

  // Adjust state
  const [adjustments, setAdjustments] = React.useState<Adjustments>(DEFAULT_ADJUSTMENTS);

  // Resize state
  const [resizeW, setResizeW] = React.useState<number | undefined>();
  const [resizeH, setResizeH] = React.useState<number | undefined>();

  // Reset on open / image change
  React.useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setAspect(undefined);
      setFlipH(false);
      setFlipV(false);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setResizeW(undefined);
      setResizeH(undefined);
      setTab("crop");
      setImageError(false);
    }
  }, [isOpen, imageSrc]);

  // Probe image load — detects stale blob URLs or CORS failures early
  React.useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.onload = () => setImageError(false);
    img.onerror = () => setImageError(true);
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Escape to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const onCropComplete = React.useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleSave = React.useCallback(async () => {
    setSaving(true);
    try {
      const dataUrl = await getCroppedImg(
        imageSrc,
        croppedArea,
        rotation,
        { h: flipH, v: flipV },
        adjustments,
        resizeW,
        resizeH,
      );
      // Await the parent handler so its rejection surfaces here as a typed
      // error instead of escaping as an unhandled promise.
      await onSave(dataUrl);
      onClose();
    } catch (err) {
      if (onError) {
        onError(err);
      } else {
        console.error("Image save failed:", err);
      }
      // Modal stays open on error so the user can retry without
      // re-opening + re-cropping.
    } finally {
      setSaving(false);
    }
  }, [imageSrc, croppedArea, rotation, flipH, flipV, adjustments, resizeW, resizeH, onSave, onClose, onError]);

  const handleReset = React.useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setResizeW(undefined);
    setResizeH(undefined);
  }, []);

  if (!isOpen) return null;

  const filterStyle = buildCssFilter(adjustments);

  return (
    <div
      className="tw:fixed tw:inset-0 tw:z-[10000] tw:flex tw:items-center tw:justify-center tw:bg-[rgba(17,24,39,0.6)]"
      onClick={onClose}
    >
      <div
        className="tw:flex tw:max-h-[90vh] tw:w-[720px] tw:max-w-[92vw] tw:flex-col tw:overflow-y-auto tw:rounded-2xl tw:bg-white tw:[box-shadow:var(--bk-shadow-overlay)]"
        role="dialog"
        aria-modal="true"
        aria-label={imageName ? `Edit image — ${imageName}` : "Edit image"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — board: title + text-link tabs, no button chrome. */}
        <div className="tw:shrink-0 tw:px-6 tw:pt-5">
          <h3 className="tw:m-0 tw:text-[16px] tw:font-semibold tw:leading-6 tw:text-[var(--bk-ink)]">
            Edit image{imageName ? ` — ${imageName}` : ""}
          </h3>
          <div className="tw:mt-3 tw:flex tw:gap-5" role="tablist" aria-label="Editor sections">
            {([
              ["crop", "Crop"],
              ["adjust", "Adjust"],
              ["resize", "Resize"],
            ] as Array<[EditorTab, string]>).map(([id, label]) => (
              <Button
                key={id}
                role="tab"
                aria-selected={tab === id}
                className={`${TAB} ${tab === id ? TAB_ACTIVE : TAB_RESTING}`}
                onClick={() => setTab(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Canvas well — board 1124: full-width, rounded-8, mono dims. */}
        <div className="tw:relative tw:mx-6 tw:mt-3 tw:h-[280px] tw:shrink-0 tw:overflow-hidden tw:rounded-lg tw:bg-[var(--bk-bg-subtle)]">
          {!imageError && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={comparing ? 0 : rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onMediaLoaded={() => setImageError(false)}
              style={{
                mediaStyle: {
                  filter: comparing ? "none" : filterStyle,
                  transform: comparing
                    ? "none"
                    : `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  transformOrigin: "center center",
                },
              }}
            />
          )}
          {imageError && (
            <div className="tw:flex tw:h-full tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:px-8 tw:text-center tw:text-[var(--bk-ink-soft)]">
              <AlertTriangle size={32} aria-hidden="true" />
              <div className="tw:text-[14px] tw:font-semibold tw:text-[var(--bk-ink)]">Image failed to load</div>
              <div className="tw:max-w-[400px] tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
                The asset&apos;s URL may be stale or inaccessible. Try reloading the page, or re-upload the image.
              </div>
            </div>
          )}
          {!imageError && croppedArea.width > 0 ? (
            <span className={`tw:absolute tw:bottom-2 tw:left-4 ${MONO_VAL}`}>
              {Math.round(croppedArea.width)}×{Math.round(croppedArea.height)}
            </span>
          ) : null}
          {/* Compare is a CANVAS behaviour, so it overlays the well — every
              tab gets it (a B&W preview compare is an Adjust job). */}
          {!imageError && (
            <Button
              className={`tw:absolute tw:right-2 tw:top-2 tw:flex tw:min-h-7 tw:items-center tw:gap-1.5 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-white tw:px-2 tw:text-[12px] tw:font-medium ${comparing ? "tw:text-[var(--bk-accent)]" : "tw:text-[var(--bk-ink-soft)]"} tw:enabled:hover:bg-[var(--bk-gray-50)]`}
              onPointerDown={() => setComparing(true)}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={() => setComparing(false)}
              onPointerCancel={() => setComparing(false)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setComparing(true);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") setComparing(false);
              }}
              onBlur={() => setComparing(false)}
              title="Hold to compare with original"
              aria-label="Hold to compare with original"
              aria-pressed={comparing}
            >
              <Eye size={13} aria-hidden="true" />
              {comparing ? "Original" : "Compare"}
            </Button>
          )}
        </div>

        {/* Controls — the active tab's, below the canvas per the board. */}
        <div className="tw:min-h-[128px] tw:shrink-0 tw:px-6 tw:pt-4">
          {tab === "crop" && (
            <>
              <div className="tw:flex tw:items-center tw:gap-2">
                {CROP_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    className={`${CHIP} ${aspect === p.value ? CHIP_ACTIVE : CHIP_RESTING}`}
                    aria-pressed={aspect === p.value}
                    onClick={() => setAspect(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
                <span className="tw:flex-1" />
                {/* Transform tools + Compare — canvas tools sit with the canvas. */}
                <Button className={TOOL} onClick={() => setRotation((r) => r - 90)} title="Rotate left" aria-label="Rotate left">
                  <RotateCcw size={14} />
                </Button>
                <Button className={TOOL} onClick={() => setRotation((r) => r + 90)} title="Rotate right" aria-label="Rotate right">
                  <RotateCw size={14} />
                </Button>
                <Button
                  className={`${TOOL} ${flipH ? "tw:border-[var(--bk-accent)] tw:text-[var(--bk-accent)]" : ""}`}
                  onClick={() => setFlipH(!flipH)}
                  title="Flip horizontal"
                  aria-label="Flip horizontal"
                  aria-pressed={flipH}
                >
                  <FlipHorizontal size={14} />
                </Button>
                <Button
                  className={`${TOOL} ${flipV ? "tw:border-[var(--bk-accent)] tw:text-[var(--bk-accent)]" : ""}`}
                  onClick={() => setFlipV(!flipV)}
                  title="Flip vertical"
                  aria-label="Flip vertical"
                  aria-pressed={flipV}
                >
                  <FlipVertical size={14} />
                </Button>
              </div>

              <div className="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-x-9">
                <div>
                  <span className={SECTION_LABEL}>Zoom</span>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div className="tw:flex-1">
                      <Slider value={zoom} onChange={setZoom} min={1} max={3} step={0.1} label="Zoom" withField={false} />
                    </div>
                    <span className={MONO_VAL}>{zoom.toFixed(1)}x</span>
                  </div>
                </div>
                <div>
                  <span className={SECTION_LABEL}>Rotate</span>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div className="tw:flex-1">
                      <Slider value={rotation} onChange={setRotation} min={-180} max={180} label="Rotate" withField={false} />
                    </div>
                    <span className={MONO_VAL}>{rotation}°</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "adjust" && (
            <>
              <div className="tw:grid tw:grid-cols-2 tw:gap-x-9 tw:gap-y-3">
                {([
                  ["Brightness", "brightness", -100, 100, 1, ""],
                  ["Contrast", "contrast", -100, 100, 1, ""],
                  ["Saturation", "saturation", -100, 100, 1, ""],
                  ["Blur", "blur", 0, 20, 0.5, "px"],
                ] as Array<[string, "brightness" | "contrast" | "saturation" | "blur", number, number, number, string]>).map(
                  ([label, key, min, max, step, unit]) => (
                    <div key={key}>
                      <span className={SECTION_LABEL}>{label}</span>
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <div className="tw:flex-1">
                          <Slider
                            value={adjustments[key]}
                            onChange={(v) => setAdjustments((a) => ({ ...a, [key]: v }))}
                            min={min}
                            max={max}
                            step={step}
                            label={label}
                            withField={false}
                          />
                        </div>
                        <span className={MONO_VAL}>
                          {adjustments[key]}
                          {unit}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Filter presets — applied AFTER user adjustments. */}
              <span className={`${SECTION_LABEL} tw:mt-4`}>Filters</span>
              <div className="tw:flex tw:flex-wrap tw:gap-2">
                {FILTER_PRESETS.map((preset) => {
                  const active = adjustments.preset === preset.id;
                  return (
                    <Button
                      key={preset.id}
                      className={`${CHIP} ${active ? CHIP_ACTIVE : CHIP_RESTING}`}
                      aria-pressed={active}
                      onClick={() => setAdjustments((a) => ({ ...a, preset: preset.id }))}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "resize" && (
            <>
              <span className={SECTION_LABEL}>Output size</span>
              <div className="tw:flex tw:items-center tw:gap-2">
                <label className="tw:flex tw:items-center tw:gap-1.5 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
                  <span>W</span>
                  <TextInput
                    type="number"
                    className="tw:w-24 tw:[&_input]:h-8 tw:[&_input]:rounded-md tw:[&_input]:text-[13px]"
                    placeholder={String(Math.round(croppedArea.width) || "auto")}
                    value={resizeW ?? ""}
                    onChange={(e) => setResizeW(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </label>
                <span className="tw:text-[13px] tw:text-[var(--bk-ink-muted)]">×</span>
                <label className="tw:flex tw:items-center tw:gap-1.5 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
                  <span>H</span>
                  <TextInput
                    type="number"
                    className="tw:w-24 tw:[&_input]:h-8 tw:[&_input]:rounded-md tw:[&_input]:text-[13px]"
                    placeholder={String(Math.round(croppedArea.height) || "auto")}
                    value={resizeH ?? ""}
                    onChange={(e) => setResizeH(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </label>
                <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">px</span>
              </div>
              <div className="tw:mt-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                Leave empty to keep original crop dimensions
              </div>
            </>
          )}
        </div>

        {/* Foot — board: note left, actions right. Reset rides as a ghost. */}
        <div className="tw:mt-auto tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:px-6 tw:py-5">
          <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
            Edits create a new version — original preserved.
          </span>
          <Button className={GHOST} onClick={handleReset}>
            Reset
          </Button>
          <Button className={GHOST} onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="tw:min-h-8 tw:rounded tw:border-0 tw:bg-[var(--bk-accent)] tw:px-3.5 tw:text-[13px] tw:font-medium tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-accent-hover)]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save version"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
