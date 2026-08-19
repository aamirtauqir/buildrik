import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The type panel told the user two different things, and one of them was
 * false: a hint saying "changes here only affect the selected breakpoint" and
 * a tooltip saying "font sizes scale automatically for mobile. You cannot set
 * separate mobile values here."
 *
 * Nothing scales type for mobile. The 0.85 factor exists in this file, applied
 * to the specimen rows, and nowhere else — not in the engine, not in
 * `design.css`, not in any exported stylesheet. Per-screen sizes come from
 * selecting an element and setting its size at that breakpoint, which is a
 * different control and does work (verified end to end the same day: 48px
 * desktop, 22px mobile, in the canvas and in the exported media query).
 *
 * @license BSD-3-Clause
 */
const src = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../TypeTokenList.tsx"),
  "utf8"
);

describe("the type panel does not promise a scale that does not exist", () => {
  it("no longer claims sizes scale automatically", () => {
    // Assert on what SHIPS — the title attribute — not on the file, which
    // quotes the old wording in the comment explaining why it went.
    const title = src.match(/title="Preview only[^"]*"/)?.[0] ?? "";
    expect(title).toBeTruthy();
    expect(title).not.toContain("scale automatically");
  });

  it("says the toggle is a preview, and where real per-screen sizes come from", () => {
    expect(src).toContain("does not resize type by itself");
    expect(src).toContain("Mobile breakpoint");
  });

  it("does not also claim edits here are per-breakpoint", () => {
    // The old hint and the old tooltip contradicted each other. The hint is
    // rendered text, so assert it is gone from the JSX rather than the file.
    expect(src).not.toMatch(/>\s*Type scale per device/);
  });

  it("keeps the specimen factor named, so it reads as preview-only", () => {
    expect(src).toContain("MOBILE_SPECIMEN_SCALE");
    expect(src).toMatch(/Specimen-only/);
  });
});
