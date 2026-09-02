/**
 * Element profiles integrity tests.
 *
 * Locks down what the profile system depends on:
 *   1. Every section id referenced in any profile exists in the registry.
 *   2. Every profile is one ordered array — the panel is one scroll.
 *   3. Unknown element types fall back to the container profile.
 *   4. Each profile opens in its board's order (807:8342 text, 807:8567
 *      button, 807:8412 flex, 807:8475 grid, 807:8521 media, 807:8614 input).
 *
 * Run with: `npx vitest run editor/inspector/__tests__/elementProfiles`
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import {
  ALL_PROFILE_ELEMENT_TYPES,
  getProfileFor,
  PROFILE_MAP,
} from "../config/elementProfiles";
import {
  ALL_REGISTRY_SECTION_IDS,
  SECTION_REGISTRY,
  type SectionId,
} from "../sections/registry";

describe("element profiles — registry integrity", () => {
  it("every section id in every profile exists in the registry", () => {
    const registrySet = new Set<SectionId>(ALL_REGISTRY_SECTION_IDS);
    const violations: string[] = [];

    for (const [elementType, profile] of Object.entries(PROFILE_MAP)) {
      for (const sectionId of profile.order) {
        if (!registrySet.has(sectionId)) {
          violations.push(`${elementType}.${sectionId}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("every registry entry has a render function and respects the AnySectionEntry shape", () => {
    for (const id of ALL_REGISTRY_SECTION_IDS) {
      const entry = SECTION_REGISTRY[id];
      expect(entry, `registry entry for "${id}"`).toBeDefined();
      expect(typeof entry.render, `${id}.render`).toBe("function");
    }
  });
});

describe("element profiles — structural coverage", () => {
  it("every profile is a single ordered array, no repeats", () => {
    const problems: string[] = [];
    for (const [elementType, profile] of Object.entries(PROFILE_MAP)) {
      if (!Array.isArray(profile.order)) {
        problems.push(`${elementType}: not an array`);
        continue;
      }
      if (new Set(profile.order).size !== profile.order.length) {
        problems.push(`${elementType}: duplicate section`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("profile map is non-empty — we need real profiles, not just a fallback", () => {
    expect(ALL_PROFILE_ELEMENT_TYPES.length).toBeGreaterThan(10);
  });
});

describe("element profiles — public API", () => {
  it("getProfileFor returns a real profile for every known element type", () => {
    for (const elementType of ALL_PROFILE_ELEMENT_TYPES) {
      const profile = getProfileFor(elementType);
      expect(profile).toBeDefined();
      expect(Array.isArray(profile.order)).toBe(true);
    }
  });

  it("getProfileFor falls back to container profile for unknown types", () => {
    const unknown = getProfileFor("some-unregistered-widget-type-xyz");
    const container = getProfileFor("container");
    expect(unknown.order).toEqual(container.order);
  });

  it("getProfileFor is case-insensitive for element type strings", () => {
    const lower = getProfileFor("heading");
    const upper = getProfileFor("HEADING");
    expect(lower.order).toEqual(upper.order);
  });
});

describe("element profiles — board order", () => {
  /* Board 807:8342 — Typography, Spacing, then Size. No Layout row and no
     Corner radius for text at all. */
  it("text leads with typography, spacing, size", () => {
    for (const type of ["text", "heading", "paragraph"]) {
      expect(getProfileFor(type).order.slice(0, 3)).toEqual([
        "typography",
        "spacing",
        "size",
      ]);
      expect(getProfileFor(type).order).not.toContain("layout");
    }
  });

  /* Board 807:8567 — Typography then Background; Link sits low, after
     Animation, rather than at the top of an "Element" tab. */
  it("button leads with typography, background and keeps link low", () => {
    const order = getProfileFor("button").order;
    expect(order.slice(0, 2)).toEqual(["typography", "background"]);
    expect(order.indexOf("link")).toBeGreaterThan(order.indexOf("animation"));
  });

  /* Board 807:8521 — Size, Spacing, and no Link anywhere: LinkSection gates
     itself to link/button/a/cta, so an entry here could only ever be dead. */
  it("media leads with size then spacing and carries no link", () => {
    expect(getProfileFor("image").order.slice(0, 2)).toEqual(["size", "spacing"]);
    expect(getProfileFor("image").order).not.toContain("link");
  });

  /* Boards 807:8412 / 807:8475 — Layout, then the box model that element is. */
  it("flex and grid lead with layout then their own section", () => {
    expect(getProfileFor("flex").order.slice(0, 2)).toEqual(["layout", "flex"]);
    expect(getProfileFor("grid").order.slice(0, 2)).toEqual(["layout", "grid"]);
    expect(getProfileFor("columns").order).toEqual(getProfileFor("grid").order);
  });

  /* Board 807:8614 — Typography, Border, and Element properties promoted
     above the behaviour sections. */
  it("input leads with typography, border and promotes element properties", () => {
    const order = getProfileFor("input").order;
    expect(order.slice(0, 2)).toEqual(["typography", "border"]);
    expect(order.indexOf("element-properties")).toBeLessThan(order.indexOf("interactions"));
  });

  /* Board 32:2 — Layout leads the container fallback. The display presets
     row it used to lead with ("quick-actions") is on no board and is gone;
     Layout owns Display. */
  it("container leads with layout, and no profile keeps a quick-actions row", () => {
    expect(getProfileFor("container").order[0]).toBe("layout");
    for (const profile of Object.values(PROFILE_MAP)) {
      expect(profile.order).not.toContain("quick-actions");
    }
  });
});
