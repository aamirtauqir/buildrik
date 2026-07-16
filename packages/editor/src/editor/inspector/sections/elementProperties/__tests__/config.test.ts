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

  // BUG (pinned): types whose specific list ALSO defines an id present in
  // `default` produce a duplicate entry — image/link/iframe all carry a
  // "title" field, and `default` adds another "title". getPropertiesForType
  // does not de-dupe, so ElementPropertiesSection renders two "Title" fields
  // with the same key (React "two children with the same key `title`"
  // warning) that share attribute state. Should de-dupe by id, keeping the
  // type-specific definition. Pinning current (buggy) behavior.
  it.todo(
    "should de-dupe fields by id so a type-specific 'title' isn't duplicated by the default 'title'"
  );

  it("PIN: getPropertiesForType currently emits a duplicate 'title' for image", () => {
    const titleFields = getPropertiesForType("image").filter((p) => p.id === "title");
    expect(titleFields).toHaveLength(2); // known bug — see it.todo above
  });
});
