/**
 * B-1: useTabSwitchGuard wraps the shell's two tab-switch sinks
 * (`setLeftPanelTab`, `openLeftPanelToTab`). A switch that would unmount a
 * surface holding unsaved work (Settings, an open CMS record) waits behind a
 * confirm; everything else runs straight through.
 *
 * Fix: no global reset on "Leave anyway" — each surface owns its
 * registry entry. Fix: Brand prompts too, and "Leave anyway" runs
 * each dirty surface's registered discard before switching.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { shellDirty, type DirtyDomain } from "../../shellDirtyRegistry";
import { useTabSwitchGuard } from "../useTabSwitchGuard";

const DOMAINS: DirtyDomain[] = ["settings", "brand", "cms-record"];

function setup(opts: { tab?: string; subTabs?: Record<string, string>; allowed?: (t: string) => boolean } = {}) {
  const setLeftPanelTab = vi.fn();
  const onDiscardFailed = vi.fn();
  const openLeftPanelToTab = vi.fn();
  const hook = renderHook(() =>
    useTabSwitchGuard({
      leftPanelTab: opts.tab ?? "settings",
      leftPanelSubTabs: opts.subTabs ?? {},
      setLeftPanelTab,
      openLeftPanelToTab,
      isTabAllowed: opts.allowed ?? (() => true),
      onDiscardFailed,
    }),
  );
  return { ...hook, setLeftPanelTab, openLeftPanelToTab, onDiscardFailed };
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

  /* Fix (ruling): Brand staging does NOT reliably survive a switch
     (a BrandWorkspace remount can reset staged registries; the draft store
     restores only part of it), so Brand prompts too — with copy that does
     not overclaim, since Brand registers no discard. */
  it("Brand staged edits prompt on a switch, with honest may-discard copy", () => {
    act(() => shellDirty.set("brand", true));
    const { result, setLeftPanelTab } = setup({ tab: "design" });
    act(() => result.current.setLeftPanelTab("pages"));
    expect(setLeftPanelTab).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.body).toBe("You have unsaved brand changes. Switching away may discard some of them.");
    expect(result.current.dialogProps.leaveLabel).toBe("Leave anyway");
  });

  it("Leave anyway runs each dirty surface's discard BEFORE the switch; loss copy only when all can discard", () => {
    const order: string[] = [];
    const discard = vi.fn(() => {
      order.push("discard");
      shellDirty.set("settings", false);
    });
    act(() => {
      shellDirty.setDiscard("settings", discard);
      shellDirty.set("settings", true);
    });
    const { result, setLeftPanelTab } = setup();
    setLeftPanelTab.mockImplementation(() => order.push("switch"));
    act(() => result.current.setLeftPanelTab("add"));
    expect(result.current.dialogProps.body).toBe("You have unsaved changes. Switching away will lose them.");
    expect(result.current.dialogProps.leaveLabel).toBe("Leave and lose changes");
    act(() => result.current.dialogProps.onLeaveAnyway());
    expect(order).toEqual(["discard", "switch"]);
    expect(shellDirty.get()).toBe(false);
    act(() => shellDirty.setDiscard("settings", null));
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

  it("Leave anyway with a throwing discard: the other discards run, the switch still happens, the failure is reported and stays dirty", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const recordDiscard = vi.fn(() => shellDirty.set("cms-record", false));
    act(() => {
      shellDirty.setDiscard("settings", () => {
        throw new Error("boom");
      });
      shellDirty.setDiscard("cms-record", recordDiscard);
      shellDirty.set("settings", true);
      shellDirty.set("cms-record", true);
    });
    const { result, setLeftPanelTab, onDiscardFailed } = setup({ tab: "content" });
    act(() => result.current.setLeftPanelTab("add"));
    act(() => result.current.dialogProps.onLeaveAnyway());
    expect(recordDiscard).toHaveBeenCalledTimes(1);
    expect(setLeftPanelTab).toHaveBeenCalledWith("add");
    expect(onDiscardFailed).toHaveBeenCalledWith(["settings"]);
    expect(shellDirty.dirtyDomains()).toEqual(["settings"]);
    act(() => {
      shellDirty.setDiscard("settings", null);
      shellDirty.setDiscard("cms-record", null);
    });
    err.mockRestore();
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
