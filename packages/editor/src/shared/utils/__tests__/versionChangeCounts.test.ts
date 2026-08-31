/**
 * The row badge is derived, so the derivation is where the lying happens.
 *
 * Board 162:2 prints `Auto-save · 3 changes · 16:20`. The row shipped
 * `{elementCount} el` and never rendered it — `VersionList.tsx` hardcoded
 * `elementCount={0}` at its only call site, so prop, markup and styling were
 * all live code that could not run.
 *
 * The bounded-stack case is the one that matters: an old version whose changes
 * have fallen off the undo stack must produce NO badge, not a "0 changes" badge
 * over a version that reshaped the site.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { versionChangeCounts } from "../versionChangeCounts";

/* Newest first, matching useVersionHistory. */
const versions = [
  { id: "v3", createdAt: 300 },
  { id: "v2", createdAt: 200 },
  { id: "v1", createdAt: 100 },
];

describe("versionChangeCounts", () => {
  it("attributes each entry to the version that captured it", () => {
    const history = [
      { timestamp: 250 }, { timestamp: 260 }, { timestamp: 300 }, // -> v3
      { timestamp: 150 },                                          // -> v2
      { timestamp: 100 },                                          // -> v1
    ];
    const counts = versionChangeCounts(versions, history);
    expect(counts.get("v3")).toBe(3);
    expect(counts.get("v2")).toBe(1);
    expect(counts.get("v1")).toBe(1);
  });

  /* The window closes ON the version's own timestamp and opens AFTER the
     previous one's, so an entry taken at exactly a version's time belongs to
     that version and is not double-counted into its neighbour. */
  it("puts an entry on the boundary in exactly one version", () => {
    const counts = versionChangeCounts(versions, [{ timestamp: 200 }]);
    expect(counts.get("v2")).toBe(1);
    expect(counts.has("v3")).toBe(false);
    expect(counts.has("v1")).toBe(false);
  });

  it("omits a version the stack no longer reaches instead of claiming zero", () => {
    const counts = versionChangeCounts(versions, [{ timestamp: 290 }]);
    expect(counts.get("v3")).toBe(1);
    expect(counts.has("v2")).toBe(false);
    expect(counts.has("v1")).toBe(false);
  });

  it("returns nothing at all when there is no history or no versions", () => {
    expect(versionChangeCounts(versions, []).size).toBe(0);
    expect(versionChangeCounts([], [{ timestamp: 1 }]).size).toBe(0);
  });
});
