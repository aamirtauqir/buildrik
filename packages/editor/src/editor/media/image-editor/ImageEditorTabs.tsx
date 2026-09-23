/**
 * The image editor's right column — one control panel per tab (Clone
 * 3695:43236 crop · 3695:43319 adjust · 3695:43403 resize · 3695:43480
 * optimise). Each edits the shared draft; nothing here owns state.
 *
 * Chips are 32-high flowbite Buttons at `size="xs"`: the pressed one is the
 * primary (accent fill), the rest sit as plain labels on the body's grey and
 * take a gray-200 hover — 3695:43236's `3:2` and 3695:43705's `Horizontal`
 * are the pressed shape. The tab row above them is a different recipe (the
 * accent TINT, `ImageEditorModal.tsx`), because the board draws a selected
 * tab and a pressed chip differently.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { Button, Slider, TextInput } from "@/editor/chrome-ui";
import { formatBytes } from "@shared/utils/helpers/number";
import { LIBRARY_MODAL_BTN_PRIMARY } from "../components/libraryModal";
import {
  ADJUST_RANGE,
  ASPECT_CHIPS,
  BLUR_MAX,
  FORMAT_CHIPS,
  PRESET_CHIPS,
  QUALITY_MIN,
  ROTATION_RANGE,
  SCALE_CHIPS,
  ZOOM_MAX,
  outputSize,
  savingsPercent,
  validateResize,
  type ImageDraft,
  type OutputSize,
  type ResizeVerdict,
} from "./imageEdits";

export interface TabProps {
  draft: ImageDraft;
  /** Merges a partial into the draft. */
  patch(changes: Partial<ImageDraft>): void;
}

const LABEL = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink)]";
const HINT = "tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const MONO_VALUE =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-muted)]";

/* Pressed = the library modal's primary (flowbite's default colour IS the
   accent). Resting displaces flowbite `light`'s border, white fill and text
   per property — twMerge resolves same-property utilities, so each has to be
   named or it stands (CLAUDE.md §Chrome). */
const CHIP_ON = LIBRARY_MODAL_BTN_PRIMARY;
const CHIP_OFF =
  `${LIBRARY_MODAL_BTN_PRIMARY} tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] ` +
  "tw:enabled:hover:bg-[var(--bk-gray-200)]";

