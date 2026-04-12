/**
 * Aquibra Image Editor Modal
 * Crop, resize, rotate, flip, and adjust images.
 * Uses react-easy-crop (15KB, no reconciler conflicts) + CSS filters.
 * Non-destructive: onSave returns a data URL of the edited image.
 *
 * @module editor/media/ImageEditorModal
 * @license BSD-3-Clause
 */

import * as React from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import {
  X, RotateCcw, RotateCw, FlipHorizontal, FlipVertical,
  Crop, SlidersHorizontal, Maximize, Download, AlertTriangle,
} from "lucide-react";
import "./ImageEditorModal.css";

// ============================================
// Types
// ============================================

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (editedSrc: string) => void;
}

type EditorTab = "crop" | "adjust" | "resize";

interface Adjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // -100 to 100
  blur: number;        // 0 to 20
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
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

  // Apply rotation to determine canvas size
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const cropW = pixelCrop.width;
  const cropH = pixelCrop.height;

  const outputW = resizeW || cropW;
  const outputH = resizeH || cropH;

  canvas.width = outputW;
  canvas.height = outputH;

  // Apply CSS filter as canvas filter
  ctx.filter = buildCssFilter(adjustments);

  // Center and rotate
  ctx.translate(outputW / 2, outputH / 2);
  ctx.rotate(radians);
  ctx.scale(flip.h ? -1 : 1, flip.v ? -1 : 1);

  // Draw the cropped region
  const scaleX = outputW / cropW;
  const scaleY = outputH / cropH;

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
// Component
// ============================================

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onSave,
}) => {
  const [tab, setTab] = React.useState<EditorTab>("crop");
  const [saving, setSaving] = React.useState(false);
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
      onSave(dataUrl);
      onClose();
    } catch (err) {
      console.error("Image save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [imageSrc, croppedArea, rotation, flipH, flipV, adjustments, resizeW, resizeH, onSave, onClose]);

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
    <div className="ie-backdrop" onClick={onClose}>
      <div className="ie-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ie-header">
          <h3 className="ie-title">Edit Image</h3>
          <div className="ie-header-actions">
            <button className="ie-btn-ghost" onClick={handleReset}>Reset</button>
            <button className="ie-btn-primary" onClick={handleSave} disabled={saving}>
              <Download size={14} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button className="ie-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="ie-body">
          {/* Canvas area */}
          <div className="ie-canvas">
            {!imageError && (
              <div className="ie-cropper-wrap">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                  onMediaLoaded={() => setImageError(false)}
                  style={{
                    mediaStyle: {
                      filter: filterStyle,
                      transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                      transformOrigin: "center center",
                    },
                  }}
                />
              </div>
            )}
            {imageError && (
              <div className="ie-canvas-error">
                <AlertTriangle size={40} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>Image failed to load</div>
                <div style={{ opacity: 0.7, maxWidth: 400 }}>
                  The asset's URL may be stale or inaccessible. Try reloading the page, or re-upload the image.
                </div>
              </div>
            )}
          </div>

          {/* Sidebar controls */}
          <div className="ie-sidebar">
            {/* Tab bar */}
            <div className="ie-tabs">
              <button className={`ie-tab${tab === "crop" ? " active" : ""}`} onClick={() => setTab("crop")}>
                <Crop size={14} /> Crop
              </button>
              <button className={`ie-tab${tab === "adjust" ? " active" : ""}`} onClick={() => setTab("adjust")}>
                <SlidersHorizontal size={14} /> Adjust
              </button>
              <button className={`ie-tab${tab === "resize" ? " active" : ""}`} onClick={() => setTab("resize")}>
                <Maximize size={14} /> Resize
              </button>
            </div>

            {/* Tab content */}
            <div className="ie-controls">
              {tab === "crop" && (
                <>
                  {/* Aspect ratio presets */}
                  <div className="ie-section-label">Aspect Ratio</div>
                  <div className="ie-presets">
                    {CROP_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        className={`ie-preset${aspect === p.value ? " active" : ""}`}
                        onClick={() => setAspect(p.value)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Rotation */}
                  <div className="ie-section-label">Rotation</div>
                  <div className="ie-slider-row">
                    <input
                      type="range"
                      className="ie-slider"
                      min={-180}
                      max={180}
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                    />
                    <span className="ie-slider-val">{rotation}°</span>
                  </div>

                  {/* Quick rotate + flip */}
                  <div className="ie-section-label">Transform</div>
                  <div className="ie-transform-btns">
                    <button className="ie-tool-btn" onClick={() => setRotation((r) => r - 90)} title="Rotate left">
                      <RotateCcw size={16} />
                    </button>
                    <button className="ie-tool-btn" onClick={() => setRotation((r) => r + 90)} title="Rotate right">
                      <RotateCw size={16} />
                    </button>
                    <button className={`ie-tool-btn${flipH ? " active" : ""}`} onClick={() => setFlipH(!flipH)} title="Flip horizontal">
                      <FlipHorizontal size={16} />
                    </button>
                    <button className={`ie-tool-btn${flipV ? " active" : ""}`} onClick={() => setFlipV(!flipV)} title="Flip vertical">
                      <FlipVertical size={16} />
                    </button>
                  </div>

                  {/* Zoom */}
                  <div className="ie-section-label">Zoom</div>
                  <div className="ie-slider-row">
                    <input
                      type="range"
                      className="ie-slider"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                    <span className="ie-slider-val">{zoom.toFixed(1)}x</span>
                  </div>
                </>
              )}

              {tab === "adjust" && (
                <>
                  <div className="ie-section-label">Brightness</div>
                  <div className="ie-slider-row">
                    <input type="range" className="ie-slider" min={-100} max={100}
                      value={adjustments.brightness}
                      onChange={(e) => setAdjustments((a) => ({ ...a, brightness: Number(e.target.value) }))}
                    />
                    <span className="ie-slider-val">{adjustments.brightness}</span>
                  </div>

                  <div className="ie-section-label">Contrast</div>
                  <div className="ie-slider-row">
                    <input type="range" className="ie-slider" min={-100} max={100}
                      value={adjustments.contrast}
                      onChange={(e) => setAdjustments((a) => ({ ...a, contrast: Number(e.target.value) }))}
                    />
                    <span className="ie-slider-val">{adjustments.contrast}</span>
                  </div>

                  <div className="ie-section-label">Saturation</div>
                  <div className="ie-slider-row">
                    <input type="range" className="ie-slider" min={-100} max={100}
                      value={adjustments.saturation}
                      onChange={(e) => setAdjustments((a) => ({ ...a, saturation: Number(e.target.value) }))}
                    />
                    <span className="ie-slider-val">{adjustments.saturation}</span>
                  </div>

                  <div className="ie-section-label">Blur</div>
                  <div className="ie-slider-row">
                    <input type="range" className="ie-slider" min={0} max={20} step={0.5}
                      value={adjustments.blur}
                      onChange={(e) => setAdjustments((a) => ({ ...a, blur: Number(e.target.value) }))}
                    />
                    <span className="ie-slider-val">{adjustments.blur}px</span>
                  </div>
                </>
              )}

              {tab === "resize" && (
                <>
                  <div className="ie-section-label">Output Size</div>
                  <div className="ie-resize-inputs">
                    <label className="ie-resize-field">
                      <span>W</span>
                      <input
                        type="number"
                        placeholder={String(croppedArea.width || "auto")}
                        value={resizeW ?? ""}
                        onChange={(e) => setResizeW(e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <span>px</span>
                    </label>
                    <span className="ie-resize-x">×</span>
                    <label className="ie-resize-field">
                      <span>H</span>
                      <input
                        type="number"
                        placeholder={String(croppedArea.height || "auto")}
                        value={resizeH ?? ""}
                        onChange={(e) => setResizeH(e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <span>px</span>
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ls-text-ghost)", marginTop: 8 }}>
                    Leave empty to keep original crop dimensions
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
