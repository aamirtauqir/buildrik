// @vitest-environment jsdom
/**
 * useElementsState.test.tsx — the Elements-tab state machine: recent tracking
 * (dedupe + MAX_RECENT cap + persistence), favorites toggle, tip dismissal,
 * category expand/remap, search filtering, and category ordering/filtering.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { getBlockDefinitions } from "@/blocks/blockRegistry";
import type { BlockData } from "@/shared/types";
import { MAX_RECENT } from "@/shared/constants/ui";
import {
  RECENT_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  TIP_DISMISSED_KEY,
  EXPANDED_CATEGORY_KEY,
  MOST_USED_IDS,
} from "../constants";
import { useElementsState } from "../useElementsState";

const { addToastMock, trackSidebarMock } = vi.hoisted(() => ({
  addToastMock: vi.fn(),
  trackSidebarMock: vi.fn(),
}));

vi.mock("@/editor/shared/vibcoder", () => ({
  useToast: () => ({ addToast: addToastMock }),
}));
vi.mock("@/shared/utils/sidebarAnalytics", () => ({
  trackSidebar: trackSidebarMock,
}));

const ALL_IDS = getBlockDefinitions().map((b) => b.id);
const block = (id: string): BlockData =>
  (getBlockDefinitions().find((b) => b.id === id) as unknown as BlockData);

function setup(props: Partial<Parameters<typeof useElementsState>[0]> = {}) {
  return renderHook(() =>
    useElementsState({
      searchQuery: "",
      categoryFilter: undefined,
      onBlockClick: undefined,
      ...props,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  addToastMock.mockClear();
  trackSidebarMock.mockClear();
});

describe("useElementsState — initial state", () => {
  it("defaults the expanded category to Most Used", () => {
    const { result } = setup();
    expect(result.current.expandedCategory).toBe("Most Used");
  });

  it("shows the tip when it has never been dismissed", () => {
    const { result } = setup();
    expect(result.current.showTip).toBe(true);
  });

  it("hides the tip when the dismissed flag is already set", () => {
    localStorage.setItem(TIP_DISMISSED_KEY, "true");
    const { result } = setup();
    expect(result.current.showTip).toBe(false);
  });

  it("restores recents + favorites from localStorage", () => {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(["button"]));
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(["card"]));
    const { result } = setup();
    expect(result.current.recentIds).toEqual(["button"]);
    expect(result.current.favorites).toEqual(["card"]);
    expect(result.current.isFavorite("card")).toBe(true);
  });

  it("survives corrupt persisted JSON without throwing", () => {
    localStorage.setItem(RECENT_STORAGE_KEY, "{not-json");
    const { result } = setup();
    expect(result.current.recentIds).toEqual([]);
  });
});

describe("useElementsState — categories + remap", () => {
  it("puts every MOST_USED id into the Most Used bucket", () => {
    const { result } = setup();
    const mostUsedIds = result.current.filtered["Most Used"].map((b) => b.id);
    for (const id of MOST_USED_IDS) expect(mostUsedIds).toContain(id);
  });

  it("remaps Sections/Components/Ecommerce blocks into Advanced", () => {
    const { result } = setup();
    // No raw 'Sections'/'Components'/'Ecommerce' bucket survives the remap.
    expect(result.current.filtered).not.toHaveProperty("Sections");
    expect(result.current.filtered).not.toHaveProperty("Components");
    expect(result.current.filtered.Advanced?.length ?? 0).toBeGreaterThan(0);
  });

  it("orders categories by the canonical NEW_CATEGORY_ORDER", () => {
    const { result } = setup();
    const cats = result.current.sortedCategories;
    expect(cats[0]).toBe("Most Used");
    // Layout precedes Basic precedes Advanced in the canonical order.
    const idx = (c: string) => cats.indexOf(c);
    if (idx("Layout") >= 0 && idx("Basic") >= 0) {
      expect(idx("Layout")).toBeLessThan(idx("Basic"));
    }
    if (idx("Basic") >= 0 && idx("Advanced") >= 0) {
      expect(idx("Basic")).toBeLessThan(idx("Advanced"));
    }
  });

  it("respects a comma-separated categoryFilter", () => {
    const { result } = setup({ categoryFilter: "Layout, Media" });
    expect(result.current.sortedCategories.sort()).toEqual(["Layout", "Media"]);
  });
});

describe("useElementsState — search filtering", () => {
  it("filters blocks by label/id substring and drops empty buckets", () => {
    const { result } = setup({ searchQuery: "button" });
    const flat = Object.values(result.current.filtered).flat().map((b) => b.id);
    expect(flat.length).toBeGreaterThan(0);
    expect(flat.every((id) => id.includes("button") || block(id)?.label?.toLowerCase().includes("button"))).toBe(true);
  });

  it("returns no categories for a query that matches nothing", () => {
    const { result } = setup({ searchQuery: "zzz-nonexistent-zzz" });
    expect(Object.keys(result.current.filtered)).toHaveLength(0);
    expect(result.current.sortedCategories).toHaveLength(0);
  });
});

describe("useElementsState — favorites", () => {
  it("toggles a favorite on and off + persists", () => {
    const { result } = setup();
    act(() => result.current.toggleFavorite("card"));
    expect(result.current.isFavorite("card")).toBe(true);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual(["card"]);

    act(() => result.current.toggleFavorite("card"));
    expect(result.current.isFavorite("card")).toBe(false);
    expect(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual([]);
  });

  it("stops event propagation when toggling from a card", () => {
    const { result } = setup();
    const stopPropagation = vi.fn();
    act(() =>
      result.current.toggleFavorite("card", {
        stopPropagation,
      } as unknown as React.MouseEvent),
    );
    expect(stopPropagation).toHaveBeenCalled();
  });

  it("maps favorite ids to real block objects", () => {
    const { result } = setup();
    act(() => result.current.toggleFavorite("card"));
    expect(result.current.favoriteBlocks.map((b) => b.id)).toContain("card");
  });
});

describe("useElementsState — tip + category expand", () => {
  it("dismissTip flips the flag and persists", () => {
    const { result } = setup();
    act(() => result.current.dismissTip());
    expect(result.current.showTip).toBe(false);
    expect(localStorage.getItem(TIP_DISMISSED_KEY)).toBe("true");
  });

  it("toggleCategory collapses the active one and expands a new one", () => {
    const { result } = setup();
    // Collapsing the already-open Most Used clears the selection.
    act(() => result.current.toggleCategory("Most Used"));
    expect(result.current.expandedCategory).toBe("");
    // Opening a different one selects it + persists.
    act(() => result.current.toggleCategory("Layout"));
    expect(result.current.expandedCategory).toBe("Layout");
    expect(localStorage.getItem(EXPANDED_CATEGORY_KEY)).toBe("Layout");
  });
});

describe("useElementsState — recent tracking via handleClick", () => {
  it("adds a clicked block to recents, toasts, and tracks analytics", () => {
    const onBlockClick = vi.fn();
    const { result } = setup({ onBlockClick });
    act(() => result.current.handleClick(block("heading")));

    expect(result.current.recentIds[0]).toBe("heading");
    expect(result.current.recentBlocks[0]?.id).toBe("heading");
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(addToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success" }),
    );
    expect(trackSidebarMock).toHaveBeenCalledWith(
      "element_insert",
      expect.objectContaining({ element_type: "heading", source: "click" }),
    );
  });

  it("de-duplicates a re-clicked block to the front without growing the list", () => {
    const { result } = setup();
    act(() => result.current.handleClick(block("heading")));
    act(() => result.current.handleClick(block("button")));
    act(() => result.current.handleClick(block("heading")));
    expect(result.current.recentIds).toEqual(["heading", "button"]);
  });

  it("caps recents at MAX_RECENT most-recent-first", () => {
    const ids = ALL_IDS.slice(0, MAX_RECENT + 3);
    const { result } = setup();
    for (const id of ids) act(() => result.current.handleClick(block(id)));
    expect(result.current.recentIds).toHaveLength(MAX_RECENT);
    // Most recent click sits at the head.
    expect(result.current.recentIds[0]).toBe(ids[ids.length - 1]);
    // Persisted list mirrors state.
    expect(JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY)!)).toHaveLength(MAX_RECENT);
  });
});

describe("useElementsState — handleDragStart", () => {
  it("writes the block payload to the dataTransfer and records a recent", () => {
    const { result } = setup();
    const setData = vi.fn();
    const evt = {
      dataTransfer: { effectAllowed: "", setData, setDragImage: vi.fn() },
    } as unknown as React.DragEvent;

    act(() => result.current.handleDragStart(evt, block("image")));

    expect(evt.dataTransfer.effectAllowed).toBe("copy");
    expect(setData).toHaveBeenCalledWith("text/plain", "image");
    const blockPayload = setData.mock.calls.find((c) => c[0] === "block");
    expect(blockPayload).toBeDefined();
    expect(JSON.parse(blockPayload![1]).id).toBe("image");
    expect(result.current.recentIds).toContain("image");
  });
});
