import { describe, it, expect } from "vitest";
import { calculateSeoScore } from "./seoScore";

describe("calculateSeoScore", () => {
  it("returns 0 when allowIndex is false, regardless of other fields", () => {
    expect(
      calculateSeoScore({
        title: "Perfect Title Length Here",
        desc: "This is a great meta description that is long enough to be useful for SEO purposes in Google.",
        slug: "my-page",
        allowIndex: false,
      })
    ).toBe(0);
  });

  it("scores normally when allowIndex is true", () => {
    expect(
      calculateSeoScore({
        title: "Perfect Title Length Here",
        desc: "This is a great meta description that is long enough to be useful for SEO purposes in Google.",
        slug: "my-page",
        allowIndex: true,
      })
    ).toBeGreaterThan(0);
  });

  it("returns 0 for empty inputs when allowIndex is true", () => {
    expect(calculateSeoScore({ title: "", desc: "", slug: "", allowIndex: true })).toBe(0);
  });
});
