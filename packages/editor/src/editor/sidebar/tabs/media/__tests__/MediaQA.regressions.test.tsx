/**
 * Three bugs a live walk of the Media drawer found that nothing else did.
 *
 * Each one passed a unit suite, a probe render and an eyeball before it was
 * caught by driving the real app, so each gets a test shaped like the failure
 * rather than like the code.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { SlimLauncher } from "../components/SlimLauncher";
import { useSelectionState } from "../hooks/useSelectionState";
import type { LibraryItem } from "../data/mediaTypes";

const ITEM: LibraryItem = {
  key: "a1",
  name: "hero.jpg",
  type: "img",
  src: "data:image/png;base64,",
  size: 1000,
  createdAt: "2026-08-01T00:00:00.000Z",
  mimeType: "image/jpeg",
};

function drawer(over: Partial<React.ComponentProps<typeof SlimLauncher>> = {}) {
  return render(
    <ToastProvider>
      <SlimLauncher
        composer={null as never}
        libraryItems={[]}
        activeTypes={new Set()}
        counts={{ all: 4, img: 4, vid: 0, ico: 0, fnt: 0 }}
        searchQuery="logo dark"
        storage={{ used: 0, total: 1e9 }}
        uploadQueue={[]}
        usageMap={new Map()}
        onInsert={vi.fn()}
        onToggleType={vi.fn()}
        onSearchChange={vi.fn()}
        onUpload={vi.fn()}
        onRetryUpload={vi.fn()}
        onOpenStock={vi.fn()}
        onOpenLibrary={vi.fn()}
        onClose={vi.fn()}
        {...over}
      />
    </ToastProvider>,
  );
}

describe("a fruitless search is not an empty library (board 782:4353)", () => {
  // useLibraryState hands the drawer an ALREADY-filtered list, so a search
  // matching nothing arrives as `libraryItems: []`. Testing that list's length
  // told the drawer the account was empty, and it rendered "No images or files
  // yet." over a library with four files in it.
  it("shows no-results while the library still has assets", () => {
    drawer({ libraryItems: [] });
    expect(screen.getByTestId("media-no-results")).toBeInTheDocument();
    expect(screen.queryByTestId("media-empty")).toBeNull();
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it("shows the empty library only when the library really is empty", () => {
    drawer({ libraryItems: [], counts: { all: 0, img: 0, vid: 0, ico: 0, fnt: 0 }, searchQuery: "" });
    expect(screen.getByTestId("media-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("media-no-results")).toBeNull();
  });

  it("renders the grid when the search does match", () => {
    drawer({ libraryItems: [ITEM], searchQuery: "hero" });
    expect(screen.getByTestId("media-grid")).toBeInTheDocument();
  });
});

describe("the in-use check calls its engine method ON the manager", () => {
  /*
    `findByMediaSrc` was lifted out of `composer.elements` and called bare, so
    `this` was undefined and its `this.elements.values()` threw. That threw
    inside requestBulkDelete, so bulk Delete opened NO confirm modal and the
    warning that guards deleting a referenced asset never ran. This fake fails
    the same way if the method is ever detached again.
  */
  function fakeComposer() {
    const manager = {
      elements: new Map([["e1", { src: "data:image/png;base64," }]]),
      findByMediaSrc(src: string) {
        // Deliberately `this`-dependent, like the real ElementManager.
        return [...this.elements.values()].filter((e: { src: string }) => e.src === src);
      },
    };
    return {
      elements: manager,
      media: { getAsset: (k: string) => (k === "a1" ? ITEM : null) },
    } as never;
  }

  it("counts an in-use asset instead of throwing", () => {
    const { result } = renderHook(() => useSelectionState(fakeComposer(), [ITEM]));
    act(() => result.current.requestBulkDelete([ITEM]));
    expect(result.current.confirmDelete).not.toBeNull();
    expect(result.current.confirmDelete?.inUseCount).toBe(1);
  });

  it("still opens the confirmation when the engine lacks the method", () => {
    const composer = { elements: {}, media: { getAsset: () => ITEM } } as never;
    const { result } = renderHook(() => useSelectionState(composer, [ITEM]));
    act(() => result.current.requestBulkDelete([ITEM]));
    expect(result.current.confirmDelete?.inUseCount).toBe(0);
  });
});
