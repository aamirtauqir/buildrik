import { describe, it, expect } from "vitest";
import { calculateSeoScore, isPlaceholderSlug } from "./seoScore";

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

/* The panel advertises "+30 pts" for a clean slug, and the score paid 20 on the
   very page every new project starts with: `createPage("Page 1")` slugifies to
   "page-1", which the old literal `slug !== "page-1"` singled out — while
   "page-2", "page-3" and every other name the app itself hands out escaped the
   rule entirely. Either the rule means something or it does not. */
describe("placeholder slugs", () => {
  const base = {
    title: "Perfect Title Length Here",
    desc: "This is a great meta description that is long enough to be useful for SEO purposes in Google.",
    allowIndex: true,
  };

  it.each(["page-1", "page-2", "page-12", "/page-3"])(
    "%s is a placeholder and forfeits the last 10 points",
    (slug) => {
      expect(isPlaceholderSlug(slug)).toBe(true);
      expect(calculateSeoScore({ ...base, slug })).toBe(
        calculateSeoScore({ ...base, slug: "my-page" }) - 10
      );
    }
  );

  it.each(["my-page", "about-us", "page", "pages-2", "page-two", "blog/page-1-review"])(
    "%s is a real slug and is paid in full",
    (slug) => {
      expect(isPlaceholderSlug(slug)).toBe(false);
    }
  );

  /* The full 100 needs every band, not just the headline ones: title 30-60,
     desc 100-160, a clean non-placeholder slug, indexing on. `base` above
     deliberately sits below the title>=30 and desc>=100 bonuses (it scores 80),
     which is what makes the -10 comparisons above read cleanly. */
  it("a chosen slug plus full-length copy reaches 100", () => {
    const title = "A Perfectly Sized Page Title For SEO";
    const desc =
      "This meta description sits comfortably between one hundred and one hundred sixty characters, which is the ideal window.";
    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(desc.length).toBeGreaterThanOrEqual(100);
    expect(calculateSeoScore({ title, desc, slug: "my-page", allowIndex: true })).toBe(100);
    expect(calculateSeoScore({ title, desc, slug: "page-1", allowIndex: true })).toBe(90);
  });
});
