/**
 * Optimization Panel Component
 * Quality slider, format picker, and compression preview.
 *
 * The hex-policy exemption this file used to carry is gone with its only hex:
 * the savings figure was #a6e3a1, a Catppuccin swatch, where the meaning is
 * "this succeeded" and the token is --bk-success.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Spinner, Button, Label, Slider, TextInput } from "@/editor/chrome-ui";
import { MediaOptimizer } from "../../engine/media";
import { formatBytes } from "@shared/utils/helpers/number";
import type { ImageExportFormat } from "../../shared/types/media";
// ============================================================================
// TYPES
// ============================================================================

export interface OptimizationPanelProps {
  imageSrc: string;
  onOptimized: (optimizedSrc: string) => void;
  onClose?: () => void;
}

interface OptimizationState {
  format: ImageExportFormat;
  quality: number;
  originalSize: number;
  optimizedSize: number;
  optimizedSrc: string | null;
  isProcessing: boolean;
}

/* Layout classes. The quality control is chrome-ui's Slider now, so the
   hand-rolled range-input restyle that used to live here is gone. */
const SECTION = "tw:mb-5";
const FIELD_LABEL = "tw:block tw:mb-2";
const SEGMENTED = "tw:flex tw:gap-2";
const STAT_LABEL = "tw:text-xs tw:text-gray-500 tw:uppercase tw:mb-1";
const STAT_VALUE = "tw:text-sm tw:font-semibold tw:text-gray-900";
const PREVIEW_BOX = "tw:flex-1 tw:bg-gray-50 tw:rounded-lg tw:p-2 tw:text-center";
const PREVIEW_LABEL = "tw:text-xs tw:text-gray-500 tw:mt-1.5";
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

