// @vitest-environment jsdom
/**
 * Content › Children (2L9 B69): direct children open as themselves; a
 * uniform list adds a blank item in one Undo; a mixed one opens Add.
 * @license BSD-3-Clause
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";
import { ChildrenSection } from "../ChildrenSection";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);
afterEach(cleanup);

function withBlock(id: string) {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const elId = insertBlock(c, getBlockById(id)!, page.root.id)!;
  c.history.flushPending();
  return { c, elId };
}

describe("Children (B69)", () => {
  it("a list: its items by name, 'Add blank list item' copies the last item's tag with no content, one Undo", () => {
    const { c, elId } = withBlock("list");
    const list = c.elements.getElement(elId)!;
    const before = list.getChildren().length;
    render(<ChildrenSection composer={c} elementId={elId} isOpen />);
    expect(screen.getByTestId("children-count")).toHaveTextContent(`${before} direct children`);
    fireEvent.click(screen.getAllByTestId("children-open")[0]);
    expect(c.selection.getSelected()?.getId()).toBe(list.getChildren()[0].getId());
    const steps = c.history.getUndoCount();
    fireEvent.click(screen.getByRole("button", { name: "Add blank list item" }));
    c.history.flushPending();
    const kids = c.elements.getElement(elId)!.getChildren();
    expect(kids).toHaveLength(before + 1);
    expect(kids[before].getTagName().toLowerCase()).toBe("li");
    expect(kids[before].getContent()).toBe("");
    expect(c.history.getUndoCount()).toBe(steps + 1);
  });

  it("an empty container reads Empty and opens Add", () => {
    const { c, elId } = withBlock("container");
    const seen: unknown[] = [];
    c.on("ui:switch-tab" as never, ((p: unknown) => seen.push(p)) as never);
    render(<ChildrenSection composer={c} elementId={elId} isOpen />);
    expect(screen.getByTestId("children-count")).toHaveTextContent("Empty");
    fireEvent.click(screen.getByTestId("children-open-add"));
    expect(seen).toEqual([{ tab: "add" }]);
  });
});
