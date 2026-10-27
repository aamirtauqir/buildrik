// @vitest-environment jsdom
/**
 * Table — 2L9 245:42929 (C13): Structure (Body rows, Columns, Add blank row,
 * Edit A1, Inspect scroll wrapper) and Accessibility (Caption), on the tree
 * the Table block really builds, through the lock gate, one Undo each.
 *
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";
import { getBlockById, insertBlock } from "@/blocks/blockRegistry";
import { TableAccessibilitySection, TableStructureSection } from "../TableSections";
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
