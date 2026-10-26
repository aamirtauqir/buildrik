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
import { CMS_RECORD_STATUSES } from "@buildrik/shared/schemas/cms";
import { color as tokenColor } from "@/themes/tokens.generated";
import { RecordsTable, STATUS_TONES, recordStatusBadge } from "../RecordsTable";

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

/**
 * Board 165:2 (2L9, CMS records) gives the table a Status column of
 * StatusBadges (500:342149): Draft neutral, Published success, Changed since
 * publish warning. The statuses come from the CMS record schema
 * (CMS_RECORD_STATUSES), not from the board's sample rows.
 */
describe("CmsRecordsTable · status column", () => {
  const collection = {
    id: "c",
    name: "Blog",
    slug: "blog",
    displayField: "title",
    fields: [{ id: "title", slug: "title", name: "Title", type: "text" }],
    createdAt: "",
    updatedAt: "",
  } as unknown as CMSCollection;
  const at = (min: number) => new Date(Date.UTC(2026, 9, 22, 10, min)).toISOString();
  const rec = (id: string, extra: Partial<CMSContentItem>): CMSContentItem => ({
    id,
    collectionId: "c",
    data: { title: id },
    status: "draft",
    createdAt: at(0),
    updatedAt: at(1),
    ...extra,
  });
  const badge = (id: string) => screen.getByTestId(`cms-row-status-${id}`);

  it("renders a Badge per status: Draft→neutral, Published→success, Changed since publish→warning", () => {
    render(
      <RecordsTable
        collection={collection}
        query=""
        onOpenRecord={() => {}}
        records={[
          rec("d", { status: "draft" }),
          rec("p", { status: "published", publishedAt: at(1), updatedAt: at(1) }),
          rec("x", { status: "published", publishedAt: at(1), updatedAt: at(5) }),
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    expect(badge("d")).toHaveTextContent("Draft");
    expect(badge("d").getAttribute("data-tone")).toBe("neutral");
    expect(badge("p")).toHaveTextContent("Published");
    expect(badge("p").getAttribute("data-tone")).toBe("success");
    expect(badge("x")).toHaveTextContent("Changed since publish");
    expect(badge("x").getAttribute("data-tone")).toBe("warning");
    /* The old inline "· Draft" suffix on the name cell is gone. */
    expect(screen.queryByText("· Draft")).toBeNull();
  });

  it("each badge carries its status text (state is never colour-only)", () => {
    const records = CMS_RECORD_STATUSES.map((status) => rec(status, { status }));
    render(<RecordsTable collection={collection} query="" onOpenRecord={() => {}} records={records} />);
    for (const r of records) expect(badge(r.id).textContent?.trim()).not.toBe("");
  });

  it("every status in the CMS record Zod schema maps to a tone; an unmapped status falls back to neutral with its raw label", () => {
    for (const status of CMS_RECORD_STATUSES) {
      const b = recordStatusBadge(rec(status, { status }));
      expect(Object.keys(STATUS_TONES)).toContain(b.tone);
      expect(b.label).not.toBe(status);
    }
    const odd = { ...rec("o", {}), status: "scheduled" } as unknown as CMSContentItem;
    expect(recordStatusBadge(odd)).toEqual({ label: "scheduled", tone: "neutral" });
    render(<RecordsTable collection={collection} query="" onOpenRecord={() => {}} records={[odd]} />);
    expect(badge("o")).toHaveTextContent("scheduled");
    expect(badge("o").getAttribute("data-tone")).toBe("neutral");
  });

  it("a published record with no publish stamp (server rows carry none) reads Published", () => {
    expect(recordStatusBadge(rec("s", { status: "published", updatedAt: at(9) }))).toEqual({
      label: "Published",
      tone: "success",
    });
  });
});

describe("CmsRecordsTable · badge tone contrast ≥4.5:1", () => {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each([
    ["neutral", "#4B5563", "#F3F4F6", 6.87],
    ["success", "#057A55", "#DEF7EC", 4.75],
    ["warning", "#723B13", "#FDFDEA", 8.69],
  ] as const)("%s: tokens resolve to %s on %s, %f:1", (tone, fgHex, bgHex, expected) => {
    const { fg, bg, className } = STATUS_TONES[tone];
    expect(tokenColor[fg]).toBe(fgHex);
    expect(tokenColor[bg]).toBe(bgHex);
    /* The class string styles the badge with exactly these tokens. */
    expect(className).toContain(`var(--bk-${fg})`);
    expect(className).toContain(`var(--bk-${bg})`);
    const r = ratio(tokenColor[fg], tokenColor[bg]);
    expect(r).toBeGreaterThanOrEqual(4.5);
    expect(r).toBeCloseTo(expected, 1);
  });
});
