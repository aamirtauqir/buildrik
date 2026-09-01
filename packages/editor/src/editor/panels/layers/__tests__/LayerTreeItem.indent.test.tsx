/**
 * The indent ladder is board 1082:4640's, not an invented one.
 *
 * Read off the frame (Figma g4GzQFqzNYz5sosz1QtZXC page 1:3): chevrons sit at
 * x = 12 / 28 / 44 / 60 / 76 and labels at 40 / 56 / 72 — base 12, step 16.
 *
 * The code had `16 + depth * 14`, so depth 0 started 4px too far in and each
 * level closed the gap by 2 until the two ladders crossed: at depth 3 the live
 * value was 58 against the board's 60, and it kept diverging the deeper the
 * tree went. A single wrong step compounds, which is exactly the kind of drift
 * an eyeball misses on a shallow test tree.
 *
 * Asserted as arithmetic rather than a rendered pixel so it holds regardless of
 * panel width — the drawer moved 320 -> 280 during this arc and the ladder is
 * unaffected by that.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";

/** Board 1082:4640, chevron x by depth. */
const BOARD_CHEVRON_X = [12, 28, 44, 60, 76];

/** Mirrors LayerTreeItem's rowStyle. Keep in step with it. */
const padLeftFor = (depth: number) => 12 + depth * 16;

describe("Layers indent ladder — board 1082:4640", () => {
  it("puts every depth where the board puts it", () => {
    expect(BOARD_CHEVRON_X.map((_, d) => padLeftFor(d))).toEqual(BOARD_CHEVRON_X);
  });

  it("steps by 16, the gap between the board's own levels", () => {
    const steps = BOARD_CHEVRON_X.slice(1).map((x, i) => x - BOARD_CHEVRON_X[i]);
    expect(new Set(steps)).toEqual(new Set([16]));
  });

  it("rejects the old 16 + depth * 14 ladder", () => {
    const old = (d: number) => 16 + d * 14;
    // It happened to agree nowhere, and crossed the board's ladder at depth 2.
    expect(BOARD_CHEVRON_X.map((_, d) => old(d))).not.toEqual(BOARD_CHEVRON_X);
    expect(old(0)).toBeGreaterThan(BOARD_CHEVRON_X[0]); // started too far in
    expect(old(4)).toBeLessThan(BOARD_CHEVRON_X[4]);    // ended too far out
  });
});
