/**
 * B-1: shellDirtyRegistry is the one place every navigation guard reads to
 * know whether Settings, Brand or a CMS record has a staged-but-unsaved
 * edit.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { shellDirty, useShellDirty } from "../shellDirtyRegistry";

describe("shellDirtyRegistry", () => {
  beforeEach(() => {
    shellDirty.reset();
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

  it("reset() clears every domain", () => {
    shellDirty.set("brand", true);
    shellDirty.set("settings", true);
    shellDirty.reset();
    expect(shellDirty.get()).toBe(false);
    expect(shellDirty.getDomains()).toEqual({ settings: false, brand: false, "cms-record": false });
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
