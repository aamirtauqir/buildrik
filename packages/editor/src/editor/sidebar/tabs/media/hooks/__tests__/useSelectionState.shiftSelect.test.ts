/**
 * §14 useSelectionState — shiftSelect + enterSelectModeWith — Phase 5 Task 29.
 *
 * Asserts shift-click range and right-click "Select" entry paths set
 * selMode + selectedKeys correctly.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelectionState } from "../useSelectionState";
import type { LibraryItem } from "../../data/mediaTypes";

function makeItem(key: string): LibraryItem {
  return {
    key,
    name: key,
    type: "img",
    src: "data:,",
    size: 1,
    createdAt: "2026-01-01T00:00:00Z",
    mimeType: "image/png",
  };
}

const FAKE_COMPOSER = {
  elements: { findByMediaSrc: () => [] },
  media: { getAsset: () => null },
} as never;

describe("§14 — useSelectionState entry paths", () => {
  it("enterSelectModeWith turns selMode on + selects one item", () => {
    const items = ["a", "b", "c"].map(makeItem);
    const { result } = renderHook(() =>
      useSelectionState(FAKE_COMPOSER, items, () => {}),
    );
    expect(result.current.selMode).toBe(false);
    act(() => result.current.enterSelectModeWith("b"));
    expect(result.current.selMode).toBe(true);
    expect(Array.from(result.current.selectedKeys)).toEqual(["b"]);
  });

  it("shiftSelect with no prior anchor selects one item + sets anchor", () => {
    const items = ["a", "b", "c"].map(makeItem);
    const { result } = renderHook(() =>
      useSelectionState(FAKE_COMPOSER, items, () => {}),
    );
    act(() => result.current.shiftSelect("b"));
    expect(result.current.selMode).toBe(true);
    expect(Array.from(result.current.selectedKeys)).toEqual(["b"]);
  });

  it("shiftSelect with prior anchor selects range inclusive", () => {
    const items = ["a", "b", "c", "d", "e"].map(makeItem);
    const { result } = renderHook(() =>
      useSelectionState(FAKE_COMPOSER, items, () => {}),
    );
    act(() => result.current.toggleSelect("b")); // anchor = b
    act(() => result.current.shiftSelect("d"));
    expect(Array.from(result.current.selectedKeys).sort()).toEqual([
      "b",
      "c",
      "d",
    ]);
  });

  it("shiftSelect handles reverse order (later anchor, earlier target)", () => {
    const items = ["a", "b", "c", "d"].map(makeItem);
    const { result } = renderHook(() =>
      useSelectionState(FAKE_COMPOSER, items, () => {}),
    );
    act(() => result.current.toggleSelect("d")); // anchor = d
    act(() => result.current.shiftSelect("b"));
    expect(Array.from(result.current.selectedKeys).sort()).toEqual([
      "b",
      "c",
      "d",
    ]);
  });
});
