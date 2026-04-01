/**
 * ColorPicker — self-contained HSB canvas color picker
 * Props: { initialHex, background, onChange, onCancel, onSave }
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

export interface ColorPickerProps {
  initialHex: string;
  /** Background color for contrast ratio calculation */
  background?: string;
  onChange: (hex: string) => void;
  onCancel: () => void;
  onSave: (hex: string) => void;
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
}) => {
  const [hsb, setHsb] = React.useState<ColorHSB>(() => hexToHsb(initialHex));
  const [hexInput, setHexInput] = React.useState(initialHex.toUpperCase());
  const [hexError, setHexError] = React.useState(false);

  const sbCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const alphaCanvasRef = React.useRef<HTMLCanvasElement>(null);

  const isDraggingSb = React.useRef(false);
  const isDraggingHue = React.useRef(false);
  const isDraggingAlpha = React.useRef(false);

  const currentHex = hsbToHex(hsb);
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
    setHsb((prev) => ({ ...prev, s, b }));
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
    setHsb((prev) => ({ ...prev, h }));
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
    setHsb((prev) => ({ ...prev, a }));
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

  return (
    <div className="aqb-design-picker">
      {/* SB Canvas */}
      <div className="aqb-design-picker__sb-wrap">
        <canvas
          ref={sbCanvasRef}
          width={228}
          height={128}
          className="aqb-design-picker__sb-canvas"
          onPointerDown={handleSbDown}
          onPointerMove={handleSbMove}
          onPointerUp={handleSbUp}
        />
        <div className="aqb-design-picker__crosshair" style={{ left: sbX, top: sbY }} aria-hidden />
      </div>

      {/* Hue slider */}
      <div className="aqb-design-picker__slider-wrap">
        <canvas
          ref={hueCanvasRef}
          width={228}
          height={12}
          className="aqb-design-picker__slider-canvas"
          onPointerDown={handleHueDown}
          onPointerMove={handleHueMove}
          onPointerUp={handleHueUp}
        />
        <div className="aqb-design-picker__knob" style={{ left: hueX }} aria-hidden />
      </div>

      {/* Alpha slider */}
      <div className="aqb-design-picker__slider-wrap">
        <canvas
          ref={alphaCanvasRef}
          width={228}
          height={12}
          className="aqb-design-picker__slider-canvas"
          onPointerDown={handleAlphaDown}
          onPointerMove={handleAlphaMove}
          onPointerUp={handleAlphaUp}
        />
        <div className="aqb-design-picker__knob" style={{ left: alphaX }} aria-hidden />
        <span className="aqb-design-picker__alpha-label">{Math.round(hsb.a * 100)}%</span>
      </div>

      {/* Hex input row */}
      <div className="aqb-design-picker__hex-row">
        <div
          className="aqb-design-picker__swatch-preview"
          style={{ background: currentHex.slice(0, 7) }}
        />
        <div
          className={`aqb-design-picker__hex-input-wrap${hexError ? " aqb-design-picker__hex-input-wrap--error" : ""}`}
        >
          <span className="aqb-design-picker__hash">#</span>
          <input
            type="text"
            value={hexInput.replace("#", "")}
            onChange={handleHexInput}
            className="aqb-design-picker__hex-input"
            maxLength={8}
            spellCheck={false}
            aria-label="Hex color value"
          />
        </div>
        <span
          className="aqb-design-picker__contrast-badge"
          title={`Contrast ratio: ${contrastRatio.toFixed(1)}:1`}
        >
          {contrastRatio.toFixed(1)}:1
        </span>
      </div>

      {hexError && (
        <div className="aqb-design-picker__hex-error">Enter a valid hex like #3B82F6</div>
      )}

      {showAlphaWarning && (
        <div className="aqb-design-picker__alpha-warning">
          Background has transparency — contrast may not be accurate
        </div>
      )}

      {/* Action buttons */}
      <div className="aqb-design-picker__actions">
        <button className="aqb-design-picker__cancel-btn" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className="aqb-design-picker__save-btn"
          onClick={() => onSave(currentHex)}
          type="button"
          disabled={hexError}
        >
          Set color
        </button>
      </div>
    </div>
  );
};
