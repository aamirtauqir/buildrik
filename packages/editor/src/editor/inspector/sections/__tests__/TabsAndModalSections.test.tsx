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
import { TabPanelSection, TabsBehaviorSection, TabsSection } from "../TabsSection";
import { DialogBehaviorSection, DialogContentSection, ModalRelationshipSection } from "../ModalSections";

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
  it("pairs, Edit panel selects the panel, Add tab adds a pair", () => {
    const { c, elId } = withBlock("tabs");
    const tabsId = c.elements.getElement(elId)!.getType() === "tabs" ? elId : c.elements.getElement(elId)!.getDescendants().find((d) => d.getType() === "tabs")!.getId();
    render(
      <ToastProvider>
        <TabsSection composer={c} elementId={tabsId} isOpen />
      </ToastProvider>
    );
    const before = readTabs(c, tabsId)!;
    expect(screen.getByTestId("tabs-pair-count")).toHaveTextContent(`${before.pairs.length} pairs`);
    expect(screen.getByText("Stable IDs · no pairing by label or position.")).toBeTruthy();
    fireEvent.click(screen.getByTestId(`tabs-edit-panel-${before.pairs[0].key}`));
    expect(c.selection.getSelected()?.getId()).toBe(before.pairs[0].panelId);
    act(() => {
      fireEvent.click(screen.getByTestId("tabs-add"));
    });
    expect(readTabs(c, tabsId)!.pairs).toHaveLength(before.pairs.length + 1);
  });

  it("C06: Behavior › Initial tab writes the authored pair; C05: a panel says it is shown in the editor only", () => {
    const { c, elId } = withBlock("tabs");
    const tabsId = c.elements.getElement(elId)!.getType() === "tabs" ? elId : c.elements.getElement(elId)!.getDescendants().find((d) => d.getType() === "tabs")!.getId();
    const pairs = readTabs(c, tabsId)!.pairs;
    render(<TabsBehaviorSection composer={c} elementId={tabsId} isOpen />);
    act(() => {
      fireEvent.change(screen.getByRole("combobox", { name: "Initial tab" }), { target: { value: pairs[1].key } });
    });
    expect(readTabs(c, tabsId)!.initial).toBe(pairs[1].key);
    cleanup();
    render(<TabPanelSection composer={c} elementId={pairs[0].panelId} isOpen />);
    expect(screen.getByTestId("inspector-tab-panel")).toHaveTextContent(`Shown in editor only. Visitors still start on ${pairs[1].label}.`);
    fireEvent.click(screen.getByTestId("tab-panel-back"));
    expect(c.selection.getSelected()?.getId()).toBe(tabsId);
  });
});

describe("Tabs repair (C02 / C03 / C04)", () => {
  it("an unlinked button shows Needs repair; Link selected pair repairs it in one step with a receipt; the section then reads '{n} linked'", () => {
    const { c, elId } = withBlock("tabs");
    const tabsId = c.elements.getElement(elId)!.getType() === "tabs" ? elId : c.elements.getElement(elId)!.getDescendants().find((d) => d.getType() === "tabs")!.getId();
    const panels = c.elements.getElement(tabsId)!.getChildren().filter((e) => e.getAttribute("role") === "tabpanel");
    panels[1].setAttribute("data-tab-key", "orphan");
    c.history.flushPending();
    render(
      <ToastProvider>
        <TabsSection composer={c} elementId={tabsId} isOpen />
      </ToastProvider>
    );
    expect(screen.getByTestId("tabs-unlinked")).toHaveTextContent("Tab 2 has no confirmed panel. Both nodes are preserved.");
    expect(screen.getByTestId("tabs-unlinked-button")).toHaveTextContent("Tab 2 · tab-02");
    expect(screen.getByTestId("tabs-unlinked-panel")).toHaveTextContent("Not linked");
    act(() => {
      fireEvent.click(screen.getByTestId("tabs-repair-open"));
    });
    expect(screen.getByTestId("tabs-repair")).toHaveTextContent("One Undo restores the previous IDs and relationships.");
    const before = c.history.getUndoCount();
    act(() => {
      fireEvent.click(screen.getByTestId("tabs-link-pair"));
    });
    c.history.flushPending();
    expect(c.history.getUndoCount()).toBe(before + 1);
    expect(readTabs(c, tabsId)!.unpairedTabs).toEqual([]);
    expect(screen.getByTestId("tabs-pair-count")).toHaveTextContent("3 linked");
    expect(screen.getByTestId("tabs-pair-tab-02")).toHaveTextContent("tab-02 → panel-02");
    expect(screen.getByText("aria-controls and aria-labelledby reference the chosen pair.")).toBeTruthy();
    expect(screen.getByText(/linked to /)).toBeTruthy();
  });
});

