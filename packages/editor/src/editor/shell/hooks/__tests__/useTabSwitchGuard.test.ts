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

const DOMAINS: DirtyDomain[] = ["settings", "cms-record"];

function setup(
  opts: { tab?: string; subTabs?: Record<string, string>; allowed?: (t: string) => boolean; drawerOpen?: boolean } = {},
) {
  const setLeftPanelTab = vi.fn();
  const setIsLeftPanelOpen = vi.fn();
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
      isLeftPanelOpen: opts.drawerOpen ?? true,
      setIsLeftPanelOpen,
    }),
  );
  return { ...hook, setLeftPanelTab, openLeftPanelToTab, onDiscardFailed, setIsLeftPanelOpen };
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

  /* A surface that registers no discard still prompts — with copy that does
     not overclaim. (This was Brand's case until its edits autosaved, spec §4.) */
  it("a dirty surface with no discard prompts on a switch, with honest may-discard copy", () => {
    act(() => shellDirty.set("cms-record", true));
    const { result, setLeftPanelTab } = setup({ tab: "design" });
    act(() => result.current.setLeftPanelTab("pages"));
    expect(setLeftPanelTab).not.toHaveBeenCalled();
    expect(result.current.dialogProps.open).toBe(true);
    expect(result.current.dialogProps.body).toBe("You have unsaved changes. Switching away may discard some of them.");
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
      shellDirty.set("cms-record", true);
    });
    const { result, setLeftPanelTab } = setup();
    const onSwitched = vi.fn();
    act(() => result.current.setLeftPanelTab("add", onSwitched));
    act(() => result.current.dialogProps.onLeaveAnyway());
    expect(setLeftPanelTab).toHaveBeenCalledWith("add");
    expect(onSwitched).toHaveBeenCalledTimes(1);
    expect(result.current.dialogProps.open).toBe(false);
    // The registry is not reset: Settings clears its own entry when it
    // unmounts, and the record sheet clears its own.
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
    // Only the failed domain stays dirty: clearing it leaves the registry clean.
    expect(shellDirty.get()).toBe(true);
    act(() => shellDirty.set("settings", false));
    expect(shellDirty.get()).toBe(false);
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

  /* EDT-007: closing the drawer unmounts the CMS workspace, and with it an
     open record sheet. That exit asks through the same dialog as every
     other; Keep editing keeps the drawer (and the edit). */
  describe("closing the drawer (EDT-007)", () => {
    it("clean: the drawer closes at once, no dialog", () => {
      const { result, setIsLeftPanelOpen } = setup({ tab: "content" });
      act(() => result.current.toggleLeftPanel());
      expect(setIsLeftPanelOpen).toHaveBeenCalledWith(false);
      expect(result.current.dialogProps.open).toBe(false);
    });

    it("a dirty record: close waits behind the dialog; Keep editing keeps the drawer open and the edit", () => {
      act(() => shellDirty.set("cms-record", true));
      const { result, setIsLeftPanelOpen } = setup({ tab: "content" });
      act(() => result.current.toggleLeftPanel());
      expect(setIsLeftPanelOpen).not.toHaveBeenCalled();
      expect(result.current.dialogProps.open).toBe(true);
      act(() => result.current.dialogProps.onKeepEditing());
      expect(setIsLeftPanelOpen).not.toHaveBeenCalled();
      expect(shellDirty.get()).toBe(true);
      act(() => result.current.closeLeftPanel());
      expect(setIsLeftPanelOpen).not.toHaveBeenCalled();
      expect(result.current.dialogProps.open).toBe(true);
    });

    it("a dirty record: Discard runs the record's discard, then closes", () => {
      const order: string[] = [];
      act(() => {
        shellDirty.setDiscard("cms-record", () => {
          order.push("discard");
          shellDirty.set("cms-record", false);
        });
        shellDirty.set("cms-record", true);
      });
      const { result, setIsLeftPanelOpen } = setup({ tab: "content" });
      setIsLeftPanelOpen.mockImplementation(() => order.push("close"));
      act(() => result.current.toggleLeftPanel());
      expect(result.current.dialogProps.leaveLabel).toBe("Leave and lose changes");
      act(() => result.current.dialogProps.onLeaveAnyway());
      expect(order).toEqual(["discard", "close"]);
      expect(setIsLeftPanelOpen).toHaveBeenCalledWith(false);
      act(() => shellDirty.setDiscard("cms-record", null));
    });

    it("dirty Settings alone does not prompt: a closed drawer keeps Settings mounted", () => {
      const discard = vi.fn();
      act(() => {
        shellDirty.setDiscard("settings", discard);
        shellDirty.set("settings", true);
      });
      const { result, setIsLeftPanelOpen } = setup({ tab: "settings" });
      act(() => result.current.closeLeftPanel());
      expect(setIsLeftPanelOpen).toHaveBeenCalledWith(false);
      expect(discard).not.toHaveBeenCalled();
      expect(result.current.dialogProps.open).toBe(false);
      act(() => shellDirty.setDiscard("settings", null));
    });

    it("Discard on a drawer close leaves a dirty Settings untouched", () => {
      const settingsDiscard = vi.fn();
      act(() => {
        shellDirty.setDiscard("settings", settingsDiscard);
        shellDirty.setDiscard("cms-record", () => shellDirty.set("cms-record", false));
        shellDirty.set("settings", true);
        shellDirty.set("cms-record", true);
      });
      const { result } = setup({ tab: "content" });
      act(() => result.current.toggleLeftPanel());
      act(() => result.current.dialogProps.onLeaveAnyway());
      expect(settingsDiscard).not.toHaveBeenCalled();
      expect(shellDirty.get()).toBe(true);
      act(() => {
        shellDirty.setDiscard("settings", null);
        shellDirty.setDiscard("cms-record", null);
      });
    });

    it("opening a closed drawer never prompts", () => {
      act(() => shellDirty.set("cms-record", true));
      const { result, setIsLeftPanelOpen } = setup({ tab: "content", drawerOpen: false });
      act(() => result.current.toggleLeftPanel());
      expect(setIsLeftPanelOpen).toHaveBeenCalledWith(true);
      expect(result.current.dialogProps.open).toBe(false);
    });
  });
});
