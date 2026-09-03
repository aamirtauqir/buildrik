/**
 * Pick mode's crosshair (board 301:2186).
 *
 * The inspector's crosshair button puts the canvas into pick mode: the next
 * click resolves whatever is under the pointer and hands its id back. The
 * cursor is the only thing on screen that says so.
 *
 * It shipped as `cursor: crosshair` inline on the canvas FRAME, which cannot
 * work. `cursor` inherits, and an inherited value loses to any declaration
 * that matches the element itself — and Canvas.css matches every element on
 * the canvas: `[data-buildrick-id]:hover { cursor: move }`, `.dragging` with
 * `grabbing !important`, `[data-locked="true"]` with `not-allowed !important`.
 * So the crosshair appeared over the empty gutter and nowhere else: the one
 * part of the canvas with nothing to pick.
 *
 * This is a cascade fact, not a render, so it is asserted against the source.
 * jsdom never loads Canvas.css, so a mounted-component test would pass whether
 * the rule existed or not — the shape of a green run that proves nothing.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const tsx = readFileSync(join(__dirname, "../Canvas.tsx"), "utf8");
const css = readFileSync(join(__dirname, "../Canvas.css"), "utf8");

describe("pick mode marks the canvas for CSS, not with an inline cursor", () => {
  it("drives the attribute from pick mode", () => {
    expect(tsx).toMatch(/data-bk-pick=\{pickMode \? "true" : undefined\}/);
  });

  it("no longer sets the crosshair inline, where it could never win", () => {
    expect(tsx).not.toMatch(/cursor:\s*"crosshair"/);
  });
});

describe("the rule reaches the elements and outranks theirs", () => {
  const rule = css.match(/\[data-bk-pick="true"\][^{]*\{[^}]*\}/);

  it("exists, and reaches the subtree rather than the frame alone", () => {
    expect(rule, "no [data-bk-pick] rule in Canvas.css").not.toBeNull();
    expect(rule![0]).toContain("[data-bk-pick=\"true\"] [data-buildrick-id]");
    expect(rule![0]).toMatch(/cursor:\s*crosshair\s*!important/);
  });

  /* The three it has to beat, each of which matches the element under the
     pointer. `!important` settles specificity; source order settles the tie
     against the other two `!important` cursors. */
  it("comes after every cursor rule it has to beat", () => {
    const pick = css.indexOf('[data-bk-pick="true"]');
    for (const beaten of [
      "[data-buildrick-id]:hover",
      "[data-buildrick-id].dragging",
      '[data-buildrick-id][data-locked="true"]',
    ]) {
      const at = css.indexOf(beaten);
      expect(at, `${beaten} is not in Canvas.css any more — re-check this test`).toBeGreaterThan(-1);
      expect(pick, `${beaten} would win over the pick cursor`).toBeGreaterThan(at);
    }
  });
});
