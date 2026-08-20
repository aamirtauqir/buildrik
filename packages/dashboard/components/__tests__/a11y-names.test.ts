/**
 * Controls that carry no text still say what they are.
 *
 * An axe pass over eleven dashboard routes (WCAG 2.0/2.1 A+AA, with the
 * agentation dev overlay stripped) returned criticals on four of them: the
 * Sites row overflow buttons and select-all checkboxes had no accessible name,
 * the SEO "allow indexing" switch was an unnamed button carrying `aria-pressed`,
 * the eight notification email selects were unnamed, and the redirects 301/302
 * select was unnamed. Serious contrast failures came with them: the top-nav
 * search placeholder (4.39:1, on every page), the disabled "View site" pill,
 * and the success figures on the overview (3.38:1).
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

describe("named controls", () => {
  it("the site row's overflow menu names its site", () => {
    const src = read("sites/context-menu.tsx");
    expect(src).toMatch(/aria-label=\{siteName \? `More options for \$\{siteName\}` : "More options"\}/);
    expect(src).toMatch(/aria-haspopup="menu"/);
    expect(read("sites/site-card-full.tsx")).toMatch(/siteName=\{site\.name\}/);
    expect(read("sites/site-list-view.tsx")).toMatch(/siteName=\{site\.name\}/);
  });

  it("the site select checkbox names its site", () => {
    expect(read("sites/site-card-full.tsx")).toMatch(/aria-label=\{`Select \$\{site\.name\}`\}/);
  });

  it("the indexing toggle is a named switch", () => {
    const src = read("site-detail/seo-tab.tsx");
    expect(src).toMatch(/role="switch"/);
    expect(src).toMatch(/aria-checked=\{indexing\}/);
    expect(src).toMatch(/aria-label="Allow search engines to index this site"/);
    expect(src).not.toMatch(/aria-pressed/);
  });

  it("both selects say what they set", () => {
    expect(read("settings/notification-prefs.tsx")).toMatch(
      /aria-label=\{`Email frequency for \$\{pref\.category\}`\}/,
    );
    expect(read("site-detail/redirects-tab.tsx")).toMatch(/aria-label="Redirect type"/);
  });
});

describe("small text clears AA", () => {
  it("the top-nav search uses the secondary text colour, not the placeholder one", () => {
    expect(read("dashboard/shell/top-nav.tsx")).not.toMatch(/color: "var\(--color-text-placeholder\)"/);
  });

  it("figures use the -text tokens rather than the fill colours", () => {
    expect(read("dashboard/dataviz.tsx")).toMatch(/var\(--color-success-text\)/);
    const overview = read("site-detail/overview-tab.tsx");
    expect(overview).toMatch(/healthTextColor/);
    expect(overview).toMatch(/var\(--color-success-text\)/);
  });

  it("the disabled View-site pill dims by colour, not opacity", () => {
    const src = read("site-detail/site-header.tsx");
    const pill = src.slice(Math.max(0, src.indexOf("Publish your site first") - 500), src.indexOf("Publish your site first"));
    expect(pill).not.toMatch(/opacity-50/);
  });
});
