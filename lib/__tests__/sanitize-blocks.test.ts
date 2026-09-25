/**
 * sanitize-blocks — server-side defense-in-depth for the Page.blocks element
 * tree. The editor sanitizes on import/serialize, but a direct API write could
 * still persist hostile blocks. This strips dangerous markup at the write
 * boundary so the stored tree is clean at rest.
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeBlocks,
  sanitizeComponentPayload,
  sanitizeTemplateHtml,
  sanitizeVersionPayload,
} from "../sanitize-blocks";

describe("sanitizeBlocks", () => {
  it("strips on* event-handler attribute keys", () => {
    const blocks = {
      id: "r",
      type: "image",
      tagName: "img",
      attributes: { src: "x", onerror: "alert(1)", onclick: "y" },
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("onerror");
    expect(blocks.attributes).not.toHaveProperty("onclick");
    expect(blocks.attributes.src).toBe("x");
  });

  it("strips javascript: URLs from URL attributes", () => {
    const blocks = { id: "r", type: "link", tagName: "a", attributes: { href: "javascript:alert(1)" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("href");
  });

  it("sanitizes content HTML (removes onerror, keeps text)", () => {
    const blocks = { id: "r", type: "text", tagName: "p", content: '<img src=x onerror="alert(1)">PWNED' };
    sanitizeBlocks(blocks);
    expect(blocks.content).not.toMatch(/onerror/i);
    expect(blocks.content).toContain("PWNED");
  });

  it("recurses into children", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      children: [{ id: "c", type: "text", tagName: "p", content: '<b onmouseover="x">hi</b>' }],
    };
    sanitizeBlocks(blocks);
    expect(blocks.children[0].content).not.toMatch(/onmouseover/i);
  });

  it("handles array roots and non-object input without throwing", () => {
    expect(() => sanitizeBlocks(null)).not.toThrow();
    expect(() => sanitizeBlocks("str")).not.toThrow();
    expect(() => sanitizeBlocks(undefined)).not.toThrow();
    const arr = [{ id: "a", type: "text", tagName: "p", attributes: { onclick: "x", title: "ok" } }];
    sanitizeBlocks(arr);
    expect(arr[0].attributes).not.toHaveProperty("onclick");
    expect(arr[0].attributes.title).toBe("ok");
  });

  it("keeps safe content, URLs, and editor attributes", () => {
    const blocks = {
      id: "r",
      type: "link",
      tagName: "a",
      attributes: { href: "https://example.com", "data-buildrick-id": "el1", style: "color: red" },
      content: "<b>Hi</b>",
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes.href).toBe("https://example.com");
    expect(blocks.attributes["data-buildrick-id"]).toBe("el1");
    expect(blocks.content).toContain("<b>Hi</b>");
  });
});

describe("sanitizeBlocks — tag and attribute allowlist (S-1a, A19-1)", () => {
  it("drops srcdoc (a same-origin document) whatever its case", () => {
    const blocks = { id: "r", type: "container", tagName: "div", attributes: { srcdoc: "<script>x</script>", SRCDOC: "y", title: "ok" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).toEqual({ title: "ok" });
  });

  it("rewrites a disallowed tag to div and keeps the content", () => {
    const blocks = { id: "r", type: "container", tagName: "script", content: "hello" };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBe("div");
    expect(blocks.content).toBe("hello");
  });

  it("rewrites a malformed tag that smuggles attributes to div", () => {
    const blocks = { id: "r", type: "image", tagName: "img src=x onerror=alert(1) x" };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBe("div");
  });

  it("drops an attribute whose NAME smuggles a handler", () => {
    const blocks = { id: "r", type: "container", tagName: "div", attributes: { "x onerror=alert(1) y": "v", "data-ok": "1" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).toEqual({ "data-ok": "1" });
  });

  it("treats srcset, formaction and xlink:href as URL attributes", () => {
    const blocks = {
      id: "r",
      type: "image",
      tagName: "img",
      attributes: {
        srcset: "a.jpg 1x, javascript:alert(1) 2x",
        formaction: "javascript:alert(1)",
        "xlink:href": "data:text/html,<script>x</script>",
        sizes: "100vw",
      },
    };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).toEqual({ sizes: "100vw" });
  });

  it("keeps a safe srcset, including a data:image candidate", () => {
    const blocks = { id: "r", type: "image", tagName: "img", attributes: { srcset: "a.jpg 1x, data:image/png;base64,AAAA 2x" } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes.srcset).toBe("a.jpg 1x, data:image/png;base64,AAAA 2x");
  });

  it("keeps audio, video, svg and its camelCase children, and upper-case DIV", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "DIV",
      children: [
        { id: "a", type: "audio", tagName: "audio" },
        { id: "v", type: "video", tagName: "video" },
        { id: "s", type: "svg", tagName: "svg", children: [{ id: "g", type: "custom", tagName: "linearGradient" }, { id: "p", type: "custom", tagName: "path" }] },
      ],
    };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBe("DIV");
    expect(blocks.children.map((c) => c.tagName)).toEqual(["audio", "video", "svg"]);
    expect(blocks.children[2].children?.map((c) => c.tagName)).toEqual(["linearGradient", "path"]);
  });

  it("leaves a missing tagName alone (the editor derives it from the type)", () => {
    const blocks: { id: string; type: string; tagName?: string } = { id: "r", type: "heading" };
    sanitizeBlocks(blocks);
    expect(blocks.tagName).toBeUndefined();
  });

  it("keeps target on a rich-text link, as the editor does", () => {
    const blocks = { id: "r", type: "text", tagName: "p", content: '<a href="/x" target="_blank">x</a>' };
    sanitizeBlocks(blocks);
    expect(blocks.content).toContain('target="_blank"');
  });

  it("reports each change with its reason", () => {
    const reasons: string[] = [];
    sanitizeBlocks({ id: "r", type: "x", tagName: "iframe", attributes: { srcdoc: "y", onclick: "z" } }, (r) => reasons.push(r));
    expect(reasons.sort()).toEqual(["attr-event-handler", "attr-forbidden", "tag"]);
  });
});

describe("sanitizeComponentPayload / sanitizeVersionPayload / sanitizeTemplateHtml", () => {
  it("sanitizes a component master tree and its variant attribute overrides", () => {
    const payload = {
      id: "c",
      masterTree: { id: "m", type: "container", tagName: "iframe", attributes: { srcdoc: "<script>x</script>" } },
      variants: [{ id: "v", attributeOverrides: { onclick: "x", title: "t" } }],
    };
    sanitizeComponentPayload(payload);
    expect(payload.masterTree.tagName).toBe("div");
    expect(payload.masterTree.attributes).toEqual({});
    expect(payload.variants[0].attributeOverrides).toEqual({ title: "t" });
  });

  it("sanitizes every page root in a version snapshot", () => {
    const payload = {
      id: "v",
      snapshot: { pages: [{ id: "p", root: { id: "r", type: "container", tagName: "img src=x onerror=alert(1) x" } }] },
    };
    sanitizeVersionPayload(payload);
    expect(payload.snapshot.pages[0].root.tagName).toBe("div");
  });

  it("tolerates payloads of an unexpected shape", () => {
    expect(() => sanitizeComponentPayload({ html: "<div>x</div>" })).not.toThrow();
    expect(() => sanitizeVersionPayload({ snapshot: "nope" })).not.toThrow();
  });

  it("strips executable markup from template html and keeps the layout", () => {
    const out = sanitizeTemplateHtml(
      '<section style="padding:4px" data-x="1"><iframe srcdoc="<script>x</script>"></iframe><img src=x onerror="alert(1)"><a href="/p" target="_blank">go</a></section>'
    );
    expect(out).not.toMatch(/srcdoc|onerror|<iframe/i);
    expect(out).toContain('style="padding:4px"');
    expect(out).toContain('target="_blank"');
  });
});

describe("URL schemes a browser would still run (S-1 review fix 2)", () => {
  it.each([
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "java\rscript:alert(1)",
    "\x01javascript:alert(1)",
    " \x00vbscript:msgbox(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "\tdata:text/html,x",
  ])("drops href=%j", (href) => {
    const blocks = { id: "r", type: "link", tagName: "a", attributes: { href } };
    sanitizeBlocks(blocks);
    expect(blocks.attributes).not.toHaveProperty("href");
  });

  it.each(["https://x.com/a", "/p", "#top", "mailto:a@b.c", "data:image/png;base64,AAAA", "page.html"])(
    "keeps href=%j",
    (href) => {
      const blocks = { id: "r", type: "link", tagName: "a", attributes: { href } };
      sanitizeBlocks(blocks);
      expect(blocks.attributes.href).toBe(href);
    }
  );
});

describe("target links get rel=noopener noreferrer (S-1 review fix 3)", () => {
  it("adds it to rich-text content, merging an existing rel", () => {
    const blocks = {
      id: "r",
      type: "text",
      tagName: "p",
      content: '<a href="/a" target="_blank">a</a><a href="/b" target="_blank" rel="nofollow">b</a><a href="/c">c</a>',
    };
    sanitizeBlocks(blocks);
    expect(blocks.content).toContain('<a href="/a" target="_blank" rel="noopener noreferrer">a</a>');
    expect(blocks.content).toContain('rel="nofollow noopener noreferrer"');
    expect(blocks.content).toContain('<a href="/c">c</a>');
  });

  it("adds it to user-template html", () => {
    expect(sanitizeTemplateHtml('<a href="/x" target="_blank">x</a>')).toContain('rel="noopener noreferrer"');
  });
});

describe("component instance overrides (S-1 review round 2)", () => {
  it("sanitizes content overrides and drops unsafe attribute overrides on write", () => {
    const overrides = [
      { op: "replace", path: "#/children[0]/content/content", value: '<img src=x onerror="alert(1)">Owned' },
      { op: "replace", path: "#/children[1]/attribute/href", value: "java\tscript:alert(1)" },
      { op: "replace", path: "#/children[1]/attribute/x onerror=y", value: "1" },
      { op: "replace", path: "#/children[1]/attribute/srcdoc", value: "<script>x</script>" },
      { op: "replace", path: "#/children[1]/attribute/title", value: "kept" },
      { op: "replace", path: "#/style/color", value: "red" },
    ];
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      children: [{ id: "i", type: "container", tagName: "div", data: { componentInstance: { componentId: "c", overrides } } }],
    };
    const reasons: string[] = [];
    sanitizeBlocks(blocks, (r) => reasons.push(r));
    const kept = blocks.children[0].data.componentInstance.overrides;
    expect(kept.map((o) => o.path)).toEqual([
      "#/children[0]/content/content",
      "#/children[1]/attribute/title",
      "#/style/color",
    ]);
    expect(kept[0].value).toContain("Owned");
    expect(kept[0].value).not.toMatch(/onerror/i);
    expect(reasons.filter((r) => r === "override")).toHaveLength(4);
  });

  it("tolerates overrides of an unexpected shape", () => {
    const blocks = { id: "r", type: "container", tagName: "div", data: { componentInstance: { overrides: "nope" } } };
    expect(() => sanitizeBlocks(blocks)).not.toThrow();
  });
});

describe("style declarations (S-1 review round 3)", () => {
  it("drops breakout / dangerous declarations from styles and every breakpoint map on write", () => {
    const blocks = {
      id: "r",
      type: "container",
      tagName: "div",
      styles: {
        color: "red}</style><script>alert(1)</script>",
        width: "expression(alert(1))",
        "x y": "1",
        padding: "4px",
        backgroundImage: "url(https://cdn.example.com/a.png)",
        background: "linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)",
        borderColor: "var(--buildrick-design-primary)",
      },
      breakpointStyles: {
        tablet: { color: "blue</style>", margin: "8px" },
        mobile: { background: "url(javascript:alert(1))" },
        desktop: "nope",
      },
    };
    const reasons: string[] = [];
    sanitizeBlocks(blocks, (r) => reasons.push(r));
    expect(blocks.styles).toEqual({
      padding: "4px",
      backgroundImage: "url(https://cdn.example.com/a.png)",
      background: "linear-gradient(90deg, #fff 0%, rgba(0,0,0,.5) 100%)",
      borderColor: "var(--buildrick-design-primary)",
    });
    expect(blocks.breakpointStyles.tablet).toEqual({ margin: "8px" });
    expect(blocks.breakpointStyles.mobile).toEqual({});
    expect(reasons.filter((r) => r === "style")).toHaveLength(5);
  });
});

describe("malformed override entries (S-1 review round 3)", () => {
  it("removes entries that are not ops and resets a non-array list", () => {
    const good = { op: "replace", path: "#/style/color", value: "red" };
    const a = { id: "a", type: "container", data: { componentInstance: { overrides: [null, "x", { path: 5 }, { op: "replace" }, good] } } };
    const b = { id: "b", type: "container", data: { componentInstance: { overrides: "nope" } } };
    sanitizeBlocks([a, b]);
    expect(a.data.componentInstance.overrides).toEqual([good]);
    expect(b.data.componentInstance.overrides).toEqual([]);
  });
});
