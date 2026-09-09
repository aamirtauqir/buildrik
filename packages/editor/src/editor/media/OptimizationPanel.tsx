/**
 * OptimizationPanel — board S3.6 · media · optimise (1124:4562).
 *
 * Drawer anatomy: a 160h preview well with the live mono size line, a Format
 * chip row, the Quality slider with its mono readout, Original / Optimised
 * size rows where the saving rides the optimised number in success, a
 * full-width Optimise CTA and the new-version note. The back row and panel
 * header belong to the drill-in that hosts this (AssetDetailOverlay), which is
 * why the panel starts at the preview.
 *
 * Two code-only controls have no board row and are kept, not deleted: AVIF
 * (a real capability probed at mount — it joins the board's three chips) and
 * the max-dimension clamp (§18). Both are flagged for a Figma row rather than
 * removed to match a static frame.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Spinner, Button, Slider, TextInput } from "@/editor/chrome-ui";
import { MediaOptimizer } from "../../engine/media";
import { formatBytes } from "@shared/utils/helpers/number";
import type { ImageExportFormat } from "../../shared/types/media";

// ============================================================================
// TYPES
// ============================================================================

export interface OptimizationPanelProps {
  imageSrc: string;
  onOptimized: (optimizedSrc: string) => void;
  /**
   * Renders a Cancel link beside the CTA. The drill-in omits it — its ‹ back
   * row is the exit and the board draws no second one; the fullpage manager
   * passes it because there the panel replaces the library view.
   */
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

// ── Board classes ───────────────────────────────────────────────────────────
const LABEL = "tw:block tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
const MONO =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:font-medium tw:tabular-nums";
/* `tw:h-6`, not `tw:min-h-6` — flowbite's Button is `h-10` and only a
   SAME-property utility beats it through twMerge, so the format chips shipped
   40 tall against board 1124:4570's 24. Identical trap, identical fix, in
   ImageEditorModal's own CHIP. */
const CHIP = "tw:h-6 tw:min-h-0 tw:rounded-full tw:border-0 tw:px-3 tw:py-0.5 tw:text-[12px] tw:leading-4";
/* `--bk-accent-tint` (#EBF5FF), which is what board 1124:4570's
   `--color/bg-selected` names. The class carried that hex as the FALLBACK of a
   token that resolves to #E1EFFE, so the fallback was right, the token was
   wrong, and the fallback never applies. */
const CHIP_ACTIVE =
  "tw:bg-[var(--bk-accent-tint)] tw:font-medium tw:text-[var(--bk-accent-text)]";