describe("Modal states (C08 / C09 / C10 / C11)", () => {
  function triggerOf(c: ReturnType<typeof withBlock>["c"], elId: string): string {
    return [elId, ...c.elements.getElement(elId)!.getDescendants().map((d) => d.getId())].find((id) => readModal(c, id)?.triggerIds.includes(id))!;
  }

  it("C11: a trigger whose dialog is gone repairs only by an explicit choice", () => {
    const { c, elId } = withBlock("modal");
    const triggerId = triggerOf(c, elId);
    const other = insertBlock(c, getBlockById("modal")!, c.elements.getActivePage()!.root.id)!;
    const otherDialog = readModal(c, triggerOf(c, other))!.dialogId;
    c.elements.removeElement(readModal(c, triggerId)!.dialogId);
    render(
      <ToastProvider>
        <ModalRelationshipSection composer={c} elementId={triggerId} isOpen />
      </ToastProvider>
    );
    expect(screen.getByTestId("modal-missing")).toHaveTextContent("The saved dialog ID no longer exists.");
    expect(screen.getByTestId("modal-missing-link")).toBeDisabled();
    act(() => {
      fireEvent.change(screen.getByRole("combobox", { name: "Dialog" }), { target: { value: otherDialog } });
    });
    act(() => {
      fireEvent.click(screen.getByTestId("modal-missing-link"));
    });
    expect(readModal(c, triggerId)!.dialogId).toBe(otherDialog);
  });

  it("C09 / C10: a trigger in a component instance refuses the link and inserts a local modal at the page root, one step", async () => {
    const { c, elId } = withBlock("modal");
    const triggerId = triggerOf(c, elId);
    const trigger = c.elements.getElement(triggerId)!;
    trigger.isComponentInstance = () => true;
    render(
      <ToastProvider>
        <ModalRelationshipSection composer={c} elementId={triggerId} isOpen />
      </ToastProvider>
    );
    expect(screen.getByTestId("modal-component-refused")).toHaveTextContent("a shared component cannot store its reference");
    expect(screen.getByTestId("modal-link-refused")).toBeDisabled();
    c.history.flushPending();
    const before = c.history.getUndoCount();
    act(() => {
      fireEvent.click(screen.getByTestId("modal-insert-local"));
    });
    c.history.flushPending();
    expect(c.history.getUndoCount()).toBe(before + 1);
    const made = c.selection.getSelected()!;
    expect(made.getId()).not.toBe(triggerId);
    expect(made.getParent()!.getId()).toBe(c.elements.getActivePage()!.root.id);
    expect(screen.getByText("Local trigger and dialog added.")).toBeTruthy();
    cleanup();
    render(
      <ToastProvider>
        <ModalRelationshipSection composer={c} elementId={made.getId()} isOpen />
      </ToastProvider>
    );
    expect(screen.getByTestId("modal-local-created")).toHaveTextContent("Trigger and dialog were added at Home’s root.");
  });

  it("C08: Dialog content edits the close label (one step) and goes back to the trigger", () => {
    const { c, elId } = withBlock("modal");
    const triggerId = triggerOf(c, elId);
    const { dialogId } = readModal(c, triggerId)!;
    render(<DialogContentSection composer={c} elementId={dialogId} isOpen />);
    expect(screen.getByTestId("dialog-labelled-by")).toHaveTextContent(/.+/);
    const input = screen.getByTestId("dialog-close-label").querySelector("input")!;
    act(() => {
      fireEvent.change(input, { target: { value: "Close dialog" } });
      fireEvent.blur(input);
    });
    const close = c.elements.getElement(dialogId)!.getDescendants().find((d) => d.getAttribute("data-modal-close") !== undefined)!;
    expect(close.getAttribute("aria-label")).toBe("Close dialog");
    fireEvent.click(screen.getByTestId("dialog-edit-title"));
    expect(c.selection.getSelected()!.getTagName().toLowerCase()).toBe("h3");
    fireEvent.click(screen.getByTestId("dialog-back-to-trigger"));
    expect(c.selection.getSelected()!.getId()).toBe(triggerId);
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
