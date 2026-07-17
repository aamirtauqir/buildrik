/**
 * elementProperties/config — getPropertiesForType always appends the shared
 * `default` fields and returns the type-specific set first.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { getPropertiesForType, ELEMENT_PROPERTIES } from "../config";

describe("getPropertiesForType", () => {
  it("returns type-specific fields followed by the default fields", () => {
    const props = getPropertiesForType("link");
    const ids = props.map((p) => p.id);
    // link-specific fields come first…
    expect(ids.slice(0, 4)).toEqual(["href", "target", "rel", "title"]);
    // …and the shared default fields are appended.
    expect(ids).toContain("id");
    expect(ids).toContain("tabindex");
  });

  it("falls back to just the default fields for an unknown type", () => {
    const props = getPropertiesForType("totally-unknown-xyz");
    expect(props.map((p) => p.id)).toEqual(
      ELEMENT_PROPERTIES.default.map((p) => p.id)
    );
  });

  it("declares heading's Level as a select with h1–h6 options", () => {
    const level = getPropertiesForType("heading").find((p) => p.id === "level");
    expect(level?.type).toBe("select");
    expect(level?.options?.map((o) => o.value)).toEqual([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]);
  });

  it("declares checkbox-typed fields for boolean attributes (e.g. image has none but video does)", () => {
    const video = getPropertiesForType("video");
    const autoplay = video.find((p) => p.id === "autoplay");
    expect(autoplay?.type).toBe("checkbox");
  });

  // FIXED: types whose specific list ALSO defines an id present in `default`
  // no longer produce a duplicate entry — image/link/iframe all carry a
  // "title" field, and the default "title" is dropped in favor of the
  // type-specific one. ElementPropertiesSection therefore renders a single
  // "Title" field (no React "two children with the same key `title`" warning).
  it("de-dupes fields by id, keeping the type-specific definition", () => {
    const props = getPropertiesForType("image");
    const titleFields = props.filter((p) => p.id === "title");
    expect(titleFields).toHaveLength(1);
    // the surviving field is the image-specific one (its placeholder), not
    // the generic default ("Element title").
    expect(titleFields[0].placeholder).toBe("Image title");
    // every id in the returned list is unique
    const ids = props.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("emits exactly one 'title' for image", () => {
    const titleFields = getPropertiesForType("image").filter((p) => p.id === "title");
    expect(titleFields).toHaveLength(1);
  });
});
