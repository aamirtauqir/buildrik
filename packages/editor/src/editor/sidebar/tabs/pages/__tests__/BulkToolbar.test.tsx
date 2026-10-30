/**
 * BulkToolbar — class + a11y + handler-plumbing assertions.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkToolbar } from "../components/BulkToolbar";
import type { FolderItem } from "../types";

const folders: FolderItem[] = [
  { id: "f1", name: "Marketing", pageIds: [], collapsed: false },
];

const baseProps = {
  selectedCount: 3,
  selectedNames: ["Menu", "Contact", "About"],
  folders,
  anyInFolder: true,
  onDuplicate: vi.fn(),
  onMoveToFolder: vi.fn(),
  onRemoveFromFolders: vi.fn(),
  onDelete: vi.fn(),
  onClear: vi.fn(),
};

describe("BulkToolbar", () => {
  // re-baseline: Pages bulk band — board 139:47668: "3 selected" with Clear, then the three actions.
  it("reads 'n selected' and Clear ends the selection", () => {
    const onClear = vi.fn();
    render(<BulkToolbar {...baseProps} onClear={onClear} />);
    expect(screen.getByTestId("pages-bulk-count")).toHaveTextContent("3 selected");
    fireEvent.click(screen.getByTestId("pages-bulk-clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does NOT render disabled Publish or Unpublish buttons (anti-slop)", () => {
    render(<BulkToolbar {...baseProps} />);
    expect(screen.queryByText(/^Publish$/)).toBeNull();
    expect(screen.queryByText(/^Unpublish$/)).toBeNull();
  });

  /* v3 6887:77925: Move to… opens a dialog, not a pop-up list. */
  it("Move to… opens the Move dialog naming the pages, with the folders and Top level", () => {
    render(<BulkToolbar {...baseProps} />);
    fireEvent.click(screen.getByText(/Move to/));
    expect(screen.getByText("Move 3 pages to…")).toBeInTheDocument();
    /* design-2l9 board 139:51389's line. Re-baseline: bulk Move dialog. */
    expect(screen.getByText("Menu, Contact and About. Only your folder organization changes; page URLs and the homepage stay the same.")).toBeInTheDocument();
    expect(screen.getByText("Top level (no folder)")).toBeInTheDocument();
  });

  it("confirming with a folder picked calls onMoveToFolder with its id", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onMoveToFolder={fn} />);
    fireEvent.click(screen.getByText(/Move to…/));
    fireEvent.click(screen.getByRole("button", { name: "Move 3 pages" }));
    expect(fn).toHaveBeenCalledWith("f1");
  });

  it("Duplicate click invokes handler", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onDuplicate={fn} />);
    fireEvent.click(screen.getByText(/Duplicate/));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("Top level (no folder) calls onRemoveFromFolders", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onRemoveFromFolders={fn} />);
    fireEvent.click(screen.getByText(/Move to…/));
    fireEvent.click(screen.getByText("Top level (no folder)"));
    fireEvent.click(screen.getByRole("button", { name: "Move 3 pages" }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("pages all at the top level get no Top level choice (139:51389)", () => {
    render(<BulkToolbar {...baseProps} anyInFolder={false} />);
    fireEvent.click(screen.getByText(/Move to…/));
    expect(screen.getByText("Marketing")).toBeInTheDocument();
    expect(screen.queryByText("Top level (no folder)")).toBeNull();
  });

  it("Delete reads in the error red", () => {
    render(<BulkToolbar {...baseProps} />);
    expect(screen.getByRole("button", { name: "Delete" }).className).toContain("tw:text-[var(--bk-error)]");
  });

  it("is a toolbar named by its count", () => {
    render(<BulkToolbar {...baseProps} />);
    expect(screen.getByRole("toolbar", { name: "3 pages selected" })).toBeInTheDocument();
  });

  it("does not render legacy pg-bulk__* classes", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    expect(container.querySelector(".pg-bulk")).toBeNull();
    expect(container.querySelector(".pg-bulk__btn")).toBeNull();
    expect(container.querySelector(".pg-bulk__clear")).toBeNull();
  });
});
