/**
 * RepeaterRenderer tests — repeater expansion with CMS collection data.
 *
 * The renderer only touches composer.cms.bindings.getCollectionBinding and
 * composer.cms.collections.queryContent, so a duck-typed composer stub is
 * sufficient (mirrors the stub pattern in TokenBindingResolver.test.ts).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { RepeaterRenderer } from "../RepeaterRenderer";
import type { CMSCollectionBinding } from "../CMSBindingManager";
import type { Composer } from "@/engine/Composer";
import type { CMSContentItem, CMSQueryOptions, CMSQueryResult } from "@/shared/types/cms";

function makeItem(
  id: string,
  collectionId: string,
  data: Record<string, unknown>,
  status: CMSContentItem["status"] = "published"
): CMSContentItem {
  const now = "2026-01-01T00:00:00.000Z";
  return { id, collectionId, data, status, createdAt: now, updatedAt: now };
}

function makeBinding(overrides: Partial<CMSCollectionBinding> = {}): CMSCollectionBinding {
  return {
    elementId: "rep",
    collectionId: "col-posts",
    itemVar: "item",
    indexVar: "index",
    status: "published",
    ...overrides,
  };
}

/**
 * Build a composer stub. `itemsByCollection` drives queryContent responses;
 * `bindings` drives getCollectionBinding lookups.
 */
