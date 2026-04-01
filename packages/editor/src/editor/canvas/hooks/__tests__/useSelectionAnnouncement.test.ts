/**
 * Tests for useSelectionAnnouncement (WCAG 4.1.3)
 * Verifies that screen-reader announcements are emitted correctly
 * when canvas selection changes.
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Composer } from "../../../../engine";
import { useSelectionAnnouncement } from "../useSelectionAnnouncement";

// Minimal Composer mock — only elements.getElement is needed
const makeComposer = (typeMap: Record<string, string> = {}): Composer =>
  ({
    elements: {
      getElement: vi.fn((id: string) => (id in typeMap ? { getType: () => typeMap[id] } : null)),
    },
  }) as unknown as Composer;

describe("useSelectionAnnouncement", () => {
  it("produces no announcement when nothing is selected on mount", () => {
    const { result } = renderHook(() =>
      useSelectionAnnouncement({
        composer: makeComposer(),
        selectedId: null,
        selectedIds: [],
      })
    );

    expect(result.current).toBe("");
  });

  it("announces the element type when a single element is selected", () => {
    const composer = makeComposer({ "el-1": "button" });

    const { result } = renderHook(() =>
      useSelectionAnnouncement({
        composer,
        selectedId: "el-1",
        selectedIds: ["el-1"],
      })
    );

    expect(result.current).toBe("Selected: button");
  });

  it("falls back to 'element' when getType is unavailable", () => {
    const composerWithNoType = {
      elements: {
        getElement: vi.fn(() => null),
      },
    } as unknown as Composer;

    const { result } = renderHook(() =>
      useSelectionAnnouncement({
        composer: composerWithNoType,
        selectedId: "el-unknown",
        selectedIds: ["el-unknown"],
      })
    );

    expect(result.current).toBe("Selected: element");
  });

  it("announces count when multiple elements are selected", () => {
    const { result } = renderHook(() =>
      useSelectionAnnouncement({
        composer: makeComposer({ "el-1": "div", "el-2": "p", "el-3": "span" }),
        selectedId: "el-1",
        selectedIds: ["el-1", "el-2", "el-3"],
      })
    );

    expect(result.current).toBe("Selected 3 elements");
  });

  it("announces 'Selection cleared' when transitioning from selected to nothing", () => {
    const composer = makeComposer({ "el-1": "text" });

    const { result, rerender } = renderHook(
      ({ selectedId, selectedIds }: { selectedId: string | null; selectedIds: string[] }) =>
        useSelectionAnnouncement({ composer, selectedId, selectedIds }),
      {
        initialProps: {
          selectedId: "el-1" as string | null,
          selectedIds: ["el-1"],
        },
      }
    );

    // Confirm element is announced first
    expect(result.current).toBe("Selected: text");

    // Now clear the selection
    act(() => {
      rerender({ selectedId: null, selectedIds: [] });
    });

    expect(result.current).toBe("Selection cleared");
  });

  it("does not re-announce when selection state is unchanged", () => {
    const composer = makeComposer({ "el-1": "image" });
    let renderCount = 0;

    const { result, rerender } = renderHook(
      ({ selectedId, selectedIds }: { selectedId: string | null; selectedIds: string[] }) => {
        renderCount++;
        return useSelectionAnnouncement({ composer, selectedId, selectedIds });
      },
      { initialProps: { selectedId: "el-1", selectedIds: ["el-1"] } }
    );

    const firstAnnouncement = result.current;
    expect(firstAnnouncement).toBe("Selected: image");

    // Trigger a rerender with identical selection — announcement must not change
    act(() => {
      rerender({ selectedId: "el-1", selectedIds: ["el-1"] });
    });

    expect(result.current).toBe(firstAnnouncement);
    // renderCount confirms the hook did re-run but the state did NOT update
    expect(renderCount).toBeGreaterThan(1);
  });

  it("updates from single to multi-select correctly", () => {
    const composer = makeComposer({ "el-1": "container" });

    const { result, rerender } = renderHook(
      ({ selectedId, selectedIds }: { selectedId: string | null; selectedIds: string[] }) =>
        useSelectionAnnouncement({ composer, selectedId, selectedIds }),
      { initialProps: { selectedId: "el-1", selectedIds: ["el-1"] } }
    );

    expect(result.current).toBe("Selected: container");

    act(() => {
      rerender({ selectedId: "el-1", selectedIds: ["el-1", "el-2"] });
    });

    expect(result.current).toBe("Selected 2 elements");
  });
});