// ============================================================================
// COMPONENT
// ============================================================================

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  imageSrc,
  onOptimized,
  onClose,
}) => {
  const [optimizer] = React.useState(() => new MediaOptimizer());
  const [state, setState] = React.useState<OptimizationState>({
    format: "webp",
    quality: 85,
    originalSize: 0,
    optimizedSize: 0,
    optimizedSrc: null,
    isProcessing: false,
  });
  // §18 — Max-dimension override (longest-side clamp). Empty / 0 / NaN → no clamp.
  const [maxDim, setMaxDim] = React.useState<string>("");

  // Check format support
  const [formatSupport, setFormatSupport] = React.useState({ webp: true, avif: false });

  React.useEffect(() => {
    optimizer.checkFormatSupport().then(setFormatSupport);
  }, [optimizer]);

  // Calculate original size
  React.useEffect(() => {
    if (imageSrc) {
      const base64 = imageSrc.split(",")[1];
      if (base64) {
        const size = Math.round((base64.length * 3) / 4);
        setState((s) => ({ ...s, originalSize: size }));
      }
    }
  }, [imageSrc]);

  // Optimize on settings change
  React.useEffect(() => {
    const optimize = async () => {
      setState((s) => ({ ...s, isProcessing: true }));
      try {
        const maxDimPx = Number(maxDim);
        const clamp =
          Number.isFinite(maxDimPx) && maxDimPx > 0
            ? { maxWidth: maxDimPx, maxHeight: maxDimPx }
            : {};
        const result = await optimizer.optimize(imageSrc, {
          format: state.format,
          quality: state.quality / 100,
          preserveTransparency: state.format !== "jpeg",
          ...clamp,
        });

        if (result.success && result.dataUrl) {
          setState((s) => ({
            ...s,
            optimizedSize: result.optimizedSize ?? 0,
            optimizedSrc: result.dataUrl ?? null,
            isProcessing: false,
          }));
        } else {
          setState((s) => ({ ...s, isProcessing: false }));
        }
      } catch {
        setState((s) => ({ ...s, isProcessing: false }));
      }
    };

    const timer = setTimeout(optimize, 300);
    return () => clearTimeout(timer);
  }, [imageSrc, state.format, state.quality, maxDim, optimizer]);

  const handleFormatChange = (format: ImageExportFormat) => {
    setState((s) => ({ ...s, format }));
  };

  const handleApply = () => {
    if (state.optimizedSrc) {
      onOptimized(state.optimizedSrc);
    }
  };

  const savings =
    state.originalSize > 0 ? Math.round((1 - state.optimizedSize / state.originalSize) * 100) : 0;

  // Phase D: AVIF added — formatSupport.avif is already probed at mount.
  // Disabled state shown when browser/canvas doesn't support encoding.
  const formats: Array<{ id: ImageExportFormat; label: string; supported: boolean }> = [
    { id: "webp", label: "WebP", supported: formatSupport.webp },
    { id: "avif", label: "AVIF", supported: formatSupport.avif },
    { id: "jpeg", label: "JPEG", supported: true },
    { id: "png", label: "PNG", supported: true },
  ];

  return (
    <div className="tw:p-4">
      {/* Format Selection */}
      <div className={SECTION}>
        <Label className={FIELD_LABEL}>Output Format</Label>
        <div className={SEGMENTED}>
          {formats.map(({ id, label, supported }) => (
            <Button
              key={id}
              size="xs"
              color={state.format === id ? undefined : "light"}
              aria-pressed={state.format === id}
              className="tw:flex-1"
              onClick={() => supported && handleFormatChange(id)}
              disabled={!supported}
            >
              {label}
              {id === "webp" && " (Recommended)"}
            </Button>
          ))}
        </div>
      </div>
      {/* Quality Slider */}
      <div className={SECTION}>
        <Label className={FIELD_LABEL}>Quality</Label>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex-1">
            {/* chrome-ui Slider, not a restyled range input. Its own readout is
                off because this panel shows a percentage, not the raw value. */}
            <Slider
              value={state.quality}
              onChange={(v) => setState((s) => ({ ...s, quality: v }))}
              min={10}
              max={100}
              label="Quality"
              withField={false}
            />
          </div>
          <span className="tw:min-w-10 tw:text-right tw:text-[13px] tw:[font-family:var(--bk-font-mono)] tw:text-gray-900">
            {state.quality}%
          </span>
        </div>
      </div>
      {/* §18 — Max dimension override */}
      <div className={SECTION}>
        <Label className={FIELD_LABEL} htmlFor="opt-max-dim">Max dimension (px)</Label>
        <TextInput
          id="opt-max-dim"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="No limit"
          aria-label="Max dimension in pixels"
          value={maxDim}
          onChange={(e) => setMaxDim(e.target.value)}
        />
      </div>
      {/* Stats */}
      <div className="tw:flex tw:justify-between tw:px-4 tw:py-3 tw:bg-gray-50 tw:rounded-lg tw:mb-4">
        <div className="tw:text-center">
          <div className={STAT_LABEL}>Original</div>
          <div className={STAT_VALUE}>{formatBytes(state.originalSize)}</div>
        </div>
        <div className="tw:text-center">
          <div className={STAT_LABEL}>Optimized</div>
          <div className={STAT_VALUE}>
            {state.isProcessing ? "..." : formatBytes(state.optimizedSize)}
          </div>
        </div>
        <div className="tw:text-center">
          <div className={STAT_LABEL}>Savings</div>
          <div className={`${STAT_VALUE} tw:text-[var(--bk-success)]`}>
            {state.isProcessing ? "..." : `${savings}%`}
          </div>
        </div>
      </div>
      {/* Preview Comparison */}
      <div className="tw:flex tw:gap-3 tw:mb-4">
        <div className={PREVIEW_BOX}>
          <img src={imageSrc} alt="Original" className="tw:max-w-full tw:max-h-30 tw:rounded" />
          <div className={PREVIEW_LABEL}>Original</div>
        </div>
        <div className={PREVIEW_BOX}>
          {state.isProcessing ? (
            <Spinner size="sm" />
          ) : state.optimizedSrc ? (
            <img src={state.optimizedSrc} alt="Optimized" className="tw:max-w-full tw:max-h-30 tw:rounded" />
          ) : null}
          <div className={PREVIEW_LABEL}>Optimized</div>
        </div>
      </div>
      {/* Actions */}
      <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4">
        {onClose && (
          <Button color="light" onClick={onClose} className={GHOST}>
            Cancel
          </Button>
        )}
        <Button onClick={handleApply} disabled={state.isProcessing || !state.optimizedSrc}>
          Apply Optimization
        </Button>
      </div>
    </div>
  );
};

export default OptimizationPanel;
