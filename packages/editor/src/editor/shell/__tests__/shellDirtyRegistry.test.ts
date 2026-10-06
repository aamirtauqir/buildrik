/**
 * B-1: shellDirtyRegistry is the one place every navigation guard reads to
 * know whether Settings or a CMS record has a staged-but-unsaved
 * edit. Each surface owns (sets and clears) its own entry.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { shellDirty, useShellDirty } from "../shellDirtyRegistry";

describe("shellDirtyRegistry", () => {
  afterEach(() => {
    act(() => (["settings", "cms-record"] as const).forEach((d) => shellDirty.set(d, false)));
  });

  it("get() is false when nothing is registered dirty", () => {
    expect(shellDirty.get()).toBe(false);
  });

  it("get() is true when any single domain is dirty", () => {
    shellDirty.set("settings", true);
    expect(shellDirty.get()).toBe(true);
    shellDirty.set("settings", false);

    shellDirty.set("cms-record", true);
    expect(shellDirty.get()).toBe(true);
  });

  it("discardDirty() runs the discard of every dirty domain that registered one, and only those", () => {
    const settingsDiscard = vi.fn(() => shellDirty.set("settings", false));
    shellDirty.setDiscard("settings", settingsDiscard);
    shellDirty.set("settings", true);
    shellDirty.set("cms-record", true);
    shellDirty.discardDirty();
    expect(settingsDiscard).toHaveBeenCalledTimes(1);
    expect(shellDirty.get()).toBe(true); // cms-record registered no discard
    shellDirty.setDiscard("settings", null);
  });

  /* Fix: one throwing discard must not abort the rest, and its
     domain stays dirty so Exit / beforeunload still warn. */
  it("discardDirty() isolates a throwing discard: others still run, the failed domain stays dirty and is reported", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    shellDirty.setDiscard("settings", () => {
      throw new Error("boom");
    });
    const recordDiscard = vi.fn(() => shellDirty.set("cms-record", false));
    shellDirty.setDiscard("cms-record", recordDiscard);
    shellDirty.set("settings", true);
    shellDirty.set("cms-record", true);
    expect(shellDirty.discardDirty()).toEqual(["settings"]);
    expect(recordDiscard).toHaveBeenCalledTimes(1);
    expect(shellDirty.dirtyDomains()).toEqual(["settings"]);
    expect(err).toHaveBeenCalledWith(expect.stringContaining("settings"), expect.any(Error));
    shellDirty.setDiscard("settings", null);
    shellDirty.setDiscard("cms-record", null);
    err.mockRestore();
  });

  it("everyDirtyDiscards() is false while a dirty domain has no discard", () => {
    shellDirty.setDiscard("settings", () => {});
    shellDirty.set("settings", true);
    expect(shellDirty.everyDirtyDiscards()).toBe(true);
    shellDirty.set("cms-record", true);
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
