/**
 * MasterPreview — the summary pane's 272×152 preview (2L9 215:47036, boards
 * B6-K02 / B6-K03), L2-020 (owner 2026-10-10; kept code-ahead 2026-11-19).
 *
 * The well was one light surface, so a light-on-dark master (white text on a
 * translucent dark fill) showed as an empty box. Now:
 *   - Auto reads the picture: light content gets a dark well, dark content a
 *     light one (`wellToneForPixels`).
 *   - A manual choice — Light · Dark · Transparency checker — overrides it,
 *     remembered per component in this browser (a viewing preference).
 *   - Nothing here writes to the component: the well is behind the picture,
 *     never a style on the master.
 *
 * The dark well is gray-700, not a near-black surface (DESIGN.md NO BLACK);
 * the checker is a grid of token-filled cells — chrome carries no gradients
 * (Gate 11) and no inline SVG (design-debt ratchet).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Select } from "@/editor/chrome-ui";
import type { ComponentDefinition } from "@/shared/types/components";

type WellMode = "auto" | "light" | "dark" | "checker";
type WellTone = "light" | "dark";

const MODES: ReadonlyArray<{ value: WellMode; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "checker", label: "Transparency checker" },
];

const isWellMode = (v: string | null): v is WellMode => MODES.some((m) => m.value === v);

const WELL_BG: Record<WellTone | "checker", string> = {
  light: "tw:bg-[var(--bk-bg-subtle)]",
  dark: "tw:bg-[var(--bk-gray-700)]",
  checker: "tw:bg-[var(--bk-bg-panel)]",
};

const storageKey = (id: string) => `bk-component-preview-bg:${id}`;

function readMode(id: string): WellMode {
  try {
    const v = localStorage.getItem(storageKey(id));
    return isWellMode(v) ? v : "auto";
  } catch {
    return "auto";
  }
}

/**
 * Which well suits this picture? Alpha-weighted mean luminance of its visible
 * pixels: light content → "dark" well, dark content → "light" well; nothing
 * visible → null (no opinion; the well stays light).
 */
export function wellToneForPixels(data: Uint8ClampedArray): WellTone | null {
  let weight = 0;
  let sum = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const a = data[i + 3] / 255;
    if (a === 0) continue;
    const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    sum += lum * a;
    weight += a;
  }
  if (weight === 0) return null;
  return sum / weight > 0.6 ? "dark" : "light";
}

/** Auto's reading of the thumbnail, sampled small. Null until it loads, or
 *  when the browser cannot read it (no 2d canvas) — the well stays light. */
function useAutoTone(src: string | undefined): WellTone | null {
  const [tone, setTone] = React.useState<WellTone | null>(null);
  React.useEffect(() => {
    setTone(null);
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 32, 32);
        const t = wellToneForPixels(ctx.getImageData(0, 0, 32, 32).data);
        if (alive) setTone(t);
      } catch {
        /* A tainted or unreadable picture keeps the light well. */
      }
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return tone;
}

/* 16px squares on tokens: 18 × 10 cells cover the 272 × 152 well. */
const CHECKER_COLS = 18;
const CHECKER_CELLS = CHECKER_COLS * 10;

function Checker() {
  return (
    <div
      aria-hidden="true"
      className="tw:absolute tw:inset-0 tw:grid tw:grid-cols-[repeat(18,16px)] tw:auto-rows-[16px]"
      data-testid="component-preview-checker"
    >
      {Array.from({ length: CHECKER_CELLS }, (_, i) => (
        <span
          key={i}
          className={(Math.floor(i / CHECKER_COLS) + i) % 2 === 0 ? "tw:bg-[var(--bk-gray-200)]" : undefined}
        />
      ))}
    </div>
  );
}

export function MasterPreview({ component }: { component: ComponentDefinition }) {
  const [mode, setMode] = React.useState<WellMode>(() => readMode(component.id));
  React.useEffect(() => setMode(readMode(component.id)), [component.id]);
  const autoTone = useAutoTone(component.thumbnail);
  const well: WellTone | "checker" = mode === "auto" ? (autoTone ?? "light") : mode;

  const choose = (next: string) => {
    if (!isWellMode(next)) return;
    setMode(next);
    try {
      localStorage.setItem(storageKey(component.id), next);
    } catch {
      /* Private mode: the choice lasts this view. */
    }
  };

  return (
    <div
      className={`tw:relative tw:flex tw:h-[152px] tw:w-full tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded ${WELL_BG[well]}`}
      data-testid="component-preview"
      data-well={well}
    >
      {well === "checker" ? <Checker /> : null}
      {component.thumbnail ? (
        <img src={component.thumbnail} alt={component.name} className="tw:relative tw:max-h-full tw:max-w-full tw:object-contain" />
      ) : (
        <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">No preview yet</span>
      )}
      {component.thumbnail ? (
        <Select
          aria-label="Preview background"
          sizing="sm"
          value={mode}
          onChange={(e) => choose(e.target.value)}
          className="tw:absolute tw:right-2 tw:top-2 tw:w-[112px]"
          data-testid="component-preview-bg"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      ) : null}
    </div>
  );
}
