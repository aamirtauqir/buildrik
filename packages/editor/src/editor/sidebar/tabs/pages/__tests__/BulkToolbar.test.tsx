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
  folders,
  onDuplicate: vi.fn(),
  onMoveToFolder: vi.fn(),
  onRemoveFromFolders: vi.fn(),
  onDelete: vi.fn(),
  onClear: vi.fn(),
};

describe("BulkToolbar", () => {
  it("renders count with tabular className", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/selected/)).toBeInTheDocument();
    expect(container.querySelector(".bd-pg-bulk-count.tabular")).not.toBeNull();
  });

  it("does NOT render disabled Publish or Unpublish buttons (anti-slop)", () => {
    render(<BulkToolbar {...baseProps} />);
    expect(screen.queryByText(/^Publish$/)).toBeNull();
    expect(screen.queryByText(/^Unpublish$/)).toBeNull();
  });

  it("Move-to-folder click opens dropdown listing folders", () => {
    render(<BulkToolbar {...baseProps} />);
    fireEvent.click(screen.getByText(/Move to/));
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("clicking a folder in the dropdown invokes onMoveToFolder with folderId", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onMoveToFolder={fn} />);
    fireEvent.click(screen.getByText(/Move to/));
    fireEvent.click(screen.getByText("Marketing"));
    expect(fn).toHaveBeenCalledWith("f1");
  });

  it("Duplicate click invokes handler", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onDuplicate={fn} />);
    fireEvent.click(screen.getByText(/Duplicate/));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("Remove from folder click invokes onRemoveFromFolders", () => {
    const fn = vi.fn();
    render(<BulkToolbar {...baseProps} onRemoveFromFolders={fn} />);
    fireEvent.click(screen.getByText(/Move to/));
    fireEvent.click(screen.getByText(/Remove from folder/));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("Delete button has danger class", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    const danger = container.querySelector("button.danger");
    expect(danger?.textContent).toMatch(/Delete/);
  });

  it("Close click invokes onClear", () => {
    const fn = vi.fn();
    const { container } = render(<BulkToolbar {...baseProps} onClear={fn} />);
    const close = container.querySelector(".bd-pg-bulk-close") as HTMLElement;
    fireEvent.click(close);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("toolbar root has class .bd-pg-bulk-toolbar with role toolbar", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    const toolbar = container.querySelector(".bd-pg-bulk-toolbar");
    expect(toolbar).not.toBeNull();
    expect(toolbar?.getAttribute("role")).toBe("toolbar");
  });

  it("does not render legacy pg-bulk__* classes", () => {
    const { container } = render(<BulkToolbar {...baseProps} />);
    expect(container.querySelector(".pg-bulk")).toBeNull();
    expect(container.querySelector(".pg-bulk__btn")).toBeNull();
    expect(container.querySelector(".pg-bulk__clear")).toBeNull();
  });
});
