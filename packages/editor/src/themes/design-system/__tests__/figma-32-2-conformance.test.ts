/**
 * Figma "Foundations (32-2)" conformance — locks the editor design-system tokens
 * to the Figma foundations file (g4GzQFqzNYz5sosz1QtZXC, node 32-2).
 *
 * The fixture below is the source of truth, transcribed from the Figma variables
 * (get_variable_defs + the Foundations frame swatches, 2026-07-24). If a token in
 * color.css / layout.css drifts from Figma, this test fails — that is the point:
 * it is the "real developer" verification the design language stays applied.
 *
 * Intentional deviations from Figma are declared in A11Y_KEEPS and SHIPPED_KEEPS
 * with a reason, so the test documents *why* a value is allowed to differ rather
 * than silently passing. Update the fixture only when Figma itself changes.
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
  // semantic fill (only where code matches Figma; deviations in A11Y_KEEPS)
  "--buildrick-success": "#16A34A",
  "--buildrick-error": "#DC2626",
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
};

/** Deliberate deviations — Figma value would regress accessibility. */
const A11Y_KEEPS: Record<string, { value: string; figma: string; why: string }> = {
  "--buildrick-warning": {
    value: "#B45309",
    figma: "#D97706",
    why: "Figma amber-600 fails WCAG AA on warning-bg (3.19:1); amber-700 passes (5.04:1).",
  },
};

/** Deliberate deviations — shipped shell width, Figma widen pending founder sign-off. */
const SHIPPED_KEEPS = ["--buildrick-sidebar-width", "--buildrick-sidebar-panel-width", "--buildrick-right-panel-width"];

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

  describe("declared deviations stay declared (not silently reverted)", () => {
    for (const [token, dev] of Object.entries(A11Y_KEEPS)) {
      it(`${token} keeps a11y-safe ${dev.value} (not Figma ${dev.figma})`, () => {
        expect(color[token]).toBe(dev.value.toUpperCase());
        expect(color[token]).not.toBe(dev.figma.toUpperCase());
      });
    }
    it("shipped shell widths still present (widen deferred)", () => {
      for (const t of SHIPPED_KEEPS) expect(layout[t], `${t} missing`).toBeDefined();
    });
  });
});
