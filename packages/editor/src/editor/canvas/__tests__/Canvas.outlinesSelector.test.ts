/**
 * A-12 "Show outlines": the rule must use the names the canvas actually
 * renders — `.buildrick-canvas` and `data-buildrick-id`. It was spelled
 * "buildrik" on both and matched nothing (found by L-B, 2026-10-30).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(__dirname, "..", "Canvas.css"), "utf8");

describe("Canvas.css — Show outlines", () => {
  it("targets the canvas's real class and element attribute", () => {
    expect(css).toContain('.buildrick-canvas[data-outlines="true"] [data-buildrick-id]');
    expect(css).not.toMatch(/buildrik-canvas|data-buildrik-id/);
  });
});
