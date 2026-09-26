/**
 * sanitizeHTML — security + editor-preservation contract.
 *
 * XSS invariants: dangerous markup never survives the sanitizer.
 * Preservation invariants: the editor's canvas depends on data-buildrick-*,
 * class, and style attributes for selection/overlays, and stock blocks depend
 * on form/SVG attributes surviving the round-trip — the sanitizer must keep them.
 */
import { describe, it, expect } from "vitest";
import { isAllowedElementTag } from "@buildrik/shared/schemas/element-markup";
import { isSafeAttrValue, sanitizeHTML, sanitizeElementTreeContent } from "../sanitization";
import { TYPE_TO_TAG_MAP } from "../typeMapping";
import type { ElementData } from "../../../types";

describe("sanitizeHTML — XSS invariants", () => {
  it("strips on* event-handler attributes", () => {
    const out = sanitizeHTML('<img src="x" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
  });

  it("removes <script> elements", () => {
    const out = sanitizeHTML("<div>hi<script>alert(1)</script></div>");
    expect(out).not.toMatch(/<script/i);
  });

  it("strips javascript: URLs from anchor href", () => {
    const out = sanitizeHTML('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("strips javascript: from svg xlink:href", () => {
    const out = sanitizeHTML('<svg><use xlink:href="javascript:alert(1)"></use></svg>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("blocks data:text/html URLs", () => {
    const out = sanitizeHTML('<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>');
    expect(out).not.toMatch(/data:text\/html/i);
  });

  it("strips non-media data: URLs from anchor href", () => {
    const out = sanitizeHTML('<a href="data:text/plain;base64,SGk=">x</a>');
    expect(out).not.toMatch(/data:/i);
  });
});

describe("sanitizeHTML — editor preservation invariants", () => {
  it("preserves data-buildrick-id, class, and style (canvas selection depends on these)", () => {
    const out = sanitizeHTML('<div data-buildrick-id="el1" class="x" style="color: red">hi</div>');
    expect(out).toMatch(/data-buildrick-id="el1"/);
    expect(out).toMatch(/class="x"/);
    expect(out).toMatch(/red/);
  });

  it("preserves form control attributes (stock blocks round-trip)", () => {
    const out = sanitizeHTML('<input type="text" placeholder="Name" name="full">');
    expect(out).toMatch(/type="text"/);
    expect(out).toMatch(/placeholder="Name"/);
  });

  it("preserves svg path geometry", () => {
    const out = sanitizeHTML('<svg viewBox="0 0 10 10"><path d="M0 0L10 10" fill="red"></path></svg>');
    expect(out).toMatch(/d="M0 0L10 10"/);
  });

  it("preserves data:image/png on img src", () => {
    const out = sanitizeHTML('<img src="data:image/png;base64,iVBORw0KGgo=">');
    expect(out).toMatch(/data:image\/png/);
  });
});

describe("sanitizeElementTreeContent — ingest boundary", () => {
  it("sanitizes content on every node in a nested tree", () => {
    const tree: ElementData = {
      id: "root",
      type: "container",
      tagName: "div",
      content: "",
      children: [
        { id: "c1", type: "text", tagName: "p", content: '<img src=x onerror="alert(1)">' },
        {
          id: "c2",
          type: "container",
          tagName: "div",
          children: [
            { id: "c3", type: "text", tagName: "span", content: '<a href="javascript:alert(1)">x</a>' },
          ],
        },
      ],
    };

    sanitizeElementTreeContent(tree);

    expect(tree.children![0].content).not.toMatch(/onerror/i);
    expect(tree.children![1].children![0].content).not.toMatch(/javascript:/i);
  });

  it("preserves safe rich-text content", () => {
    const tree: ElementData = {
      id: "r",
      type: "text",
      tagName: "p",
      content: "<b>Hello</b> <i>world</i>",
    };

    sanitizeElementTreeContent(tree);

    expect(tree.content).toContain("<b>Hello</b>");
    expect(tree.content).toContain("<i>world</i>");
  });
});

/* importProject is how project JSON from storage, the dashboard, a template or
   an AI draft enters the element tree, and this is the only thing that runs on
   it. It sanitized `content` and left `attributes` untouched on the grounds
   that the serializer handled them — true of one of the editor's three HTML
   writers; ExportEngine's two emitted whatever was there, so `onerror` in a
   stored project reached a published page. */
describe("sanitizeElementTreeContent — attributes", () => {
  const tree = (): ElementData =>
    ({
      id: "root",
      type: "container",
      tagName: "div",
      attributes: { onclick: "steal()", title: "fine" },
      children: [
        {
          id: "a1",
          type: "link",
          tagName: "a",
          attributes: {
            onerror: "alert(1)",
            href: "javascript:alert(1)",
            rel: "noopener",
            "data-x": "1",
          },
          children: [],
        },
      ],
    }) as unknown as ElementData;

  it("drops event handlers at every depth", () => {
    const t = tree();
    sanitizeElementTreeContent(t);

    expect(t.attributes).not.toHaveProperty("onclick");
    expect(t.children?.[0].attributes).not.toHaveProperty("onerror");
  });

  it("drops a javascript: href", () => {
    const t = tree();
    sanitizeElementTreeContent(t);

    expect(t.children?.[0].attributes).not.toHaveProperty("href");
  });

  it("keeps everything legitimate", () => {
    const t = tree();
    sanitizeElementTreeContent(t);

    expect(t.attributes).toMatchObject({ title: "fine" });
    expect(t.children?.[0].attributes).toMatchObject({ rel: "noopener", "data-x": "1" });
  });
});

describe("tag and attribute allowlist (S-1a, A19-1)", () => {
  it("refuses srcdoc whatever its value or case", () => {
    expect(isSafeAttrValue("srcdoc", "<script>alert(1)</script>", "iframe")).toBe(false);
    expect(isSafeAttrValue("SRCDOC", "<p>hi</p>", "iframe")).toBe(false);
  });

  it("refuses an attribute name that smuggles a handler", () => {
    expect(isSafeAttrValue("x onerror=alert(1) y", "v", "div")).toBe(false);
    expect(isSafeAttrValue("data-buildrick-x", "v", "div")).toBe(true);
    expect(isSafeAttrValue("xlink:href", "#icon", "use")).toBe(true);
  });

  it("refuses an upper-case event handler", () => {
    expect(isSafeAttrValue("ONCLICK", "x", "div")).toBe(false);
  });

  it("scheme-checks srcset, formaction, xlink:href and poster", () => {
    expect(isSafeAttrValue("srcset", "a.jpg 1x, javascript:alert(1) 2x", "img")).toBe(false);
    expect(isSafeAttrValue("srcset", "a.jpg 1x, blob:https://x/1 2x", "img")).toBe(true);
    expect(isSafeAttrValue("formaction", "javascript:alert(1)", "button")).toBe(false);
    expect(isSafeAttrValue("formaction", "/submit", "button")).toBe(true);
    expect(isSafeAttrValue("xlink:href", "javascript:alert(1)", "use")).toBe(false);
    expect(isSafeAttrValue("poster", "https://cdn/x.jpg", "video")).toBe(true);
  });

  it("rewrites a disallowed or malformed tagName to div and keeps the content", () => {
    const tree: ElementData = {
      id: "r",
      type: "container",
      tagName: "script",
      content: "hello",
      children: [
        { id: "i", type: "image", tagName: "img src=x onerror=alert(1) x" },
        { id: "f", type: "container", tagName: "iframe", attributes: { srcdoc: "<script>x</script>", title: "t" } },
      ],
    };
    sanitizeElementTreeContent(tree);
    expect(tree.tagName).toBe("div");
    expect(tree.content).toBe("hello");
    expect(tree.children?.[0].tagName).toBe("div");
    expect(tree.children?.[1].tagName).toBe("div");
    expect(tree.children?.[1].attributes).toEqual({ title: "t" });
  });

  it("keeps audio, video, svg children and upper-case DIV", () => {
    const tree: ElementData = {
      id: "r",
      type: "container",
      tagName: "DIV",
      children: [
        { id: "a", type: "audio", tagName: "audio" },
        { id: "v", type: "video", tagName: "video" },
        { id: "s", type: "svg", tagName: "svg", children: [{ id: "g", type: "custom", tagName: "linearGradient" }] },
      ],
    };
    sanitizeElementTreeContent(tree);
    expect(tree.tagName).toBe("DIV");
    expect(tree.children?.map((c) => c.tagName)).toEqual(["audio", "video", "svg"]);
    expect(tree.children?.[2].children?.[0].tagName).toBe("linearGradient");
  });

  it("every tag the type map emits is on the shared allowlist", () => {
    for (const tag of new Set(Object.values(TYPE_TO_TAG_MAP))) {
      expect(isAllowedElementTag(tag), tag).toBe(true);
    }
  });
});

describe("URL schemes a browser would still run (S-1 review fix 2)", () => {
  it.each(["java\tscript:alert(1)", "java\nscript:alert(1)", "\x01javascript:alert(1)", "data:application/xhtml+xml,x"])(
    "refuses %j on every URL attribute",
    (url) => {
      for (const attr of ["href", "src", "formaction", "xlink:href", "poster", "action"]) {
        expect(isSafeAttrValue(attr, url, "a"), attr).toBe(false);
      }
      expect(isSafeAttrValue("srcset", `a.jpg 1x, ${url} 2x`, "img")).toBe(false);
    }
  );
});

describe("target links get rel=noopener noreferrer (S-1 review fix 3)", () => {
  it("sanitizeHTML adds it, merging an existing rel", () => {
    const out = sanitizeHTML('<a href="/a" target="_blank">a</a><a href="/b" target="_blank" rel="nofollow">b</a>');
    expect(out).toContain('<a href="/a" target="_blank" rel="noopener noreferrer">a</a>');
    expect(out).toContain('rel="nofollow noopener noreferrer"');
  });
});

describe("style declarations on load (S-1)", () => {
  it("drops breakout declarations from styles and breakpoint maps, keeps the rest", () => {
    const tree = {
      id: "r",
      type: "container",
      tagName: "div",
      styles: { color: "red}</style><script>x</script>", padding: "4px" },
      breakpointStyles: { tablet: { margin: "8px", color: "blue</style>" } },
    } as ElementData;
    sanitizeElementTreeContent(tree);
    expect(tree.styles).toEqual({ padding: "4px" });
    expect(tree.breakpointStyles?.tablet).toEqual({ margin: "8px" });
  });
});
