/**
 * The server now refuses any publish page path that is not a safe relative
 * `.html` file (`publishPathError`, P1-3 of the 2026-10-08 audit). Every name
 * the exporter really writes — from slugs as the Pages panel normalizes them —
 * must still pass, or the tightening would break publishing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { publishPathError } from "@buildrik/shared/schemas/publish";
import { pageFileNames } from "../pageFiles";
import { normalizeSlug } from "@/editor/sidebar/tabs/pages/utils/slug";

describe("exported page file names pass the server's publish path check", () => {
  it("home, plain, nested, typed-with-slash, slugless and colliding slugs", () => {
    const raw = ["home", "About Us", "/contact-us", "blog/My Post", "", "menu", "menu", "404", "docs/api"];
    const pages = raw.map((slug, i) => ({ id: `p${i}`, slug: normalizeSlug(slug), isHome: i === 0 }));
    // A slug saved before normalizeSlug stripped the leading slash (exporter strips it too).
    pages.push({ id: "legacy", slug: "/legacy-page", isHome: false });

    const names = [...pageFileNames(pages).values()];
    expect(names).toContain("blog/my-post.html");
    for (const name of names) expect([name, publishPathError(name)]).toEqual([name, null]);
  });
});
