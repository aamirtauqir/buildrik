import { describe, expect, it } from "vitest";
import {
  blankPageRoot,
  claimUniqueIds,
  copyIdKeyedRecord,
  copyIdKeyedStyles,
  copiesForRenamedIds,
  newPageRoot,
  reidSite,
  stableElementId,
  withUniqueIds,
} from "../elementIds";

const tree = (text: string) => ({
  id: "root",
  type: "container",
  children: [{ id: "ai-hero-0", type: "container", content: text, attributes: { id: "top" }, children: [] }],
});

describe("stableElementId", () => {
  it("is deterministic and depends on page, id and occurrence", () => {
    expect(stableElementId("p2", "root", 0)).toBe(stableElementId("p2", "root", 0));
    expect(stableElementId("p2", "root", 0)).not.toBe(stableElementId("p3", "root", 0));
    expect(stableElementId("p2", "root", 0)).not.toBe(stableElementId("p2", "root", 1));
    expect(stableElementId("p2", "root", 0)).toMatch(/^el-[0-9a-z]+$/);
  });
});

describe("claimUniqueIds", () => {
  it("keeps free ids, renames taken ones and in-page repeats, records all ids", () => {
    const taken = new Set(["root"]);
    const root = { id: "root", children: [{ id: "a", children: [] }, { id: "a", children: [] }] };
    const renames = claimUniqueIds(root, "p2", taken);
    expect(renames).toEqual([
      { from: "root", to: stableElementId("p2", "root", 0) },
      { from: "a", to: stableElementId("p2", "a", 0) },
    ]);
    expect(root.children[0].id).toBe("a");
    expect(taken.has(root.id) && taken.has("a") && taken.has(root.children[1].id)).toBe(true);
  });
});

describe("withUniqueIds", () => {
  it("first page keeps its ids; later pages get the same ids every run; inputs untouched", () => {
    const pages = [
      { key: "p1", blocks: tree("home") },
      { key: "p2", blocks: tree("about") },
      { key: "p3", blocks: [] as unknown },
    ];
    const snapshot = JSON.stringify(pages);
    const a = withUniqueIds(pages);
    const b = withUniqueIds(pages);
    expect(JSON.stringify(pages)).toBe(snapshot);
    expect(a[0].renames).toEqual([]);
    expect(a[0].blocks).toBe(pages[0].blocks);
    expect(a[1].renames.map((r) => r.from)).toEqual(["root", "ai-hero-0"]);
    expect(JSON.stringify(a[1].blocks)).toBe(JSON.stringify(b[1].blocks));
    expect(a[2].blocks).toEqual([]);
  });

  it("leaves the HTML id attribute (what href/for/aria target) alone", () => {
    const [, second] = withUniqueIds([{ key: "p1", blocks: tree("x") }, { key: "p2", blocks: tree("y") }]);
    const child = (second.blocks as ReturnType<typeof tree>).children[0];
    expect(child.id).not.toBe("ai-hero-0");
    expect(child.attributes.id).toBe("top");
  });

  it("seeds from ids other pages already own", () => {
    const [page] = withUniqueIds([{ key: "new", blocks: tree("t") }], new Set(["root"]));
    expect(page.renames.map((r) => r.from)).toEqual(["root"]);
  });
});

describe("blankPageRoot", () => {
  it("differs per page", () => {
    expect(blankPageRoot("a").id).not.toBe(blankPageRoot("b").id);
    expect(blankPageRoot("a").children).toEqual([]);
  });

  it("carries no style — a never-saved page loaded as one is not rebound", () => {
    expect("styles" in blankPageRoot("a")).toBe(false);
  });
});

describe("newPageRoot", () => {
  it("is the blank root with its background bound to the page-background token", () => {
    expect(newPageRoot("a")).toEqual({
      ...blankPageRoot("a"),
      styles: { "background-color": "var(--buildrick-design-color-page-background)" },
    });
  });

  it("hands each page its own styles object", () => {
    expect(newPageRoot("a").styles).not.toBe(newPageRoot("b").styles);
  });
});

describe("copy helpers", () => {
  const renames = [{ from: "hero", to: "el-new" }];
  it("copies id-keyed style rules (media + pseudo kept), idempotently", () => {
    const styles = [
      { id: "s1", selector: '[data-buildrick-id="hero"]', properties: { color: "red" }, mediaQuery: "(max-width: 767px)" },
      { id: "s2", selector: '[data-buildrick-id="hero"]:hover', properties: {} },
      { id: "s3", selector: ".btn", properties: {} },
    ];
    const copies = copyIdKeyedStyles(styles, renames);
    expect(copies.map((c) => c.selector)).toEqual(['[data-buildrick-id="el-new"]', '[data-buildrick-id="el-new"]:hover']);
    expect(copies[0].mediaQuery).toBe("(max-width: 767px)");
    expect(copyIdKeyedStyles([...styles, ...copies], renames)).toEqual([]);
  });
  it("copies id-keyed records without overwriting", () => {
    const out = copyIdKeyedRecord({ hero: [{ field: "title" }] }, renames);
    expect(out["el-new"]).toEqual([{ field: "title" }]);
    expect(out.hero).toEqual([{ field: "title" }]);
    expect(copyIdKeyedRecord({ hero: 1, "el-new": 2 }, renames)["el-new"]).toBe(2);
  });
});

describe("reidSite", () => {
  it("keys by page id (the editor's scheme), copies id-keyed rules, maps renames per page, and is idempotent", () => {
    const pages = [
      { id: "p1", blocks: tree("home") },
      { id: "p2", blocks: tree("about") },
    ];
    const styles = [{ id: "s", selector: '[data-buildrick-id="ai-hero-0"]', properties: {} }];
    const first = reidSite(pages, styles);
    const newHero = stableElementId("p2", "ai-hero-0", 0);
    expect(first.renames).toEqual([
      { from: "root", to: stableElementId("p2", "root", 0) },
      { from: "ai-hero-0", to: newHero },
    ]);
    expect((first.styles as Array<{ selector: string }>).map((r) => r.selector)).toEqual([
      '[data-buildrick-id="ai-hero-0"]',
      `[data-buildrick-id="${newHero}"]`,
    ]);
    const second = reidSite(first.pages, first.styles);
    expect(second.renames).toEqual([]);
    expect(second.styles).toEqual(first.styles);
  });
});

/* Round 2: FormBlock rows are keyed by (siteId, blockId = element id; no
   writer sets pageId), so a row belongs to EVERY page of its site carrying
   that id. Each renamed occurrence gets its own copy; the original stays. */
describe("copiesForRenamedIds", () => {
  it("one copy per new id of a row whose blockId was renamed (id is a surrogate)", () => {
    const rows = [
      { id: "form-1", blockId: "form-1", pageId: null },
      { id: "cuid-x", blockId: "form-2", pageId: null },
      { id: "other", blockId: "other", pageId: null },
      // Another element's row whose surrogate id happens to equal a renamed id.
      { id: "form-2", blockId: "unrelated", pageId: null },
    ];
    const renames = [
      { from: "form-1", to: "el-a" },
      { from: "form-1", to: "el-b" },
      { from: "form-2", to: "el-c" },
    ];
    const copies = copiesForRenamedIds(rows, renames);
    expect(copies.map((c) => [c.row.id, c.to])).toEqual([
      ["form-1", "el-a"],
      ["form-1", "el-b"],
      ["cuid-x", "el-c"],
    ]);
  });
});

