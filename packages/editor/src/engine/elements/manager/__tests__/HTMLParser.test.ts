/**
 * HTMLParser — import/export behavior contracts.
 *
 * Covers sanitize-before-parse (XSS defense-in-depth), DOM→ElementData tag
 * mapping, attribute/class/style extraction, text-node handling (text-only
 * tags store content; mixed content becomes span children), the default-page
 * bootstrap, element registry swaps on re-import, insertHTMLToElement, and
 * toHTML reading from the LIVE element tree.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { Element } from "../../Element";
import { makeEngine } from "../../__tests__/harness";

function importInto(html: string) {
  const { composer, manager } = makeEngine();
  manager.createPage("Home");
  manager.importHTMLToActivePage(html);
  const page = manager.getActivePage()!;
  const root = manager.getElement(page.root.id)!;
  return { composer, manager, page, root, kids: root.getChildren() };
}

describe("HTMLParser.importHTMLToActivePage", () => {
  it("creates a default page when none exists", () => {
    const { manager } = makeEngine();
    expect(manager.getActivePage()).toBeUndefined();

    manager.importHTMLToActivePage("<p>hi</p>");

    const page = manager.getActivePage()!;
    expect(page.name).toBe("Page 1");
    const root = manager.getElement(page.root.id)!;
    expect(root.getChildren()).toHaveLength(1);
    expect(root.getChildren()[0].getType()).toBe("paragraph");
  });

  it("replaces the page content and deregisters the previous import's elements", () => {
    const { manager, root } = importInto("<p>first</p>");
    const oldChildId = root.getChildren()[0].getId();

    manager.importHTMLToActivePage("<h1>second</h1>");

    expect(manager.getElement(oldChildId)).toBeUndefined();
    const page = manager.getActivePage()!;
    const newRoot = manager.getElement(page.root.id)!;
    expect(newRoot.getChildren()).toHaveLength(1);
    expect(newRoot.getChildren()[0].getType()).toBe("heading");
  });

  it("wraps the import in a transaction", () => {
    const { composer, manager } = makeEngine();
    manager.createPage("Home");
    manager.importHTMLToActivePage("<p>hi</p>");
    expect(composer.beginTransaction).toHaveBeenCalledWith("import-html-to-active-page");
    expect(composer.endTransaction).toHaveBeenCalled();
  });
});

describe("HTMLParser — sanitize before parse (XSS defense-in-depth)", () => {
  it("strips on* event handler attributes", () => {
    const { kids } = importInto('<div onclick="steal()" id="ok">x</div>');
    expect(kids).toHaveLength(1);
    expect(kids[0].getAttribute("onclick")).toBeUndefined();
    expect(kids[0].getAttribute("id")).toBe("ok");
  });

  it("removes <script> elements entirely", () => {
    const { kids } = importInto("<script>alert(1)</script><p>safe</p>");
    expect(kids).toHaveLength(1);
    expect(kids[0].getType()).toBe("paragraph");
    expect(kids[0].getContent()).toBe("safe");
  });

  it("strips onerror from images but keeps src", () => {
    const { kids } = importInto('<img src="a.png" onerror="alert(1)">');
    expect(kids).toHaveLength(1);
    expect(kids[0].getAttribute("onerror")).toBeUndefined();
    expect(kids[0].getAttribute("src")).toBe("a.png");
  });
});

describe("HTMLParser — tag mapping", () => {
  it("maps tags to element types (h1→heading, ul→list, article→section, div→container)", () => {
    const { kids } = importInto(
      "<h1>t</h1><ul><li>i</li></ul><article><p>a</p></article><div></div><span>s</span>"
    );
    expect(kids.map((k: Element) => k.getType())).toEqual([
      "heading",
      "list",
      "section",
      "container",
      "text",
    ]);
    // The original tag names are preserved on the elements.
    expect(kids.map((k: Element) => k.getTagName())).toEqual([
      "h1",
      "ul",
      "article",
      "div",
      "span",
    ]);
  });

  it("honors data-buildrick-type and strips the marker attributes", () => {
    const { kids } = importInto('<div data-buildrick-type="hero" data-buildrick-id="x1"></div>');
    expect(kids[0].getType()).toBe("hero");
    expect(kids[0].getAttribute("data-buildrick-type")).toBeUndefined();
    expect(kids[0].getAttribute("data-buildrick-id")).toBeUndefined();
  });
});

describe("HTMLParser — attributes, classes, styles", () => {
  it("routes class→classes, style→styles, and the rest→attributes", () => {
    const { kids } = importInto(
      '<div class="a b" style="color: red; margin-top: 4px" id="box" title="t">x</div>'
    );
    const el = kids[0];
    expect(el.getClasses()).toEqual(["a", "b"]);
    expect(el.getStyle("color")).toBe("red");
    expect(el.getStyle("margin-top")).toBe("4px");
    expect(el.getAttribute("id")).toBe("box");
    expect(el.getAttribute("title")).toBe("t");
    expect(el.getAttribute("class")).toBeUndefined();
    expect(el.getAttribute("style")).toBeUndefined();
  });
});

describe("HTMLParser — text node handling", () => {
  it("text-only tags store text as content, no child text elements", () => {
    const { kids } = importInto("<p>hello world</p>");
    expect(kids[0].getContent()).toBe("hello world");
    expect(kids[0].getChildCount()).toBe(0);
  });

  it("non-text-only tags get span text children", () => {
    const { kids } = importInto("<div>hello</div>");
    expect(kids[0].getContent()).toBe("");
    expect(kids[0].getChildCount()).toBe(1);
    const textChild = kids[0].getChildren()[0];
    expect(textChild.getType()).toBe("text");
    expect(textChild.getTagName()).toBe("span");
    expect(textChild.getContent()).toBe("hello");
  });

  it("interleaves text and element children in document order", () => {
    const { kids } = importInto("<div>before<span>mid</span>after</div>");
    const parts = kids[0].getChildren();
    expect(parts).toHaveLength(3);
    expect(parts[0].getContent()).toBe("before");
    expect(parts[1].getContent()).toBe("mid");
    expect(parts[2].getContent()).toBe("after");
  });

  it("top-level bare text becomes a text element; whitespace-only is dropped", () => {
    const { kids } = importInto("just text   <p>p</p>   ");
    expect(kids).toHaveLength(2);
    expect(kids[0].getType()).toBe("text");
    expect(kids[0].getContent()).toBe("just text   ");
    expect(kids[1].getType()).toBe("paragraph");
  });
});

describe("HTMLParser.insertHTMLToElement", () => {
  it("returns [] for a missing parent or empty html", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    expect(manager.insertHTMLToElement("ghost", "<p>x</p>")).toEqual([]);
    expect(manager.insertHTMLToElement(page.root.id, "")).toEqual([]);
  });

  it("inserts multiple top-level nodes at the given index, preserving order", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const existing = manager.createElement("container");
    manager.addElement(existing, page.root.id);
    const root = manager.getElement(page.root.id)!;

    const created = manager.insertHTMLToElement(page.root.id, "<h1>a</h1><p>b</p>", 0);

    expect(created).toHaveLength(2);
    expect(root.getChildren().map((e) => e.getType())).toEqual([
      "heading",
      "paragraph",
      "container",
    ]);
    // Created elements (and their subtrees) are registered.
    created.forEach((el) => expect(manager.getElement(el.getId())).toBe(el));
  });

  it("registers nested children of inserted HTML in the element registry", () => {
    const { manager } = makeEngine();
    const page = manager.createPage("Home");
    const [card] = manager.insertHTMLToElement(page.root.id, "<div><p>deep</p></div>");
    const deep = card.getChildren()[0];
    expect(manager.getElement(deep.getId())).toBe(deep);
    expect(deep.getContent()).toBe("deep");
  });
});

describe("HTMLParser.toHTML", () => {
  it("returns '' when there is no active page", () => {
    const { manager } = makeEngine();
    expect(manager.toHTML()).toBe("");
  });

  it("renders from the LIVE element tree so post-import edits appear", () => {
    const { manager, kids } = importInto("<p>hi</p>");
    kids[0].setStyle("color", "red");
    kids[0].setContent("edited");

    const html = manager.toHTML();
    expect(html).toContain("color: red");
    expect(html).toContain("edited");
    expect(html).not.toContain(">hi<");
  });

  it("includes data-buildrick attributes for editor mode", () => {
    const { manager, kids } = importInto("<p>hi</p>");
    const html = manager.toHTML();
    expect(html).toContain(`data-buildrick-id="${kids[0].getId()}"`);
    expect(html).toContain('data-buildrick-type="paragraph"');
  });
});
