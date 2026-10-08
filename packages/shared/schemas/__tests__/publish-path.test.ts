/**
 * P1-3 (2026-10-08 audit): a publish page's `path` becomes a file in the
 * workspace owner's Vercel deployment. It was any 1–500 char string, so an
 * EDITOR could ship `vercel.json` (overriding the ADMIN-owned headers and
 * redirects) or `api/*` alongside the pages. Only relative `.html` page paths
 * may reach the deployment — and every path the exporter and the CMS page
 * generator really produce must still pass.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { publishPageSchema, publishPathError } from "../publish";
import { cmsRecordPath } from "../cms";

describe("publishPathError", () => {
  it.each([
    "index.html",
    "about.html",
    "about-2.html",
    "page-3.html",
    "404.html",
    "blog/post.html",
    "docs/getting-started/install.html",
    // CMS dynamic pages: `${cmsRecordPath(...)}/index.html` (cms.service generateDynamicPages)
    `${cmsRecordPath("blog/{slug}", { slug: "My First Post!" })}/index.html`,
    "index/index.html",
  ])("accepts the generated page path %s", (path) => {
    expect(publishPathError(path)).toBeNull();
  });

  it.each([
    ["vercel.json"],
    ["robots.txt"],
    ["sitemap.xml"],
    ["api/x.js"],
    ["api/hook.html"],
    ["_next/static/x.html"],
    ["_vercel/insights.html"],
    [".well-known/x.html"],
    ["blog/.hidden.html"],
    ["/index.html"],
    ["../outside.html"],
    ["blog/../../x.html"],
    ["blog/./x.html"],
    ["blog//x.html"],
    ["blog\\x.html"],
    ["a\u0000.html"],
    ["page.HTML.js"],
  ])("refuses %s", (path) => {
    expect(publishPathError(path)).not.toBeNull();
  });
});

describe("publishPageSchema", () => {
  it("rejects a page whose path is not a safe .html path", () => {
    expect(publishPageSchema.safeParse({ path: "vercel.json", html: "{}" }).success).toBe(false);
    expect(publishPageSchema.safeParse({ path: "about.html", html: "<p>x</p>" }).success).toBe(true);
  });
});
