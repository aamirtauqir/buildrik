/**
 * Element profiles integrity tests.
 *
 * Locks down three invariants the registry + profile system depends on:
 *   1. Every section id referenced in any profile exists in the registry.
 *   2. Every profile populates all 3 tabs (style/element/effects) with an
 *      array, even if empty.
 *   3. Unknown element types fall back to the container profile without
 *      crashing.
 *
 * Run with: `npx vitest run editor/inspector/__tests__/elementProfiles`
 *
 * @license BSD-3-Clause
 */

import { describe, expect, it } from "vitest";
import {
  ALL_PROFILE_ELEMENT_TYPES,
  getDefaultTab,
  getProfileFor,
  PROFILE_MAP,
} from "../config/elementProfiles";
import {
  ALL_REGISTRY_SECTION_IDS,
  SECTION_REGISTRY,
  type SectionId,
  type TabId,
} from "../sections/registry";

describe("element profiles — registry integrity", () => {
  it("every section id in every profile exists in the registry", () => {
    const registrySet = new Set<SectionId>(ALL_REGISTRY_SECTION_IDS);
    const violations: string[] = [];

    for (const [elementType, profile] of Object.entries(PROFILE_MAP)) {
      const tabs: TabId[] = ["style", "element", "effects"];
      for (const tabId of tabs) {
        for (const sectionId of profile[tabId].order) {
          if (!registrySet.has(sectionId)) {
            violations.push(`${elementType}.${tabId}.${sectionId}`);
          }
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
  it("every profile populates all 3 tabs with an array", () => {
    const missing: string[] = [];
    for (const [elementType, profile] of Object.entries(PROFILE_MAP)) {
      if (!Array.isArray(profile.style?.order)) missing.push(`${elementType}.style`);
      if (!Array.isArray(profile.element?.order)) missing.push(`${elementType}.element`);
      if (!Array.isArray(profile.effects?.order)) missing.push(`${elementType}.effects`);
    }
    expect(missing).toEqual([]);
  });

  it("every profile declares a defaultTab that is one of the 3 known tabs", () => {
    const validTabs: TabId[] = ["style", "element", "effects"];
    for (const [elementType, profile] of Object.entries(PROFILE_MAP)) {
      expect(
        validTabs.includes(profile.defaultTab),
        `${elementType}.defaultTab must be style/element/effects, got "${profile.defaultTab}"`
      ).toBe(true);
    }
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
      expect(Array.isArray(profile.style.order)).toBe(true);
    }
  });

  it("getProfileFor falls back to container profile for unknown types", () => {
    const unknown = getProfileFor("some-unregistered-widget-type-xyz");
    const container = getProfileFor("container");
    expect(unknown.defaultTab).toBe(container.defaultTab);
    expect(unknown.style.order).toEqual(container.style.order);
  });

  it("getProfileFor is case-insensitive for element type strings", () => {
    const lower = getProfileFor("heading");
    const upper = getProfileFor("HEADING");
    expect(lower.style.order).toEqual(upper.style.order);
  });

  it("getDefaultTab returns the profile's defaultTab for known types", () => {
    expect(getDefaultTab("heading")).toBe("style");
    expect(getDefaultTab("container")).toBe("style");
    expect(getDefaultTab("button")).toBe("style");
  });

  it("getDefaultTab falls back to container's defaultTab for unknown types", () => {
    expect(getDefaultTab("totally-made-up-element")).toBe("style");
  });
});

describe("element profiles — contextual ordering sanity", () => {
  it("text-like elements show typography as the first visible style section", () => {
    const textProfile = getProfileFor("text");
    expect(textProfile.style.order[0]).toBe("typography");
    const headingProfile = getProfileFor("heading");
    expect(headingProfile.style.order[0]).toBe("typography");
  });

  it("button-like elements show typography first in the style tab", () => {
    const buttonProfile = getProfileFor("button");
    expect(buttonProfile.style.order[0]).toBe("typography");
  });

  it("media elements show size first in the style tab", () => {
    const imageProfile = getProfileFor("image");
    expect(imageProfile.style.order[0]).toBe("size");
  });

  it("container elements start with quick-actions so users can switch layout modes", () => {
    const containerProfile = getProfileFor("container");
    expect(containerProfile.style.order[0]).toBe("quick-actions");
  });

  it("flex containers have quick-actions + layout + flex as the first three visible sections", () => {
    const flexProfile = getProfileFor("flex");
    const firstThree = flexProfile.style.order.slice(0, 3);
    expect(firstThree).toEqual(["quick-actions", "layout", "flex"]);
  });

  it("grid containers (including columns) use the grid profile order", () => {
    const gridProfile = getProfileFor("grid");
    const columnsProfile = getProfileFor("columns");
    expect(columnsProfile.style.order).toEqual(gridProfile.style.order);
    expect(gridProfile.style.order.slice(0, 3)).toEqual(["quick-actions", "layout", "grid"]);
  });
});
