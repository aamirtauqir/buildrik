/**
 * The session log behind History › Session's markers (2L9 H01): only real
 * page opens and the user's own clears.
 */
import { describe, it, expect, vi } from "vitest";
import {
  getHistorySessionMarkers,
  recordHistoryCleared,
  trackHistorySessionMarkers,
} from "../historySessionMarkers";

function fakeComposer() {
  const handlers = new Map<string, () => void>();
  const pages: Record<string, { id: string; name: string }> = {
    a: { id: "a", name: "Home" },
    b: { id: "b", name: "About" },
  };
  let active = pages.a;
  return {
    on: (ev: string, fn: () => void) => handlers.set(ev, fn),
    elements: { getActivePage: () => active },
    set(id: string) {
      active = pages[id];
      handlers.get("page:changed")?.();
    },
  };
}

describe("historySessionMarkers", () => {
  it("records the page open at start, and only pages still open once the task settles", async () => {
    vi.useFakeTimers();
    const c = fakeComposer();
    trackHistorySessionMarkers(c as never);
    trackHistorySessionMarkers(c as never); // idempotent
    // undo's re-import flips to the first page and back in one task
    c.set("b");
    c.set("a");
    await vi.runAllTimersAsync();
    expect(getHistorySessionMarkers(c as never).map((m) => m.kind === "page" && m.pageName)).toEqual(["Home"]);
    c.set("b");
    await vi.runAllTimersAsync();
    expect(getHistorySessionMarkers(c as never).map((m) => m.kind === "page" && m.pageName)).toEqual(["Home", "About"]);
    vi.useRealTimers();
  });

  it("a clear drops the earlier opens but keeps the page still open", async () => {
    vi.useFakeTimers();
    const c = fakeComposer();
    trackHistorySessionMarkers(c as never);
    c.set("b");
    await vi.runAllTimersAsync();
    recordHistoryCleared(c as never);
    const kinds = getHistorySessionMarkers(c as never).map((m) => (m.kind === "page" ? m.pageName : m.kind));
    expect(kinds).toEqual(["About", "cleared"]);
    vi.useRealTimers();
  });
});
