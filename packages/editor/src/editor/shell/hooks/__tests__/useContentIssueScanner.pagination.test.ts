// @vitest-environment jsdom
/**
 * B-31 (D81 189:25985): a split Collection list whose `/page/k` lands on
 * another page's file is one blocking (error) issue — the publish gate
 * counts it; no collision, no issue.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const pagination = vi.hoisted(() => ({ listPagination: vi.fn() }));
vi.mock("@/engine/cms/listPages", () => pagination);
vi.mock("@buildrik/shared/content/contentIssues", () => ({ detectContentIssues: () => [] }));

import { useContentIssueScanner } from "../useContentIssueScanner";

function composer(bindings: Array<{ elementId: string; pages?: string }>) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    elements: { exportPages: () => [] },
    cms: { bindings: { getAllCollectionBindings: () => bindings } },
  };
}

describe("useContentIssueScanner — pagination collisions (B-31)", () => {
  it("a colliding split list gives one blocking issue", async () => {
    pagination.listPagination.mockResolvedValue({ paths: ["/", "/page/2"], collision: { path: "/page/2", pageId: "p-2" } });
    const c = composer([{ elementId: "list-1", pages: "split" }, { elementId: "list-2" }]);
    const { result } = renderHook(() => useContentIssueScanner(c as never));
    await waitFor(() => expect(result.current.issues).toHaveLength(1));
    expect(result.current.issues[0]).toEqual({
      id: "list-pages:list-1",
      type: "error",
      message: "/page/2 is already used by another page. Rename that page or turn off pagination.",
      elementId: "list-1",
    });
    expect(pagination.listPagination).toHaveBeenCalledTimes(1);
  });

  it("no collision gives no issue", async () => {
    pagination.listPagination.mockClear();
    pagination.listPagination.mockResolvedValue({ paths: ["/", "/page/2"], collision: null });
    const c = composer([{ elementId: "list-1", pages: "split" }]);
    const { result } = renderHook(() => useContentIssueScanner(c as never));
    await waitFor(() => expect(pagination.listPagination).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.issues).toEqual([]);
  });

  it("listens for binding and list-query changes, and stops on unmount", () => {
    const c = composer([]);
    const { unmount } = renderHook(() => useContentIssueScanner(c as never));
    const on = c.on.mock.calls.map((x) => x[0]);
    expect(on).toEqual(expect.arrayContaining(["cms:collection:bound", "cms:collection:unbound", "cms:list-query:changed"]));
    unmount();
    const off = c.off.mock.calls.map((x) => x[0]);
    expect(off).toEqual(expect.arrayContaining(["cms:collection:bound", "cms:collection:unbound", "cms:list-query:changed"]));
  });
});
