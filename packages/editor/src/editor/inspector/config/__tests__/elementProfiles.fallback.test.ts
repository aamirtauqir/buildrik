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
    expect(first.style.order).toEqual(second.style.order);
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
    expect(unknown.style.order).toEqual(container.style.order);
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