const CHIP_RESTING = "tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-200)]";
const ROW = "tw:flex tw:items-center tw:justify-between tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";

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

  /* Board 1124:4568's line is `{w}x{h} · {bytes}`. The pixels are read off the
     decoded image rather than taken from the library record, because this panel
     takes only a `src` — the drill-in that hosts it holds the LibraryItem. Null
     until the image decodes, and the byte half renders on its own meanwhile. */
  const [dimensions, setDimensions] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!imageSrc) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive && img.naturalWidth) setDimensions(`${img.naturalWidth}×${img.naturalHeight}`);
    };
    img.src = imageSrc;
    return () => {
      alive = false;
    };
  }, [imageSrc]);

  // Check format support
  const [formatSupport, setFormatSupport] = React.useState({ webp: true, avif: false });

  React.useEffect(() => {
    optimizer.checkFormatSupport().then(setFormatSupport);
  }, [optimizer]);

  /*
    Original size. The base64 arithmetic only works for data: URLs — every
    asset in the library is a blob:/http: URL, so this read returned 0 and the
    panel showed "Original 0 Bytes" with a 0% saving next to a real optimised
    number. Found by the live walk against board 1124:4562. Falls back to
    fetching the blob and reading its size.
  */
  React.useEffect(() => {
    if (!imageSrc) return;
    let alive = true;
    const base64 = imageSrc.startsWith("data:") ? imageSrc.split(",")[1] : null;
    if (base64) {
      setState((s) => ({ ...s, originalSize: Math.round((base64.length * 3) / 4) }));
      return;
    }
    fetch(imageSrc)
      .then((r) => r.blob())
      .then((blob) => {
        if (alive) setState((s) => ({ ...s, originalSize: blob.size }));
      })
      .catch(() => {
        // Unreachable source — the optimised number still renders on its own.
      });
    return () => {
      alive = false;
    };
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

  // AVIF joins the board's three chips — formatSupport.avif is probed at mount,
  // and the chip renders disabled where the browser cannot encode it.
  const formats: Array<{ id: ImageExportFormat; label: string; supported: boolean }> = [
    { id: "webp", label: "WebP", supported: formatSupport.webp },
    { id: "avif", label: "AVIF", supported: formatSupport.avif },
    { id: "jpeg", label: "JPEG", supported: true },
    { id: "png", label: "PNG", supported: true },
  ];

  return (
    <div className="tw:flex tw:flex-col">
      {/* Board 1124: one 160h well — the optimised result once it exists, the
          original until then. Two side-by-side thumbnails were the old shape;
          at 320 they were 130px each and proved nothing. */}
      <div
        data-testid="opt-preview"
        className="tw:relative tw:h-40 tw:w-full tw:shrink-0 tw:overflow-hidden tw:bg-[var(--bk-bg-subtle)]"
      >
        {state.isProcessing ? (
          <span className="tw:flex tw:h-full tw:items-center tw:justify-center">
            <Spinner size="sm" />
          </span>
        ) : (
          <img
            src={state.optimizedSrc ?? imageSrc}
            alt={state.optimizedSrc ? "Optimised preview" : "Original"}
            className="tw:size-full tw:object-contain"
          />
        )}
        {/* Board 1124:4568 reads `2400x1600 - 840 KB`: the pixel dimensions
            come FIRST and the byte size second. This printed the bytes alone,
            so the one line that tells you what you are about to shrink never
            said how big it is on screen. */}
        <span
          data-testid="opt-preview-dims"
          className={`tw:absolute tw:bottom-2 tw:left-4 ${MONO} tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]`}
        >
          {dimensions ? `${dimensions} · ` : ""}
          {formatBytes(state.originalSize)}
        </span>
      </div>

      <div className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-3">
        {/* Format */}
        <div>
          <span className={LABEL} id="opt-format-label" data-testid="opt-format-label">
            Format
          </span>
          <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:gap-2" role="group" aria-labelledby="opt-format-label">
            {formats.map(({ id, label, supported }) => (
              <Button
                key={id}
                data-testid={`opt-format-${id}`}
                className={`${CHIP} ${state.format === id ? CHIP_ACTIVE : CHIP_RESTING}`}
                aria-pressed={state.format === id}
                onClick={() => supported && handleFormatChange(id)}
                disabled={!supported}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Quality — label left, mono value right, slider under (board 1124). */}
        <div>
          <div className="tw:flex tw:items-center tw:justify-between">
            <span className={LABEL} data-testid="opt-quality-label">Quality</span>
            <span className={`${MONO} tw:text-[var(--bk-ink-soft)]`} data-testid="opt-quality-value">
              {state.quality}%
            </span>
          </div>
          <div className="tw:mt-1.5">
            <Slider
              value={state.quality}
              onChange={(v) => setState((s) => ({ ...s, quality: v }))}
              min={10}
              max={100}
              label="Quality"
              withField={false}
            />
          </div>
        </div>

        {/* §18 max-dimension clamp — real behaviour with no board row yet. */}
        <div>
          <label className={LABEL} htmlFor="opt-max-dim">
            Max dimension (px)
          </label>
          <TextInput
            id="opt-max-dim"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="No limit"
            aria-label="Max dimension in pixels"
            className="tw:mt-1.5 tw:[&_input]:h-8 tw:[&_input]:rounded-md tw:[&_input]:text-[13px]"
            value={maxDim}
            onChange={(e) => setMaxDim(e.target.value)}
          />
        </div>

        {/* Size rows — the saving rides the optimised number, in success. */}
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <div className={ROW}>
            <span data-testid="opt-original-label">Original</span>
            <span className={`${MONO} tw:text-[var(--bk-ink-muted)]`} data-testid="opt-original-size">
              {formatBytes(state.originalSize)}
            </span>
          </div>
          <div className={ROW}>
            <span data-testid="opt-optimised-label">Optimised</span>
            {/* Success green means "this saved you something". A wash (0%) or
                a bigger file is not a success and must not read as one.

                The TEXT tokens, not the raw signal colours: board 1124:4584
                names `--color/success-text` #057A55, and the `--bk-success`
                #0E9F6E this carried measures 3.39:1 on white at 11px — a WCAG
                failure the board's own choice fixes. `--bk-warning` #C27803
                (3.51:1) is the same defect on the branch no board draws, so it
                moves with it rather than being left as the one inaccessible
                readout in the panel. */}
            <span
              className={`${MONO} ${savings > 0 ? "tw:text-[var(--bk-success-text)]" : savings < 0 ? "tw:text-[var(--bk-warning-text)]" : "tw:text-[var(--bk-ink-muted)]"}`}
              data-testid="opt-result"
            >
              {state.isProcessing
                ? "…"
                : state.originalSize > 0
                  ? `${formatBytes(state.optimizedSize)}${savings === 0 ? "" : ` · ${savings > 0 ? "−" : "+"}${Math.abs(savings)}%`}`
                  : formatBytes(state.optimizedSize)}
            </span>
          </div>
        </div>

        {/* CTA — full-width per the board. */}
        <Button
          className="tw:h-9 tw:w-full tw:rounded tw:border-0 tw:bg-[var(--bk-accent)] tw:text-[13px] tw:font-medium tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-accent-hover)]"
          data-testid="opt-apply"
          onClick={handleApply}
          disabled={state.isProcessing || !state.optimizedSrc}
        >
          Optimise
        </Button>

        <div className="tw:flex tw:items-center tw:gap-2 tw:pb-4">
          <span
            data-testid="opt-version-note"
            className="tw:min-w-0 tw:flex-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]"
          >
            Optimised copy saves as a new version.
          </span>
          {onClose && (
            <Button
              color="light"
              size="xs"
              className="tw:min-h-6 tw:shrink-0 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)]"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationPanel;
