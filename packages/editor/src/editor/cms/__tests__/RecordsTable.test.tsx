// @vitest-environment jsdom
/**
 * RecordsTable with the collection the verify seed actually stored
 * (scripts/audit/seed-verify.ts: `{ id, name, type }` fields — no `slug`, no
 * `order`). Live verification (results-editor-b2.md C-4) crashed opening it:
 * `Cannot read properties of null (reading 'dir')` in `head()`, because
 * `sort?.key === key` is `undefined === undefined` when nothing is sorted and
 * the column's key is a missing slug.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import { RecordsTable } from "../RecordsTable";

afterEach(cleanup);

const storedCollection = {
  id: "cmuhr2uw0001is9frerlpmchf",
  name: "Posts",
  slug: "posts",
  fields: [
    { id: "title", name: "Title", type: "text" },
    { id: "body", name: "Body", type: "richtext" },
    { id: "summary", name: "Summary", type: "text" },
  ],
  createdAt: "",
  updatedAt: "",
} as unknown as CMSCollection;

const records: CMSContentItem[] = [
  { id: "e1", collectionId: "c", data: { title: "Verify Post 1" }, status: "published", createdAt: "", updatedAt: new Date().toISOString() },
];

describe("RecordsTable · stored fields without a slug", () => {
  it("renders with no sort (null) instead of crashing", () => {
    render(<RecordsTable collection={storedCollection} records={records} query="" onOpenRecord={() => {}} />);
    expect(screen.getByTestId("cms-table")).toBeTruthy();
    for (const header of screen.getAllByRole("columnheader")) {
      expect(header.getAttribute("aria-sort")).toBe("none");
    }
  });

  it("sorting by Updated leaves the slugless columns unsorted", () => {
    render(<RecordsTable collection={storedCollection} records={records} query="" onOpenRecord={() => {}} />);
    fireEvent.click(screen.getByTestId("cms-th-__updated"));
    const sorted = screen.getAllByRole("columnheader").filter((h) => h.getAttribute("aria-sort") !== "none");
    expect(sorted).toHaveLength(1);
  });
});
