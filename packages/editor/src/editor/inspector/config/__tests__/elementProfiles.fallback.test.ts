/**
 * elementProfiles — unknown-type fallback + warn-once behavior.
 * Structural integrity is covered by inspector/__tests__/elementProfiles.test.ts.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getProfileFor,
  getUnknownElementTypes,
} from "../elementProfiles";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("elementProfiles — warn-once fallback", () => {
  it("warns exactly once per unknown type and records it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const type = "totally-unknown-widget-alpha";

    const first = getProfileFor(type);
    const second = getProfileFor(type);

    // Same fallback profile both times…
    expect(first.order).toEqual(second.order);
    // …but the warning only fires on first sighting.
    const relevant = warn.mock.calls.filter((c) =>
      String(c[0]).includes(type)
    );
    expect(relevant).toHaveLength(1);
    expect(getUnknownElementTypes().has(type)).toBe(true);
  });

  it("falls back to the container profile's section order for unknown types", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const unknown = getProfileFor("totally-unknown-widget-beta");
    const container = getProfileFor("container");
    expect(unknown.order).toEqual(container.order);
  });

  it("does NOT warn for a known type", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getProfileFor("heading");
    const relevant = warn.mock.calls.filter((c) =>
      String(c[0]).includes("heading")
    );
    expect(relevant).toHaveLength(0);
  });
});

/* The type refinement on this branch produces these types. Until the
   Inspector redesign gives them their own type blocks, text-like ones read as
   text and the rest as containers — and none of them warns. */
describe("elementProfiles — interim mapping for refined element types", () => {
  it.each(["label", "stack", "tabs", "list-item", "checkbox", "radio", "switch", "cta"])(
    "%s has an explicit profile (no fallback warning)",
    (type) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      getProfileFor(type);
      expect(warn).not.toHaveBeenCalled();
      expect(getUnknownElementTypes().has(type)).toBe(false);
    },
  );

  it("label reads as text", () => {
    expect(getProfileFor("label").order).toEqual(getProfileFor("text").order);
  });

  it("cta is a section container: it exposes Layout, Flex and Grid", () => {
    const { order } = getProfileFor("cta");
    expect(order).toEqual(expect.arrayContaining(["layout", "flex", "grid"]));
    expect(order).toEqual(getProfileFor("container").order);
  });
});
