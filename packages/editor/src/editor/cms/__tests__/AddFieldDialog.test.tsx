/**
 * Add field · <collection> (4418:164208).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection } from "@/shared/types/cms";
import { AddFieldDialog } from "../AddFieldDialog";

const MENU = { id: "col-1", name: "Menu items", fields: [{ id: "f1", name: "Price", slug: "price", type: "number" }] } as unknown as CMSCollection;

afterEach(() => cleanup());

describe("AddFieldDialog", () => {
  it("adds a named field of the chosen type", async () => {
    const onAdd = vi.fn(() => Promise.resolve());
    const onClose = vi.fn();
    render(<AddFieldDialog collection={MENU} onClose={onClose} onAdd={onAdd} />);
    expect(screen.getByText("Add field · Menu items")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-add-field-type-image"));
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "Photo" } });
    fireEvent.click(screen.getByTestId("cms-add-field-required"));
    fireEvent.click(screen.getByTestId("cms-add-field-save"));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith("Photo", "image", true));
    expect(onClose).toHaveBeenCalled();
  });

  it("refuses a name the collection already has", () => {
    render(<AddFieldDialog collection={MENU} onClose={() => {}} onAdd={vi.fn()} />);
    fireEvent.change(screen.getByTestId("cms-add-field-name"), { target: { value: "price" } });
    expect(screen.getByTestId("cms-add-field-error")).toHaveTextContent("Menu items already has a field called price.");
    expect(screen.getByTestId("cms-add-field-save")).toBeDisabled();
  });
});
