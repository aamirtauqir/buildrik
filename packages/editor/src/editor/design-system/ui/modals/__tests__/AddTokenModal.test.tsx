import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { AddTokenModal } from "../AddTokenModal";

function setup(existingIds: string[] = []) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <AddTokenModal existingIds={existingIds} onAdd={onAdd} onClose={onClose} />
  );
  const nameInput = utils.getByPlaceholderText("e.g., Purple") as HTMLInputElement;
  const hexInput = utils.getByPlaceholderText("#3B82F6") as HTMLInputElement;
  const addButton = utils.getByText("Add token");
  const cancelButton = utils.getByText("Cancel");
  return { onAdd, onClose, nameInput, hexInput, addButton, cancelButton, ...utils };
}

describe("AddTokenModal — rendering", () => {
  it("renders title, name input, hex input (seeded #3B82F6), and action buttons", () => {
    const { getByText, nameInput, hexInput } = setup();
    expect(getByText("Add color token")).toBeTruthy();
    expect(nameInput.value).toBe("");
    expect(hexInput.value).toBe("#3B82F6");
  });

  it("Cancel invokes onClose without onAdd", () => {
    const { onAdd, onClose, cancelButton } = setup();
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe("AddTokenModal — name validation", () => {
  it("empty name blocks the add and shows 'Name is required'", () => {
    const { onAdd, addButton, getByText } = setup();
    fireEvent.click(addButton);
    expect(getByText("Name is required")).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("whitespace-only name is rejected as empty", () => {
    const { onAdd, nameInput, addButton, getByText } = setup();
    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.click(addButton);
    expect(getByText("Name is required")).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("duplicate name (collides with an existing generated id) is rejected", () => {
    // generateColorTokenId("Brand Blue") → "color-brand-blue"
    const { onAdd, nameInput, addButton, getByText } = setup(["color-brand-blue"]);
    fireEvent.change(nameInput, { target: { value: "Brand Blue" } });
    fireEvent.click(addButton);
    expect(getByText("A token with this name already exists")).toBeTruthy();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe("AddTokenModal — hex validation", () => {
  it.each(["#FFF", "#12345", "#1234567", "3B82F6", "#GGGGGG", ""])(
    "rejects %s — only 6-digit #RRGGBB accepted",
    (bad) => {
      const { onAdd, nameInput, hexInput, addButton, getByText } = setup();
      fireEvent.change(nameInput, { target: { value: "Purple" } });
      fireEvent.change(hexInput, { target: { value: bad } });
      fireEvent.click(addButton);
      expect(getByText("Enter a valid 6-digit hex color")).toBeTruthy();
      expect(onAdd).not.toHaveBeenCalled();
    }
  );

  it("hex error clears once a valid hex is submitted", () => {
    const { onAdd, nameInput, hexInput, addButton, queryByText } = setup();
    fireEvent.change(nameInput, { target: { value: "Purple" } });
    fireEvent.change(hexInput, { target: { value: "#FFF" } });
    fireEvent.click(addButton);
    expect(queryByText("Enter a valid 6-digit hex color")).toBeTruthy();
    fireEvent.change(hexInput, { target: { value: "#A855F7" } });
    fireEvent.click(addButton);
    expect(queryByText("Enter a valid 6-digit hex color")).toBeNull();
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});

describe("AddTokenModal — successful add", () => {
  it("calls onAdd with the trimmed name and uppercased hex", () => {
    const { onAdd, nameInput, hexInput, addButton } = setup();
    fireEvent.change(nameInput, { target: { value: "  Purple  " } });
    fireEvent.change(hexInput, { target: { value: "#a855f7" } });
    fireEvent.click(addButton);
    expect(onAdd).toHaveBeenCalledWith("Purple", "#A855F7");
  });

  it("both fields invalid → both errors surface in the same pass", () => {
    const { nameInput, hexInput, addButton, getByText } = setup();
    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.change(hexInput, { target: { value: "nope" } });
    fireEvent.click(addButton);
    expect(getByText("Name is required")).toBeTruthy();
    expect(getByText("Enter a valid 6-digit hex color")).toBeTruthy();
  });
});
