/**
 * Guards the multi-removal array-patch ordering fix (P0 QA 2026-06-09).
 * Removing ≥2 trailing items from one array must replay correctly — ascending
 * remove ops shift indices and silently leave elements behind.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { createPatch, applyPatch, reversePatch } from "../JsonPatch";

describe("JsonPatch array multi-removal", () => {
  it("removes ≥2 trailing items correctly on apply", () => {
    const oldState = { items: ["a", "b", "c"] };
    const newState = { items: ["a"] };
    const patch = createPatch(oldState, newState);
    expect(applyPatch(oldState, patch)).toEqual(newState);
  });

  it("removes all items correctly", () => {
    const oldState = { items: ["a", "b", "c", "d"] };
    const newState = { items: [] };
    expect(applyPatch(oldState, createPatch(oldState, newState))).toEqual(newState);
  });

  it("reverse patch re-adds removed items in order", () => {
    const oldState = { items: ["a", "b", "c"] };
    const newState = { items: ["a"] };
    const patch = createPatch(oldState, newState);
    const reversed = reversePatch(patch);
    expect(applyPatch(newState, reversed)).toEqual(oldState);
  });

  it("handles mixed nested object removal", () => {
    const oldState = { children: [{ id: 1 }, { id: 2 }, { id: 3 }] };
    const newState = { children: [{ id: 1 }] };
    expect(applyPatch(oldState, createPatch(oldState, newState))).toEqual(newState);
  });
});
