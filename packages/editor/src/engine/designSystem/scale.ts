/**
 * One colour → an 11-step scale (spec §7, D3). Built in OKLCH: every step
 * sits at a fixed target lightness, the picked colour is kept EXACTLY at the
 * step nearest its own lightness, chroma follows a fixed shape scaled to the
 * pick, hue stays the pick's. Out-of-gamut steps lose chroma until the sRGB
 * round trip holds. Deterministic: same input, same 11 values.
 *
 * Dark alias: the step mirroring the pick around the middle (10 − index),
 * clamped to 300…500 so dark accents stay readable. `mirrorStep` is the same
 * mirror without the clamp — what a surface or a text colour needs (a light
 * background must turn dark, not mid-grey; OQ-5).
 */
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { parseColor, rgbToHex, rgbToOklch, oklchToRgb } from "@/shared/utils/parsers";

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];

const TARGET_L = [0.97, 0.932, 0.882, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282];
const CHROMA_SHAPE = [0.12, 0.25, 0.45, 0.7, 0.9, 1, 1, 0.92, 0.8, 0.68, 0.55];
const MAX_CHROMA = 0.37;

export interface ColorScale {
  /** 11 opaque `#RRGGBB`, 50 → 950. */
  hexes: string[];
  pickedStep: ScaleStep;
  darkStep: ScaleStep;
  mirrorStep: ScaleStep;
}

const hexOf = (rgb: { r: number; g: number; b: number }) => rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b }).toUpperCase();

function fitToGamut(l: number, c: number, h: number): string {
  let chroma = c;
  for (let i = 0; i < 80; i++) {
    const rgb = oklchToRgb({ l, c: chroma, h });
    const back = rgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) return hexOf(rgb);
    if (chroma === 0) break;
    chroma = Math.max(0, chroma - 0.005);
  }
  return hexOf(oklchToRgb({ l, c: 0, h }));
}

export function generateColorScale(input: string): ColorScale | null {
  const rgb = parseColor(input.trim());
  if (!rgb || (rgb.a !== undefined && rgb.a < 1)) return null;
  const picked = rgbToOklch({ r: rgb.r, g: rgb.g, b: rgb.b });
  let pi = 0;
  for (let i = 1; i < TARGET_L.length; i++) {
    if (Math.abs(TARGET_L[i] - picked.l) < Math.abs(TARGET_L[pi] - picked.l)) pi = i;
  }
  const mirror = 10 - pi;
  const hexes = TARGET_L.map((l, i) =>
    i === pi ? hexOf(rgb) : fitToGamut(l, Math.min(MAX_CHROMA, (picked.c * CHROMA_SHAPE[i]) / CHROMA_SHAPE[pi]), picked.h),
  );
  return {
    hexes,
    pickedStep: SCALE_STEPS[pi],
    darkStep: SCALE_STEPS[Math.min(5, Math.max(3, mirror))],
    mirrorStep: SCALE_STEPS[mirror],
  };
}

const stepHex = (scale: ColorScale, step: ScaleStep) => scale.hexes[SCALE_STEPS.indexOf(step)];

/** Writes `scale` as the role's own primitives (`<role>-50…950`, group
 *  `scale-<roleId>`) and aliases the role's light → picked step, dark → dark
 *  step. A scale this role generated before is overwritten in place; a token
 *  it does not own is never touched — the whole scale takes a free prefix. */
export function applyScaleToRole(
  tokens: readonly DesignToken[],
  roleId: string,
  scale: ColorScale,
): { ok: true; tokens: DesignToken[]; prefix: string } | { ok: false; reason: "not-a-semantic-colour" } {
  const role = tokens.find((t) => t.id === roleId);
  if (!role || role.kind !== "color" || role.layer !== "semantic") return { ok: false, reason: "not-a-semantic-colour" };
  const group = `scale-${roleId}`;
  const slug = roleId.replace(/^color-/, "");
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const vars = new Set(tokens.map((t) => t.cssVar));
  const fits = (prefix: string) =>
    SCALE_STEPS.every((s) => {
      const id = `${prefix}-${s}`;
      const existing = byId.get(id);
      if (existing) return existing.layer === "primitive" && existing.group === group && existing.cssVar === `--buildrick-design-${id}`;
      return !vars.has(`--buildrick-design-${id}`);
    });
  let prefix = slug;
  for (let n = 2; !fits(prefix); n++) prefix = `${slug}-${n}`;

  const primitives: DesignToken[] = SCALE_STEPS.map((s) => ({
    id: `${prefix}-${s}`,
    name: `${role.name} ${s}`,
    kind: "color",
    layer: "primitive",
    modes: { light: { value: stepHex(scale, s) } },
    category: "colors",
    cssVar: `--buildrick-design-${prefix}-${s}`,
    type: "color",
    group,
  }));
  const ids = new Set(primitives.map((p) => p.id));
  const rest = tokens
    .filter((t) => !ids.has(t.id))
    .map((t) =>
      t.id === roleId
        ? { ...t, modes: { light: { alias: `${prefix}-${scale.pickedStep}` }, dark: { alias: `${prefix}-${scale.darkStep}` } } }
        : t,
    );
  const at = rest.findIndex((t) => t.id === roleId);
  return { ok: true, tokens: [...rest.slice(0, at), ...primitives, ...rest.slice(at)], prefix };
}

const mirrors = (t: DesignToken) =>
  t.semanticKind === "surface" || t.semanticKind === "text" || t.group === "surface" || t.group === "text";

/** Dark values for every semantic colour that has none (D11). One
 *  `custom-<id>-dark` primitive each, via `setTokenLiteral` (OQ-5). A token
 *  whose light value is not an opaque colour (`transparent`) is skipped. */
export function proposeMissingDarks(tokens: readonly DesignToken[]): { tokens: DesignToken[]; filled: string[] } {
  let out: DesignToken[] = [...tokens];
  const filled: string[] = [];
  for (const t of tokens) {
    if (t.kind !== "color" || t.layer !== "semantic" || t.replacedBy || t.modes.dark) continue;
    const light = resolveTokenLiteral(out, t.id, "light");
    const scale = light ? generateColorScale(light) : null;
    if (!scale) continue;
    out = setTokenLiteral(out, t.id, "dark", stepHex(scale, mirrors(t) ? scale.mirrorStep : scale.darkStep));
    filled.push(t.id);
  }
  return { tokens: out, filled };
}
