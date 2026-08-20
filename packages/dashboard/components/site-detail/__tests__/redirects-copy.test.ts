/**
 * The Redirects screen describes what it does, not what it doesn't.
 *
 * Two claims, both untrue when read against the code:
 *  - "Forward old URLs to new ones" — the publish payload is HTML pages plus
 *    robots.txt (`app/api/workers/publish/[jobId]/route.ts`); no vercel.json,
 *    no redirect config, so a stored rule never reaches the deployed site.
 *  - "Renaming a page slug auto-creates one" — nothing writes a Redirect row
 *    outside this screen's own Add and Import CSV (`redirect.service.ts` is
 *    called only from the site-detail router). The editor keeps slug history on
 *    the page; it does not create redirects.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tab = readFileSync(join(__dirname, "../redirects-tab.tsx"), "utf8");
/* Strip the JSX comments first — they quote the old copy to explain why it
   went, and an unstripped file matches its own history. */
const rendered = tab.slice(tab.indexOf("return (")).replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("redirects copy", () => {
  it("does not claim the rules are applied to the published site", () => {
    expect(rendered).not.toMatch(/Forward old URLs to new ones/);
    expect(rendered).toMatch(/isn&rsquo;t wired up yet/);
  });

  it("does not claim a rename creates one", () => {
    expect(rendered).not.toMatch(/auto-creates one/);
    expect(rendered).toMatch(/Add one above, or import a CSV\./);
  });

  it("still says what the two types mean", () => {
    expect(rendered).toMatch(/301 = permanent \(SEO\), 302 = temporary/);
  });
});
