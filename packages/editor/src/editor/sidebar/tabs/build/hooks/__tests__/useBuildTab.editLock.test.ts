// @vitest-environment jsdom
/**
 * Task 1.6 — an Insert drag does not start while an edit lock holds: the
 * drop would be refused, so there is no payload, no insert cue and no
 * "recent" entry. It follows `editlock:changed`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type * as React from "react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { useBuildTab } from "../useBuildTab";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function dragEvent() {
  const setData = vi.fn();
  const preventDefault = vi.fn();
  const e = { preventDefault, dataTransfer: { setData, effectAllowed: "", setDragImage: vi.fn() } };
  return { e: e as unknown as React.DragEvent, setData, preventDefault };
}

describe("useBuildTab — drag while locked", () => {
  it("an element or block drag is cancelled under the not-loaded lock, and starts once it clears", () => {
    const composer = createTestComposer();
    const { result } = renderHook(() => useBuildTab(composer));
    act(() => result.current.setSearchQuery("heading"));
    const hit = result.current.searchResults.find((h) => h.group === "ELEMENTS");
    if (!hit || hit.group !== "ELEMENTS") throw new Error("no element hit");

    act(() => composer.setEditLock("not-loaded", true));
    const locked = dragEvent();
    result.current.handleDragStart(locked.e, hit.el);
    expect(locked.preventDefault).toHaveBeenCalled();
    expect(locked.setData).not.toHaveBeenCalled();
    expect(result.current.recents).not.toContain(hit.el.name);

    act(() => composer.setEditLock("not-loaded", false));
    const open = dragEvent();
    act(() => result.current.handleDragStart(open.e, hit.el));
    expect(open.preventDefault).not.toHaveBeenCalled();
    expect(open.setData).toHaveBeenCalled();
  });
});
