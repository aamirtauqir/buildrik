/**
 * L1-023 (editor audit 2026-10-08): "btn" answered "Nothing matches 'btn'".
 * Common short forms resolve to the word the catalogue uses.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { FlatElEntry } from "../../catalog/types";
import { searchInsert } from "../search";

const el = (name: string, tags: string[] = []): FlatElEntry =>
  ({ name, description: "", tags, catName: "Basic", catId: "basic" }) as unknown as FlatElEntry;

const ELEMENTS = [el("Button", ["button"]), el("Image", ["img"]), el("Divider", ["hr"]), el("Text", ["p"])];
const labels = (q: string) => searchInsert(q, ELEMENTS, []).map((h) => h.label);

describe("searchInsert — short forms", () => {
  it("btn finds Button", () => expect(labels("btn")).toEqual(["Button"]));
  it("pic and photo find Image", () => {
    expect(labels("pic")).toEqual(["Image"]);
    expect(labels("photo")).toEqual(["Image"]);
  });
  it("separator finds Divider", () => expect(labels("separator")).toEqual(["Divider"]));
  it("paragraph finds Text", () => expect(labels("paragraph")).toEqual(["Text"]));
  it("a plain word still matches as before", () => expect(labels("butt")).toEqual(["Button"]));
  it("nonsense still finds nothing", () => expect(labels("zzz")).toEqual([]));
});