function makeComposer(opts: {
  bindings?: Record<string, CMSCollectionBinding>;
  itemsByCollection?: Record<string, CMSContentItem[]>;
}) {
  const queryContent = vi.fn(async (query: CMSQueryOptions): Promise<CMSQueryResult> => {
    const items = opts.itemsByCollection?.[query.collectionId] ?? [];
    return { items, total: items.length, hasMore: false };
  });

  const composer = {
    cms: {
      bindings: {
        getCollectionBinding: (elementId: string) => opts.bindings?.[elementId] ?? null,
      },
      collections: { queryContent },
    },
  } as unknown as Composer;

  return { composer, queryContent };
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("RepeaterRenderer", () => {
  describe("expandRepeaters — pass-through paths", () => {
    it("returns empty string unchanged", async () => {
      const { composer } = makeComposer({});
      const renderer = new RepeaterRenderer(composer);
      await expect(renderer.expandRepeaters("")).resolves.toBe("");
    });

    it("returns input unchanged when the bindings manager is absent", async () => {
      const composer = { cms: { bindings: undefined } } as unknown as Composer;
      const renderer = new RepeaterRenderer(composer);
      // Early return — no DOM round-trip, exact string identity.
      await expect(renderer.expandRepeaters("<div>Hello</div>")).resolves.toBe(
        "<div>Hello</div>"
      );
    });

    it("passes through HTML whose elements have no collection bindings", async () => {
      const { composer, queryContent } = makeComposer({});
      const renderer = new RepeaterRenderer(composer);
      const html = '<div data-buildrick-id="a">Hello</div>';
      await expect(renderer.expandRepeaters(html)).resolves.toBe(html);
      expect(queryContent).not.toHaveBeenCalled();
    });

    it("leaves the template untouched when the collections manager is absent", async () => {
      const composer = {
        cms: {
          bindings: { getCollectionBinding: () => makeBinding() },
          collections: undefined,
        },
      } as unknown as Composer;
      const renderer = new RepeaterRenderer(composer);

      const out = await renderer.expandRepeaters(
        '<div data-buildrick-id="rep">{{item.title}}</div>'
      );

      const doc = parse(out);
      const tpl = doc.querySelector('[data-buildrick-id="rep"]') as HTMLElement;
      expect(tpl.textContent).toBe("{{item.title}}");
      expect(tpl.style.display).not.toBe("none");
      expect(tpl.hasAttribute("data-cms-repeater-empty")).toBe(false);
      expect(doc.querySelectorAll("[data-cms-repeater-item]")).toHaveLength(0);
    });
  });

  describe("expandRepeaters — expansion", () => {
    const items = [
      makeItem("item-1", "col-posts", { title: "First Post", slug: "first-post" }),
      makeItem("item-2", "col-posts", { title: "Second Post", slug: "second-post" }),
    ];

    const templateHtml =
      "<section>" +
      '<div data-buildrick-id="rep" data-cms-repeater-template="true">' +
      "<h3>{{item.title}}</h3>" +
      '<a href="/posts/{{item.slug}}" data-idx="{{index}}">Read</a>' +
      "</div>" +
      "</section>";

    it("clones the template once per collection item", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": items },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(await renderer.expandRepeaters(templateHtml));
      const clones = doc.querySelectorAll("[data-cms-repeater-item]");
      expect(clones).toHaveLength(2);

      const first = clones[0] as HTMLElement;
      expect(first.getAttribute("data-buildrick-id")).toBe("rep-0");
      expect(first.getAttribute("data-cms-item-id")).toBe("item-1");
      expect(first.getAttribute("data-cms-repeater-item")).toBe("0");
      // The clone must not carry the template marker copied from the source.
      expect(first.hasAttribute("data-cms-repeater-template")).toBe(false);

      const second = clones[1] as HTMLElement;
      expect(second.getAttribute("data-buildrick-id")).toBe("rep-1");
      expect(second.getAttribute("data-cms-item-id")).toBe("item-2");
    });

    it("replaces field and index placeholders in text nodes and attributes", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": items },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(await renderer.expandRepeaters(templateHtml));
      const clones = doc.querySelectorAll("[data-cms-repeater-item]");

      expect(clones[0].querySelector("h3")!.textContent).toBe("First Post");
      expect(clones[0].querySelector("a")!.getAttribute("href")).toBe("/posts/first-post");
      expect(clones[0].querySelector("a")!.getAttribute("data-idx")).toBe("0");

      expect(clones[1].querySelector("h3")!.textContent).toBe("Second Post");
      expect(clones[1].querySelector("a")!.getAttribute("href")).toBe("/posts/second-post");
      expect(clones[1].querySelector("a")!.getAttribute("data-idx")).toBe("1");
    });

    it("hides the original template and marks it processed, clones inserted after it in order", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": items },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(await renderer.expandRepeaters(templateHtml));
      const section = doc.querySelector("section")!;
      const children = Array.from(section.children) as HTMLElement[];

      expect(children).toHaveLength(3);
      // [template, clone-0, clone-1]
      expect(children[0].getAttribute("data-cms-repeater-template")).toBe("true");
      expect(children[0].style.display).toBe("none");
      // Template retains its raw placeholders.
      expect(children[0].querySelector("h3")!.textContent).toBe("{{item.title}}");
      expect(children[1].getAttribute("data-buildrick-id")).toBe("rep-0");
      expect(children[2].getAttribute("data-buildrick-id")).toBe("rep-1");
    });

    it("replaces isFirst / isLast / total helpers in text nodes", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": items },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep">{{isFirst}}|{{isLast}}|{{total}}|{{index}}</div>'
        )
      );
      const clones = doc.querySelectorAll("[data-cms-repeater-item]");
      expect(clones[0].textContent).toBe("true|false|2|0");
      expect(clones[1].textContent).toBe("false|true|2|1");
    });

    it("does NOT replace context helpers inside attributes (current behavior: only item fields and index)", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": items },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep" data-first="{{isFirst}}">x</div>'
        )
      );
      const clone = doc.querySelector("[data-cms-repeater-item]") as HTMLElement;
      // applyContext's attribute pass only handles {{index}} and {{item.*}}.
      expect(clone.getAttribute("data-first")).toBe("{{isFirst}}");
    });

    it("honors custom itemVar / indexVar and ignores the default names", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding({ itemVar: "product", indexVar: "i" }) },
        itemsByCollection: {
          "col-posts": [makeItem("p-1", "col-posts", { name: "Widget" })],
        },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep">{{product.name}} #{{i}} — {{item.name}} {{index}}</div>'
        )
      );
      const clone = doc.querySelector("[data-cms-repeater-item]")!;
      // "item"/"index" are not the configured vars, so those stay literal.
      expect(clone.textContent).toBe("Widget #0 — {{item.name}} {{index}}");
    });

    it("supports whitespace inside placeholder braces", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": [makeItem("i1", "col-posts", { title: "Hi" })] },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep">{{ item.title }} at {{ index }}</div>'
        )
      );
      expect(doc.querySelector("[data-cms-repeater-item]")!.textContent).toBe("Hi at 0");
    });

    it("leaves placeholders for fields missing from item.data literal", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": [makeItem("i1", "col-posts", { title: "T" })] },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep">{{item.title}} / {{item.missing}}</div>'
        )
      );
      expect(doc.querySelector("[data-cms-repeater-item]")!.textContent).toBe(
        "T / {{item.missing}}"
      );
    });

    it("renders null field values as empty string and stringifies non-string values", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: {
          "col-posts": [
            makeItem("i1", "col-posts", { subtitle: null, price: 42, featured: false }),
          ],
        },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep">[{{item.subtitle}}] {{item.price}} {{item.featured}}</div>'
        )
      );
      expect(doc.querySelector("[data-cms-repeater-item]")!.textContent).toBe("[] 42 false");
    });

    it("hides the template and flags empty state when the collection has no items", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": [] },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(await renderer.expandRepeaters(templateHtml));
      const tpl = doc.querySelector('[data-buildrick-id="rep"]') as HTMLElement;
      expect(tpl.style.display).toBe("none");
      expect(tpl.getAttribute("data-cms-repeater-empty")).toBe("true");
      expect(doc.querySelectorAll("[data-cms-repeater-item]")).toHaveLength(0);
    });
  });

  describe("expandRepeaters — query construction", () => {
    it('maps status "all" to undefined (no filter) and forwards limit', async () => {
      const { composer, queryContent } = makeComposer({
        bindings: { rep: makeBinding({ status: "all", limit: 7 }) },
        itemsByCollection: { "col-posts": [] },
      });
      const renderer = new RepeaterRenderer(composer);

      await renderer.expandRepeaters('<div data-buildrick-id="rep">x</div>');
      expect(queryContent).toHaveBeenCalledWith({
        collectionId: "col-posts",
        status: undefined,
        limit: 7,
      });
    });

    it("forwards explicit draft/published status filters", async () => {
      const { composer, queryContent } = makeComposer({
        bindings: { rep: makeBinding({ status: "draft" }) },
        itemsByCollection: { "col-posts": [] },
      });
      const renderer = new RepeaterRenderer(composer);

      await renderer.expandRepeaters('<div data-buildrick-id="rep">x</div>');
      expect(queryContent).toHaveBeenCalledWith({
        collectionId: "col-posts",
        status: "draft",
        limit: undefined,
      });
    });
  });

  describe("escaping (current behavior)", () => {
    it("inserts field values verbatim into text nodes; serialization is what escapes markup", async () => {
      const payload = 'Tom & Jerry <b>"bold"</b>';
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: { "col-posts": [makeItem("i1", "col-posts", { title: payload })] },
      });
      const renderer = new RepeaterRenderer(composer);

      const out = await renderer.expandRepeaters(
        '<div data-buildrick-id="rep"><h3>{{item.title}}</h3></div>'
      );

      // escapeHtml() round-trips textContent, so the raw string lands in the
      // text node unchanged...
      const doc = parse(out);
      const h3 = doc.querySelector("[data-cms-repeater-item] h3")!;
      expect(h3.textContent).toBe(payload);
      // ...and no <b> element is ever created — safety currently comes from
      // textContent assignment + innerHTML serialization, not from escapeHtml.
      expect(h3.children).toHaveLength(0);
      expect(out).toContain("Tom &amp; Jerry &lt;b&gt;");
      expect(out).not.toContain("<b>");
    });

    it("keeps script payloads inert in serialized output (via text-node serialization)", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: {
          "col-posts": [
            makeItem("i1", "col-posts", { title: '<img src=x onerror=alert(1)>' }),
          ],
        },
      });
      const renderer = new RepeaterRenderer(composer);

      const out = await renderer.expandRepeaters(
        '<div data-buildrick-id="rep">{{item.title}}</div>'
      );
      expect(out).not.toContain("<img");
      expect(out).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });

    it("sets attribute values verbatim via setAttribute", async () => {
      const { composer } = makeComposer({
        bindings: { rep: makeBinding() },
        itemsByCollection: {
          "col-posts": [makeItem("i1", "col-posts", { slug: 'a"b<c>' })],
        },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="rep"><a href="/x/{{item.slug}}">go</a></div>'
        )
      );
      const a = doc.querySelector("[data-cms-repeater-item] a")!;
      // The "escaped" value is byte-identical to the input — no entity encoding.
      expect(a.getAttribute("href")).toBe('/x/a"b<c>');
    });

    it.todo(
      'BUG: escapeHtml() is a no-op round-trip — `div.textContent = text; return div.textContent` ' +
        "returns its input unchanged (textContent never encodes entities). Rendering is only safe " +
        "today because values are applied via textContent/setAttribute; any future consumer that " +
        "trusts the 'escaped' return value in an innerHTML sink becomes an XSS hole. " +
        "Fix: use `div.innerHTML` on the way out (or a manual entity map)."
    );

    it.todo(
      "BUG: field values are passed to String.replace() as raw replacement strings — a CMS value " +
        'containing "$&", "$`" or "$\'" triggers JS replacement-pattern substitution (e.g. "$&" ' +
        "re-inserts the matched placeholder). Values must be inserted via a replacer function."
    );
  });

  describe("multiple repeaters", () => {
    it("expands two sibling repeaters bound to different collections", async () => {
      const { composer } = makeComposer({
        bindings: {
          posts: makeBinding({ elementId: "posts", collectionId: "col-posts" }),
          team: makeBinding({ elementId: "team", collectionId: "col-team" }),
        },
        itemsByCollection: {
          "col-posts": [
            makeItem("p1", "col-posts", { title: "Post A" }),
            makeItem("p2", "col-posts", { title: "Post B" }),
          ],
          "col-team": [makeItem("t1", "col-team", { name: "Aamir" })],
        },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="posts">{{item.title}}</div>' +
            '<div data-buildrick-id="team">{{item.name}}</div>'
        )
      );

      expect(doc.querySelectorAll('[data-buildrick-id^="posts-"]')).toHaveLength(2);
      expect(doc.querySelectorAll('[data-buildrick-id^="team-"]')).toHaveLength(1);
      expect(doc.querySelector('[data-buildrick-id="team-0"]')!.textContent).toBe("Aamir");
    });

    it("expands a nested repeater's own template (single-pass semantics)", async () => {
      // Outer template contains an inner repeater template. Both are found in
      // the initial [data-buildrick-id] scan and expanded concurrently.
      const { composer } = makeComposer({
        bindings: {
          outer: makeBinding({ elementId: "outer", collectionId: "col-outer" }),
          inner: makeBinding({
            elementId: "inner",
            collectionId: "col-inner",
            itemVar: "sub",
          }),
        },
        itemsByCollection: {
          "col-outer": [
            makeItem("o1", "col-outer", { title: "Outer 1" }),
            makeItem("o2", "col-outer", { title: "Outer 2" }),
          ],
          "col-inner": [
            makeItem("s1", "col-inner", { label: "Sub A" }),
            makeItem("s2", "col-inner", { label: "Sub B" }),
          ],
        },
      });
      const renderer = new RepeaterRenderer(composer);

      const doc = parse(
        await renderer.expandRepeaters(
          '<div data-buildrick-id="outer"><span>{{item.title}}</span>' +
            '<ul data-buildrick-id="inner"><li>{{sub.label}}</li></ul></div>'
        )
      );

      // Outer expanded into two clones with the outer field resolved.
      const outerClones = doc.querySelectorAll('[data-buildrick-id^="outer-"]');
      expect(outerClones).toHaveLength(2);
      expect(outerClones[0].querySelector("span")!.textContent).toBe("Outer 1");

      // The inner template that was present in the initial scan was expanded
      // (its clones live wherever that original node sits after outer cloning).
      expect(doc.querySelector('[data-buildrick-id="inner-0"]')!.textContent).toBe("Sub A");
      expect(doc.querySelector('[data-buildrick-id="inner-1"]')!.textContent).toBe("Sub B");
    });

    it.todo(
      "LIMITATION: nested repeaters are not recursively expanded — outer clones copy the inner " +
        "template markup as-is (expansion order between outer/inner is a microtask race), so inner " +
        "placeholders can survive inside outer clones. Recursive/nested expansion needs a " +
        "sequential inner-first pass."
    );
  });

  describe("isRepeaterTemplate / getRepeaterBinding", () => {
    it("reflects binding presence", () => {
      const binding = makeBinding();
      const { composer } = makeComposer({ bindings: { rep: binding } });
      const renderer = new RepeaterRenderer(composer);

      expect(renderer.isRepeaterTemplate("rep")).toBe(true);
      expect(renderer.getRepeaterBinding("rep")).toEqual(binding);
      expect(renderer.isRepeaterTemplate("other")).toBe(false);
      expect(renderer.getRepeaterBinding("other")).toBeNull();
    });

    it("returns false/null when the bindings manager is absent", () => {
      const composer = { cms: { bindings: undefined } } as unknown as Composer;
      const renderer = new RepeaterRenderer(composer);

      expect(renderer.isRepeaterTemplate("rep")).toBe(false);
      expect(renderer.getRepeaterBinding("rep")).toBeNull();
    });
  });
});
