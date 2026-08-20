/**
 * The binding chips can reach the Design panel.
 *
 * ColorInput and SpacingControls emit UI_OPEN_DESIGN_PANEL when a chip is
 * clicked — but only when a `composer` prop reaches them, and every production
 * call site omitted it: the chip fell back to its static, non-button rendering,
 * so "click jumps to Design › Tokens" (DSBindingChip's own contract) happened
 * nowhere. Only the unit tests passed a composer.
 *
 * Walked live: with the thread in place the chip renders as a button
 * ("Off-design-system value #1a1a1a. Click to…") and clicking it opens Brand.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(__dirname, p), "utf8");

describe("composer reaches the sections that own binding chips", () => {
  it("adaptBaseStyleProps forwards it", () => {
    expect(read("../_shared.tsx")).toMatch(/composer: ctx\.composer/);
  });

  it("every chip-bearing control gets it from its section", () => {
    const cases: Array<[string, string, number]> = [
      ["../../BackgroundSection.tsx", "ColorInput", 3],
      ["../../BorderSection.tsx", "ColorInput", 2],
      ["../../SpacingSection.tsx", "SpacingBox", 1],
      ["../../typography/FontControls.tsx", "ColorInput", 1],
    ];
    for (const [file, control, count] of cases) {
      const src = read(file);
      expect(src, file).toContain(`<${control}`);
      expect(src.match(/composer=\{composer\}/g) ?? [], file).toHaveLength(count);
    }
  });

  it("the controls still treat it as optional — a chip with no composer stays static", () => {
    const colorInput = read("../../../shared/controls/ColorInput.tsx");
    expect(colorInput).toMatch(/onClick=\{composer \? handleChipClick : undefined\}/);
  });
});
