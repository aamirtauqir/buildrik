/**
 * REQUESTS #13 — a folder move is one undo step on the editor's history, and
 * the receipt's Undo is bound to it (boards 127:38819 / 127:40244 / 131:41086).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "@/engine/__tests__/test-utils/realComposer";
import { movePagesWithHistory } from "../folderHistory";
import { TOP_LEVEL } from "../components/MovePagesDialog";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());

/* The folder store's three moves over a plain map, as useFolders keeps them. */
function folders(initial: Record<string, string>) {
  const pageToFolder = new Map(Object.entries(initial));
  return {
    pageToFolder,
    movePageToFolder: (id: string, to: string) => void pageToFolder.set(id, to),
    removePageFromFolder: (id: string) => void pageToFolder.delete(id),
  };
}

describe("movePagesWithHistory", () => {
  it("moves, and the receipt's Undo puts every page back where it was", () => {
    const c = createTestComposer();
    const f = folders({ legal: "studio" });
    const undo = movePagesWithHistory(c, f, ["about", "legal"], "client", "2 pages moved to Client projects");
    expect([f.pageToFolder.get("about"), f.pageToFolder.get("legal")]).toEqual(["client", "client"]);
    expect(undo?.()).toBe(true);
    expect([f.pageToFolder.has("about"), f.pageToFolder.get("legal")]).toEqual([false, "studio"]);
    expect(c.history.redo()).toBe(true);
    expect(f.pageToFolder.get("about")).toBe("client");
  });

  it("back to the top level is undoable too, and ⌘Z reaches it", () => {
    const c = createTestComposer();
    const f = folders({ about: "studio" });
    movePagesWithHistory(c, f, ["about"], TOP_LEVEL, "About removed from Studio");
    expect(f.pageToFolder.has("about")).toBe(false);
    expect(c.history.undo()).toBe(true);
    expect(f.pageToFolder.get("about")).toBe("studio");
  });

  it("the Undo refuses once a newer step is on top", () => {
    const c = createTestComposer();
    const f = folders({});
    const undo = movePagesWithHistory(c, f, ["about"], "studio", "About moved to Studio");
    movePagesWithHistory(c, f, ["work"], "studio", "Work moved to Studio");
    expect(undo?.()).toBe(false);
    expect(f.pageToFolder.get("about")).toBe("studio");
  });

  it("without a history it still moves and offers no Undo", () => {
    const f = folders({});
    expect(movePagesWithHistory(null, f, ["about"], "studio", "x")).toBeNull();
    expect(f.pageToFolder.get("about")).toBe("studio");
  });
});
