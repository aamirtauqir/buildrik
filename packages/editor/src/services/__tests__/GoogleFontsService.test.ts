/**
 * GoogleFontsService tests — link-tag construction (fonts.googleapis.com/css2),
 * preconnect export markup, and the static 25-font fallback catalog (the
 * service never fetches; POPULAR_FONTS is the offline-safe source).
 */
import { describe, it, expect, beforeEach } from "vitest";
import GoogleFontsService, {
  loadGoogleFont,
  searchGoogleFonts,
} from "../GoogleFontsService";

const svc = () => GoogleFontsService.getInstance();

beforeEach(() => {
  // Singleton persists across tests — unload everything for isolation.
  for (const family of svc().getLoadedFonts()) svc().unloadFont(family);
});

describe("GoogleFontsService singleton + catalog", () => {
  it("getInstance always returns the same instance", () => {
    expect(GoogleFontsService.getInstance()).toBe(GoogleFontsService.getInstance());
  });

  it("ships the 25-font fallback catalog (no API key, no fetch)", () => {
    const fonts = svc().getFonts();
    expect(fonts).toHaveLength(25);
    const families = fonts.map((f) => f.family);
    expect(families).toContain("Inter");
    expect(families).toContain("Playfair Display");
    expect(families).toContain("JetBrains Mono");
  });

  it("getFonts returns a copy — mutating it does not corrupt the catalog", () => {
    const fonts = svc().getFonts();
    fonts.pop();
    expect(svc().getFonts()).toHaveLength(25);
  });

  it("searches by family name and by category, case-insensitively", () => {
    expect(searchGoogleFonts("inter").map((f) => f.family)).toContain("Inter");
    const monos = svc().searchFonts("monospace");
    expect(monos.length).toBeGreaterThan(0);
    expect(monos.every((f) => f.category === "monospace")).toBe(true);
  });

  it("empty query returns the full catalog", () => {
    expect(svc().searchFonts("   ")).toHaveLength(25);
  });

  it("getFontsByCategory partitions the catalog", () => {
    const handwriting = svc().getFontsByCategory("handwriting");
    expect(handwriting.map((f) => f.family)).toEqual(["Dancing Script", "Pacifico", "Caveat"]);
  });

  it("getFont is case-insensitive", () => {
    expect(svc().getFont("playfair display")?.family).toBe("Playfair Display");
    expect(svc().getFont("Comic Sans")).toBeUndefined();
  });
});

describe("GoogleFontsService.loadFont — DOM link injection", () => {
  it("appends a css2 stylesheet link with +-encoded family and requested weights", () => {
    svc().loadFont("Playfair Display", { variants: ["400", "700"] });

    const link = document.getElementById("gf-playfair-display") as HTMLLinkElement;
    expect(link).not.toBeNull();
    expect(link.rel).toBe("stylesheet");
    expect(link.href).toBe(
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap"
    );
    expect(link.parentElement).toBe(document.head);
    expect(svc().isFontLoaded("Playfair Display")).toBe(true);
  });

  it("defaults to weight 400 and maps regular/bold aliases to 400/700", () => {
    svc().loadFont("Inter");
    expect((document.getElementById("gf-inter") as HTMLLinkElement).href).toContain(
      "family=Inter:wght@400&display=swap"
    );

    svc().loadFont("Lato", { variants: ["regular", "bold"] });
    expect((document.getElementById("gf-lato") as HTMLLinkElement).href).toContain(
      "family=Lato:wght@400;700&display=swap"
    );
  });

  it("is idempotent — loading the same family twice injects one link", () => {
    svc().loadFont("Inter");
    svc().loadFont("Inter");
    expect(document.querySelectorAll("#gf-inter")).toHaveLength(1);
  });

  it("ignores families not in the catalog", () => {
    svc().loadFont("Comic Sans");
    expect(svc().isFontLoaded("Comic Sans")).toBe(false);
    expect(document.getElementById("gf-comic-sans")).toBeNull();
  });

  it("unloadFont removes the link and clears loaded state", () => {
    svc().loadFont("Inter");
    svc().unloadFont("Inter");
    expect(document.getElementById("gf-inter")).toBeNull();
    expect(svc().isFontLoaded("Inter")).toBe(false);
    expect(svc().getLoadedFonts()).toEqual([]);
  });

  it("loadGoogleFont convenience function drives the singleton", () => {
    loadGoogleFont("Oswald");
    expect(svc().isFontLoaded("Oswald")).toBe(true);
  });
});

describe("GoogleFontsService export markup", () => {
  it("getLinkTag emits both preconnects + one combined css2 stylesheet link", () => {
    svc().loadFont("Inter");
    svc().loadFont("Merriweather");

    const tag = svc().getLinkTag();
    expect(tag).toContain('<link rel="preconnect" href="https://fonts.googleapis.com">');
    expect(tag).toContain(
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    );
    // Export uses the catalog's FULL variant list, joined with &family=.
    expect(tag).toContain(
      'href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet"'
    );
  });

  it("getImportStatement emits a single @import for all loaded fonts", () => {
    svc().loadFont("Pacifico");
    expect(svc().getImportStatement()).toBe(
      "@import url('https://fonts.googleapis.com/css2?family=Pacifico:wght@400&display=swap');"
    );
  });

  it("returns empty strings when nothing is loaded", () => {
    expect(svc().getLinkTag()).toBe("");
    expect(svc().getImportStatement()).toBe("");
  });
});
