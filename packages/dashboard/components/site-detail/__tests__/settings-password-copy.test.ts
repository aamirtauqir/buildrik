/**
 * The site-password toggle says when it takes effect.
 *
 * The password is enforced by Vercel deployment protection, and the only thing
 * that pushes it is the publish worker (`publish.service.ts` reconciles it
 * during runVercelDeploy). Saving the setting changes the stored value and
 * nothing on the live site — so a site switched ON stays open to anyone with
 * the URL until the next publish, and one switched OFF stays locked. The
 * toggle's own words were "Require password to view published site", which
 * reads as a fact about the live site right now.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tab = readFileSync(join(__dirname, "../settings-tab.tsx"), "utf8");
const rendered = tab.slice(tab.indexOf("return (")).replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("site password copy", () => {
  it("says the change reaches the live site on the next publish", () => {
    expect(rendered).toMatch(/Applied when you next publish/);
    expect(rendered).toMatch(/keeps its current access until then/);
  });

  it("still labels what the toggle does", () => {
    expect(rendered).toMatch(/Require password to view published site/);
  });
});
