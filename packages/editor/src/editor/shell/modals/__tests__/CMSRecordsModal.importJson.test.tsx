/**
 * B13 — Records › Import JSON (SH-115, was a STUB with no door). Board 1170:4749
 * draws the button beside Add record; decision #31 names the states: an invalid
 * file says so on its own row, a partial import reports "N of M" and lists the
 * rows it skipped, and a progress bar runs while records are written. Each row
 * goes through `createContentItem`, the same write Add record uses.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CMSRecordsModal } from "../CMSRecordsModal";
import { parseRecordsJson } from "../parseRecordsJson";
import type { CMSCollection, CMSField } from "../../../../shared/types/cms";

const FIELDS: CMSField[] = [
  { id: "f1", name: "Title", slug: "title", type: "text", order: 0 },
  { id: "f2", name: "Price", slug: "price", type: "number", order: 1 },
];

const collection: CMSCollection = {
  id: "col-1", name: "Menu items", slug: "menu", fields: FIELDS, displayField: "title", createdAt: "", updatedAt: "",
};

describe("parseRecordsJson", () => {
  it("maps keys by slug or by field name, case-insensitively, and drops unknown keys", () => {
    const out = parseRecordsJson('[{"title":"A","Price":3,"junk":1},{"TITLE":"B"}]', FIELDS);
    expect(out).toEqual({ ok: true, rows: [{ row: 1, data: { title: "A", price: 3 } }, { row: 2, data: { title: "B" } }], invalid: [] });
  });

  it("names each row it cannot use, by its 1-based position", () => {
    const out = parseRecordsJson('[{"title":"A"}, 7, {"other":1}]', FIELDS);
    expect(out).toEqual({
      ok: true,
      rows: [{ row: 1, data: { title: "A" } }],
      invalid: [
        { row: 2, reason: "not an object" },
        { row: 3, reason: "no field of this collection" },
      ],
    });
  });

  it("refuses a file that is not a JSON array", () => {
    expect(parseRecordsJson("{nope", FIELDS)).toEqual({ ok: false, reason: "This file isn't valid JSON." });
    expect(parseRecordsJson('{"title":"A"}', FIELDS)).toEqual({ ok: false, reason: "Expected a JSON array of records." });
  });
});

function mount() {
  const created: Array<Record<string, unknown>> = [];
  const collections = {
    getAllCollections: vi.fn(() => [collection]),
    getContentItems: vi.fn(async () => []),
    createContentItem: vi.fn(async (_id: string, data: Record<string, unknown>) => {
      created.push(data);
      return { id: `r${created.length}` };
    }),
    updateContentItem: vi.fn(),
    deleteContentItem: vi.fn(),
  };
  const composer = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), cms: { collections } } as never;
  render(<CMSRecordsModal isOpen composer={composer} onClose={vi.fn()} />);
  return { collections, created };
}

const pick = (text: string) => {
  const input = screen.getByTestId("cms-records-import-input") as HTMLInputElement;
  const file = new File([text], "records.json", { type: "application/json" });
  fireEvent.change(input, { target: { files: [file] } });
};

describe("CMSRecordsModal — Import JSON", () => {
  it("imports the usable rows and reports the partial count and the skipped rows", async () => {
    const { collections, created } = mount();
    await screen.findByText("Menu items — 0 records");
    expect(screen.getByTestId("cms-records-import")).toHaveTextContent("Import JSON");
    pick('[{"title":"Margherita","price":14},{"title":"Diavola"},"bad"]');
    const result = await screen.findByTestId("cms-records-import-result");
    expect(result).toHaveTextContent("Imported 2 of 3 records");
    expect(result).toHaveTextContent("Row 3: not an object");
    expect(created).toEqual([{ title: "Margherita", price: 14 }, { title: "Diavola" }]);
    await waitFor(() => expect(collections.getContentItems.mock.calls.length).toBeGreaterThan(1));
  });

  it("an invalid file says so on its own row and writes nothing", async () => {
    const { collections } = mount();
    await screen.findByText("Menu items — 0 records");
    pick("not json");
    expect(await screen.findByTestId("cms-records-import-error")).toHaveTextContent("This file isn't valid JSON.");
    expect(collections.createContentItem).not.toHaveBeenCalled();
  });

  it("a row the engine refuses is counted as skipped, not as imported", async () => {
    const { collections } = mount();
    collections.createContentItem.mockImplementationOnce(async () => {
      throw new Error("Title is required");
    });
    await screen.findByText("Menu items — 0 records");
    pick('[{"title":""},{"title":"Ok"}]');
    const result = await screen.findByTestId("cms-records-import-result");
    expect(result).toHaveTextContent("Imported 1 of 2 records");
    expect(result).toHaveTextContent("Row 1: Title is required");
  });
});
