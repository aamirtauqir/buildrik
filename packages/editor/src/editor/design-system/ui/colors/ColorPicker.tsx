/**
 * ColorPicker — the ONE colour picker (G3-140), board 7318:80959: title,
 * shade canvas, hue, alpha, "Hex [old] New [hex]" with the contrast ratio,
 * WORKSPACE PALETTE (the brand's colours), and a Cancel / Apply foot. Brand's
 * token card opens it in a popover; the inspector's Fill popover reuses it
 * for a custom colour and, footless (`actions`), for Edit token (4428:142968).
 * No external state — fully controlled by parent via callbacks.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ColorHSB } from "../../types";
import {
  hexToHsb,
  hsbToHex,
  isValidHex,
  expandShorthand,
  calcContrastRatio,
} from "../../utils/colorUtils";
import { Button, TextField } from "@/editor/chrome-ui";

export interface ColorPickerProps {
  initialHex: string;
  /** Background color for contrast ratio calculation */
  background?: string;
  onChange: (hex: string) => void;
  onCancel: () => void;
  onSave: (hex: string) => void;
  /** The header line (7318:80959 names the token, "Primary"). */
  title?: string;
  /** WORKSPACE PALETTE — the brand's colours; a click takes the value. */
  palette?: { id: string; name: string; value: string }[];
  /** Replaces the Cancel / Apply foot (Edit token draws its own actions). */
  actions?: (hex: string, valid: boolean) => React.ReactNode;
}

// ─── Canvas gradient helpers ──────────────────────────────────────────────────

function drawSatBrightCanvas(canvas: HTMLCanvasElement, hue: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;

  // White → Hue gradient (horizontal)
  const hueColor = `hsl(${hue}, 100%, 50%)`;
  const gradH = ctx.createLinearGradient(0, 0, width, 0);
  gradH.addColorStop(0, "#fff");
  gradH.addColorStop(1, hueColor);
  ctx.fillStyle = gradH;
  ctx.fillRect(0, 0, width, height);

  // Transparent → Black gradient (vertical)
  const gradV = ctx.createLinearGradient(0, 0, 0, height);
  gradV.addColorStop(0, "rgba(0,0,0,0)");
  gradV.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = gradV;
  ctx.fillRect(0, 0, width, height);
}

