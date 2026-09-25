/**
 * M7 round 2 — SITE_COLUMN_FIELDS is the list the Settings screens lock below
 * ADMIN. It must be exactly the projectSettings fields extractSiteColumnPatch
 * mirrors to Site columns: a field missing from the list is an EDITOR edit
 * that silently never reaches the site; an extra one locks project data (Global
 * CSS, Author) an EDITOR could always change. These tests pin the two together.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ProjectData } from "@shared/types";
import { SITE_COLUMN_FIELDS, extractSiteColumnPatch } from "../BuildrikSyncProvider";

const project = (settings: ProjectData["settings"]): ProjectData => ({
  version: "1",
  pages: [],
  styles: [],
  assets: [],
  settings,
});

describe("SITE_COLUMN_FIELDS ↔ extractSiteColumnPatch", () => {
  it("the fields extractSiteColumnPatch reads are exactly SITE_COLUMN_FIELDS", () => {
    const reads = new Set<string>();
    const section = (name: string) =>
      new Proxy(
        {},
        {
          get: (_t, key) => {
            if (typeof key === "string") reads.add(`${name}.${key}`);
            return "probe-value";
          },
        },
      );
    const settings = new Proxy(
      {},
      { get: (_t, key) => (typeof key === "string" ? section(key) : undefined) },
    );
    extractSiteColumnPatch(project(settings));
    expect([...reads].sort()).toEqual([...SITE_COLUMN_FIELDS].sort());
  });

  it.each(SITE_COLUMN_FIELDS)("%s, set alone, reaches the patch", (field) => {
    const [sectionKey, key] = field.split(".");
    const patch = extractSiteColumnPatch(project({ [sectionKey]: { [key]: "probe-value" } }));
    expect(Object.keys(patch).length).toBe(1);
  });

  it("project-only fields (Author lives in metadata; Twitter handle, Global CSS) are not in it", () => {
    expect(SITE_COLUMN_FIELDS).not.toContain("seo.twitterHandle");
    expect(SITE_COLUMN_FIELDS).not.toContain("customCode.globalCss");
  });
});
