/**
 * Color Palette Generator
 * Generate and apply color palettes using color theory
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface ColorPaletteProps {
  onApplyColor?: (color: string) => void;
}

interface ColorSwatch {
  hex: string;
  name: string;
}

type HarmonyType = "complementary" | "analogous" | "triadic" | "split";

// ============================================================================
// HELPERS
// ============================================================================

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generatePalette(baseColor: string, harmony: HarmonyType): ColorSwatch[] {
  const [h, s, l] = hexToHsl(baseColor);

  switch (harmony) {
    case "complementary":
      return [
        { hex: baseColor, name: "Primary" },
        { hex: hslToHex((h + 180) % 360, s, l), name: "Complement" },
        { hex: hslToHex(h, s, Math.min(l + 20, 90)), name: "Light" },
        { hex: hslToHex(h, s, Math.max(l - 20, 10)), name: "Dark" },
      ];
    case "analogous":
      return [
        { hex: hslToHex((h + 330) % 360, s, l), name: "Adjacent 1" },
        { hex: baseColor, name: "Primary" },
        { hex: hslToHex((h + 30) % 360, s, l), name: "Adjacent 2" },
        { hex: hslToHex(h, s, Math.max(l - 30, 10)), name: "Accent" },
      ];
    case "triadic":
      return [
        { hex: baseColor, name: "Primary" },
        { hex: hslToHex((h + 120) % 360, s, l), name: "Triad 1" },
        { hex: hslToHex((h + 240) % 360, s, l), name: "Triad 2" },
        { hex: hslToHex(h, s, Math.min(l + 30, 95)), name: "Light" },
      ];
    case "split":
      return [
        { hex: baseColor, name: "Primary" },
        { hex: hslToHex((h + 150) % 360, s, l), name: "Split 1" },
        { hex: hslToHex((h + 210) % 360, s, l), name: "Split 2" },
        { hex: hslToHex(h, Math.max(s - 30, 10), l), name: "Muted" },
      ];
    default:
      // Fallback to complementary palette
      return [
        { hex: baseColor, name: "Primary" },
        { hex: hslToHex((h + 180) % 360, s, l), name: "Complement" },
        { hex: hslToHex(h, s, Math.min(l + 20, 90)), name: "Light" },
        { hex: hslToHex(h, s, Math.max(l - 20, 10)), name: "Dark" },
      ];
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ColorPalette: React.FC<ColorPaletteProps> = ({ onApplyColor }) => {
  const [baseColor, setBaseColor] = React.useState("#3b82f6");
  const [harmony, setHarmony] = React.useState<HarmonyType>("complementary");

  const palette = React.useMemo(() => generatePalette(baseColor, harmony), [baseColor, harmony]);

  return (
    <div style={{ padding: 16 }}>
      {/* Base Color Picker */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            display: "block",
            marginBottom: 8,
          }}
        >
          Base Color
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            style={{ width: 48, height: 32, border: "none", cursor: "pointer" }}
          />
          <input
            type="text"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "var(--aqb-bg-dark)",
              border: "1px solid var(--aqb-border)",
              borderRadius: 4,
              color: "var(--aqb-text)",
              fontFamily: "monospace",
            }}
          />
        </div>
      </div>

      {/* Harmony Selector */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            display: "block",
            marginBottom: 8,
          }}
        >
          Color Harmony
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["complementary", "analogous", "triadic", "split"] as HarmonyType[]).map((h) => (
            <button
              key={h}
              onClick={() => setHarmony(h)}
              style={{
                padding: "6px 12px",
                background: harmony === h ? "var(--aqb-primary)" : "var(--aqb-bg-dark)",
                border: "1px solid var(--aqb-border)",
                borderRadius: 4,
                color: harmony === h ? "#fff" : "var(--aqb-text)",
                fontSize: 12,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Palette Display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {palette.map((swatch) => (
          <div
            key={swatch.hex}
            onClick={() => onApplyColor?.(swatch.hex)}
            style={{
              cursor: onApplyColor ? "pointer" : "default",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                background: swatch.hex,
                borderRadius: 8,
                marginBottom: 4,
                border: "2px solid var(--aqb-border)",
              }}
            />
            <div style={{ fontSize: 10, color: "var(--aqb-text-muted)" }}>{swatch.name}</div>
            <div style={{ fontSize: 11, fontFamily: "monospace" }}>{swatch.hex}</div>
          </div>
        ))}
      </div>

      {/* Random Palette */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          const randomHue = Math.floor(Math.random() * 360);
          setBaseColor(hslToHex(randomHue, 70, 50));
        }}
        style={{ width: "100%" }}
      >
        🎲 Random Palette
      </Button>
    </div>
  );
};

export default ColorPalette;