function drawHueBar(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  const stops = [0, 60, 120, 180, 240, 300, 360];
  stops.forEach((deg) => grad.addColorStop(deg / 360, `hsl(${deg},100%,50%)`));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawAlphaBar(canvas: HTMLCanvasElement, hue: number, sat: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;

  // Checkerboard
  const tileSize = 6;
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      ctx.fillStyle =
        (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0 ? "#ccc" : "#fff";
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Transparent → opaque gradient
  const hslColor = `hsl(${hue},${Math.round(sat * 100)}%,50%)`;
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, `${hslColor.replace(")", ",0)")}`);
  grad.addColorStop(1, hslColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// ─── Clamp helper ─────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ─── ColorPicker component ────────────────────────────────────────────────────

export const ColorPicker: React.FC<ColorPickerProps> = ({
  initialHex,
  background = "#0A0A0A",
  onChange,
  onCancel,
  onSave,
  title,
  palette = [],
  actions,
}) => {
  const [hsb, setHsb] = React.useState<ColorHSB>(() => hexToHsb(initialHex));
  const [hexInput, setHexInput] = React.useState(initialHex.toUpperCase());
  const [hexError, setHexError] = React.useState(false);
  /* The hex the user GAVE (the token's value on open, or what they typed) —
     kept verbatim until a canvas control moves. HSB is lossy: #1A56DB comes
     back from hexToHsb → hsbToHex as #1A57DB, so opening the picker and
     pressing Set color without touching anything saved a different colour
     (QA, 2026-09-24). A drag is a new colour; only then does HSB speak. */
  const [exactHex, setExactHex] = React.useState<string | null>(() => initialHex.toUpperCase());
  const moveHsb = (update: (prev: ColorHSB) => ColorHSB) => {
    setExactHex(null);
    setHsb(update);
  };

  const sbCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const alphaCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const isDraggingSb = React.useRef(false);
  const isDraggingHue = React.useRef(false);
  const isDraggingAlpha = React.useRef(false);

  const currentHex = exactHex ?? hsbToHex(hsb);
  const contrastRatio = calcContrastRatio(currentHex.slice(0, 7), background);

  // Sync hex input when hsb changes externally
  React.useEffect(() => {
    setHexInput(currentHex.slice(0, 7).toUpperCase());
    onChange(currentHex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsb]);

  // Draw canvases
  React.useEffect(() => {
    if (sbCanvasRef.current) drawSatBrightCanvas(sbCanvasRef.current, hsb.h);
  }, [hsb.h]);

  React.useEffect(() => {
    if (hueCanvasRef.current) drawHueBar(hueCanvasRef.current);
  }, []);

  React.useEffect(() => {
    if (alphaCanvasRef.current) drawAlphaBar(alphaCanvasRef.current, hsb.h, hsb.s);
  }, [hsb.h, hsb.s]);

  // ─ SB canvas interactions ─
  const handleSbPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sbCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);
    const s = x / rect.width;
    const b = 1 - y / rect.height;
    moveHsb((prev) => ({ ...prev, s, b }));
  };

  const handleSbDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingSb.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    handleSbPointer(e);
  };

  const handleSbMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingSb.current) return;
    handleSbPointer(e);
  };

  const handleSbUp = () => {
    isDraggingSb.current = false;
  };

  // ─ Hue slider interactions ─
  const handleHuePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const h = Math.round((x / rect.width) * 360);
    moveHsb((prev) => ({ ...prev, h }));
  };

  const handleHueDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingHue.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    handleHuePointer(e);
  };

  const handleHueMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingHue.current) return;
    handleHuePointer(e);
  };

  const handleHueUp = () => {
    isDraggingHue.current = false;
  };

  // ─ Alpha slider interactions ─
  const handleAlphaPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = alphaCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const a = Math.round((x / rect.width) * 100) / 100;
    moveHsb((prev) => ({ ...prev, a }));
  };

  const handleAlphaDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingAlpha.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    handleAlphaPointer(e);
  };

  const handleAlphaMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingAlpha.current) return;
    handleAlphaPointer(e);
  };

  const handleAlphaUp = () => {
    isDraggingAlpha.current = false;
  };

  // ─ Hex input ─
  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw.toUpperCase());

    const full = raw.startsWith("#") ? raw : `#${raw}`;
    const expanded = expandShorthand(full);
    if (isValidHex(expanded)) {
      setHexError(false);
      setExactHex(expanded.toUpperCase());
      setHsb(hexToHsb(expanded));
    } else {
      setHexError(true);
    }
  };

  // ─ Crosshair position ─
  const sbX = `${(hsb.s * 100).toFixed(1)}%`;
  const sbY = `${((1 - hsb.b) * 100).toFixed(1)}%`;
  const hueX = `${(hsb.h / 360) * 100}%`;
  const alphaX = `${(hsb.a * 100).toFixed(0)}%`;

  const showAlphaWarning = hsb.a < 0.8;

  const takeHex = (hex: string) => {
    const expanded = expandShorthand(hex.startsWith("#") ? hex : `#${hex}`);
    if (!isValidHex(expanded)) return;
    setHexError(false);
    setExactHex(expanded.toUpperCase());
    setHsb(hexToHsb(expanded));
  };

  const EYEBROW = "tw:text-[length:var(--bk-text-11)] tw:uppercase tw:tracking-[0.06em] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
  const BAR = "tw:relative tw:h-2";
  const BAR_CANVAS = "tw:block tw:h-2 tw:w-full tw:cursor-pointer tw:rounded-full";
  const KNOB =
    "tw:pointer-events-none tw:absolute tw:top-1/2 tw:size-3.5 tw:-translate-x-1/2 tw:-translate-y-1/2 tw:rounded-full tw:border-2 tw:border-white tw:shadow-[var(--bk-shadow-raised)]";

  return (
    <div className="tw:flex tw:w-70 tw:flex-col" data-testid="color-picker">
      {title ? (
        <div className="tw:border-b tw:border-[var(--bk-border)] tw:px-4 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="color-picker-title">
          {title}
        </div>
      ) : null}
      <div className="tw:flex tw:flex-col tw:gap-3 tw:p-4">
        {/* Shade (saturation × brightness) */}
        <div className="tw:relative">
          <canvas
            ref={sbCanvasRef}
            width={248}
            height={120}
            className="tw:block tw:h-30 tw:w-full tw:cursor-crosshair tw:rounded"
            onPointerDown={handleSbDown}
            onPointerMove={handleSbMove}
            onPointerUp={handleSbUp}
            aria-label="Shade"
          />
          <div
            className="tw:pointer-events-none tw:absolute tw:size-3 tw:-translate-x-1/2 tw:-translate-y-1/2 tw:rounded-full tw:border-2 tw:border-white"
            style={{ left: sbX, top: sbY }}
            aria-hidden
          />
        </div>
        {/* Hue */}
        <div className={BAR}>
          <canvas ref={hueCanvasRef} width={248} height={8} className={BAR_CANVAS} onPointerDown={handleHueDown} onPointerMove={handleHueMove} onPointerUp={handleHueUp} aria-label="Hue" />
          <div className={KNOB} style={{ left: hueX, background: `hsl(${hsb.h},100%,50%)` }} aria-hidden />
        </div>
        {/* Alpha (not drawn on 7318:80959; the one picker keeps it — G3-140) */}
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className={`${BAR} tw:flex-1`}>
            <canvas ref={alphaCanvasRef} width={248} height={8} className={BAR_CANVAS} onPointerDown={handleAlphaDown} onPointerMove={handleAlphaMove} onPointerUp={handleAlphaUp} aria-label="Opacity" />
            <div className={`${KNOB} tw:bg-white`} style={{ left: alphaX }} aria-hidden />
          </div>
          <span className="tw:w-9 tw:text-right tw:text-[length:var(--bk-text-11)] tw:tabular-nums tw:text-[var(--bk-ink-muted)]" data-testid="picker-alpha-label">
            {Math.round(hsb.a * 100)}%
          </span>
        </div>
        {/* Hex [old] New [hex] · contrast */}
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-muted)]">
          <span>Hex</span>
          <span className="tw:size-6 tw:flex-none tw:rounded tw:border tw:border-[var(--bk-border)]" style={{ background: currentHex.slice(0, 7) }} data-testid="color-picker-preview" aria-hidden />
          <span>New</span>
          <TextField
            type="text"
            value={hexInput}
            onChange={handleHexInput}
            className="tw:min-w-0 tw:flex-1 tw:[font-family:var(--bk-font-mono)]"
            maxLength={9}
            spellCheck={false}
            aria-label="Hex color value"
            aria-invalid={hexError || undefined}
          />
          <span className="tw:tabular-nums" title={`Contrast ratio: ${contrastRatio.toFixed(1)}:1`}>
            {contrastRatio.toFixed(1)}:1
          </span>
        </div>
        {hexError && (
          <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-error-text)]">Enter a valid hex like #3B82F6</div>
        )}
        {showAlphaWarning && (
          <div className="tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-warning-text)]">
            Background has transparency — contrast may not be accurate
          </div>
        )}
        {palette.length > 0 ? (
          <div className="tw:flex tw:flex-col tw:gap-2" data-testid="color-picker-palette">
            <span className={EYEBROW}>Workspace palette</span>
            <div className="tw:flex tw:flex-wrap tw:gap-2.5">
              {palette.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="xs"
                  className="tw:size-5.5 tw:min-h-0 tw:min-w-0 tw:rounded tw:border tw:border-[var(--bk-border)] tw:p-0"
                  style={{ background: p.value }}
                  onClick={() => takeHex(p.value)}
                  aria-label={`Use ${p.name} ${p.value}`}
                  title={`${p.name} · ${p.value}`}
                />
              ))}
            </div>
          </div>
        ) : null}
        {actions ? actions(currentHex, !hexError) : null}
      </div>
      {actions ? null : (
        <div className="tw:flex tw:justify-end tw:gap-2 tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:py-3">
          <Button type="button" variant="secondary" size="xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="xs" onClick={() => onSave(currentHex)} disabled={!!hexError}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};
