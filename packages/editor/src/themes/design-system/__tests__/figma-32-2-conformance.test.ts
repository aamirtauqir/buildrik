/**
 * Figma "Buildrick — Product" foundation conformance — locks the editor
 * design-system tokens to the Figma foundations (g4GzQFqzNYz5sosz1QtZXC,
 * 📕 Foundations page; DS replacement arc 2026-07-26).
 *
 * The fixture below is the source of truth, transcribed from the Figma
 * variables (get_variable_defs + use_figma walker). Legacy chrome token names
 * are references onto the Figma-canonical set, so the parser resolves one
 * chain of var() indirection before comparing. If a token drifts from Figma,
 * this test fails — that is the point.
 *
 * Update the fixture only when Figma itself changes.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const dsDir = join(here, "..");

function parseTokens(file: string): Record<string, string> {
  const css = readFileSync(join(dsDir, file), "utf8");
  const out: Record<string, string> = {};
  // strip block comments so a hex inside /* ... */ never counts as a value
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/(--buildrick-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out[m[1].toLowerCase()] = m[2].trim().toUpperCase();
  }
  return out;
}

/** Resolve var(--x) chains within one parsed token map. */
function resolve(tokens: Record<string, string>, name: string): string | undefined {
  let val = tokens[name];
  let hops = 0;
  while (val && hops < 8) {
    const m = val.match(/^VAR\((--[A-Z0-9-]+)\)$/);
    if (!m) return val;
    val = tokens[m[1].toLowerCase()];
    hops++;
  }
  return val;
}

/** Figma foundation values → the token that must carry them (post-resolution). */
const FIGMA_COLOR: Record<string, string> = {
  // surfaces
  "--buildrick-bg-app": "#F1F5F9",
  "--buildrick-bg-subtle": "#F1F5F9",
  "--buildrick-bg-card": "#FFFFFF",
  "--buildrick-bg-panel": "#F8FAFC",
  "--buildrick-bg-elevated": "#FFFFFF",
  // ink scale — Figma-canonical names
  "--buildrick-ink": "#0F172A",
  "--buildrick-ink-soft": "#485465",
  "--buildrick-ink-muted": "#656F7E",
  "--buildrick-ink-disabled": "#CBD5E1",
  // legacy text names must resolve onto the ink scale
  "--buildrick-text-primary": "#0F172A",
  "--buildrick-text-secondary": "#485465",
  "--buildrick-text-muted": "#656F7E",
  "--buildrick-text-heading": "#0F172A",
  "--buildrick-text-disabled": "#CBD5E1",
  // borders
  "--buildrick-border": "#E2E8F0",
  "--buildrick-border-medium": "#CBD5E1",
  "--buildrick-border-strong": "#94A3B8",
  "--buildrick-border-input": "#8D949C",
  // accent (Package collection — full set)
  "--buildrick-accent": "#406ED6",
  "--buildrick-accent-hover": "#2E56B8",
  "--buildrick-accent-pressed": "#264899",
  "--buildrick-accent-on": "#FFFFFF",
  "--buildrick-accent-text": "#3C68C9",
  "--buildrick-accent-subtle": "#EBF1FF",
  "--buildrick-accent-tint": "#ECF0FB",
  "--buildrick-text-on-accent": "#FFFFFF",
  // semantic triads (fill / text / tint — tints pre-mixed, never alpha)
  "--buildrick-success": "#16A34A",
  "--buildrick-success-text": "#117D39",
  "--buildrick-success-tint": "#E3F4E9",
  "--buildrick-warning": "#B45309",
  "--buildrick-warning-text": "#A05804",
  "--buildrick-warning-tint": "#FAECDC",
  "--buildrick-error": "#DC2626",
  "--buildrick-error-text": "#CB2323",
  "--buildrick-error-tint": "#FBE5E5",
};

const FIGMA_SIZE: Record<string, string> = {
  "--buildrick-size-rail": "60PX",
  "--buildrick-size-drawer": "320PX",
  "--buildrick-size-inspector": "300PX",
  "--buildrick-size-panel-right": "360PX",
  "--buildrick-size-nav": "240PX",
  "--buildrick-size-topbar": "56PX",
  "--buildrick-size-header": "44PX",
  "--buildrick-size-footer": "32PX",
  "--buildrick-size-row": "32PX",
  "--buildrick-size-row-dense": "28PX",
  "--buildrick-size-row-tall": "64PX",
  "--buildrick-footer-height": "32PX",
  "--buildrick-sidebar-width": "60PX",
  "--buildrick-sidebar-panel-width": "320PX",
  "--buildrick-right-panel-width": "300PX",
};

/** Elevation — 3-step scale from shipped Figma components. */
const FIGMA_SHADOW: Record<string, string> = {
  "--buildrick-shadow-raised": "0 1PX 3PX RGBA(15, 23, 42, 0.12)",
  "--buildrick-shadow-drag": "0 2PX 6PX RGBA(15, 23, 42, 0.24)",
  "--buildrick-shadow-overlay": "0 12PX 32PX RGBA(15, 23, 42, 0.16)",
};

/** Motion — fast/base/slow, ease-out house curve. */
const FIGMA_MOTION: Record<string, string> = {
  "--buildrick-duration-fast": "100MS",
  "--buildrick-duration-normal": "160MS",
  "--buildrick-duration-slow": "240MS",
  "--buildrick-ease-default": "CUBIC-BEZIER(0.2, 0, 0, 1)",
};

describe("Figma foundation conformance (Buildrick — Product)", () => {
  const color = parseTokens("color.css");
  const layout = parseTokens("layout.css");
  const shadow = parseTokens("shadow.css");
  const motion = parseTokens("motion.css");

  describe("colour tokens match Figma", () => {
    for (const [token, figmaVal] of Object.entries(FIGMA_COLOR)) {
      it(`${token} → ${figmaVal}`, () => {
        expect(color[token], `${token} missing from color.css`).toBeDefined();
        expect(resolve(color, token)).toBe(figmaVal.toUpperCase());
      });
    }
  });

  describe("size tokens match Figma", () => {
    for (const [token, figmaVal] of Object.entries(FIGMA_SIZE)) {
      it(`${token} === ${figmaVal}`, () => {
        expect(layout[token], `${token} missing from layout.css`).toBeDefined();
        expect(resolve(layout, token)).toBe(figmaVal);
      });
    }
  });

  describe("elevation tokens match Figma", () => {
    for (const [token, figmaVal] of Object.entries(FIGMA_SHADOW)) {
      it(`${token} === ${figmaVal}`, () => {
        expect(shadow[token], `${token} missing from shadow.css`).toBeDefined();
        expect(resolve(shadow, token)).toBe(figmaVal);
      });
    }
  });

  describe("motion tokens match Figma", () => {
    for (const [token, figmaVal] of Object.entries(FIGMA_MOTION)) {
      it(`${token} === ${figmaVal}`, () => {
        expect(motion[token], `${token} missing from motion.css`).toBeDefined();
        expect(resolve(motion, token)).toBe(figmaVal);
      });
    }
  });

  it("weights cap at 600 — no 700 in the chrome type system", () => {
    const type = parseTokens("typography.css");
    expect(resolve(type, "--buildrick-font-weight-bold")).toBe("600");
  });

  it("Inter is the UI family (Geist Mono for data)", () => {
    const type = parseTokens("typography.css");
    expect(resolve(type, "--buildrick-font-family")).toContain('"INTER"');
    expect(resolve(type, "--buildrick-font-family-mono")).toContain("GEIST MONO");
  });
});
