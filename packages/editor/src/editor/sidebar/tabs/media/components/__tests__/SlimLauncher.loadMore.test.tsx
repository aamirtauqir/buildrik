/**
 * Board `144:2` → `Load more` (1311:11). The drawer says how much of the server
 * library it is showing, and offers the rest.
 *
 * `media.listAssets` has always paged — the service over-fetches by one and
 * returns `{ items, nextCursor, total }`. Nothing in the editor ever asked for
 * page two: `loadServerMedia` sent `limit: 200` and threw `nextCursor` away
 * under a comment saying the UI could paginate "once user opens MediaTab". So a
 * library past 200 showed 200, silently, and the grid, the picker and
 * replace-across-site all read the same truncated set.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SlimLauncher } from "../SlimLauncher";
import type { LibraryItem } from "../../data/mediaTypes";

function items(n: number): LibraryItem[] {
  return Array.from({ length: n }, (_, i) => ({
    key: `a${i}`,
    id: `a${i}`,
    name: `asset-${i}`,
    type: "image",
    src: `https://example.test/${i}.png`,
    bucket: "image",
    size: 1024,
    createdAt: new Date(0).toISOString(),
  })) as unknown as LibraryItem[];
}

function mount(over: Record<string, unknown> = {}) {
  const onLoadMore = vi.fn();
  const props = {
    composer: null,
    libraryItems: items(3),
    activeTypes: new Set<string>(),
    counts: {},
    searchQuery: "",
    storage: { used: 0, total: 1000 },
    uploadQueue: [],
    usageMap: new Map(),
    appliedAssetKey: undefined,
    onInsert: vi.fn(),
    onToggleType: vi.fn(),
    onSearchChange: vi.fn(),
    onExpand: vi.fn(),
    statusPill: null,
    onDismissStatusPill: vi.fn(),
    onUpload: vi.fn(),
    onOpenStock: vi.fn(),
    loading: false,
    loadError: null,
    onRetryLoad: vi.fn(),
    currentFolderId: null,
    allFolders: [],
    onFolderChange: vi.fn(),
    onLoadMore,
    ...over,
  };
  render(<SlimLauncher {...(props as unknown as React.ComponentProps<typeof SlimLauncher>)} />);
  return { onLoadMore };
}

describe("SlimLauncher — Load more", () => {
  it("says nothing when the library is entirely on screen", () => {
    mount({ serverPage: { nextCursor: null, total: 3, loaded: 3 } });
    expect(screen.queryByTestId("media-load-more-row")).toBeNull();
  });

  it("says nothing before the first page has landed", () => {
    mount({ serverPage: null });
    expect(screen.queryByTestId("media-load-more-row")).toBeNull();
  });

  /* The count is the honest half: a "Load more" with no number tells the user
     there is more, not how much they cannot see. */
  it("names what is shown AND what exists", () => {
    mount({ serverPage: { nextCursor: "cur-1", total: 412, loaded: 3 } });
    expect(screen.getByTestId("media-shown-count").textContent).toBe("Showing 3 of 412");
  });

  /* The row compares what has been PULLED against the server's total. The
     filters — type pills, folder, search — run on the client over whatever has
     been pulled, so comparing the FILTERED list against a server-wide count
     asks two different questions: with a video filter on a 412-asset library it
     read "Showing 3 of 412", and a search that matched nothing read
     "Showing 0 of 412" beside the no-results state. */
  it("counts what was pulled, not what survived the filters", () => {
    mount({ serverPage: { nextCursor: "cur-1", total: 412, loaded: 200 }, libraryItems: items(3) });
    expect(screen.getByTestId("media-shown-count").textContent).toBe("Showing 200 of 412");
  });

  it("stays quiet when everything on the server is already pulled, however it is filtered", () => {
    mount({ serverPage: { nextCursor: null, total: 200, loaded: 200 }, libraryItems: items(3) });
    expect(screen.queryByTestId("media-load-more-row")).toBeNull();
  });

  it("asks for the next page when pressed", () => {
    const { onLoadMore } = mount({ serverPage: { nextCursor: "cur-1", total: 412, loaded: 3 } });
    fireEvent.click(screen.getByTestId("media-load-more"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("cannot be pressed twice while a page is in flight", () => {
    const { onLoadMore } = mount({ serverPage: { nextCursor: "cur-1", total: 412, loaded: 3 }, loadingMore: true });
    const btn = screen.getByTestId("media-load-more");
    expect(btn.textContent).toBe("Loading…");
    fireEvent.click(btn);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  /* A failed page is offered again in place rather than as a toast: the thing
     that failed is on screen, and so is the retry. */
  it("offers the failed page again in place", () => {
    mount({ serverPage: { nextCursor: "cur-1", total: 412, loaded: 3 }, loadMoreError: true });
    expect(screen.getByTestId("media-load-more").textContent).toBe("Try again");
  });

  /* total > shown, but no cursor: the count is still worth showing and the
     button must not fire a request it cannot make. */
  it("shows the count but refuses the press when there is no cursor", () => {
    const { onLoadMore } = mount({ serverPage: { nextCursor: null, total: 412, loaded: 3 } });
    expect(screen.getByTestId("media-shown-count").textContent).toBe("Showing 3 of 412");
    fireEvent.click(screen.getByTestId("media-load-more"));
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

describe("SlimLauncher — search scope", () => {
  /* Board `145:2` → `Search scope` (1313:11). The scope is only a QUESTION when
     the library is not fully loaded — every filter in this drawer runs on the
     client over what has been pulled, so a query used to reach 200 of 412
     assets and report "Nothing matches" about a file that exists. */
  it("says the query covers the whole library while one is running", () => {
    mount({ serverPage: { nextCursor: "c1", total: 412, loaded: 200 }, searchQuery: "logo", searchState: "searching" });
    expect(screen.getByTestId("media-search-scope").textContent).toBe("Searching all 412 items…");
  });

  it("keeps saying so after the request settles, because the SCOPE has not changed", () => {
    mount({ serverPage: { nextCursor: "c1", total: 412, loaded: 200 }, searchQuery: "logo", searchState: "whole" });
    expect(screen.getByTestId("media-search-scope").textContent).toBe("Searching all 412 items");
  });

  it("says nothing when the whole library is already local", () => {
    mount({ serverPage: { nextCursor: null, total: 200, loaded: 200 }, searchQuery: "logo" });
    expect(screen.queryByTestId("media-search-scope")).toBeNull();
  });

  /* One character is a keystroke, not a query — the hook does not go to the
     server for it, so the drawer must not claim it did. */
  it("says nothing for a single character", () => {
    mount({ serverPage: { nextCursor: "c1", total: 412, loaded: 200 }, searchQuery: "l" });
    expect(screen.queryByTestId("media-search-scope")).toBeNull();
  });

  it("says nothing with no query at all", () => {
    mount({ serverPage: { nextCursor: "c1", total: 412, loaded: 200 }, searchQuery: "" });
    expect(screen.queryByTestId("media-search-scope")).toBeNull();
  });
});

describe("SlimLauncher — the scope line only claims what happened", () => {
  const paged = { nextCursor: "c1", total: 412, loaded: 200 };

  it("says the search itself was cut, rather than repeating the whole-library claim", () => {
    mount({ serverPage: paged, searchQuery: "logo", searchState: "truncated" });
    expect(screen.getByTestId("media-search-scope").textContent)
      .toBe("First 200 matches — narrow the search to see more");
  });

  /* Silence here is the original bug: "Nothing matches" for a file that is on
     the server, under a line saying the whole library was searched. */
  it("says the server leg failed, and marks it as an error", () => {
    mount({ serverPage: paged, searchQuery: "logo", searchState: "failed" });
    const el = screen.getByTestId("media-search-scope");
    /* One line. Two lines of error copy in a 320 drawer pushed the footer off
       board `782:4353` entirely — the panel is a fixed height. */
    expect(el.textContent).toBe("Couldn't reach the rest of your library");
    expect(el.className).toMatch(/text-red-700/);
  });

  it("does not paint the ordinary case as an error", () => {
    mount({ serverPage: paged, searchQuery: "logo", searchState: "whole" });
    expect(screen.getByTestId("media-search-scope").className).not.toMatch(/text-red-700/);
  });

  /* The line is keyed on the PAGING position, not on how many assets happen to
     be local — a search that imported 60 hits must not make the drawer think
     the library is fully pulled. */
  it("keeps showing while paging is behind, whatever a search imported", () => {
    mount({ serverPage: { nextCursor: "c1", total: 412, loaded: 200 }, searchQuery: "logo", searchState: "whole" });
    expect(screen.getByTestId("media-search-scope")).toBeTruthy();
    expect(screen.getByTestId("media-shown-count").textContent).toBe("Showing 200 of 412");
  });
});
