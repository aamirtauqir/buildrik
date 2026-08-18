/**
 * Board 152:2 puts a count on every root row that has one.
 *
 * Fetched the board on 2026-08-18: Tokens 14 · Presets 18 · Starters 6 ·
 * Classes 12 · Components 27 · Typography · Colour mode · Lint 3 ·
 * Import / export. Starters and Components were the only two rows drawn WITH
 * a number that shipped without one — and the board's numbers are the real
 * registries, not sample data: `STARTER_DS_REGISTRY.length` is 6 and
 * `CATALOG.length` is 27, exactly.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { STARTER_DS_REGISTRY } from "../../starters";
import { CATALOG } from "../../../components-catalog/catalog";

describe("Brand root — the counts the board draws", () => {
  it("has a starter registry to count", () => {
    expect(STARTER_DS_REGISTRY.length).toBeGreaterThan(0);
  });

  it("has a component catalog to count", () => {
    expect(CATALOG.length).toBeGreaterThan(0);
  });

  it("matches the board's own numbers", () => {
    // The board was drawn from these registries; if either changes, the board
    // is the thing that needs re-reading, not this assertion that needs a bump.
    expect(STARTER_DS_REGISTRY.length).toBe(6);
    expect(CATALOG.length).toBe(27);
  });
});
