/**
 * B-1: useTabSwitchGuard lets a tab switch run immediately when nothing is
 * dirty, and defers it behind a confirm dialog when shellDirtyRegistry says
 * something is.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { shellDirty } from "../../shellDirtyRegistry";
import { useTabSwitchGuard } from "../useTabSwitchGuard";

describe("useTabSwitchGuard", () => {
  beforeEach(() => {
    shellDirty.reset();
  });

  it("runs the switch immediately when nothing is dirty — no dialog", () => {
    const { result } = renderHook(() => useTabSwitchGuard());
    const perform = vi.fn();

    act(() => result.current.guard(perform));

    expect(perform).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
  });

  it("Brand staged edit: switching tab opens the dialog instead of running the switch", () => {
    shellDirty.set("brand", true);
    const { result } = renderHook(() => useTabSwitchGuard());
    const perform = vi.fn();

    act(() => result.current.guard(perform));

    expect(perform).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(true);
  });

  it("Settings dirty: a palette jump opens the dialog", () => {
    shellDirty.set("settings", true);
    const { result } = renderHook(() => useTabSwitchGuard());
    const perform = vi.fn();

    act(() => result.current.guard(perform));

    expect(perform).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(true);
  });

  it("Keep editing closes the dialog without running the switch", () => {
    shellDirty.set("settings", true);
    const { result } = renderHook(() => useTabSwitchGuard());
    const perform = vi.fn();

    act(() => result.current.guard(perform));
    act(() => result.current.dialogProps.onKeepEditing());

    expect(perform).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(false);
    // The domain is still dirty — Keep editing didn't discard anything.
    expect(shellDirty.get()).toBe(true);
  });

  it("Leave anyway runs the deferred switch and clears the registry", () => {
    shellDirty.set("cms-record", true);
    const { result } = renderHook(() => useTabSwitchGuard());
    const perform = vi.fn();

    act(() => result.current.guard(perform));
    act(() => result.current.dialogProps.onLeaveAnyway());

    expect(perform).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
    expect(shellDirty.get()).toBe(false);
  });
});
