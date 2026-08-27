/**
 * The client's two buttons must not sit under the cookie banner.
 *
 * Measured live at 1280x720 before this was fixed: the banner spans y 672-708
 * and "Approve this design" / "Request changes" sat at y 668-704 — fully
 * covered, on the one page in the product built for someone with no account.
 * The page's own source already said what that costs: "A client who cannot see
 * 'Approve' does not approve."
 *
 * The banner is `fixed` at `z-[9998]` and the footer is `sticky` at `z-40`, so
 * no z change can win. The banner publishes its height instead, and anything
 * bottom-anchored offsets by it. This pins the contract on both ends, because
 * either half alone is silently useless.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const reviewClient = readFileSync(join(__dirname, "..", "review-client.tsx"), "utf8");
const banner = readFileSync(
  join(__dirname, "..", "..", "..", "..", "components", "global", "cookie-consent.tsx"),
  "utf8",
);

describe("the cookie banner and the client's action bar", () => {
  it("the banner publishes its measured height", () => {
    expect(banner).toMatch(/setProperty\("--cookie-inset"/);
    // Measured, not assumed: the bar's height changes with viewport and copy.
    expect(banner).toMatch(/getBoundingClientRect\(\)\.height/);
  });

  it("the banner clears the variable when it goes", () => {
    // An inset that outlives the banner is a permanent gap at the page bottom.
    expect(banner).toMatch(/removeProperty\("--cookie-inset"\)/);
  });

  it("the action bar offsets by it, with 0 when the banner is absent", () => {
    expect(reviewClient).toMatch(/bottom: "var\(--cookie-inset, 0px\)"/);
  });

  it("the action bar no longer hard-pins itself to the viewport bottom", () => {
    // `sticky bottom-0` is what put it under the banner.
    expect(reviewClient).not.toMatch(/sticky bottom-0/);
  });
});
