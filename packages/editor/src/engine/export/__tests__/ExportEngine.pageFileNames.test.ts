/**
 * `pageFileNames` was lifted out of `ExportEngine` so the CMS Dynamic pages
 * tab can bind a template page by the same file name the publish payload
 * carries. A site without dynamic pages must export exactly as before: same
 * file names, same internal hrefs. These literals are the pre-extraction
 * output of the inline rule.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { ExportEngine, pageFileNames } from "../ExportEngine";

const link = (id: string, href: string) => ({ id, type: "link", tagName: "a", content: "About", children: [], attributes: { href } });
const page = (id: string, slug: string, extra: Record<string, unknown> = {}) => ({
  id, name: id, slug, root: { id: `r-${id}`, type: "container", tagName: "div", children: [link(`l-${id}`, "#page:about")] }, ...extra,
});

/* Home first, then a plain slug, a slug written as a path, a slugless page
   and two pages whose slugs collide — every branch of the rule. */
const PAGES = [
  page("home", "home", { isHome: true }),
  page("about", "about"),
  page("team", "/team"),
  page("blank", ""),
  page("dup-a", "menu"),
  page("dup-b", "menu"),
];

function makeComposer(pageSet: unknown[]) {
  return {
    elements: { exportPages: vi.fn().mockReturnValue(pageSet) },
    styles: { generateResponsiveCSS: vi.fn().mockReturnValue(""), generateCSS: vi.fn().mockReturnValue("") },
    getProjectSettings: vi.fn().mockReturnValue(undefined),
  } as unknown as ConstructorParameters<typeof ExportEngine>[0];
}

describe("pageFileNames — export output unchanged for sites without dynamic pages", () => {
  it("keeps the inline rule's names", () => {
    expect([...pageFileNames(PAGES as never).entries()]).toEqual([
      ["home", "index.html"],
      ["about", "about.html"],
      ["team", "team.html"],
      ["blank", "page-4.html"],
      ["dup-a", "menu.html"],
      ["dup-b", "menu-2.html"],
    ]);
  });

  it("is exactly the set of files the export writes, and internal links still resolve to them", async () => {
    const { files } = await new ExportEngine(makeComposer(PAGES)).exportAllPages({ format: "html" });
    const html = files.filter((f) => f.name.endsWith(".html")).map((f) => f.name).sort();
    expect(html).toEqual([...pageFileNames(PAGES as never).values()].sort());
    const home = files.find((f) => f.name === "index.html")?.content ?? "";
    expect(home).toContain('href="about.html"');
    expect(home).not.toContain("#page:");
  });
});
