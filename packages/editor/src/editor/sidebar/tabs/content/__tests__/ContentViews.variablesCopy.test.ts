/**
 * The Variables empty state must say what a variable actually does.
 *
 * Until G3-075 it could not promise substitution: variables lived in one
 * browser's localStorage and nothing replaced {{site.*}}. They are now saved
 * in the project settings and the export writes each value in place of its
 * {{site.<key>}} (ExportEngine.withSiteVariables). The canvas still shows the
 * braces as typed, and the copy says that too.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const views = readFileSync(join(__dirname, "..", "ContentViews.tsx"), "utf8");
const hook = readFileSync(join(__dirname, "..", "useContentPanel.ts"), "utf8");
const exporter = readFileSync(join(__dirname, "..", "..", "..", "..", "..", "engine", "export", "ExportEngine.ts"), "utf8");
const emptyState =
  views.slice(views.indexOf("No variables yet")).split("</div>")[0].replace(/\s+/g, " ");

describe("Variables empty state", () => {
  it("promises the published page, and admits the canvas shows braces", () => {
    expect(emptyState).toMatch(/published page shows the value/i);
    expect(emptyState).toMatch(/canvas shows the braces/i);
  });

  it("matches the code: saved in the project, substituted by the export", () => {
    expect(hook).toMatch(/setProjectSettings\(\{ \.\.\.composer\.getProjectSettings\(\), siteVariables: vars \}\)/);
    expect(exporter).toMatch(/private withSiteVariables\(/);
  });
});
