import { describe, it, expect } from "vitest";
import { CATALOG, flatCatalog } from "./catalog";
import { getBlockDefinitions } from "@/blocks/blockRegistry";
import { blockRows, buildInsertGroups } from "./groups";

describe("Build Tab Catalog — blockId integrity", () => {
  const registryIds = new Set(getBlockDefinitions().map((b) => b.id));

  it("every non-disabled catalog entry has a blockId that exists in blockRegistry", () => {
    const violations: string[] = [];

    for (const el of flatCatalog) {
      if (el.disabled) continue; // disabled = known gap, explicitly acknowledged
      if (!registryIds.has(el.blockId)) {
        violations.push(`${el.catName} › "${el.name}": blockId "${el.blockId}" not in registry`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Catalog has ${violations.length} blockId mismatch(es):\n${violations.join("\n")}\n\n` +
          `Fix: update blockId in catalog/catalog.ts or add block config to blockRegistry.`
      );
    }
  });

  it("CATALOG array is non-empty with 5 categories", () => {
    expect(CATALOG).toHaveLength(5);
  });

  it("flatCatalog has no duplicate element names within the same category", () => {
    for (const cat of CATALOG) {
      const names = cat.elements.map((e) => e.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    }
  });
});

/* L3-025 (owner default 2026-10-09): a published form cannot take a file —
   the public endpoint refuses multipart as "Invalid JSON" — so Add does not
   offer the Upload element until uploads are supported. */
describe("Build Tab Catalog — Upload is not offered", () => {
  it("lists no file-upload element, and the Forms summary does not name one", () => {
    expect(flatCatalog.some((el) => el.blockId === "file")).toBe(false);
    expect(CATALOG.find((c) => c.id === "forms")?.sub ?? "").not.toMatch(/Upload/);
  });
});

/* L1-022 (owner 2026-10-10): one name per concept — Elements are primitives,
   Blocks are sections, saved Components are the user's own. The Add panel
   listed Testimonials three times, Pricing / Pricing Table, Carousel /
   Slider/Carousel, Navbar, Footer and CTA twice, under different names. */
describe("Add catalog — one name per concept (L1-022)", () => {
  it("has no Built-in Components group: Elements, Blocks, Saved components", () => {
    expect(buildInsertGroups(0).map((g) => g.label)).toEqual(["ELEMENTS", "BLOCKS", "SAVED COMPONENTS"]);
  });

  it("never offers the same block from two groups", () => {
    const elementIds = new Set(flatCatalog.map((e) => e.blockId));
    expect(blockRows.filter((b) => elementIds.has(b.id)).map((b) => b.id)).toEqual([]);
  });

  it("never shows one name in two groups", () => {
    const norm = (n: string) => n.toLowerCase().replace(/[^a-z]/g, "");
    const elementNames = new Set(flatCatalog.map((e) => norm(e.name)));
    expect(blockRows.filter((b) => elementNames.has(norm(b.label))).map((b) => b.label)).toEqual([]);
  });

  it("Elements are primitives: section blocks live only in Blocks", () => {
    for (const id of ["navbar", "footer", "cta", "testimonials", "pricing"]) {
      expect(flatCatalog.some((e) => e.blockId === id), id).toBe(false);
    }
    expect(blockRows.map((b) => b.id)).toEqual(expect.arrayContaining(["navbar", "footer", "cta", "testimonials-section", "pricing"]));
  });

  it("keeps every registry component reachable exactly once", () => {
    const offered = [...flatCatalog.map((e) => e.blockId), ...blockRows.map((b) => b.id)];
    for (const id of ["card", "slider", "progress", "countdown", "accordion", "social-icons", "stack", "switch", "tabs", "modal", "table", "pricing"]) {
      expect(offered.filter((x) => x === id), id).toHaveLength(1);
    }
    /* "Contact Form" was a second name for the Form element. */
    expect(offered).not.toContain("contact-form");
    expect(offered.filter((x) => x === "form")).toHaveLength(1);
  });
});
