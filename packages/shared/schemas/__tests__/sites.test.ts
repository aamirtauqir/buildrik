import { describe, it, expect } from "vitest";
import { saveProjectDataSchema } from "../sites";

describe("saveProjectDataSchema", () => {
  it("accepts dsSchemaVersion as optional non-negative integer", () => {
    const valid = {
      siteId: "site-1",
      pages: [],
      dsSchemaVersion: 1,
    };
    expect(() => saveProjectDataSchema.parse(valid)).not.toThrow();
  });

  it("rejects negative dsSchemaVersion", () => {
    const invalid = {
      siteId: "site-1",
      pages: [],
      dsSchemaVersion: -1,
    };
    expect(() => saveProjectDataSchema.parse(invalid)).toThrow();
  });

  it("treats missing dsSchemaVersion as undefined (optional)", () => {
    const valid = { siteId: "site-1", pages: [] };
    const parsed = saveProjectDataSchema.parse(valid);
    expect(parsed.dsSchemaVersion).toBeUndefined();
  });
});
