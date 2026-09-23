/**
 * B13 — Create Collection, two steps (G1-099 / G3-067; boards 4418:84646,
 * 6940:79789, 4418:88263). Step 1 names the collection, step 2 lists its
 * fields, Create writes both. The cosmetic Content type select (AS-82, no
 * consumer) is gone, and a name that already exists stops at the clash notice
 * ("Collection name already exists" → "Use Menu items 2") instead of creating
 * a second collection with the same name.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CMSCollectionSetupModal } from "../CMSCollectionSetupModal";

function makeComposer(existing: string[] = []) {
  const collections = {
    getAllCollections: vi.fn(() => existing.map((name, i) => ({ id: `c${i}`, name }))),
    createCollection: vi.fn().mockResolvedValue({ id: "col-new" }),
    addField: vi.fn().mockResolvedValue(undefined),
    updateCollection: vi.fn().mockResolvedValue(undefined),
  };
  return { composer: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), cms: { collections } } as never, collections };
}

const typeName = (value: string) =>
  fireEvent.change(screen.getByTestId("cms-setup-name"), { target: { value } });
const next = () => fireEvent.click(screen.getByTestId("cms-setup-next"));

describe("CMSCollectionSetupModal — B13 two-step create", () => {
  it("step 1 has no Content type select (AS-82 had no consumer)", () => {
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={makeComposer().composer} />);
    expect(screen.queryByText("Content type")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("name → Next → fields → Create writes the collection and its fields", async () => {
    const { composer, collections } = makeComposer(["Team"]);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Menu items");
    next();
    expect(screen.getByTestId("cms-setup-title")).toHaveTextContent("Fields for Menu items");
    fireEvent.click(screen.getByTestId("cms-add-field"));
    const inputs = screen.getAllByPlaceholderText("field_name");
    fireEvent.change(inputs[1], { target: { value: "price" } });
    fireEvent.click(screen.getByTestId("cms-setup-create"));
    await waitFor(() => expect(collections.createCollection).toHaveBeenCalledWith("Menu items", undefined, undefined));
    await waitFor(() => expect(collections.addField).toHaveBeenCalledTimes(2));
    expect(collections.addField).toHaveBeenLastCalledWith("col-new", expect.objectContaining({ slug: "price", type: "text" }));
  });

  it("a name that exists stops at the clash notice and offers the next free name", async () => {
    const { composer, collections } = makeComposer(["Menu items", "Menu items 2"]);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("menu items");
    next();
    const clash = screen.getByTestId("cms-setup-clash");
    expect(clash).toHaveTextContent("Collection name already exists");
    expect(clash).toHaveTextContent("A collection named “menu items” already exists.");
    expect(screen.queryByTestId("cms-setup-create")).toBeNull();
    fireEvent.click(screen.getByTestId("cms-setup-clash-use"));
    expect(screen.getByTestId("cms-setup-name")).toHaveValue("menu items 3");
    expect(screen.queryByTestId("cms-setup-clash")).toBeNull();
    next();
    fireEvent.click(screen.getByTestId("cms-setup-create"));
    await waitFor(() => expect(collections.createCollection).toHaveBeenCalledWith("menu items 3", undefined, undefined));
  });

  it("renaming into a clash on step 2 blocks Create the same way", () => {
    const { composer, collections } = makeComposer(["Team"]);
    render(<CMSCollectionSetupModal isOpen onClose={vi.fn()} composer={composer} />);
    typeName("Staff");
    next();
    fireEvent.change(screen.getByLabelText("NAME"), { target: { value: "Team" } });
    fireEvent.click(screen.getByTestId("cms-setup-create"));
    expect(screen.getByTestId("cms-setup-clash")).toBeInTheDocument();
    expect(collections.createCollection).not.toHaveBeenCalled();
  });
});
