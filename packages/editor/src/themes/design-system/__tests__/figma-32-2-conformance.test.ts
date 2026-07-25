/**
 * Figma "Foundations (32-2)" conformance — locks the editor design-system tokens
 * to the Figma foundations file (g4GzQFqzNYz5sosz1QtZXC, node 32-2).
 *
 * The fixture below is the source of truth, transcribed from the Figma variables
 * (get_variable_defs + the Foundations frame swatches, 2026-07-24). If a token in
 * color.css / layout.css drifts from Figma, this test fails — that is the point:
 * it is the "real developer" verification the design language stays applied.
 *
 * Intentional deviations from Figma would be declared in a KEEPS map with a
 * reason. Currently there are none: the last one (warning #B45309 vs Figma
 * #D97706, WCAG AA) was resolved 2026-07-25 by updating the FIGMA variable to
 * the a11y-safe value. Update the fixture only when Figma itself changes.
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

/** Figma 32-2 foundation values → the design-system token that must carry them. */
const FIGMA_COLOR: Record<string, string> = {
  // surfaces
  "--buildrick-bg-app": "#F1F5F9",
  "--buildrick-bg-subtle": "#F1F5F9",
  "--buildrick-bg-card": "#FFFFFF",
  "--buildrick-bg-panel": "#F8FAFC",
  "--buildrick-bg-elevated": "#FFFFFF",
  // ink scale
  "--buildrick-text-primary": "#0F172A", // Figma ink
  "--buildrick-text-secondary": "#485465", // Figma ink-soft
  "--buildrick-text-muted": "#656F7E", // Figma ink-muted
  "--buildrick-text-heading": "#0F172A",
  "--buildrick-text-disabled": "#CBD5E1", // Figma ink-disabled
  // borders
  "--buildrick-border": "#E2E8F0",
  "--buildrick-border-medium": "#CBD5E1",
  "--buildrick-border-strong": "#94A3B8",
  "--buildrick-border-input": "#8D949C",
  // accent
  "--buildrick-accent": "#406ED6",
  "--buildrick-accent-text": "#3C68C9",
  "--buildrick-accent-tint-solid": "#ECF0FB",
  "--buildrick-text-on-accent": "#FFFFFF", // Figma accent-on
  // semantic fill
  "--buildrick-success": "#16A34A",
  "--buildrick-error": "#DC2626",
  // warning: Figma variable updated 2026-07-25 to the WCAG-AA amber-700 the
  // code shipped (amber-600 #D97706 failed 3.19:1 on warning-bg).
  "--buildrick-warning": "#B45309",
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
  "--buildrick-footer-height": "32PX", // shipped footer now matches Figma
  // shell widths — widened to Figma 32-2 (founder-approved 2026-07-24)
  "--buildrick-sidebar-width": "60PX", // Figma rail
  "--buildrick-sidebar-panel-width": "320PX", // Figma drawer
  "--buildrick-right-panel-width": "300PX", // Figma inspector
};

describe("Figma 32-2 foundation conformance", () => {
  const color = parseTokens("color.css");
  const layout = parseTokens("layout.css");

  describe("colour tokens match Figma", () => {
    for (const [token, figmaVal] of Object.entries(FIGMA_COLOR)) {
      it(`${token} === ${figmaVal}`, () => {
        expect(color[token], `${token} missing from color.css`).toBeDefined();
        expect(color[token]).toBe(figmaVal.toUpperCase());
      });
    }
  });

  describe("size tokens match Figma", () => {
    for (const [token, figmaVal] of Object.entries(FIGMA_SIZE)) {
      it(`${token} === ${figmaVal}`, () => {
        expect(layout[token], `${token} missing from layout.css`).toBeDefined();
        expect(layout[token]).toBe(figmaVal);
      });
    }
  });

});
