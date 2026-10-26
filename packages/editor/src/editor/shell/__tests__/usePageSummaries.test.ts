/**
 * toPageSummaries — the shell's page list: display slug, nesting depth, the
 * CMS template binding (`pageTemplatePath` = the page's published file) and
 * the dirty flag.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { CMSCollection, PageData } from "@/shared/types";
import { toPageSummaries } from "../usePageSummaries";

const page = (over: Partial<PageData>) => ({ id: "x", name: "X", root: {}, ...over }) as PageData;
const collection = (over: Partial<CMSCollection>) => ({ id: "c", name: "C", fields: [], ...over }) as CMSCollection;

const PAGES = [
  page({ id: "home", name: "Home", slug: "home", isHome: true }),
  page({ id: "web", name: "Web", slug: "services/web" }),
  page({ id: "noslug", name: "Our Team" }),
  page({ id: "post", name: "Post template", slug: "post" }),
];

describe("toPageSummaries", () => {
  it("home reads /, other slugs are paths, nesting comes from the slug", () => {
    const [home, web, noslug] = toPageSummaries(PAGES, [], new Set());
    expect(home).toMatchObject({ slug: "/", isHome: true, kind: "static", depth: 0 });
    expect(web).toMatchObject({ slug: "/services/web", depth: 1 });
    expect(noslug.slug).toBe("/our-team");
  });

  it("a page a collection renders through is a template, with the collection's pattern as its slug", () => {
    const blog = collection({ id: "c-blog", name: "Blog post", pageSlugPattern: "blog/:slug", pageTemplatePath: "post.html" });
    const unbound = collection({ id: "c-x", name: "Unbound", pageTemplatePath: "web.html" });
    const out = toPageSummaries(PAGES, [blog, unbound], new Set(["web"]));
    expect(out[3]).toMatchObject({
      kind: "template",
      collectionId: "c-blog",
      collectionName: "Blog post",
      slug: "/blog/:slug",
      depth: 0,
    });
    /* No slug pattern = no generated pages = not a template. */
    expect(out[1]).toMatchObject({ kind: "static", dirty: true });
    expect(out[0].dirty).toBe(false);
  });
});
