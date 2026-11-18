/**
 * D36: Brand may undo its own token edits with ⌘Z but never a canvas change
 * behind it. nextUndoTouchesOnly answers which kind the next undo is.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

let c: Composer;
/* Edits made within the 500 ms coalesce window merge into one history entry;
   a user's separate edits are seconds apart. */
beforeEach(() => {
  vi.useFakeTimers();
  c = createTestComposer();
  c.elements.createPage("Home");
});
afterEach(() => {
  vi.useRealTimers();
});
const settle = () => vi.advanceTimersByTime(2000);

/* A Brand edit as history sees it: a change to the history-scoped settings
   (tokens, dark mode). setDarkMode is the Brand Dark-mode switch. */
const settingsEdit = () => {
  c.beginTransaction("Brand edit");
  c.setProjectSettings({ ...c.getProjectSettings(), darkMode: c.getProjectSettings()?.darkMode === "auto" ? "off" : "auto" } as never);
  c.endTransaction();
  settle();
};
const canvasEdit = () => {
  const root = c.elements.getActivePage()!.root.id;
  c.beginTransaction("Add");
  const el = c.elements.createElement("text" as never, {} as never);
  c.elements.addElement(el, root);
  c.endTransaction();
  settle();
};

describe("HistoryManager.nextUndoTouchesOnly", () => {
  it("is true when the next undo changes only project settings", () => {
    canvasEdit();
    settingsEdit();
    expect(c.history.nextUndoTouchesOnly(["/settings/"])).toBe(true);
  });

  it("is false when the next undo changes the canvas", () => {
    settingsEdit();
    canvasEdit();
    expect(c.history.nextUndoTouchesOnly(["/settings/"])).toBe(false);
  });

  it("is true for a listed label whatever it touched", () => {
    c.beginTransaction("Connect to tokens");
    c.elements.addElement(c.elements.createElement("text" as never, {} as never), c.elements.getActivePage()!.root.id);
    c.endTransaction();
    expect(c.history.nextUndoTouchesOnly(["/settings/"], ["Connect to tokens"])).toBe(true);
  });

  it("is false with nothing to undo", () => {
    expect(c.history.nextUndoTouchesOnly(["/settings/"])).toBe(false);
  });
});
