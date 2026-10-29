// @vitest-environment jsdom
/**
 * Table — 2L9 245:42929 (C13): Structure (Body rows, Columns, Add blank row,
 * Edit A1, Inspect scroll wrapper) and Accessibility (Caption), on the tree
 * the Table block really builds, through the lock gate, one Undo each.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";
import { TableAccessibilitySection, TableCellSection, TableStructureSection, TableWrapperSection, isTableCell, isTableWrapper } from "../TableSections";
import { openingTab } from "@/editor/inspector/config/sectionOrder";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const id = insertBlock(c, getBlockById("table")!, page.root.id)!;
  return { c, id, table: () => c.elements.getElement(id)! };
}

const tag = (el: { getTagName(): string }) => el.getTagName().toLowerCase();

describe("Table · Structure", () => {
  it("counts the body rows and columns of the real tree, and a table opens on Content", () => {
    const { c, id } = setup();
    render(<TableStructureSection composer={c} elementId={id} isOpen />);
    expect(screen.getByTestId("table-body-rows")).toHaveTextContent("3");
    expect(screen.getByTestId("table-columns")).toHaveTextContent("4");
    expect(openingTab("table")).toBe("content");
  });

  it("Add blank row copies the last row's cells — tag and appearance, no content — in one transaction", () => {
    const { c, id, table } = setup();
    render(<TableStructureSection composer={c} elementId={id} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Add blank row" }));
    const tbody = table().getChildren().find((el) => tag(el) === "tbody")!;
    const rows = tbody.getChildren();
    expect(rows).toHaveLength(4);
    const added = rows[3];
    expect(added.getChildren().map(tag)).toEqual(rows[2].getChildren().map(tag));
    expect(added.getChildren().every((cell) => cell.getChildren().length === 0)).toBe(true);
    expect(screen.getByTestId("table-body-rows")).toHaveTextContent("4");
  });

  it("Edit A1 selects the first body cell; Inspect scroll wrapper selects the wrapper", () => {
    const { c, id, table } = setup();
    render(<TableStructureSection composer={c} elementId={id} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Edit A1 · Name" }));
    expect(tag(c.elements.getElement(c.selection.getSelectedIds()[0])!)).toBe("td");
    fireEvent.click(screen.getByRole("button", { name: "Inspect scroll wrapper" }));
    expect(c.selection.getSelectedIds()).toEqual([table().getParent()!.getId()]);
  });
});

describe("Table · Accessibility", () => {
  it("Caption makes a <caption> as the first child, edits it, and removes it when cleared", () => {
    const { c, id, table } = setup();
    render(<TableAccessibilitySection composer={c} elementId={id} isOpen />);
    const field = screen.getByLabelText("Caption");
    fireEvent.change(field, { target: { value: "Services and availability" } });
    fireEvent.blur(field);
    const first = table().getChildren()[0];
    expect(tag(first)).toBe("caption");
    expect(first.getContent()).toBe("Services and availability");
    fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "" } });
    fireEvent.blur(screen.getByLabelText("Caption"));
    expect(table().getChildren().some((el) => tag(el) === "caption")).toBe(false);
  });
});

const firstBodyCell = (table: { getChildren(): Array<{ getTagName(): string; getChildren(): unknown[] }> }) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (table.getChildren().find((el) => tag(el) === "tbody") as any).getChildren()[0].getChildren()[0];

describe("Table · Cell (245:43495)", () => {
  it("a td: Native tag, spans written as attributes, Back to the table", () => {
    const { c, table } = setup();
    const cell = firstBodyCell(table());
    expect(isTableCell(cell)).toBe(true);
    render(<TableCellSection composer={c} elementId={cell.getId()} isOpen />);
    expect(screen.getByLabelText("Native tag")).toHaveValue("td");
    fireEvent.change(screen.getByLabelText("Column span"), { target: { value: "2" } });
    fireEvent.blur(screen.getByLabelText("Column span"));
    expect(c.elements.getElement(cell.getId())!.getAttribute("colspan")).toBe("2");
    fireEvent.change(screen.getByLabelText("Native tag"), { target: { value: "th" } });
    expect(tag(c.elements.getElement(cell.getId())!)).toBe("th");
    expect(screen.getByLabelText("Scope")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Back to/ }));
    expect(c.selection.getSelectedIds()).toEqual([table().getId()]);
  });
});

describe("Table · Wrapper layout (245:44049)", () => {
  it("the wrapper's Width and Overflow write its own styles; Back to the table", () => {
    const { c, table } = setup();
    const wrapper = table().getParent()!;
    expect(isTableWrapper(wrapper)).toBe(true);
    const onChange = vi.fn();
    render(<TableWrapperSection composer={c} elementId={wrapper.getId()} styles={{ width: "100%" }} onChange={onChange} isOpen />);
    fireEvent.change(screen.getByLabelText("Overflow X"), { target: { value: "auto" } });
    expect(onChange).toHaveBeenCalledWith("overflow-x", "auto");
    fireEvent.click(screen.getByRole("button", { name: /^Back to/ }));
    expect(c.selection.getSelectedIds()).toEqual([table().getId()]);
  });
});
