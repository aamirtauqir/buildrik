/**
 * A hidden layer has to survive a reload.
 *
 * Walked live 2026-08-18: hiding a layer wrote
 * `buildrick-layers-<page>-hidden=["el-…"]`, and after a reload the same key
 * read `[]` — the element was back at full opacity and the Layers row no
 * longer called it hidden. The state was not lost in hydration; it was
 * overwritten before hydration ran.
 *
 * The persist effects guarded on an `isHydrated` ref that a separate effect
 * flipped to true on the FIRST commit — before `hydrateFromStorage` had been
 * called for the page — so the initial empty Set was written straight over
 * the stored ids.
 *
 * @license BSD-3-Clause
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useLayerActions } from "../useLayerActions";
import { getStorageKey } from "../layersPersistence";

const PAGE = "page-1";
const HIDDEN_KEY = getStorageKey(PAGE, "hidden");
const LOCKED_KEY = getStorageKey(PAGE, "locked");

beforeEach(() => localStorage.clear());

describe("useLayerActions — stored layer state survives a mount", () => {
  it("does not overwrite stored hidden ids before hydrating", async () => {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(["el-a", "el-b"]));
    const { result } = renderHook(() => useLayerActions(null, PAGE));

    // A mount alone must not touch the stored set.
    expect(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]")).toEqual(["el-a", "el-b"]);

    act(() => result.current.hydrateFromStorage(PAGE));
    expect([...result.current.hiddenIds]).toEqual(["el-a", "el-b"]);
    expect(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]")).toEqual(["el-a", "el-b"]);
  });

  it("does not overwrite stored locked ids either", () => {
    localStorage.setItem(LOCKED_KEY, JSON.stringify(["el-c"]));
    renderHook(() => useLayerActions(null, PAGE));
    expect(JSON.parse(localStorage.getItem(LOCKED_KEY) || "[]")).toEqual(["el-c"]);
  });

  it("still persists a change made after hydration", () => {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(["el-a"]));
    const { result } = renderHook(() => useLayerActions(null, PAGE));
    act(() => result.current.hydrateFromStorage(PAGE));
    act(() => result.current.toggleVisibility("el-z", { stopPropagation() {} } as never));
    expect(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]").sort()).toEqual(["el-a", "el-z"]);
  });
});
