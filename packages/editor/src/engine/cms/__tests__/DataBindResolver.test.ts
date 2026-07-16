/**
 * DataBindResolver tests — data-bind attribute parsing, binding creation,
 * in-place resolution, and helper predicates. All functions are pure /
 * DOM-local, so no composer or manager scaffolding is needed.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  parseDataBindAttributes,
  createBindingsFromDataBind,
  resolveDataBindings,
  getDataBindFields,
  hasDataBindAttributes,
} from "../DataBindResolver";

function elementFrom(html: string): Element {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.firstElementChild!;
}

describe("parseDataBindAttributes", () => {
  it("returns [] for HTML without data-bind attributes", () => {
    expect(parseDataBindAttributes("<div><p>plain</p></div>")).toEqual([]);
    expect(parseDataBindAttributes("")).toEqual([]);
  });

  it("parses a content binding for a generic element", () => {
    const result = parseDataBindAttributes('<h2 data-bind="title">Placeholder</h2>');
    expect(result).toEqual([
      {
        selector: '[data-bind="title"]:nth-of-type(1)',
        fieldSlug: "title",
        property: "content",
      },
    ]);
  });

  it("maps IMG to src and A to href", () => {
    const result = parseDataBindAttributes(
      '<div><img data-bind="image" /><a data-bind="link">go</a></div>'
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ fieldSlug: "image", property: "src" });
    expect(result[1]).toMatchObject({ fieldSlug: "link", property: "href" });
  });

  it("skips malformed bindings: empty and valueless data-bind attributes", () => {
    const result = parseDataBindAttributes(
      '<div><span data-bind="">a</span><span data-bind>b</span><span data-bind="ok">c</span></div>'
    );
    expect(result).toHaveLength(1);
    expect(result[0].fieldSlug).toBe("ok");
  });

  it("numbers selectors by document-order index across ALL bound elements (current behavior)", () => {
    const result = parseDataBindAttributes(
      '<div><p data-bind="a">1</p><span data-bind="b">2</span></div>'
    );
    expect(result.map((r) => r.selector)).toEqual([
      '[data-bind="a"]:nth-of-type(1)',
      '[data-bind="b"]:nth-of-type(2)',
    ]);
  });

  it.todo(
    "BUG: the generated selector is not guaranteed to match its source element — " +
      ":nth-of-type(n) counts siblings of the same TAG, while n here is the index across all " +
      'data-bind elements in the document. For <p data-bind="a"/><span data-bind="b"/> the second ' +
      'binding gets [data-bind="b"]:nth-of-type(2), which matches nothing (the span is the first ' +
      "of its type). Selector generation needs a per-slug counter or a structural path."
  );
});

describe("createBindingsFromDataBind", () => {
  const parsed = [
    { selector: '[data-bind="title"]:nth-of-type(1)', fieldSlug: "title", property: "content" as const },
    { selector: '[data-bind="image"]:nth-of-type(2)', fieldSlug: "image", property: "src" as const },
  ];

  it("creates repeater-context bindings when no itemId is given", () => {
    const bindings = createBindingsFromDataBind("el-1", "col-9", parsed);
    expect(bindings).toHaveLength(2);
    expect(bindings[0]).toEqual({
      binding: { sourceId: "cms:col-9", path: "title", type: "variable" },
      collectionId: "col-9",
      itemId: undefined,
      fieldSlug: "title",
      property: "content",
    });
    expect(bindings[1].property).toBe("src");
  });

  it("prefixes the path with the itemId for item-scoped bindings", () => {
    const bindings = createBindingsFromDataBind("el-1", "col-9", parsed, "item-42");
    expect(bindings[0].binding.path).toBe("item-42.title");
    expect(bindings[0].itemId).toBe("item-42");
    expect(bindings[1].binding.path).toBe("item-42.image");
  });

  it("returns [] for an empty parsed list", () => {
    expect(createBindingsFromDataBind("el-1", "col-9", [])).toEqual([]);
  });
});

describe("resolveDataBindings", () => {
  it("writes text content for generic elements", () => {
    const el = elementFrom(
      '<div><h2 data-bind="title">old</h2><p data-bind="body">old</p></div>'
    );
    resolveDataBindings(el, { title: "New Title", body: "New body" });
    expect(el.querySelector("h2")!.textContent).toBe("New Title");
    expect(el.querySelector("p")!.textContent).toBe("New body");
  });

  it("sets src on images and auto-fills alt from data.name when alt is missing", () => {
    const el = elementFrom('<div><img data-bind="image" /></div>');
    resolveDataBindings(el, { image: "https://x/img.jpg", name: "Widget" });
    const img = el.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://x/img.jpg");
    expect(img.getAttribute("alt")).toBe("Widget");
  });

  it("does not overwrite an existing alt attribute", () => {
    const el = elementFrom('<div><img data-bind="image" alt="keep me" /></div>');
    resolveDataBindings(el, { image: "https://x/img.jpg", name: "Widget" });
    expect(el.querySelector("img")!.getAttribute("alt")).toBe("keep me");
  });

  it("leaves alt unset when data has no name", () => {
    const el = elementFrom('<div><img data-bind="image" /></div>');
    resolveDataBindings(el, { image: "https://x/img.jpg" });
    expect(el.querySelector("img")!.hasAttribute("alt")).toBe(false);
  });

  it("sets href on anchors", () => {
    const el = elementFrom('<div><a data-bind="url">link</a></div>');
    resolveDataBindings(el, { url: "/pricing" });
    const a = el.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/pricing");
    // Anchor text is untouched — only href is bound for A elements.
    expect(a.textContent).toBe("link");
  });

  it("skips fields absent from the data object", () => {
    const el = elementFrom('<div><p data-bind="missing">keep</p></div>');
    resolveDataBindings(el, { other: "x" });
    expect(el.querySelector("p")!.textContent).toBe("keep");
  });

  it("renders present-but-null values as empty string and stringifies non-strings", () => {
    const el = elementFrom(
      '<div><p data-bind="a">old</p><p data-bind="b">old</p><p data-bind="c">old</p></div>'
    );
    resolveDataBindings(el, { a: null, b: 42, c: false });
    const [a, b, c] = Array.from(el.querySelectorAll("p"));
    expect(a.textContent).toBe("");
    expect(b.textContent).toBe("42");
    expect(c.textContent).toBe("false");
  });

  it("only resolves descendants — a data-bind on the root element itself is ignored (current behavior)", () => {
    const el = elementFrom('<p data-bind="title">keep</p>');
    resolveDataBindings(el, { title: "New" });
    // querySelectorAll never matches the element it is called on.
    expect(el.textContent).toBe("keep");
  });

  it("inserts HTML-looking values as inert text, not markup", () => {
    const el = elementFrom('<div><p data-bind="title">old</p></div>');
    resolveDataBindings(el, { title: "<b>bold</b>" });
    const p = el.querySelector("p")!;
    expect(p.textContent).toBe("<b>bold</b>");
    expect(p.children).toHaveLength(0);
  });
});

describe("getDataBindFields", () => {
  it("returns unique slugs in document order", () => {
    const fields = getDataBindFields(
      '<div><h2 data-bind="title">t</h2><img data-bind="image" />' +
        '<p data-bind="title">dupe</p></div>'
    );
    expect(fields).toEqual(["title", "image"]);
  });

  it("returns [] when nothing is bound", () => {
    expect(getDataBindFields("<div>plain</div>")).toEqual([]);
  });
});

describe("hasDataBindAttributes", () => {
  it("detects data-bind attributes", () => {
    expect(hasDataBindAttributes('<div data-bind="x">a</div>')).toBe(true);
    expect(hasDataBindAttributes("<div>a</div>")).toBe(false);
  });

  it("is a substring check, not a DOM check (current behavior)", () => {
    // "data-bind=" appearing in text content also matches...
    expect(hasDataBindAttributes("<p>use data-bind=&quot;x&quot; here</p>")).toBe(true);
    // ...while a valueless data-bind attribute does not.
    expect(hasDataBindAttributes("<div data-bind>a</div>")).toBe(false);
  });
});
