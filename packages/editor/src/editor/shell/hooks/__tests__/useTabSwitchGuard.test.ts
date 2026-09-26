/**
 * B-1: useTabSwitchGuard wraps the shell's two tab-switch sinks
 * (`setLeftPanelTab`, `openLeftPanelToTab`). A switch that would unmount a
 * surface holding unsaved work (Settings, an open CMS record) waits behind a
 * confirm; everything else runs straight through.
 *
 * Fix round 1: no global reset on "Leave anyway" — each surface owns its
 * registry entry and clears it when it actually unmounts. Brand's staged
 * edits live in TokenRegistryProvider and survive a tab switch, so Brand
 * never blocks one (the exit guard and beforeunload still count it).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { shellDirty, type DirtyDomain } from "../../shellDirtyRegistry";
import { useTabSwitchGuard } from "../useTabSwitchGuard";

const DOMAINS: DirtyDomain[] = ["settings", "brand", "cms-record"];

function setup(opts: { tab?: string; subTabs?: Record<string, string>; allowed?: (t: string) => boolean } = {}) {
  const setLeftPanelTab = vi.fn();
  const openLeftPanelToTab = vi.fn();
  const hook = renderHook(() =>
    useTabSwitchGuard({
      leftPanelTab: opts.tab ?? "settings",
      leftPanelSubTabs: opts.subTabs ?? {},
      setLeftPanelTab,
      openLeftPanelToTab,
      isTabAllowed: opts.allowed ?? (() => true),
    }),
  );
  return { ...hook, setLeftPanelTab, openLeftPanelToTab };
}

describe("useTabSwitchGuard", () => {
  afterEach(() => {
    act(() => DOMAINS.forEach((d) => shellDirty.set(d, false)));
  });

  it("clean: both sinks run immediately, onSwitched runs, no dialog", () => {
    const { result, setLeftPanelTab, openLeftPanelToTab } = setup();
    const onSwitched = vi.fn();
    act(() => result.current.setLeftPanelTab("pages", onSwitched));
    act(() => result.current.openLeftPanelToTab("history", "publishes", onSwitched));
    expect(setLeftPanelTab).toHaveBeenCalledWith("pages");
    expect(openLeftPanelToTab).toHaveBeenCalledWith("history", "publishes");
    expect(onSwitched).toHaveBeenCalledTimes(2);
    expect(result.current.dialogProps.open).toBe(false);
  });

  it.each(["settings", "cms-record"] as const)("%s dirty: a switch away waits behind the dialog", (domain) => {
    act(() => shellDirty.set(domain, true));
    const { result, setLeftPanelTab, openLeftPanelToTab } = setup();
    const onSwitched = vi.fn();
    act(() => result.current.openLeftPanelToTab("pages", undefined, onSwitched));
    expect(openLeftPanelToTab).not.toHaveBeenCalled();
    expect(onSwitched).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(true);
    act(() => result.current.dialogProps.onKeepEditing());
    act(() => result.current.setLeftPanelTab("add"));
    expect(setLeftPanelTab).not.toHaveBeenCalled();
  });

  it("Brand staged edits persist across a switch, so Brand alone never prompts", () => {
    act(() => shellDirty.set("brand", true));
    const { result, setLeftPanelTab } = setup({ tab: "design" });
    act(() => result.current.setLeftPanelTab("pages"));
    expect(setLeftPanelTab).toHaveBeenCalledWith("pages");
    expect(result.current.dialogProps.open).toBe(false);
    // ...and the entry is still there for the exit guard / beforeunload.
    expect(shellDirty.get()).toBe(true);
  });

  it("Keep editing drops the switch and keeps the entry", () => {
    act(() => shellDirty.set("settings", true));
    const { result, setLeftPanelTab } = setup();
    const onSwitched = vi.fn();
    act(() => result.current.setLeftPanelTab("add", onSwitched));
    act(() => result.current.dialogProps.onKeepEditing());
    expect(setLeftPanelTab).not.toHaveBeenCalled();
    expect(onSwitched).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(false);
    expect(shellDirty.get()).toBe(true);
  });

  it("Leave anyway runs the switch + onSwitched and does NOT clear other surfaces' entries", () => {
    act(() => {
      shellDirty.set("settings", true);
      shellDirty.set("brand", true);
    });
    const { result, setLeftPanelTab } = setup();
    const onSwitched = vi.fn();
    act(() => result.current.setLeftPanelTab("add", onSwitched));
    act(() => result.current.dialogProps.onLeaveAnyway());
    expect(setLeftPanelTab).toHaveBeenCalledWith("add");
    expect(onSwitched).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
    // The registry is not reset: Settings clears its own entry when it
    // unmounts, and Brand's staged edits are still staged.
    expect(shellDirty.get()).toBe(true);
  });

  it("the same tab (and sub-tab) is not a switch — no prompt", () => {
    act(() => shellDirty.set("cms-record", true));
    const { result, setLeftPanelTab, openLeftPanelToTab } = setup({ tab: "content" });
    act(() => result.current.setLeftPanelTab("content"));
    act(() => result.current.openLeftPanelToTab("content"));
    expect(setLeftPanelTab).toHaveBeenCalledWith("content");
    expect(openLeftPanelToTab).toHaveBeenCalledWith("content", undefined);
    expect(result.current.dialogProps.open).toBe(false);
  });

  it("a switch the sink will refuse (VIEWER) goes straight to the sink — no prompt, no onSwitched", () => {
    act(() => shellDirty.set("settings", true));
    const { result, openLeftPanelToTab } = setup({ allowed: (t) => t !== "add" });
    const onSwitched = vi.fn();
    act(() => result.current.openLeftPanelToTab("add", undefined, onSwitched));
    expect(openLeftPanelToTab).toHaveBeenCalledWith("add", undefined);
    expect(onSwitched).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(false);
  });
});