function Chip({
  on,
  className,
  ...rest
}: React.ComponentProps<typeof Button> & { on: boolean }) {
  return (
    <Button
      size="xs"
      variant={on ? "primary" : "secondary"}
      aria-pressed={on}
      className={[on ? CHIP_ON : CHIP_OFF, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

/** Label left, mono value right, the slider under — every slider on the boards. */
function SliderRow({
  id,
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange(v: number): void;
}) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5" data-testid={id}>
      <div className="tw:flex tw:items-center tw:justify-between">
        <span className={LABEL} data-testid={`${id}-label`}>
          {label}
        </span>
        <span className={MONO_VALUE} data-testid={`${id}-value`}>
          {display}
        </span>
      </div>
      <Slider value={value} onChange={onChange} min={min} max={max} step={step} label={label} withField={false} />
    </div>
  );
}

// ── Crop ────────────────────────────────────────────────────────────────────

/** ↺ / ↻ step by 90 and wrap so the slider's ±180 always has the angle. */
const turn = (rotation: number, by: number) => {
  const next = rotation + by;
  if (next > ROTATION_RANGE) return next - 360;
  if (next < -ROTATION_RANGE) return next + 360;
  return next;
};

export function CropControls({ draft, patch }: TabProps) {
  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={LABEL}>Aspect ratio</span>
        <div className="tw:flex tw:flex-wrap tw:gap-1" role="group" aria-label="Aspect ratio">
          {ASPECT_CHIPS.map((a) => (
            <Chip
              key={a.id}
              on={draft.aspect === a.id}
              data-testid={`image-editor-aspect-${a.id.replace(":", "-")}`}
              onClick={() => patch({ aspect: a.id })}
            >
              {a.label}
            </Chip>
          ))}
        </div>
      </div>
      <SliderRow
        id="image-editor-rotate"
        label="Rotation"
        value={draft.rotation}
        display={`${draft.rotation}°`}
        min={-ROTATION_RANGE}
        max={ROTATION_RANGE}
        onChange={(rotation) => patch({ rotation })}
      />
      <div className="tw:flex tw:gap-2">
        <Button
          size="xs"
          variant="secondary"
          className={`${CHIP_OFF} tw:flex-1 tw:gap-1.5`}
          aria-label="Rotate left 90°"
          data-testid="image-editor-rotate-ccw"
          onClick={() => patch({ rotation: turn(draft.rotation, -90) })}
        >
          <RotateCcw size={14} aria-hidden="true" />
          90°
        </Button>
        <Button
          size="xs"
          variant="secondary"
          className={`${CHIP_OFF} tw:flex-1 tw:gap-1.5`}
          aria-label="Rotate right 90°"
          data-testid="image-editor-rotate-cw"
          onClick={() => patch({ rotation: turn(draft.rotation, 90) })}
        >
          <RotateCw size={14} aria-hidden="true" />
          90°
        </Button>
      </div>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={LABEL}>Flip</span>
        <div className="tw:flex tw:gap-2" role="group" aria-label="Flip">
          <Chip
            on={draft.flipH}
            className="tw:flex-1"
            data-testid="image-editor-flip-h"
            onClick={() => patch({ flipH: !draft.flipH })}
          >
            Horizontal
          </Chip>
          <Chip
            on={draft.flipV}
            className="tw:flex-1"
            data-testid="image-editor-flip-v"
            onClick={() => patch({ flipV: !draft.flipV })}
          >
            Vertical
          </Chip>
        </div>
      </div>
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <SliderRow
          id="image-editor-zoom"
          label="Zoom"
          value={draft.zoom}
          display={`${Math.round(draft.zoom * 100)}%`}
          min={1}
          max={ZOOM_MAX}
          step={0.05}
          onChange={(zoom) => patch({ zoom })}
        />
        <p className={HINT} data-testid="image-editor-zoom-hint">
          Drag the image in the preview to reposition.
        </p>
      </div>
    </>
  );
}

// ── Adjust ──────────────────────────────────────────────────────────────────

const ADJUSTMENTS: ReadonlyArray<{ key: "brightness" | "contrast" | "saturation"; label: string }> = [
  { key: "brightness", label: "Brightness" },
  { key: "contrast", label: "Contrast" },
  { key: "saturation", label: "Saturation" },
];

export function AdjustControls({ draft, patch }: TabProps) {
  return (
    <>
      {ADJUSTMENTS.map(({ key, label }) => (
        <SliderRow
          key={key}
          id={`image-editor-${key}`}
          label={label}
          value={draft[key]}
          display={String(draft[key])}
          min={-ADJUST_RANGE}
          max={ADJUST_RANGE}
          onChange={(v) => patch({ [key]: v })}
        />
      ))}
      <SliderRow
        id="image-editor-blur"
        label="Blur"
        value={draft.blur}
        display={`${draft.blur}px`}
        min={0}
        max={BLUR_MAX}
        onChange={(blur) => patch({ blur })}
      />
      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={LABEL}>Preset</span>
        <div className="tw:flex tw:flex-wrap tw:gap-1" role="group" aria-label="Preset">
          {PRESET_CHIPS.map((p) => (
            <Chip
              key={p.id}
              on={draft.preset === p.id}
              data-testid={`image-editor-preset-${p.id}`}
              onClick={() => patch({ preset: p.id })}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Resize ──────────────────────────────────────────────────────────────────

export interface ResizeProps extends TabProps {
  /** The crop's output size — what the fields show until they are typed in. */
  crop: OutputSize;
  /** The file's intrinsic size, for the note; null until the image decodes. */
  intrinsic: OutputSize | null;
}

const INPUT_CLASS = "tw:[&_input]:tabular-nums";

export function ResizeControls({ draft, patch, crop, intrinsic }: ResizeProps) {
  /* Until the cropper has reported (the media is still decoding) the crop is
     0 × 0: the fields stay empty and nothing is judged yet. */
  const untouched = draft.width === "" && draft.height === "";
  const verdict: ResizeVerdict =
    untouched && crop.width === 0
      ? { ok: true, width: 0, height: 0 }
      : validateResize(draft.width || String(crop.width), draft.height || String(crop.height));
  const out = outputSize(draft, crop);
  const shownWidth = draft.width === "" ? (crop.width ? String(crop.width) : "") : draft.width;
  const shownHeight = draft.height === "" ? (crop.height ? String(crop.height) : "") : draft.height;
  const ratio = crop.height > 0 ? crop.width / crop.height : 1;

  /* Locked: the other field follows at the crop's ratio, but only from a
     number — "12a" leaves it where it was, so the error names one field's
     problem instead of spreading it. */
  const setWidth = (width: string) => {
    const n = Number(width);
    const follow = draft.aspectLocked && /^\d+$/.test(width) && n > 0;
    patch({ width, height: follow ? String(Math.max(1, Math.round(n / ratio))) : shownHeight });
  };
  const setHeight = (height: string) => {
    const n = Number(height);
    const follow = draft.aspectLocked && /^\d+$/.test(height) && n > 0;
    patch({ height, width: follow ? String(Math.max(1, Math.round(n * ratio))) : shownWidth });
  };

  const scaleOf = (pct: number) => ({
    width: Math.max(1, Math.round((crop.width * pct) / 100)),
    height: Math.max(1, Math.round((crop.height * pct) / 100)),
  });
  const activeScale = SCALE_CHIPS.find((pct) => {
    const s = scaleOf(pct);
    return verdict.ok && s.width === out.width && s.height === out.height;
  });

  return (
    <>
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <label className={LABEL} htmlFor="image-editor-width">
            Width
          </label>
          <TextInput
            id="image-editor-width"
            type="text"
            inputMode="numeric"
            className={INPUT_CLASS}
            value={shownWidth}
            aria-invalid={verdict.ok ? undefined : true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWidth(e.target.value)}
            data-testid="image-editor-width"
          />
        </div>
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <label className={LABEL} htmlFor="image-editor-height">
            Height
          </label>
          <TextInput
            id="image-editor-height"
            type="text"
            inputMode="numeric"
            className={INPUT_CLASS}
            value={shownHeight}
            aria-invalid={verdict.ok ? undefined : true}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeight(e.target.value)}
            data-testid="image-editor-height"
          />
        </div>
      </div>
      {!verdict.ok && (
        <p
          className="tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-error-text)]"
          role="alert"
          data-testid="image-editor-resize-error"
        >
          {verdict.message}
        </p>
      )}
      <Chip
        on={draft.aspectLocked}
        className="tw:w-full"
        data-testid="image-editor-aspect-lock"
        onClick={() => patch({ aspectLocked: !draft.aspectLocked })}
      >
        {draft.aspectLocked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
      </Chip>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={LABEL}>Scale</span>
        <div className="tw:flex tw:flex-wrap tw:gap-1" role="group" aria-label="Scale">
          {SCALE_CHIPS.map((pct) => (
            <Chip
              key={pct}
              on={activeScale === pct}
              data-testid={`image-editor-scale-${pct}`}
              onClick={() => {
                const s = scaleOf(pct);
                patch(pct === 100 ? { width: "", height: "" } : { width: String(s.width), height: String(s.height) });
              }}
            >
              {pct}%
            </Chip>
          ))}
        </div>
      </div>
      <p className={HINT} data-testid="image-editor-resize-note">
        The original {intrinsic ? `${intrinsic.width} × ${intrinsic.height} ` : ""}file is kept. Resizing only affects
        the new version.
      </p>
    </>
  );
}

// ── Optimise ────────────────────────────────────────────────────────────────

export interface OptimiseProps extends TabProps {
  /** The source's bytes; 0 until read. */
  originalBytes: number;
  /** The draft encoded at the chosen format and quality; null while pending. */
  estimatedBytes: number | null;
}

export function OptimiseControls({ draft, patch, originalBytes, estimatedBytes }: OptimiseProps) {
  const savings = estimatedBytes === null ? null : savingsPercent(originalBytes, estimatedBytes);
  const smaller = savings !== null && savings < 0;
  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <span className={LABEL}>Format</span>
        <div className="tw:flex tw:flex-wrap tw:gap-1" role="group" aria-label="Format">
          {FORMAT_CHIPS.map((f) => (
            <Chip
              key={f.id}
              on={draft.format === f.id}
              data-testid={`image-editor-format-${f.id}`}
              onClick={() => patch({ format: f.id })}
            >
              {f.label}
            </Chip>
          ))}
        </div>
      </div>
      <SliderRow
        id="image-editor-quality"
        label="Quality"
        value={draft.quality}
        display={String(draft.quality)}
        min={QUALITY_MIN}
        max={100}
        onChange={(quality) => patch({ quality })}
      />
      <div
        className="tw:flex tw:flex-col tw:gap-1 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-3 tw:py-2.5"
        data-testid="image-editor-estimate"
      >
        <span
          className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
          data-testid="image-editor-estimate-original"
        >
          Original · {originalBytes > 0 ? formatBytes(originalBytes) : "—"}
        </span>
        {/* Success green means "this saved you something"; a wash or a bigger
            file is not a success and must not read as one. */}
        <span
          className={`tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:tabular-nums ${
            smaller ? "tw:text-[var(--bk-success-text)]" : "tw:text-[var(--bk-ink-soft)]"
          }`}
          data-smaller={smaller ? "true" : undefined}
          data-testid="image-editor-estimate-result"
        >
          Estimated ·{" "}
          {estimatedBytes === null
            ? "…"
            : `${formatBytes(estimatedBytes)}${savings === null ? "" : ` (${savings > 0 ? "+" : savings < 0 ? "-" : ""}${Math.abs(savings)}%)`}`}
        </span>
      </div>
      <p className={HINT} data-testid="image-editor-estimate-note">
        File size is an estimate until the version is saved.
      </p>
    </>
  );
}
