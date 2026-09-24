import { describe, it, expect } from "vitest";
import { editorSaveProjectSchema, saveProjectDataSchema } from "../sites";

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

  it("rejects non-integer dsSchemaVersion", () => {
    const invalid = {
      siteId: "site-1",
      pages: [],
      dsSchemaVersion: 1.5,
    };
    expect(() => saveProjectDataSchema.parse(invalid)).toThrow();
  });

  it("accepts dsSchemaVersion=0 (inclusive lower bound)", () => {
    const valid = {
      siteId: "site-1",
      pages: [],
      dsSchemaVersion: 0,
    };
    expect(() => saveProjectDataSchema.parse(valid)).not.toThrow();
  });
});

/* Walk A2 (2026-09-24): the editor save stripped dsSchemaVersion, so the DS
   migration re-ran on every open. */
describe("editorSaveProjectSchema — dsSchemaVersion", () => {
  it("keeps the migration version on the editor's save", () => {
    const parsed = editorSaveProjectSchema.parse({
      siteId: "s",
      projectData: { version: "1.0.0", pages: [], styles: [], assets: [], dsSchemaVersion: 3 },
    });
    expect(parsed.projectData.dsSchemaVersion).toBe(3);
  });
});
