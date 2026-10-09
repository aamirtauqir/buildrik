import { describe, expect, it } from "vitest";
import { asContentRoot, detectContentIssues } from "../contentIssues";
import type { ContentElement as ElementData, ContentPage as PageData } from "../contentIssues";

function el(partial: Partial<ElementData> & { id: string }): ElementData {
  return { type: "container", ...partial } as ElementData;
}

function page(partial: Partial<PageData> & { id: string; root: ElementData }): PageData {
  return { name: partial.name ?? "Home", ...partial } as PageData;
}

describe("detectContentIssues", () => {
  it("flags an image with no alt attribute at all", () => {
    const pages = [
      page({
        id: "home",
        root: el({ id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png" } }),
      }),
    ];
    const findings = detectContentIssues(pages);
    expect(findings).toHaveLength(1);
    /* L4-033 (owner default 2026-10-09): a warning, as the server's
       pre-publish check has always reported it — not a publish-blocking
       error in the editor and a warning on the server. */
    expect(findings[0]).toMatchObject({ kind: "missing-alt", type: "warning", elementId: "img1", pageId: "home" });
  });

  /* L1-035 / L1-016: an image with no file ships as a broken <img>, and the
     Image block's own "Image" alt is a placeholder, not a description. */
  it("flags an image with no src as having no file", () => {
    const pages = [page({ id: "home", root: el({ id: "img1", type: "image", tagName: "img", attributes: { alt: "Team photo" } }) })];
    expect(detectContentIssues(pages)).toEqual([
      expect.objectContaining({ kind: "missing-image", type: "warning", elementId: "img1", message: "Image has no file" }),
    ]);
  });

  it("treats the block's placeholder alt \"Image\" as missing alt text", () => {
    const pages = [page({ id: "home", root: el({ id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png", alt: "Image" } }) })];
    expect(detectContentIssues(pages)).toEqual([expect.objectContaining({ kind: "missing-alt", elementId: "img1" })]);
  });

  it("does not flag an image with alt=\"\" (decorative, deliberate)", () => {
    const pages = [
      page({
        id: "home",
        root: el({ id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png", alt: "" } }),
      }),
    ];
    expect(detectContentIssues(pages)).toHaveLength(0);
  });

  it("does not flag an image with data.decorative even without alt", () => {
    const pages = [
      page({
        id: "home",
        root: el({ id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png" }, data: { decorative: true } }),
      }),
    ];
    expect(detectContentIssues(pages)).toHaveLength(0);
  });

  it("flags an image with real alt text as clean", () => {
    const pages = [
      page({
        id: "home",
        root: el({ id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png", alt: "A logo" } }),
      }),
    ];
    expect(detectContentIssues(pages)).toHaveLength(0);
  });

  it("flags an empty href", () => {
    const pages = [
      page({ id: "home", root: el({ id: "l1", type: "link", tagName: "a", attributes: { href: "" } }) }),
    ];
    expect(detectContentIssues(pages)[0]).toMatchObject({ kind: "broken-link", type: "error" });
  });

  it("flags a bare # href as a warning", () => {
    const pages = [
      page({ id: "home", root: el({ id: "l1", type: "link", tagName: "a", attributes: { href: "#" } }) }),
    ];
    expect(detectContentIssues(pages)[0]).toMatchObject({ kind: "broken-link", type: "warning" });
  });

  it("flags a link to a page id that no longer exists", () => {
    const pages = [
      page({ id: "home", root: el({ id: "l1", type: "link", tagName: "a", attributes: { href: "#page:ghost" } }) }),
    ];
    expect(detectContentIssues(pages)[0]).toMatchObject({ kind: "broken-link", type: "error" });
  });

  it("does not flag a link to a page id that exists", () => {
    const pages = [
      page({ id: "home", root: el({ id: "l1", type: "link", tagName: "a", attributes: { href: "#page:home" } }) }),
      page({ id: "about", root: el({ id: "root-about" }) }),
    ];
    expect(detectContentIssues(pages)).toHaveLength(0);
  });

  it("flags a malformed external URL", () => {
    const pages = [
      page({ id: "home", root: el({ id: "l1", type: "link", tagName: "a", attributes: { href: "ht!tp://broken" } }) }),
    ];
    expect(detectContentIssues(pages)[0]).toMatchObject({ kind: "broken-link", type: "warning" });
  });

  it("does not flag a well-formed external URL, mailto, tel, or anchor", () => {
    const pages = [
      page({
        id: "home",
        root: el({
          id: "root",
          children: [
            el({ id: "l1", type: "link", tagName: "a", attributes: { href: "https://example.com" } }),
            el({ id: "l2", type: "link", tagName: "a", attributes: { href: "mailto:hi@example.com" } }),
            el({ id: "l3", type: "link", tagName: "a", attributes: { href: "tel:+15551234567" } }),
            el({ id: "l4", type: "link", tagName: "a", attributes: { href: "#section-2" } }),
          ],
        }),
      }),
    ];
    expect(detectContentIssues(pages)).toHaveLength(0);
  });

  /* Lv3 #1: `new URL(href)` with no base threw on every root-relative path,
     so `/about`, `/services` and `/` were all "malformed" in the Issues panel
     and the Links pre-check (live S1: "2 links are broken", every link valid). */
  it("does not flag root-relative, dot-relative, query, protocol-relative or bare-file links", () => {
    // Review #1: `ftp/docs` and `http/x` are real relative folders, not typos.
    const hrefs = ["/", "/about", "/services?x=1#top", "./contact", "../index.html", "?q=1", "//cdn.example.com/a.png", "about.html", "ftp/docs", "http/x"];
    const pages = [
      page({
        id: "home",
        root: el({
          id: "root",
          children: hrefs.map((href, i) => el({ id: `l${i}`, type: "link", tagName: "a", attributes: { href } })),
        }),
      }),
    ];
    expect(detectContentIssues(pages)).toEqual([]);
  });

  it("still flags scheme typos and unparseable absolute URLs", () => {
    const hrefs = ["http//example.com", "https:/", "www.example.com", "ht!tp://broken", "https://exa mple.com:99999"];
    const pages = [
      page({
        id: "home",
        root: el({
          id: "root",
          children: hrefs.map((href, i) => el({ id: `l${i}`, type: "link", tagName: "a", attributes: { href } })),
        }),
      }),
    ];
    const findings = detectContentIssues(pages);
    expect(findings.map((f) => f.elementId)).toEqual(["l0", "l1", "l2", "l3", "l4"]);
    expect(findings.every((f) => f.message === "Link URL looks malformed")).toBe(true);
  });

  it("walks nested children across multiple pages, tagging each finding with its own pageId", () => {
    const pages = [
      page({
        id: "home",
        root: el({
          id: "root",
          children: [el({ id: "img1", type: "image", tagName: "img", attributes: { src: "/a.png" } })],
        }),
      }),
      page({
        id: "about",
        root: el({
          id: "root2",
          children: [el({ id: "l1", type: "link", tagName: "a", attributes: { href: "" } })],
        }),
      }),
    ];
    const findings = detectContentIssues(pages);
    expect(findings).toHaveLength(2);
    expect(findings.find((f) => f.elementId === "img1")?.pageId).toBe("home");
    expect(findings.find((f) => f.elementId === "l1")?.pageId).toBe("about");
  });

  it("treats a #page: target as alive when it is in existingPageIds but not scanned (server: hidden pages)", () => {
    const pages = [
      page({ id: "home", root: el({ id: "a1", type: "link", tagName: "a", attributes: { href: "#page:hidden" } }) }),
    ];
    expect(detectContentIssues(pages)).toHaveLength(1);
    expect(detectContentIssues(pages, ["home", "hidden"])).toHaveLength(0);
  });

  it("skips a malformed stored children value instead of throwing", () => {
    const root = { id: "r", type: "container", children: "oops" } as unknown as ElementData;
    expect(() => detectContentIssues([page({ id: "home", root })])).not.toThrow();
  });
});

describe("asContentRoot", () => {
  it("accepts a stored element root and rejects legacy/empty shapes", () => {
    expect(asContentRoot({ id: "root", type: "container" })?.id).toBe("root");
    expect(asContentRoot([])).toBeUndefined();
    expect(asContentRoot(null)).toBeUndefined();
    expect(asContentRoot({ type: "container" })).toBeUndefined();
  });
});
