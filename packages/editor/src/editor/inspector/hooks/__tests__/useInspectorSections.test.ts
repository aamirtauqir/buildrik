/**
 * useInspectorSections + resolveDisplayMode — DD-11: how a section arrives
 * (open, summary, or the "+" row), and the user's per-type choice that
 * overrides it, persisted under the v3 key.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { resolveDisplayMode, SECTION_PREFS_KEY, useInspectorSections } from "../useInspectorSections";

beforeEach(() => localStorage.clear());

describe("resolveDisplayMode", () => {
  it("always / open arrive open; closed arrives as a summary", () => {
    expect(resolveDisplayMode("always", false, undefined)).toBe("open");
    expect(resolveDisplayMode("open", false, undefined)).toBe("open");
    expect(resolveDisplayMode("closed", true, undefined)).toBe("summary");
  });

  it("valued: open with a value, the '+' row without one (board 1's Fill / Border)", () => {
    expect(resolveDisplayMode("valued", true, undefined)).toBe("open");
    expect(resolveDisplayMode("valued", false, undefined)).toBe("empty");
  });

  it("the user's choice wins; closing a valued section leaves its summary", () => {
    expect(resolveDisplayMode("valued", false, "open")).toBe("open");
    expect(resolveDisplayMode("valued", true, "closed")).toBe("summary");
    expect(resolveDisplayMode("always", true, "closed")).toBe("summary");
    expect(resolveDisplayMode("closed", false, "open")).toBe("open");
  });
});

describe("useInspectorSections", () => {
  it("records a choice per element type and persists it", () => {
    const { result } = renderHook(() => useInspectorSections());
    act(() => result.current.setChoices("heading", ["typography"], "closed"));
    expect(result.current.choices).toEqual({ "heading:typography": "closed" });
    expect(JSON.parse(localStorage.getItem(SECTION_PREFS_KEY)!)).toEqual({ "heading:typography": "closed" });
  });

  it("one call sets several sections (⌥-click, DD-22)", () => {
    const { result } = renderHook(() => useInspectorSections());
    act(() => result.current.setChoices("text", ["size", "spacing"], "open"));
    expect(result.current.choices).toEqual({ "text:size": "open", "text:spacing": "open" });
  });

  it("a new mount reads the stored choices back", () => {
    localStorage.setItem(SECTION_PREFS_KEY, JSON.stringify({ "image:fill": "open", "junk": 3 }));
    const { result } = renderHook(() => useInspectorSections());
    expect(result.current.choices).toEqual({ "image:fill": "open" });
  });

  it("deletes the retired v2, legacy and Beginner/Pro keys on first load", () => {
    for (const k of ["buildrick-inspector-sections-v2", "buildrick-inspector-sections", "buildrick-inspector-tier"]) localStorage.setItem(k, "x");
    renderHook(() => useInspectorSections());
    expect(localStorage.getItem("buildrick-inspector-sections-v2")).toBeNull();
    expect(localStorage.getItem("buildrick-inspector-sections")).toBeNull();
    expect(localStorage.getItem("buildrick-inspector-tier")).toBeNull();
  });
});
