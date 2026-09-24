/**
 * + Add field: type list (4418:164208) → Configure <Type> field (4418:164219…
 * :164260) → key clash (4418:164225).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";
import { AddFieldDialog } from "../AddFieldDialog";

const MENU = { id: "col-1", name: "Menu items", fields: [{ id: "f1", name: "Name", slug: "name", type: "text" }] } as unknown as CMSCollection;
const TEAM = { id: "col-2", name: "Team", fields: [] } as unknown as CMSCollection;

afterEach(() => cleanup());

function mount() {
  const onAdd = vi.fn(() => Promise.resolve());
  const onClose = vi.fn();
  render(<AddFieldDialog collection={MENU} collections={[MENU, TEAM]} onClose={onClose} onAdd={onAdd} />);
  return { onAdd, onClose };
}

describe("AddFieldDialog", () => {
  it("lists the types, then configures the chosen one; the key follows the name", async () => {
    const { onAdd, onClose } = mount();
    expect(screen.getByText("Add field · Menu items")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-add-field-type-number"));
    expect(screen.getByText("Configure Number field")).toBeInTheDocument();
    expect(screen.getByText("Menu items / Number field")).toBeInTheDocument();
    expect(screen.getByText("Existing records keep empty values until edited.")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Cooking time" } });
    expect(screen.getByTestId("cms-add-field-key")).toHaveValue("cooking-time");
    fireEvent.click(screen.getByTestId("cms-add-field-required-yes"));
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ name: "Cooking time", slug: "cooking-time", type: "number", validation: { required: true } }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("goes back to the type list", () => {
    mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-image"));
    fireEvent.click(screen.getByTestId("cms-add-field-back"));
    expect(screen.getByTestId("cms-add-field-types")).toBeInTheDocument();
  });

  it("a reference field names the collection it points at", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-reference"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Chef" } });
    fireEvent.change(screen.getByTestId("cms-add-field-collection"), { target: { value: "col-2" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Chef", slug: "chef", type: "reference", referenceCollection: "col-2" }));
  });

  it("stops on a key the collection has, and offers a free one (4418:164225)", async () => {
    const { onAdd } = mount();
    fireEvent.click(screen.getByTestId("cms-add-field-type-text"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Name" } });
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    expect(screen.getByText("Field key already exists")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("cms-add-field-clash-use"));
    expect(screen.getByTestId("cms-add-field-key")).toHaveValue("name-2");
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ name: "Name", slug: "name-2", type: "text" }));
  });
});
