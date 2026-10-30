/**
 * design-2l9 139:48427 / 139:49184 / 139:49899 / 142:52543 — a bulk delete
 * reports only what really happened: the homepage kept by the guard, a page
 * the engine refused kept (selected, retryable), the rest deleted.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const addToastMock = vi.fn();
vi.mock("@/editor/chrome-ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/editor/chrome-ui")>()),
  useToast: () => ({ addToast: addToastMock, removeToast: vi.fn(), toasts: [] }),
}));

import { useBulkDelete } from "../useBulkDelete";
import { useBulkSelect } from "../useBulkSelect";
import type { DeletePagesOptions, DeletePagesResult } from "../usePages";
import type { PageItem } from "../types";

const page = (id: string, name: string, isHome = false) => ({ id, name, isHome }) as PageItem;
const PAGES = [page("home", "Home", true), page("about", "About"), page("work", "Work"), page("contact", "Contact")];

function setup(refuse: Set<string>) {
  let live = [...PAGES];
  let undone: (() => void) | undefined;
  const deletePages = vi.fn((ids: string[], o?: DeletePagesOptions): DeletePagesResult => {
    const r = { deleted: ids.filter((id) => !refuse.has(id)), failed: ids.filter((id) => refuse.has(id)) };
    live = live.filter((p) => !r.deleted.includes(p.id));
    if (r.deleted.length) addToastMock({ description: o?.describe?.(r) });
    undone = o?.onUndone;
    return r;
  });
  const hook = renderHook(() => {
    const bulk = useBulkSelect();
    return { bulk, bd: useBulkDelete({ pages: live, orderedPageIds: PAGES.map((p) => p.id), bulk, deletePage: vi.fn(), deletePages }) };
  });
  const select = (...ids: string[]) => act(() => ids.forEach((id) => hook.result.current.bulk.toggleSelect(id)));
  return { hook, select, deletePages, undo: () => act(() => undone?.()) };
}

beforeEach(() => addToastMock.mockClear());

describe("useBulkDelete", () => {
  it("keeps the homepage, reports a refused page as failed and keeps it selected (139:48427)", () => {
    const { hook, select, deletePages } = setup(new Set(["work"]));
    select("home", "about", "work");
    act(() => hook.result.current.bd.request());
    expect(hook.result.current.bd.confirmIds).toEqual(["about", "work"]);
    act(() => hook.result.current.bd.confirm());
    expect(deletePages).toHaveBeenCalledWith(["about", "work"], expect.anything());
    expect(addToastMock.mock.calls.at(-1)?.[0].description).toBe("About deleted. Home and Work are still available.");
    const r = hook.result.current.bd.report!;
    expect(r.title).toBe("1 deleted · 1 kept · 1 failed");
    expect(r.lines.map((l) => `${l.name} — ${l.text}`)).toEqual([
      "About — deleted",
      "Home — kept; it is the homepage",
      "Work — delete failed; page kept",
    ]);
    expect(r.retry?.label).toBe("Retry delete Work");
    expect([...hook.result.current.bulk.selectedIds]).toEqual(["work"]);
  });

  it("Undo turns the card into what was restored (139:49184)", () => {
    const { hook, select, undo } = setup(new Set(["work"]));
    select("home", "about", "work");
    act(() => hook.result.current.bd.request());
    act(() => hook.result.current.bd.confirm());
    undo();
    const r = hook.result.current.bd.report!;
    expect(r.title).toBe("About restored");
    expect(r.lines.map((l) => `${l.name} — ${l.text}`)).toEqual([
      "About — restored with its URL and settings",
      "Home — unchanged",
      "Work — still available; deletion failed",
    ]);
    expect(r.retry).toBeNull();
    expect(addToastMock.mock.calls.at(-1)?.[0].description).toBe("About restored");
  });

  it("retry deletes only the failed page (139:49899) and its Undo says what stays deleted (142:52543)", () => {
    const refuse = new Set(["work"]);
    const { hook, select, deletePages, undo } = setup(refuse);
    select("home", "about", "work");
    act(() => hook.result.current.bd.request());
    act(() => hook.result.current.bd.confirm());
    refuse.clear();
    act(() => hook.result.current.bd.retry());
    expect(deletePages).toHaveBeenLastCalledWith(["work"], expect.anything());
    const r = hook.result.current.bd.report!;
    expect(r.title).toBe("Work deleted");
    expect(r.lines.map((l) => `${l.name} — ${l.text}`)).toEqual([
      "Work — deleted after retry",
      "About — already deleted",
      "Home — kept; it is the homepage",
    ]);
    undo();
    expect(addToastMock.mock.calls.at(-1)?.[0].description).toBe("Work restored · About remains deleted");
  });

  it("a delete that took everything asked for shows no card", () => {
    const { hook, select } = setup(new Set());
    select("about", "work");
    act(() => hook.result.current.bd.request());
    act(() => hook.result.current.bd.confirm());
    expect(hook.result.current.bd.report).toBeNull();
  });
});
