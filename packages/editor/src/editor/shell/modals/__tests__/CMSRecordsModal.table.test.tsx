/**
 * CMSRecordsModal — the records table (board 1170:4749).
 *
 * The modal used to render a flat list showing only the display field, so every
 * other field on a record was invisible until you opened it. The board draws a
 * table whose columns are the collection's own leading fields plus Updated.
 *
 * The load-bearing test here is the negative one: the board also draws an
 * `Import JSON` button, and the engine has no bulk or JSON import path —
 * `createContentItem` takes one record at a time. A button with nothing to call
 * must not ship, and a test is what keeps it from drifting back in.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CMSRecordsModal } from "../CMSRecordsModal";
import type { CMSCollection, CMSContentItem } from "../../../../shared/types/cms";

function makeCollection(over: Partial<CMSCollection> = {}): CMSCollection {
  return {
    id: "col-1",
    name: "Menu items",
    slug: "menu",
    fields: [
      { id: "f1", name: "Title", slug: "title", type: "text", order: 0 },
      { id: "f2", name: "Price", slug: "price", type: "text", order: 1 },
      { id: "f3", name: "Photo", slug: "photo", type: "image", order: 2 },
      { id: "f4", name: "Notes", slug: "notes", type: "text", order: 3 },
    ],
    displayField: "title",
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function makeItem(over: Partial<CMSContentItem> = {}): CMSContentItem {
  return {
    id: "r1",
    collectionId: "col-1",
    data: { title: "Margherita", price: "$14", photo: "asset-1", notes: "hidden" },
    status: "draft",
    createdAt: "",
    updatedAt: "2020-01-02T00:00:00.000Z",
    ...over,
  };
}

function makeComposer(collection: CMSCollection, items: CMSContentItem[]) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    cms: {
      collections: {
        getAllCollections: vi.fn().mockReturnValue([collection]),
        getContentItems: vi.fn().mockResolvedValue(items),
        createContentItem: vi.fn().mockResolvedValue(undefined),
        updateContentItem: vi.fn().mockResolvedValue(undefined),
        deleteContentItem: vi.fn().mockResolvedValue(undefined),
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const open = (collection = makeCollection(), items = [makeItem()]) =>
  render(<CMSRecordsModal isOpen composer={makeComposer(collection, items)} onClose={vi.fn()} />);

describe("CMSRecordsModal — records table", () => {
  it("names the collection and its record count in the title", async () => {
    open(makeCollection(), [makeItem(), makeItem({ id: "r2" })]);
    expect(await screen.findByText("Menu items — 2 records")).toBeTruthy();
  });

  it("singularises the count", async () => {
    open();
    expect(await screen.findByText("Menu items — 1 record")).toBeTruthy();
  });

  it("builds columns from the collection's leading fields, plus Updated", async () => {
    open();
    const headers = (await screen.findAllByRole("columnheader")).map((h) => h.textContent);
    // Three field columns fit the frame; "Notes" is the fourth field and is out.
    expect(headers).toEqual(["Title", "Price", "Photo", "Updated", "Actions"]);
  });

  it("shows a filled image field as present and an empty one as missing", async () => {
    open(makeCollection(), [
      makeItem(),
      makeItem({ id: "r2", data: { title: "Tiramisu", price: "$9", photo: "" } }),
    ]);
    expect(await screen.findByText("✓ photo")).toBeTruthy();
    expect(screen.getByText("— missing")).toBeTruthy();
  });

  it("renders every leading field's value, not only the display field", async () => {
    open();
    /* Await the CELL, not the row: the header row exists on first paint, so
       findAllByRole("row") resolves before the records have loaded. */
    const cell = await screen.findByText("Margherita");
    const row = cell.closest("tr")!;
    expect(within(row).getByText("$14")).toBeTruthy();
    expect(within(row).getByText("✓ photo")).toBeTruthy();
  });

  it("keeps the row actions the board does not draw — they are real capability", async () => {
    open();
    expect(await screen.findByRole("button", { name: /publish record/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /edit record/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /delete record/i })).toBeTruthy();
  });

  it("offers no Import JSON, because no bulk import path exists", async () => {
    open();
    await screen.findByText("Menu items — 1 record");
    expect(screen.queryByRole("button", { name: /import/i })).toBeNull();
  });

  it("explains an empty collection inside the table rather than dropping it", async () => {
    open(makeCollection(), []);
    expect(await screen.findByText("No records yet.")).toBeTruthy();
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(0);
  });
});
