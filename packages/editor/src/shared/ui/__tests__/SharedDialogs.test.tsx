import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  UnsavedChangesDialog,
  DeleteConfirmDialog,
  RevertConfirmDialog,
  AddPageDialog,
} from "../SharedDialogs";

describe("UnsavedChangesDialog", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <UnsavedChangesDialog
        isOpen={false}
        onSaveAndSwitch={vi.fn()}
        onDiscardAndSwitch={vi.fn()}
        onStay={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when isOpen is true", () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onSaveAndSwitch={vi.fn()}
        onDiscardAndSwitch={vi.fn()}
        onStay={vi.fn()}
      />
    );
    expect(screen.getByText("Unsaved Changes")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("calls onStay when Stay button clicked", () => {
    const onStay = vi.fn();
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onSaveAndSwitch={vi.fn()}
        onDiscardAndSwitch={vi.fn()}
        onStay={onStay}
      />
    );
    fireEvent.click(screen.getByText("Stay"));
    expect(onStay).toHaveBeenCalledOnce();
  });

  it("calls onSaveAndSwitch when Save button clicked", () => {
    const onSave = vi.fn();
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onSaveAndSwitch={onSave}
        onDiscardAndSwitch={vi.fn()}
        onStay={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Save & Switch"));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("has aria-modal attribute", () => {
    render(
      <UnsavedChangesDialog
        isOpen={true}
        onSaveAndSwitch={vi.fn()}
        onDiscardAndSwitch={vi.fn()}
        onStay={vi.fn()}
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});

describe("AddPageDialog", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <AddPageDialog isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("auto-generates slug from name", () => {
    render(
      <AddPageDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const nameInput = screen.getByPlaceholderText("About Us");
    fireEvent.change(nameInput, { target: { value: "About Us" } });
    const slugInput = screen.getByPlaceholderText("about-us");
    expect(slugInput).toHaveProperty("value", "about-us");
  });

  it("disables submit when name is empty", () => {
    render(
      <AddPageDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const submitBtn = screen.getByText("Create Page");
    expect(submitBtn).toHaveProperty("disabled", true);
  });

  it("calls onConfirm with name and slug", () => {
    const onConfirm = vi.fn();
    render(
      <AddPageDialog isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText("About Us"), {
      target: { value: "Contact Page" },
    });
    fireEvent.click(screen.getByText("Create Page"));
    expect(onConfirm).toHaveBeenCalledWith("Contact Page", "contact-page");
  });

  // Regression: state resets when dialog reopens
  it("resets name and slug when dialog reopens", () => {
    const { rerender } = render(
      <AddPageDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText("About Us"), {
      target: { value: "Old Name" },
    });
    // Close
    rerender(
      <AddPageDialog isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    // Reopen
    rerender(
      <AddPageDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const nameInput = screen.getByPlaceholderText("About Us");
    expect(nameInput).toHaveProperty("value", "");
  });

  it("has role=dialog and aria-modal", () => {
    render(
      <AddPageDialog isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});
