/**
 * Ledger row R12: "the Publish modal's value column runs into the right border
 * and clips — 'your connected Vercel projec[t]'."
 *
 * One missing declaration, not a padding mistake. Each fact is a flex row, and
 * a flex item's `min-width` defaults to `auto` — its CONTENT width — so the
 * value refuses to shrink and overflows the row instead of fitting in it. A
 * `truncate` on that item would have done nothing until the floor was removed.
 *
 * Read from the source the way the rollback test beside this one does: the
 * component fetches on mount, and jsdom does not lay out, so a render would
 * assert neither the fetch nor the geometry. What is pinned here is the
 * declaration that makes the layout possible.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(__dirname, "..", "PublishConfirmFacts.tsx"),
  "utf8",
);
const VAL = src.match(/const VAL =\s*([\s\S]*?);/)?.[1] ?? "";

describe("PublishConfirmFacts — the value column", () => {
  it("can shrink below its own content width", () => {
    expect(VAL).toContain("tw:min-w-0");
  });

  it("wraps rather than truncating — these facts are read before publishing", () => {
    // Truncating one of these hides something a user is about to act on. A
    // taller row is the cheaper cost (DESIGN.md §Overflow).
    expect(VAL).toContain("overflow-wrap:anywhere");
    expect(VAL).not.toContain("truncate");
  });

  it("the label column stays fixed, so only the value gives way", () => {
    const KEY = src.match(/const KEY = "([^"]*)"/)?.[1] ?? "";
    expect(KEY).toContain("tw:flex-none");
  });
});
