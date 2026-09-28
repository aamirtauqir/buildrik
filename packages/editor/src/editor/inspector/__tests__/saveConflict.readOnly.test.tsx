// @vitest-environment jsdom
/**
 * Board 29 (Q4) end to end on the real provider + real ProInspector: a refused
 * save puts the status line up and the panel read-only; Resolve re-sends the
 * conflict (AquibraStudio's listener reopens ConflictModal); Overwrite
 * (`setBaselineLastEditedAt`) takes the line down.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { raiseSaveConflict, SAVE_CONFLICT_EVENT, setBaselineLastEditedAt } from "@/services/BuildrikSyncProvider";
import { ProInspector } from "../ProInspector";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(() => {
  cleanup();
  setBaselineLastEditedAt(null);
});

function mountHeading() {
  const c = createTestComposer();
  const root = c.elements.createPage("Home").root.id;
  const created = c.elements.createElement("heading" as never, { content: "Wood-fired pizza" } as never);
  c.elements.addElement(created, root);
  const el = c.elements.getElement(created.getId())!;
  c.selection.select(el);
  render(
    <ToastProvider>
      <ProInspector composer={c} selectedElement={{ id: el.getId(), type: el.getType(), tagName: el.getTagName() }} />
    </ToastProvider>,
  );
}

describe("Save conflict — board 29", () => {
  it("line + read-only while pending; Resolve re-sends the conflict; Overwrite clears it", () => {
    mountHeading();
    expect(screen.queryByTestId("inspector-status-line")).toBeNull();

    act(() => {
      raiseSaveConflict(new Error("SAVE_CONFLICT:2026-09-28T10:00:00.000Z"));
    });
    expect(screen.getByTestId("inspector-status-line").textContent).toContain(
      "This site changed elsewhere — resolve to keep editing",
    );
    expect(screen.getByTestId("inspector-panel").getAttribute("data-readonly")).toBe("true");

    const heard = vi.fn();
    window.addEventListener(SAVE_CONFLICT_EVENT, heard);
    try {
      fireEvent.click(screen.getByTestId("inspector-resolve"));
      expect(heard).toHaveBeenCalledTimes(1);
      expect((heard.mock.calls[0][0] as CustomEvent).detail).toEqual({ serverLastEditedAt: "2026-09-28T10:00:00.000Z" });
    } finally {
      window.removeEventListener(SAVE_CONFLICT_EVENT, heard);
    }

    act(() => setBaselineLastEditedAt("2026-09-28T10:00:00.000Z"));
    expect(screen.queryByTestId("inspector-status-line")).toBeNull();
    expect(screen.getByTestId("inspector-panel").getAttribute("data-readonly")).toBeNull();
  });
});
