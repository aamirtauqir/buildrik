// @vitest-environment jsdom
/**
 * The floating canvas toolbar must stay inside the canvas column, and must be
 * opaque.
 *
 * Two defects this pins, both found by measuring the running editor at 1440:
 *
 * 1. The bar was filled with `--buildrick-surface-3`, which is defined nowhere
 *    in themes/. A floating toolbar with no fill lets canvas content read
 *    straight through it.
 * 2. The row was `white-space: nowrap` with no max-width and no overflow rule.
 *    The container shrank with the canvas column (800px once the inspector
 *    opens) but the controls kept their intrinsic ~1076px, so the right-hand
 *    group ran 276px UNDER the inspector panel and could not be clicked.
 *
 * jsdom does no layout, AND it computes nothing from a `tw:` class, so the
 * contract now lives in the class list rather than in `element.style`. That is
 * a weaker check than the inline-style one it replaces — it proves the classes
 * are applied, not that they resolve — so the real measurement moved to the
 * Playwright parity harness (`e2e/style-parity.spec.ts`, case
 * "canvas-footer-toolbar"), which reads genuine computed values with the real
 * CSS pipeline loaded. Both are needed: this one fails fast on a refactor that
 * drops a utility, that one fails on a utility that does not compile.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render as rtlRender, screen } from "@testing-library/react";
import { CanvasFooterToolbar } from "../CanvasFooterToolbar";

const ALL_OFF = { guides: false, spacing: false, grid: false, rulers: false, badges: false, xray: false };

beforeAll(() => {
  if (typeof globalThis.window !== "undefined" && !globalThis.window.matchMedia) {
    Object.defineProperty(globalThis.window, "matchMedia", {
      writable: true,
      value: vi.fn((q: string) => ({
        matches: false, media: q, onchange: null,
        addListener: vi.fn(), removeListener: vi.fn(),
        addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
      })),
    });
  }
});

const CONTAINMENT = ["tw:max-w-full", "tw:min-w-0", "tw:overflow-x-auto"];

function pill(): HTMLElement {
  render();
  // the bar is the toggle's nearest ancestor carrying the containment
  // utilities — the toggle itself has radius+padding but never these
  let n: HTMLElement | null = screen.getByRole("button", { name: "Snap Guides" });
  while (n && !CONTAINMENT.every((c) => n!.classList.contains(c))) n = n.parentElement;
  if (!n) throw new Error("toolbar container not found");
  return n;
}

function render() {
  rtlRender(
    <CanvasFooterToolbar
      overlays={ALL_OFF}
      zoom={100}
      onOverlayChange={vi.fn()}
      onZoomChange={vi.fn()}
    />,
  );
}

describe("canvas toolbar containment", () => {
  it("stays inside its column instead of spilling under the inspector", () => {
    const bar = pill();
    // min-width:0 is what lets a flex row refuse to shrink; without it the
    // controls kept their intrinsic width and ran under the inspector.
    for (const cls of CONTAINMENT) expect(bar.classList.contains(cls)).toBe(true);
  });

  it("is opaque — a floating bar cannot show canvas content through itself", () => {
    const bar = pill();
    const fill = [...bar.classList].filter((c) => /^tw:bg-/.test(c));
    expect(fill, "the bar declares no background at all").not.toHaveLength(0);
    expect(fill.join(" ")).not.toMatch(/transparent|surface-3/);
  });
});

describe("canvas toolbar tokens", () => {
  const SRC = readFileSync(resolve(__dirname, "../CanvasFooterToolbar.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
  // Tokens are generated from Figma now; the old hand-written color.css is gone.
  const TOKENS = readFileSync(resolve(__dirname, "../../../themes/tokens.generated.css"), "utf8");

  it("uses the shadow scale, not a raw dark-theme rgba", () => {
    expect(SRC).not.toMatch(/boxShadow:\s*"0 2px 12px rgba\(0,0,0,0\.3\)"/);
  });

  it("every token it references is actually defined", () => {
    // The original bug: 36 bare refs across the editor pointed at an undefined
    // surface scale, so every active/selected fill rendered transparent. Same
    // invariant, new prefix — an undefined token is still an invisible element.
    const used = [...SRC.matchAll(/var\(\s*(--bk-[a-z0-9-]+)/g)].map((m) => m[1]);
    for (const token of new Set(used)) {
      expect(TOKENS, `${token} must be defined in the generated tokens`).toMatch(
        new RegExp(`${token}:`),
      );
    }
  });

  it("uses no legacy chrome tokens at all", () => {
    expect(SRC).not.toMatch(/var\(\s*--(?:buildrick|bd)-/);
  });
});
