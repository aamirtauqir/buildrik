/**
 * useCanvasGuides — add/remove/update/clear guides + localStorage persistence,
 * all gated behind the `enabled` flag.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasGuides } from "../useCanvasGuides";

const STORAGE_KEY = "buildrick-guides";

beforeEach(() => {
  localStorage.clear();
});

describe("useCanvasGuides — disabled", () => {
  it("returns an empty guide list even after adds while disabled", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: false }));
    act(() => result.current.addGuide("horizontal", 100));
    // guides getter is `enabled ? guides : []`
    expect(result.current.guides).toEqual([]);
  });

  it("does not persist to localStorage while disabled", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: false }));
    act(() => result.current.addGuide("vertical", 50));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("useCanvasGuides — enabled add/remove/update/clear", () => {
  it("addGuide appends a guide with the given type/position and defaults", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: true }));
    act(() => result.current.addGuide("horizontal", 120));

    expect(result.current.guides).toHaveLength(1);
    const guide = result.current.guides[0];
    expect(guide.type).toBe("horizontal");
    expect(guide.position).toBe(120);
    expect(guide.locked).toBe(false);
    expect(typeof guide.id).toBe("string");
    expect(guide.id.length).toBeGreaterThan(0);
  });

  it("removeGuide drops only the matching id", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: true }));
    act(() => result.current.addGuide("horizontal", 10));
    act(() => result.current.addGuide("vertical", 20));
    const firstId = result.current.guides[0].id;

    act(() => result.current.removeGuide(firstId));

    expect(result.current.guides).toHaveLength(1);
    expect(result.current.guides[0].position).toBe(20);
  });

  it("updateGuide changes position while preserving other fields", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: true }));
    act(() => result.current.addGuide("vertical", 30));
    const id = result.current.guides[0].id;

    act(() => result.current.updateGuide(id, 200));

    expect(result.current.guides[0].position).toBe(200);
    expect(result.current.guides[0].type).toBe("vertical");
    expect(result.current.guides[0].id).toBe(id);
  });

  it("clearGuides empties the list", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: true }));
    act(() => result.current.addGuide("horizontal", 10));
    act(() => result.current.addGuide("vertical", 20));

    act(() => result.current.clearGuides());

    expect(result.current.guides).toEqual([]);
  });
});

describe("useCanvasGuides — persistence", () => {
  it("writes guides to localStorage when enabled", () => {
    const { result } = renderHook(() => useCanvasGuides({ enabled: true }));
    act(() => result.current.addGuide("horizontal", 77));

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].position).toBe(77);
  });

  it("hydrates existing guides from localStorage on mount", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: "g1", type: "vertical", position: 42, locked: false }])
    );
    const { result } = renderHook(() => useCanvasGuides({ enabled: true }));
    expect(result.current.guides).toHaveLength(1);
    expect(result.current.guides[0].id).toBe("g1");
    expect(result.current.guides[0].position).toBe(42);
  });
});
