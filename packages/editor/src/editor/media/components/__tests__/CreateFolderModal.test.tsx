/**
 * CreateFolderModal — Clone 3700:20347 (New folder) and 3700:20350 (Folder
 * name already exists). One `it` per prototype fact a DOM assertion can
 * prove; the visual half is the shot pair the live walk takes.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { CreateFolderModal } from "../CreateFolderModal";

let promptSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  promptSpy = vi.spyOn(window, "prompt").mockImplementation(() => null);
});
afterEach(() => {
  promptSpy.mockRestore();
});

function mount(over: Partial<React.ComponentProps<typeof CreateFolderModal>> = {}) {
  const props = {
    open: true,
    existingNames: [] as string[],
    onClose: vi.fn(),
    onCreate: vi.fn(),
    ...over,
  };
  const utils = render(<CreateFolderModal {...props} />);
  return { ...utils, props };
}

const nameField = () => screen.getByTestId("mgr-create-folder-input");
const createButton = () => screen.getByTestId("mgr-create-folder-go");

describe("Clone 3700:20347 · Assets · Create folder", () => {
  it("reads the board's copy: title, 'Folder name:' label, Cancel, Create folder — and no OS prompt", () => {
    mount();
    expect(screen.getByRole("heading", { name: "New folder" })).toBeInTheDocument();
    expect(screen.getByTestId("mgr-create-folder-label")).toHaveTextContent("Folder name:");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(createButton()).toHaveTextContent("Create folder");
    expect(promptSpy).not.toHaveBeenCalled();
  });

  it("Create folder stays disabled while the name is blank, including whitespace", () => {
    mount();
    expect(createButton()).toBeDisabled();
    fireEvent.change(nameField(), { target: { value: "   " } });
    expect(createButton()).toBeDisabled();
    fireEvent.change(nameField(), { target: { value: "Campaign images" } });
    expect(createButton()).toBeEnabled();
  });

  it("Create folder hands up the trimmed name and closes", () => {
    const { props } = mount();
    fireEvent.change(nameField(), { target: { value: "  Campaign images  " } });
    fireEvent.click(createButton());
    expect(props.onCreate).toHaveBeenCalledWith("Campaign images");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("Enter submits", () => {
    const { props } = mount();
    fireEvent.change(nameField(), { target: { value: "Campaign images" } });
    fireEvent.keyDown(nameField(), { key: "Enter" });
    expect(props.onCreate).toHaveBeenCalledWith("Campaign images");
  });

  it("Enter on a blank name creates nothing", () => {
    const { props } = mount();
    fireEvent.keyDown(nameField(), { key: "Enter" });
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  // Audit A06 — every overlay opened from the library cancels back to it with
  // nothing changed. Cancel and Escape are the same door.
  it("Cancel closes and creates nothing", () => {
    const { props } = mount();
    fireEvent.change(nameField(), { target: { value: "Scratch" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape closes and creates nothing", () => {
    const { props } = mount();
    fireEvent.change(nameField(), { target: { value: "Scratch" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("a reopened dialog starts empty, on the name step", () => {
    const { rerender, props } = mount({ existingNames: ["Products"] });
    fireEvent.change(nameField(), { target: { value: "Products" } });
    fireEvent.click(createButton());
    expect(screen.getByRole("heading", { name: "Folder name already exists" })).toBeInTheDocument();
    rerender(<CreateFolderModal {...props} open={false} />);
    rerender(<CreateFolderModal {...props} open />);
    expect(screen.getByRole("heading", { name: "New folder" })).toBeInTheDocument();
    expect(nameField()).toHaveValue("");
  });
});

describe("Clone 3700:20350 · Assets · Folder name already exists", () => {
  it("a name already at this level — case-insensitive, trimmed — is refused with the board's copy and the next free name", () => {
    const { props } = mount({ existingNames: ["Products", "Hero shots"] });
    fireEvent.change(nameField(), { target: { value: "  products " } });
    fireEvent.click(createButton());
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Folder name already exists" })).toBeInTheDocument();
    expect(screen.getByTestId("mgr-create-folder-taken")).toHaveTextContent(
      "Products already exists. Choose a different name. Your assets have not changed.",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByTestId("mgr-create-folder-use")).toHaveTextContent("Use Products 2");
    // One dialog at a time: the name step is gone, not stacked under this one.
    expect(screen.queryByTestId("mgr-create-folder-input")).toBeNull();
  });

  it("Enter on a taken name lands on the same step", () => {
    const { props } = mount({ existingNames: ["Products"] });
    fireEvent.change(nameField(), { target: { value: "Products" } });
    fireEvent.keyDown(nameField(), { key: "Enter" });
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(screen.getByTestId("mgr-create-folder-use")).toHaveTextContent("Use Products 2");
  });

  it("'Use <next free name>' creates that folder and closes", () => {
    const { props } = mount({ existingNames: ["Products"] });
    fireEvent.change(nameField(), { target: { value: "Products" } });
    fireEvent.click(createButton());
    fireEvent.click(screen.getByTestId("mgr-create-folder-use"));
    expect(props.onCreate).toHaveBeenCalledWith("Products 2");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("the next free name skips every taken number", () => {
    mount({ existingNames: ["Products", "products 2", "Products 3"] });
    fireEvent.change(nameField(), { target: { value: "Products" } });
    fireEvent.click(createButton());
    expect(screen.getByTestId("mgr-create-folder-use")).toHaveTextContent("Use Products 4");
  });

  it("Cancel on this step closes the whole dialog and creates nothing", () => {
    const { props } = mount({ existingNames: ["Products"] });
    fireEvent.change(nameField(), { target: { value: "Products" } });
    fireEvent.click(createButton());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onCreate).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
