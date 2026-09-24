/**
 * The record side sheet (4428:144760 and its states), driven through the
 * workspace the way the product opens it: a table row or + Add record.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import { ToastProvider } from "@/editor/chrome-ui";
import { CmsWorkspace } from "../CmsWorkspace";
import { cmsWorkspace } from "../cmsWorkspaceStore";
import { makeEngine } from "./fakeCmsEngine";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  displayField: "name",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0, validation: { required: true } },
    { id: "f2", name: "Price", slug: "price", type: "text", order: 1, validation: { required: true } },
    { id: "f3", name: "Description", slug: "description", type: "textarea", order: 2 },
    { id: "f4", name: "Available", slug: "available", type: "boolean", order: 3 },
    { id: "f5", name: "Photo", slug: "photo", type: "image", order: 4 },
  ],
} as unknown as CMSCollection;

const MARGHERITA: CMSContentItem = {
  id: "r1",
  collectionId: "col-1",
  data: { name: "Margherita", price: "$12", description: "Tomato", available: true, photo: "" },
  status: "draft",
  createdAt: "",
  updatedAt: "",
};

function mount(opts: { collection?: CMSCollection; items?: CMSContentItem[]; onOpenMediaLibrary?: ReturnType<typeof vi.fn> } = {}) {
  const engine = makeEngine({ collections: [opts.collection ?? MENU], items: opts.items ?? [MARGHERITA] });
  cmsWorkspace.openCollection("col-1");
  render(
    <ToastProvider>
      <CmsWorkspace composer={engine.composer as never} onOpenMediaLibrary={opts.onOpenMediaLibrary as never} />
    </ToastProvider>,
  );
  return engine;
}

const openRow = async (id = "r1") => {
  fireEvent.click(await screen.findByTestId(`cms-row-${id}`));
  return screen.findByTestId("cms-sheet");
};

beforeEach(() => {
  localStorage.clear();
  cmsWorkspace.reset();
});
afterEach(() => {
  cleanup();
  cmsWorkspace.reset();
});

describe("RecordSheet", () => {
  it("opens over the table with crumb, fields two to a row, and saves edits through the engine", async () => {
    const { composer } = mount();
    await openRow();
    expect(screen.getByTestId("cms-sheet-title")).toHaveTextContent("Margherita");
    expect(screen.getByText("Menu items", { selector: "button" })).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("No unsaved changes on this record");
    expect(screen.getByTestId("cms-sheet-save")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$13" } });
    expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Unsaved changes");
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() =>
      expect(composer.cms.collections.updateContentItem).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({ data: expect.objectContaining({ price: "$13" }), status: "draft" }),
      ),
    );
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
    expect(await screen.findByText("Record saved")).toBeInTheDocument();
  });

  it("+ Add record opens a blank sheet and creates the record", async () => {
    const { composer } = mount({ items: [] });
    fireEvent.click(await screen.findByTestId("cms-ws-add-record"));
    await screen.findByTestId("cms-sheet");
    expect(screen.getByText("New record")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Diavola" } });
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() =>
      expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith("col-1", expect.objectContaining({ name: "Diavola" })),
    );
  });

  it("says which required fields keep a record from publishing (5940:148412)", async () => {
    mount({ items: [{ ...MARGHERITA, data: { ...MARGHERITA.data, price: "" } }] });
    await openRow();
    expect(screen.getByTestId("cms-sheet-eligibility")).toHaveTextContent("Not eligible for publishing — Price is required");
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$7" } });
    expect(screen.getByTestId("cms-sheet-eligibility")).toHaveTextContent("Eligible for publishing");
  });

  it("keeps the Published status control the Records modal had, and shows a refused publish (5940:148777)", async () => {
    const { composer } = mount();
    composer.cms.collections.updateContentItem.mockImplementationOnce(() =>
      Promise.reject(new CMSValidationError({ price: "Price is required" })),
    );
    await openRow();
    fireEvent.click(screen.getByRole("switch", { name: "Published" }));
    fireEvent.click(screen.getByTestId("cms-sheet-save"));
    await waitFor(() => expect(screen.getByTestId("cms-sheet-state")).toHaveTextContent("Price is required"));
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toHaveTextContent("Retry save");
  });

  it("asks before throwing away edits (6879:67190), and leaves a clean record without asking", async () => {
    mount();
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());

    await openRow();
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$99" } });
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    expect(await screen.findByText("Discard record changes?")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Keep editing"));
    expect(screen.getByTestId("cms-sheet")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-sheet-close"));
    fireEvent.click(await screen.findByText("Discard and leave"));
    await waitFor(() => expect(screen.queryByTestId("cms-sheet")).toBeNull());
  });

  it("deletes a record without a page at once, with Undo on the toast (#17)", async () => {
    const { composer } = mount();
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-more"));
    fireEvent.click(screen.getByTestId("cms-sheet-delete"));
    await waitFor(() => expect(composer.cms.collections.deleteContentItem).toHaveBeenCalledWith("r1"));
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() =>
      expect(composer.cms.collections.createContentItem).toHaveBeenCalledWith("col-1", MARGHERITA.data),
    );
  });

  it("a published record with a generated page takes the typed DELETE dialog (6881:70349 · #29)", async () => {
    const { composer } = mount({
      collection: { ...MENU, pageSlugPattern: "/menu/{slug}" } as CMSCollection,
      items: [{ ...MARGHERITA, status: "published" }],
    });
    await openRow();
    fireEvent.click(screen.getByTestId("cms-sheet-more"));
    fireEvent.click(screen.getByTestId("cms-sheet-delete"));
    expect(await screen.findByText("Delete “Margherita”?")).toBeInTheDocument();
    const confirm = screen.getByTestId("cms-delete-record-confirm");
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByTestId("cms-delete-record-input"), { target: { value: "DELETE" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(composer.cms.collections.deleteContentItem).toHaveBeenCalledWith("r1"));
  });

  it("Choose image opens the Assets pick mode for this record's field (G3-081)", async () => {
    const onOpenMediaLibrary = vi.fn();
    mount({ onOpenMediaLibrary });
    await openRow();
    fireEvent.click(screen.getByTestId("cms-field-photo-choose"));
    expect(onOpenMediaLibrary).toHaveBeenCalledWith(["image"], expect.any(Function), "Margherita · Photo");
    const pick = onOpenMediaLibrary.mock.calls[0][1] as (a: { src: string }) => void;
    React.act(() => pick({ src: "https://cdn.example/menu-01.jpg" }));
    expect(await screen.findByText("menu-01.jpg")).toBeInTheDocument();
    expect(screen.getByTestId("cms-sheet-save")).toBeEnabled();
  });
});

describe("RecordSheet · Preview ▸ (7116:76427)", () => {
  it("opens a read-only card from the form's current values, with the saved status", async () => {
    mount();
    await openRow();
    expect(screen.queryByTestId("cms-record-preview")).toBeNull();
    fireEvent.click(screen.getByTestId("cms-sheet-preview"));
    const card = screen.getByTestId("cms-record-preview-card");
    expect(card).toHaveTextContent("Margherita");
    fireEvent.change(screen.getByLabelText("Price *"), { target: { value: "$15" } });
    expect(card).toHaveTextContent("$15");
    expect(screen.getByTestId("cms-record-preview-status")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("cms-sheet-preview"));
    expect(screen.queryByTestId("cms-record-preview")).toBeNull();
  });
});
