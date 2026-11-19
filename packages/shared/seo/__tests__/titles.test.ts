/**
 * L3-036 (owner 2026-10-10): the emitted <title> order is
 * page SEO title → site template applied to the page title → page title,
 * with the site default title as the HOME page's fallback only (plan Q3).
 */
import { describe, it, expect } from "vitest";
import { applyTitleTemplate, resolveEmittedTitle } from "../titles";

const site = { metaTitle: "Acme — Home of good things", metaTitleTemplate: "{page_title} · Acme", siteName: "Acme" };

describe("resolveEmittedTitle — owner order L3-036", () => {
  it("page SEO title wins verbatim (not templated)", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, seoTitle: "About our bakery", site })).toEqual({
      title: "About our bakery",
      source: "page-seo",
    });
  });
  it("then the site template applied to the page title", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, site })).toEqual({ title: "About · Acme", source: "template" });
  });
  it("then the bare page title when no usable template", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, site: { metaTitleTemplate: "Acme" } })).toEqual({
      title: "About",
      source: "page-name",
    });
  });
  it("home page with no SEO title uses the site default title", () => {
    expect(resolveEmittedTitle({ pageName: "Home", isHome: true, site })).toEqual({ title: "Acme — Home of good things", source: "home-default" });
  });
  it("a non-home page never takes the site default title", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, site: { metaTitle: "Acme" } }).title).toBe("About");
  });
  it("legacy settings.title counts as the page's own title", () => {
    expect(resolveEmittedTitle({ pageName: "About", isHome: false, settingsTitle: "Legacy", site }).title).toBe("Legacy");
  });
  it("never returns empty", () => {
    expect(resolveEmittedTitle({ pageName: "", isHome: false, site: {} }).title).toBe("Untitled");
    expect(resolveEmittedTitle({ pageName: "  ", isHome: false, seoTitle: "   ", site: {} }).title).toBe("Untitled");
  });
});

describe("applyTitleTemplate", () => {
  it("fills {page_title} and {site_name}", () => {
    expect(applyTitleTemplate("About", "{page_title} | {site_name}", "Acme")).toBe("About | Acme");
  });
  it("ignores a template without {page_title}", () => {
    expect(applyTitleTemplate("About", "Acme", "Acme")).toBe("About");
    expect(applyTitleTemplate("About", null, "Acme")).toBe("About");
  });
});
