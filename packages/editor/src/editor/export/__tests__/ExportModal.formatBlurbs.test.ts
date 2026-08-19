/**
 * The one line under the export title has to describe the archive the user
 * actually receives.
 *
 * The board's own sentence says "styles inlined". That is true of the single
 * HTML file (cssStyle defaults to embedded) and false of the ZIP, which ships
 * one `styles.css` that every page links plus an `assets/` folder — the shape
 * generateZip builds, asserted next door in ExportEngine.zipAllPages.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const modal = readFileSync(join(__dirname, "..", "ExportModal.tsx"), "utf8");
/* Scoped to the blurb map — `formatNoun` above it has the same keys, and a
   bare key regex reads "ZIP" out of that one instead. */
const blurbs = modal.slice(modal.indexOf("const formatBlurb"));
const blurb = (key: string) => blurbs.match(new RegExp(`\\n\\s*${key}: "([^"]+)"`))?.[1] ?? "";

describe("export format blurbs", () => {
  it("does not tell the ZIP user their styles are inlined", () => {
    expect(blurb("zip")).not.toMatch(/inlined/);
  });

  it("names the stylesheet and the media the ZIP carries", () => {
    expect(blurb("zip")).toMatch(/stylesheet/i);
    expect(blurb("zip")).toMatch(/media/i);
  });

  it("keeps the inlined claim where it is true — the single HTML file", () => {
    expect(blurb("html")).toMatch(/inlined/);
  });
});
