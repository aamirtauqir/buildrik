/**
 * Security review 2026-10-04: every payload through the editor's export path
 * — a Collection list ({{item.body}} rich, {{item.name}} plain), a bound
 * element (rich), and a list template whose OWN literal text looks like
 * markup — then the exported page is parsed: no execution vector.
 *
 * The last case failed before: any substitution re-parsed the whole text
 * node through innerHTML, so the author's literal "<img onerror=…>" text
 * became an element.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CMSExportResolver } from "../CMSExportResolver";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import type { Composer } from "@/engine/Composer";
import { XSS_PAYLOADS, executionVector } from "@buildrik/shared/content/__tests__/xssVectors";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});
beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

async function exportWith(payload: string, template: string) {
  const composer = { data: { on: vi.fn(), off: vi.fn() }, markDirty: vi.fn(), emit: vi.fn(), on: vi.fn(), elements: { getElement: () => null } } as unknown as Composer;
  const collections = new CollectionManager();
  const bindings = new CMSBindingManager(composer, collections);
  (composer as unknown as { cms: unknown }).cms = { collections, bindings };
  const c = await collections.createCollection("Posts", "posts", undefined, {
    fields: [{ id: "n", name: "Name", slug: "name", type: "text", order: 0 }, { id: "b", name: "Body", slug: "body", type: "richtext", order: 1 }],
  });
  /* Stored unsanitized on purpose: the writer must not trust storage. */
  const item = await collections.createContentItem(c.id, { name: payload, body: payload }, { status: "published" });
  bindings.bindCollection("list", c.id, { repeat: "children" });
  bindings.import({
    rich: [{ binding: { sourceId: `cms:${c.id}`, path: "body", type: "variable" }, collectionId: c.id, itemId: item!.id, fieldSlug: "body", property: "content" }],
    plain: [{ binding: { sourceId: `cms:${c.id}`, path: "name", type: "variable" }, collectionId: c.id, itemId: item!.id, fieldSlug: "name", property: "content" }],
  });
  const html = await new CMSExportResolver(composer).resolve(template, { mode: "static" });
  return new DOMParser().parseFromString(html, "text/html");
}

const TEMPLATE =
  '<div data-buildrick-id="list"><div data-buildrick-id="card">{{item.body}}<h3 data-buildrick-id="h">{{item.name}}</h3><img data-buildrick-id="i" src="/a.png" alt="{{item.name}}"></div></div>' +
  '<div data-buildrick-id="rich">x</div><p data-buildrick-id="plain">x</p>';

describe("XSS through the export path", () => {
  it.each(XSS_PAYLOADS)("%s", async (payload) => {
    const doc = await exportWith(payload, TEMPLATE);
    expect(executionVector(doc.body, { allowImages: true })).toBeNull();
    expect(doc.querySelectorAll("img")).toHaveLength(1);
    expect(doc.querySelector('[data-buildrick-id="plain"]')!.textContent).toBe(payload);
  });

  it("raw-text elements in a list template are not substituted: <script>{{item.name}}</script>", async () => {
    const doc = await exportWith(
      "</script><script>alert(1)</script>",
      '<div data-buildrick-id="list"><script data-buildrick-id="s">var a = "{{item.name}}";</script><style data-buildrick-id="st">.x::after{content:"{{item.name}}"}</style><textarea data-buildrick-id="ta">{{item.name}}</textarea></div>',
    );
    const scripts = Array.from(doc.querySelectorAll("script"));
    expect(scripts).toHaveLength(1);
    /* The record's value never lands there; the leftover placeholder is blanked (BD-06). */
    for (const raw of [scripts[0], doc.querySelector("style")!]) expect(raw.textContent).not.toMatch(/alert|<|Margherita/);
    expect(doc.querySelector("textarea")!.value).not.toContain("alert");
  });

  it("a plain value with <script> lands as text: <p>{{item.x}}</p>", async () => {
    const doc = await exportWith("<script>alert(1)</script>", '<div data-buildrick-id="list"><p data-buildrick-id="p">{{item.name}}</p></div>');
    expect(doc.querySelector("script")).toBeNull();
    expect(doc.querySelector("p")!.textContent).toBe("<script>alert(1)</script>");
  });

  it("the template's own literal text never becomes markup when a value is substituted beside it", async () => {
    const t = new DOMParser().parseFromString('<div data-buildrick-id="list"><p data-buildrick-id="p"></p></div>', "text/html");
    t.querySelector("p")!.textContent = "<img src=x onerror=alert(1)> by {{item.name}}";
    const doc = await exportWith("Ada", t.body.innerHTML);
    expect(executionVector(doc.body)).toBeNull();
    expect(doc.querySelector("p")!.textContent).toBe("<img src=x onerror=alert(1)> by Ada");
  });
});
