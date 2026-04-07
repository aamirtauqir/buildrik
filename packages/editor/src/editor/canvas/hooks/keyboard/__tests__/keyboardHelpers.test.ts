/**
 * Tests for getAllNavigableElements in keyboardHelpers.ts
 * Verifies that the root element is correctly excluded from the Tab cycle (A12).
 */

import { describe, it, expect, vi } from "vitest";
import type { Composer } from "../../../../../engine/Composer";
import { getAllNavigableElements } from "../keyboardHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal stub that satisfies Element traversal used by getAllNavigableElements */
interface MockElement {
  getId: () => string;
  getChildren: () => MockElement[];
}

function makeElement(id: string, children: MockElement[] = []): MockElement {
  return {
    getId: () => id,
    getChildren: () => children,
  };
}

function makeComposer(rootId: string | null, elements: { id: string; children?: string[] }[]) {
  // Build a spec map for quick children lookup
  const specMap = new Map<string, string[]>();
  for (const el of elements) {
    specMap.set(el.id, el.children ?? []);
  }

  // Lazily-built element map: each element is created on demand so children
  // are always resolved after all entries are registered.
  const elementMap = new Map<string, MockElement>();

  function getOrCreate(id: string): MockElement {
    if (!elementMap.has(id)) {
      const childIds = specMap.get(id) ?? [];
      // Register a placeholder first to break potential cycles
      elementMap.set(id, makeElement(id, []));
      // Now resolve children (they may in turn call getOrCreate)
      const childEls = childIds.map(getOrCreate);
      elementMap.set(id, makeElement(id, childEls));
    }
    return elementMap.get(id)!;
  }

  // Pre-build all elements
  for (const el of elements) {
    getOrCreate(el.id);
  }

  return {
    elements: {
      getActivePage: vi.fn(() => (rootId ? { root: { id: rootId } } : null)),
      getElement: vi.fn((id: string) => elementMap.get(id) ?? null),
    },
  } as unknown as Composer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getAllNavigableElements", () => {
  describe("without rootId (no filtering)", () => {
    it("returns all elements including the root when rootId is null (default)", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1", "child-2"] },
        { id: "child-1" },
        { id: "child-2" },
      ]);

      const result = getAllNavigableElements(composer);

      expect(result.map((el) => el.getId())).toEqual(["root", "child-1", "child-2"]);
    });

    it("returns all elements when rootId is explicitly null", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1"] },
        { id: "child-1" },
      ]);

      const result = getAllNavigableElements(composer, null);

      expect(result.map((el) => el.getId())).toEqual(["root", "child-1"]);
    });

    it("returns empty array when there is no active page", () => {
      const composer = {
        elements: {
          getActivePage: vi.fn(() => null),
          getElement: vi.fn(),
        },
      } as unknown as Composer;

      const result = getAllNavigableElements(composer, null);

      expect(result).toEqual([]);
    });
  });

  describe("with rootId filtering", () => {
    it("excludes the root element from the returned list", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1", "child-2"] },
        { id: "child-1" },
        { id: "child-2" },
      ]);

      const result = getAllNavigableElements(composer, "root");

      const ids = result.map((el) => el.getId());
      expect(ids).not.toContain("root");
      expect(ids).toEqual(["child-1", "child-2"]);
    });

    it("preserves tree order after filtering out the root", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["section-1", "section-2"] },
        { id: "section-1", children: ["text-1"] },
        { id: "text-1" },
        { id: "section-2" },
      ]);

      const result = getAllNavigableElements(composer, "root");

      expect(result.map((el) => el.getId())).toEqual(["section-1", "text-1", "section-2"]);
    });

    it("returns all elements when rootId does not match any element (no false exclusions)", () => {
      const composer = makeComposer("root", [
        { id: "root", children: ["child-1"] },
        { id: "child-1" },
      ]);

      const result = getAllNavigableElements(composer, "nonexistent-id");

      // rootId not found in the list → nothing filtered out
      expect(result.map((el) => el.getId())).toEqual(["root", "child-1"]);
    });

    it("returns empty array when the only element is the root and it is excluded", () => {
      const composer = makeComposer("root", [{ id: "root" }]);

      const result = getAllNavigableElements(composer, "root");

      expect(result).toEqual([]);
    });
  });
});
