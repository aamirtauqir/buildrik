/**
 * Board 1172:4840 names each staged change `color/accent`, not `accent`.
 *
 * The kind is load-bearing on this one screen: two kinds can each own a token
 * called "primary", and this is the last confirmation before every element
 * bound to it moves. A bare name cannot say which one is about to change.
 *
 * Read from the source rather than rendered: the modal needs a composer, four
 * registries and a staged diff to mount, and none of that would make the
 * assertion stronger than reading the expression it turns on.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "..", "ReviewModal.tsx"), "utf8");

describe("ReviewModal — the row names its kind", () => {
  it("prefixes the token's category", () => {
    expect(src).toMatch(/\$\{token\.category\}\/\$\{token\.name\}/);
  });

  it("falls back to the bare name rather than printing an empty kind", () => {
    // `undefined/primary` would be worse than `primary`.
    expect(src).toMatch(/token\.category\s*\n?\s*\?/);
    expect(src).toMatch(/:\s*token\.name/);
  });

  it("still falls back to the id when the token is gone entirely", () => {
    // A diff can outlive its token; the row must still say which id moved.
    expect(src).toMatch(/:\s*diff\.tokenId/);
  });

  it("keeps the transition text the board prints beside it", () => {
    expect(src).toMatch(/diff\.previousValue/);
    expect(src).toMatch(/diff\.currentValue/);
  });
});
