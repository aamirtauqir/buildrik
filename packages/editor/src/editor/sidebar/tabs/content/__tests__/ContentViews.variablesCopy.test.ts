/**
 * The Variables empty state described a substitution that does not happen.
 *
 * It read: "A variable is a value you write once and reuse — {{site.name}} in
 * any text on any page." Walked live: created `tagline` = "Bella Cucina",
 * typed {{site.tagline}} into a heading, and the canvas showed the braces
 * literally while `exportHTML` carried `{{site.tagline}}` and never the value.
 * The store is localStorage keyed by project id (contentPanelUtils), so the
 * publish worker cannot read it either, and the inspector's binding popover
 * lists collections only — nothing consumes a site variable today.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const views = readFileSync(join(__dirname, "..", "ContentViews.tsx"), "utf8");
const utils = readFileSync(join(__dirname, "..", "contentPanelUtils.ts"), "utf8");
const emptyState =
  views.slice(views.indexOf("No variables yet")).split("</div>")[0].replace(/\s+/g, " ");

describe("Variables empty state", () => {
  it("no longer promises substitution into page text", () => {
    expect(emptyState).not.toMatch(/in any text on any page/i);
  });

  it("says where the value lives and that pages do not read it", () => {
    expect(emptyState).toMatch(/saved in this browser/i);
    expect(emptyState).toMatch(/do not read it yet/i);
  });

  it("matches the store: variables are localStorage, not project data", () => {
    expect(utils).toMatch(/window\.localStorage\?\.setItem/);
    expect(utils).not.toMatch(/composer\.(setProjectSettings|updateProjectSettings)/);
  });
});
