// Regression: V1 walk Iter 19 → Sprint 6. imageBlockConfig.content
// previously embedded a `via.placeholder.com` src, which shipped to deployed
// sites. The default stays empty: an inserted Image is selected and the
// Inspector's "Choose image" picks its asset (L1-017, 2026-10-10).
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

  it("keeps the alt attribute for screen readers", () => {
    expect(imageBlockConfig.content).toContain('alt="Image"');
  });

  it("still emits an <img> element (engine relies on tag presence)", () => {
    expect(imageBlockConfig.content).toMatch(/^<img\b/);
  });
});
