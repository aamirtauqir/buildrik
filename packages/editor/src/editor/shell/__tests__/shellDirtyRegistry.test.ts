/**
 * B-1: shellDirtyRegistry is the one place every navigation guard reads to
 * know whether Settings, Brand or a CMS record has a staged-but-unsaved
 * edit. Each surface owns (sets and clears) its own entry.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { shellDirty, useShellDirty } from "../shellDirtyRegistry";

describe("shellDirtyRegistry", () => {
  afterEach(() => {
    act(() => (["settings", "brand", "cms-record"] as const).forEach((d) => shellDirty.set(d, false)));
  });

  it("get() is false when nothing is registered dirty", () => {
    expect(shellDirty.get()).toBe(false);
  });

  it("get() is true when any single domain is dirty", () => {
    shellDirty.set("brand", true);
    expect(shellDirty.get()).toBe(true);
    shellDirty.set("brand", false);
    expect(shellDirty.get()).toBe(false);

    shellDirty.set("settings", true);
    expect(shellDirty.get()).toBe(true);
    shellDirty.set("settings", false);

    shellDirty.set("cms-record", true);
    expect(shellDirty.get()).toBe(true);
  });

  it("discardDirty() runs the discard of every dirty domain that registered one, and only those", () => {
    const settingsDiscard = vi.fn(() => shellDirty.set("settings", false));
    const recordDiscard = vi.fn();
    shellDirty.setDiscard("settings", settingsDiscard);
    shellDirty.setDiscard("cms-record", recordDiscard);
    shellDirty.set("settings", true);
    shellDirty.set("brand", true);
    shellDirty.discardDirty();
    expect(settingsDiscard).toHaveBeenCalledTimes(1);
    expect(recordDiscard).not.toHaveBeenCalled(); // not dirty
    expect(shellDirty.get()).toBe(true); // brand registered no discard
    shellDirty.setDiscard("settings", null);
    shellDirty.setDiscard("cms-record", null);
  });

  it("everyDirtyDiscards() is false while a dirty domain has no discard (Brand)", () => {
    shellDirty.setDiscard("settings", () => {});
    shellDirty.set("settings", true);
    expect(shellDirty.everyDirtyDiscards()).toBe(true);
    shellDirty.set("brand", true);
    expect(shellDirty.everyDirtyDiscards()).toBe(false);
    shellDirty.setDiscard("settings", null);
  });

  it("useShellDirty() re-renders subscribers on a domain change", () => {
    const { result } = renderHook(() => useShellDirty());
    expect(result.current).toBe(false);

    act(() => shellDirty.set("settings", true));
    expect(result.current).toBe(true);

    act(() => shellDirty.set("settings", false));
    expect(result.current).toBe(false);
  });
});
