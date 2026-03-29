import { describe, it, expect } from "vitest";
import { CATALOG, flatCatalog } from "./catalog";
import { getBlockDefinitions } from "../../../../../blocks/blockRegistry";

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

  it("CATALOG array is non-empty with 7 categories", () => {
    expect(CATALOG).toHaveLength(7);
  });

  it("flatCatalog has no duplicate element names within the same category", () => {
    for (const cat of CATALOG) {
      const names = cat.elements.map((e) => e.name);
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    }
  });
});
