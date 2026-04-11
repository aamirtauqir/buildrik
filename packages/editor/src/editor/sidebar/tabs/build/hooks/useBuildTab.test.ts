import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import { useBuildTab } from "./useBuildTab";
import { ToastProvider } from "../../../../../shared/ui/Toast";

// useBuildTab transitively calls useQuickPicksStorage → useToast, so tests
// must render inside a ToastProvider.
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useBuildTab — search clear restores categories", () => {
  it("restores open categories after clearing search", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });

    // The hook opens "basic" by default (empty sessionStorage path in
    // useBuildTab.ts:83). Toggling "basic" would CLOSE it, which is the
    // opposite of what we want to verify. Use "layout" instead: the
    // single-accordion toggle semantics will close basic and open layout,
    // giving us a non-default open state that the search round-trip
    // must preserve.
    act(() => {
      result.current.toggleCat("layout");
    });
    expect(result.current.openCats.has("layout")).toBe(true);
    expect(result.current.openCats.has("basic")).toBe(false);

    act(() => {
      result.current.setSearchQuery("button");
    });
    expect(result.current.searchQuery).toBe("button");

    act(() => {
      result.current.setSearchQuery("");
    });

    expect(result.current.openCats.has("layout")).toBe(true);
  });
});

describe("useBuildTab — Quick Picks persistence", () => {
  it("starts empty when no storage exists", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    expect(result.current.quickPicks).toEqual([]);
  });

  it("adds a pick and persists it", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
    });
    expect(result.current.quickPicks).toEqual(["heading"]);
    expect(JSON.parse(localStorage.getItem("aqb-build-quick-picks-v2") ?? "[]")).toEqual([
      "heading",
    ]);
  });

  it("rejects unknown blockIds silently", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("nonexistent-block");
    });
    expect(result.current.quickPicks).toEqual([]);
  });

  it("dedupes repeated adds", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
      result.current.addQuickPick("heading");
    });
    expect(result.current.quickPicks).toEqual(["heading"]);
  });

  it("caps at 7 pins and rejects the 8th", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    const seven = ["heading", "paragraph", "button", "icon", "divider", "spacer", "label"];
    act(() => {
      for (const id of seven) result.current.addQuickPick(id);
    });
    expect(result.current.quickPicks).toHaveLength(7);

    act(() => {
      result.current.addQuickPick("link");
    });
    // 8th is rejected — still 7 with original contents
    expect(result.current.quickPicks).toHaveLength(7);
    expect(result.current.quickPicks).not.toContain("link");
  });

  it("removes a pick and persists the removal", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
      result.current.addQuickPick("button");
    });
    act(() => {
      result.current.removeQuickPick("heading");
    });
    expect(result.current.quickPicks).toEqual(["button"]);
  });

  it("reorders picks by insert-shift semantics", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
      result.current.addQuickPick("button");
      result.current.addQuickPick("icon");
    });
    act(() => {
      result.current.reorderQuickPicks(0, 2);
    });
    expect(result.current.quickPicks).toEqual(["button", "icon", "heading"]);
  });

  it("drops unknown ids on read (catalog drift safety)", () => {
    localStorage.setItem(
      "aqb-build-quick-picks-v2",
      JSON.stringify(["heading", "deleted-element", "button"])
    );
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    expect(result.current.quickPicks).toEqual(["heading", "button"]);
  });

  it("migrates from legacy v1 key and deletes it", () => {
    localStorage.setItem("aqb-build-quick-picks", JSON.stringify(["heading", "button"]));
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    expect(result.current.quickPicks).toEqual(["heading", "button"]);
    expect(localStorage.getItem("aqb-build-quick-picks")).toBeNull();
    expect(JSON.parse(localStorage.getItem("aqb-build-quick-picks-v2") ?? "[]")).toEqual([
      "heading",
      "button",
    ]);
  });
});

describe("useBuildTab — Quick Picks restore (Undo)", () => {
  it("restores a removed pick at its original index, preserving order", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
      result.current.addQuickPick("button");
      result.current.addQuickPick("icon");
    });
    // Remove the middle one
    act(() => {
      result.current.removeQuickPick("button");
    });
    expect(result.current.quickPicks).toEqual(["heading", "icon"]);
    // Restore at original index (1)
    act(() => {
      result.current.restoreQuickPick("button", 1);
    });
    expect(result.current.quickPicks).toEqual(["heading", "button", "icon"]);
  });

  it("clamps an out-of-bounds restore index", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
      result.current.addQuickPick("button");
    });
    act(() => {
      result.current.removeQuickPick("heading");
    });
    // Restore with a huge index — clamped to end
    act(() => {
      result.current.restoreQuickPick("heading", 999);
    });
    expect(result.current.quickPicks).toEqual(["button", "heading"]);
  });

  it("no-ops when restoring a blockId that is already pinned", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
      result.current.addQuickPick("button");
    });
    // Spam-click Undo — blockId already present, should no-op
    act(() => {
      result.current.restoreQuickPick("heading", 0);
    });
    expect(result.current.quickPicks).toEqual(["heading", "button"]);
  });

  it("evicts the oldest pin when restoring into a full slate", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    const seven = ["heading", "paragraph", "button", "icon", "divider", "spacer", "label"];
    act(() => {
      for (const id of seven) result.current.addQuickPick(id);
    });
    // Remove one so we can restore later
    act(() => {
      result.current.removeQuickPick("button");
    });
    // Fill the empty slot with a different block so the list is full again
    act(() => {
      result.current.addQuickPick("link");
    });
    expect(result.current.quickPicks).toHaveLength(7);

    // Now restore "button" at its original index — oldest ("heading") evicted
    act(() => {
      result.current.restoreQuickPick("button", 2);
    });
    expect(result.current.quickPicks).toHaveLength(7);
    expect(result.current.quickPicks).toContain("button");
    expect(result.current.quickPicks).not.toContain("heading");
  });

  it("ignores restore of unknown blockIds", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined), { wrapper });
    act(() => {
      result.current.addQuickPick("heading");
    });
    act(() => {
      result.current.restoreQuickPick("nonexistent-block", 0);
    });
    expect(result.current.quickPicks).toEqual(["heading"]);
  });
});
