/**
 * sanitizeHTML — security + editor-preservation contract.
 *
 * XSS invariants: dangerous markup never survives the sanitizer.
 * Preservation invariants: the editor's canvas depends on data-buildrick-*,
 * class, and style attributes for selection/overlays, and stock blocks depend
 * on form/SVG attributes surviving the round-trip — the sanitizer must keep them.
 */
import { describe, it, expect } from "vitest";
import { sanitizeHTML, sanitizeElementTreeContent } from "../sanitization";
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
