// Regression: V1 walk Iter 19 → Sprint 6 (Image needs-asset auto-picker).
// imageBlockConfig.content previously embedded a `via.placeholder.com` src
// which (a) shipped to deployed sites and (b) suppressed the
// element:needs-asset event at useBlockInsertion.ts:122 because the gate
// requires `!el.getAttribute("src")`. With a default src present, the
// Media tab picker never auto-opened — users had to discover the Media
// tab manually + replace the placeholder.
//
// This guard keeps the default empty so the picker fires every time.
// Discovery: 2026-05-24 /qa walk after fixing P0 publish-flow bugs.

import { describe, it, expect } from "vitest";
import { imageBlockConfig } from "../Image";

describe("imageBlockConfig.content — empty src guard", () => {
  it("does NOT embed any default src in the inserted <img> tag", () => {
    expect(imageBlockConfig.content).not.toMatch(/\bsrc\s*=/);
  });

  it("does NOT reference via.placeholder.com (or any placeholder host)", () => {
    expect(imageBlockConfig.content).not.toMatch(/placeholder\.com|placehold/i);
  });

  it("keeps the alt attribute so screen readers + element:needs-asset both work", () => {
    expect(imageBlockConfig.content).toContain('alt="Image"');
  });

  it("still emits an <img> element (engine relies on tag presence)", () => {
    expect(imageBlockConfig.content).toMatch(/^<img\b/);
  });
});
