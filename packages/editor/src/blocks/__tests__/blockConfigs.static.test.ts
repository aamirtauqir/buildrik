/**
 * Static block-config integrity — table-driven over every registered
 * definition, plus the hero attributes schema pin.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { blockDefinitions } from "../blockRegistry";
import { heroBlockConfig } from "../Sections/HeroSection";

describe("blockDefinitions — per-definition shape (table-driven)", () => {
  it.each(blockDefinitions.map((def) => [def.id, def] as const))(
    "%s has id/label/elementType and content-or-build",
    (_id, def) => {
      expect(typeof def.id).toBe("string");
      expect(def.id.length).toBeGreaterThan(0);
      // kebab-case-ish ids only (no spaces, lowercase)
      expect(def.id).toMatch(/^[a-z0-9-]+$/);

      expect(typeof def.label).toBe("string");
      expect(def.label.length).toBeGreaterThan(0);

      expect(typeof def.elementType).toBe("string");
      expect(def.elementType.length).toBeGreaterThan(0);

      // insertBlock needs at least one insertion path.
      const hasContent = typeof def.content === "string" && def.content.length > 0;
      const hasBuild = typeof def.build === "function";
      expect(hasContent || hasBuild).toBe(true);
    }
  );

  it("every definition declares a category", () => {
    const missing = blockDefinitions.filter((d) => typeof d.category !== "string" || !d.category);
    expect(missing.map((d) => d.id)).toEqual([]);
  });

  it("string content that looks like HTML starts with a tag (sanitize-branch eligible)", () => {
    // Any content containing markup must ALSO match insertBlock's
    // /^<[a-z]/i heuristic, otherwise it would ship raw through the
    // createElement fallback (see leading-whitespace audit pin in
    // blockRegistry.test.ts).
    const offenders = blockDefinitions.filter(
      (d) =>
        typeof d.content === "string" &&
        d.content.includes("<") &&
        !/^<[a-z]/i.test(d.content)
    );
    expect(offenders.map((d) => d.id)).toEqual([]);
  });
});

describe("heroBlockConfig — attributes schema", () => {
  const attrs = heroBlockConfig.attributes;

  it("declares the full editable field set", () => {
    expect(Object.keys(attrs).sort()).toEqual(
      [
        "backgroundColor",
        "backgroundImage",
        "buttonText",
        "buttonUrl",
        "height",
        "subtitle",
        "textAlign",
        "title",
      ].sort()
    );
  });

  it("every attribute has a type and a default", () => {
    for (const [name, spec] of Object.entries(attrs)) {
      expect(typeof spec.type, `${name}.type`).toBe("string");
      expect(spec, `${name}.default`).toHaveProperty("default");
    }
  });

  it("textAlign is a select restricted to left/center/right", () => {
    expect(attrs.textAlign.type).toBe("select");
    expect(attrs.textAlign.options).toEqual(["left", "center", "right"]);
    expect(attrs.textAlign.default).toBe("center");
  });

  it("hero title default and inserted content HTML both use the unified Buildrick brand", () => {
    // D5 brand sweep (2026-07-17): the schema default, the inserted HTML
    // content, and the HeroSection React default were reconciled from the
    // old divergent "dudo"/"Aquibra" strings to the current Buildrick brand.
    expect(attrs.title.default).toBe("Welcome to Buildrick");
    expect(heroBlockConfig.content).toContain("Welcome to Buildrick");
  });
});
