/**
 * useCanvasGuides — ruler guides live in the project settings (G2-033), so
 * they are saved with the site instead of in this browser's localStorage.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import type { ProjectSettings } from "../../../../shared/types";
import { useCanvasGuides } from "../useCanvasGuides";

let settings: ProjectSettings;
let handlers: Map<string, () => void>;
let composer: {
  getProjectSettings: () => ProjectSettings;
  setProjectSettings: ReturnType<typeof vi.fn>;
  on: (e: string, h: () => void) => void;
  off: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  settings = {};
  handlers = new Map();
  composer = {
    getProjectSettings: () => settings,
    setProjectSettings: vi.fn((next: ProjectSettings) => {
      settings = next;
    }),
    on: (e, h) => handlers.set(e, h),
    off: vi.fn(),
  };
});

afterEach(() => {
  vi.useRealTimers();
});

const mount = (enabled = true) =>
  renderHook(() => useCanvasGuides({ composer: composer as unknown as Composer, enabled }));

describe("useCanvasGuides", () => {
  it("reads the site's saved guides", () => {
    settings = { canvasGuides: [{ id: "g1", type: "vertical", position: 40, locked: false, color: "#89b4fa" }] };
    const { result } = mount();
    expect(result.current.guides.map((g) => g.position)).toEqual([40]);
  });

  it("writes an added guide to the project settings once it rests, not to localStorage", () => {
    const { result } = mount();
    act(() => result.current.addGuide("horizontal", 120));
    expect(result.current.guides).toHaveLength(1);
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    expect(settings.canvasGuides?.[0]).toMatchObject({ type: "horizontal", position: 120, locked: false });
    expect(localStorage.length).toBe(0);
  });

  it("a drag (many updates) is one write with the final position", () => {
    const { result } = mount();
    act(() => result.current.addGuide("vertical", 30));
    const id = result.current.guides[0].id;
    for (const p of [40, 50, 60, 200]) act(() => result.current.updateGuide(id, p));
    act(() => vi.advanceTimersByTime(300));
    expect(composer.setProjectSettings).toHaveBeenCalledTimes(1);
    expect(settings.canvasGuides?.map((g) => g.position)).toEqual([200]);
  });

  it("removeGuide drops only the matching id", () => {
    const { result } = mount();
    act(() => result.current.addGuide("horizontal", 10));
    act(() => result.current.addGuide("vertical", 20));
    act(() => result.current.removeGuide(result.current.guides[0].id));
    act(() => vi.advanceTimersByTime(300));
    expect(settings.canvasGuides?.map((g) => g.position)).toEqual([20]);
  });

  it("a project load re-reads the guides without writing (opening a site is not an edit)", () => {
    const { result } = mount();
    settings = { canvasGuides: [{ id: "g2", type: "horizontal", position: 80, locked: false, color: "#89b4fa" }] };
    act(() => handlers.get(EVENTS.PROJECT_LOADED)?.());
    expect(result.current.guides.map((g) => g.id)).toEqual(["g2"]);
    act(() => vi.advanceTimersByTime(1000));
    expect(composer.setProjectSettings).not.toHaveBeenCalled();
  });

  it("hides guides while rulers are off", () => {
    settings = { canvasGuides: [{ id: "g1", type: "vertical", position: 40, locked: false, color: "#89b4fa" }] };
    const { result } = mount(false);
    expect(result.current.guides).toEqual([]);
  });
});
