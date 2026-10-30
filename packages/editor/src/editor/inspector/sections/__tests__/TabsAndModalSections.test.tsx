// @vitest-environment jsdom
/**
 * B-21 / B-17 Inspector panels on the engine models (2L9 C01, C07, C18),
 * against a real Composer and the real Tabs / Modal blocks.
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";
import { readTabs } from "@/engine/widgets/tabsModel";
import { readModal } from "@/engine/widgets/modalModel";
import { TabsSection } from "../TabsSection";
import { DialogBehaviorSection, ModalRelationshipSection } from "../ModalSections";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function withBlock(id: string) {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const elId = insertBlock(c, getBlockById(id)!, page.root.id)!;
  return { c, elId };
}

describe("Tabs (C01)", () => {
  it("pairs, Edit panel selects the panel, Add tab adds a pair, Opens first writes the initial pair", () => {
    const { c, elId } = withBlock("tabs");
    const tabsId = c.elements.getElement(elId)!.getType() === "tabs" ? elId : c.elements.getElement(elId)!.getDescendants().find((d) => d.getType() === "tabs")!.getId();
    render(<TabsSection composer={c} elementId={tabsId} isOpen />);
    const before = readTabs(c, tabsId)!;
    expect(screen.getByTestId("tabs-pair-count")).toHaveTextContent(`${before.pairs.length} pairs`);
    expect(screen.getByText("Stable IDs · no pairing by label or position.")).toBeTruthy();
    fireEvent.click(screen.getByTestId(`tabs-edit-panel-${before.pairs[0].key}`));
    expect(c.selection.getSelected()?.getId()).toBe(before.pairs[0].panelId);
    act(() => {
      fireEvent.click(screen.getByTestId("tabs-add"));
    });
    expect(readTabs(c, tabsId)!.pairs).toHaveLength(before.pairs.length + 1);
    act(() => {
      fireEvent.change(screen.getByRole("combobox", { name: "Opens first" }), { target: { value: before.pairs[1].key } });
    });
    expect(readTabs(c, tabsId)!.initial).toBe(before.pairs[1].key);
  });
});

describe("Modal (C07 / C18)", () => {
  it("the trigger names its dialog and where both sit; Edit {dialog} selects the dialog; Duplicate modal adds a linked pair", () => {
    const { c, elId } = withBlock("modal");
    const triggerId = [elId, ...c.elements.getElement(elId)!.getDescendants().map((d) => d.getId())].find((id) => readModal(c, id)?.triggerIds.includes(id))!;
    const before = readModal(c, triggerId)!;
    render(
      <ToastProvider>
        <ModalRelationshipSection composer={c} elementId={triggerId} isOpen />
      </ToastProvider>
    );
    expect(screen.getByTestId("modal-placement")).toHaveTextContent(/Dialog is a direct child of Home\. Trigger is inside /);
    fireEvent.click(screen.getByTestId("modal-edit-dialog"));
    expect(c.selection.getSelected()?.getId()).toBe(before.dialogId);
    act(() => {
      fireEvent.click(screen.getByTestId("modal-duplicate"));
    });
    expect(screen.getByText("Modal duplicated")).toBeTruthy();
  });

  it("Dialog behavior writes Escape / backdrop / initial on the dialog", () => {
    const { c, elId } = withBlock("modal");
    const triggerId = [elId, ...c.elements.getElement(elId)!.getDescendants().map((d) => d.getId())].find((id) => readModal(c, id)?.triggerIds.includes(id))!;
    const { dialogId } = readModal(c, triggerId)!;
    render(<DialogBehaviorSection composer={c} elementId={dialogId} isOpen />);
    act(() => {
      fireEvent.click(screen.getByRole("checkbox", { name: "Close on Escape" }));
    });
    expect(readModal(c, dialogId)!.behavior.escape).toBe(false);
    act(() => {
      fireEvent.change(screen.getByRole("combobox", { name: "Initial state" }), { target: { value: "open" } });
    });
    expect(readModal(c, dialogId)!.behavior.initial).toBe("open");
  });
});
