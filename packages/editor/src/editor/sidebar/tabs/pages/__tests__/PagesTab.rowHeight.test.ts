/**
 * Page rows are one height, and it is the board's.
 *
 * Board 140:2 (Figma g4GzQFqzNYz5sosz1QtZXC page 1:3) draws every row at
 * 320x32, at y = 80 / 112 / 144 / 176 — a uniform 32 pitch, active or not.
 *
 * The CSS had `--pg-row-h: 28px` with `--pg-row-h-active: 32px`, so selecting a
 * page GREW its row by 4 and pushed everything below it down. A list that
 * reflows when you click it reads as jitter rather than as a bug, which is why
 * it survived: nobody looks at a list expecting it to move.
 *
 * Asserted against the stylesheet rather than a render, because the two custom
 * properties are the contract — a component test would pass with them
 * disagreeing as long as one row happened to be measured.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(HERE, "..", "PagesTab.css"), "utf8");

/** design-2l9 board 63:6393: two-line rows (name over URL), 40 at least —
 *  re-baselined from board 140:2's single-line 32. */
const BOARD_ROW_H = 40;

const readVar = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(\\d+)px`));
  return m ? Number(m[1]) : null;
};

describe("Pages row height — board 63:6393", () => {
  it("is the board's 40", () => {
    expect(readVar("pg-row-h")).toBe(BOARD_ROW_H);
  });

  it("does not change when a row becomes active", () => {
    // The active row grew 28 -> 32, so clicking a page reflowed the list.
    expect(readVar("pg-row-h-active")).toBe(readVar("pg-row-h"));
  });
});
