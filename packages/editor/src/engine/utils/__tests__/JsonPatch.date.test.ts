/**
 * L1-009: a brand-new site opened with a phantom "Updated page" undo step and
 * saved itself. The page's `updatedAt` arrives from the server as a Date
 * (superjson), and a Date is not a plain object, so every diff replaced it —
 * equal or not. The first harmless change event after load therefore recorded
 * a non-empty patch (`/pages/0/updatedAt`) and armed the autosave.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { createPatch } from "../JsonPatch";

describe("createPatch — Dates compare by time", () => {
  it("two equal Dates are no change", () => {
    const a = { pages: [{ updatedAt: new Date(1_700_000_000_000) }] };
    const b = { pages: [{ updatedAt: new Date(1_700_000_000_000) }] };
    expect(createPatch(a, b)).toEqual([]);
  });

  it("a different time is still a replace", () => {
    const patch = createPatch({ d: new Date(1) }, { d: new Date(2) });
    expect(patch).toHaveLength(1);
    expect(patch[0]).toMatchObject({ op: "replace", path: "/d" });
  });
});
