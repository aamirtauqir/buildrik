/**
 * G3-079 — the Collection list element repeats its CHILDREN once per record
 * (a binding with `repeat: "children"`), where the older repeater model
 * cloned the bound element itself. Canvas keeps the template editable: record
 * 0 renders into the real children (ids intact) and the rest are marked
 * clones; export renders every record and drops the template.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { RepeaterRenderer } from "../RepeaterRenderer";
import type { CMSCollectionBinding } from "../CMSBindingManager";
import type { Composer } from "@/engine/Composer";
import type { CMSContentItem, CMSQueryOptions, CMSQueryResult } from "@/shared/types/cms";

const now = "2026-01-01T00:00:00.000Z";
const item = (id: string, data: Record<string, unknown>): CMSContentItem =>
  ({ id, collectionId: "menu", data, status: "published", createdAt: now, updatedAt: now });

const ITEMS = [item("r1", { name: "Margherita", price: "$12" }), item("r2", { name: "Quattro", price: "$14" }), item("r3", { name: "Diavola", price: "$13" })];

function setup(bindings: CMSCollectionBinding[], items: CMSContentItem[] = ITEMS) {
  const queryContent = vi.fn(async (q: CMSQueryOptions): Promise<CMSQueryResult> => {
    const list = q.limit ? items.slice(0, q.limit) : items;
    return { items: list, total: items.length, hasMore: false };
  });
  const composer = {
    cms: {
      bindings: {
        getCollectionBinding: (id: string) => bindings.find((b) => b.elementId === id) ?? null,
        getAllCollectionBindings: () => bindings,
      },
      collections: { queryContent },
    },
  } as unknown as Composer;
  return { renderer: new RepeaterRenderer(composer), queryContent };
}

const list = (extra = "") =>
  new DOMParser().parseFromString(
    `<div data-buildrick-id="list"${extra}><div data-buildrick-id="card"><h3 data-buildrick-id="t">{{item.name}}</h3><p data-buildrick-id="p">{{item.price}}</p></div></div>`,
    "text/html",
  );

const binding = (o: Partial<CMSCollectionBinding> = {}): CMSCollectionBinding =>
  ({ elementId: "list", collectionId: "menu", itemVar: "item", indexVar: "index", status: "published", repeat: "children", ...o });

const cards = (doc: Document) => [...doc.querySelectorAll('[data-buildrick-id="list"] > [data-buildrick-id="card"]')] as HTMLElement[];

describe("RepeaterRenderer.expandCollectionLists", () => {
  it("canvas: record 0 renders into the real template, the rest are marked clones with the same ids", async () => {
    const { renderer } = setup([binding()]);
    const doc = list();
    expect(await renderer.expandCollectionLists(doc, { canvas: true })).toBe(true);
    const c = cards(doc);
    expect(c.map((e) => e.querySelector("h3")!.textContent)).toEqual(["Margherita", "Quattro", "Diavola"]);
    expect(c[0].hasAttribute("data-cms-repeater-clone")).toBe(false);
    expect(c.slice(1).map((e) => e.getAttribute("data-cms-repeater-clone"))).toEqual(["1", "2"]);
    expect(c[2].querySelector("p")!.getAttribute("data-buildrick-id")).toBe("p");
  });

  it("export: every record, no template, no editor markers", async () => {
    const { renderer } = setup([binding()]);
    const doc = list();
    await renderer.expandCollectionLists(doc);
    const c = cards(doc);
    expect(c.map((e) => e.querySelector("p")!.textContent)).toEqual(["$12", "$14", "$13"]);
    expect(doc.body.innerHTML).not.toContain("{{item.");
    expect(doc.body.innerHTML).not.toContain("data-cms-repeater");
  });

  it("export blanks a placeholder the record has no field for; the canvas keeps it visible", async () => {
    const doc = new DOMParser().parseFromString(
      '<div data-buildrick-id="list"><p data-buildrick-id="p">{{item.name}} {{item.missing}}</p></div>',
      "text/html",
    );
    await setup([binding()]).renderer.expandCollectionLists(doc);
    expect(doc.querySelector("p")!.textContent).toBe("Margherita ");
    const canvas = new DOMParser().parseFromString(
      '<div data-buildrick-id="list"><p data-buildrick-id="p">{{item.missing}}</p></div>',
      "text/html",
    );
    await setup([binding()]).renderer.expandCollectionLists(canvas, { canvas: true });
    expect(canvas.querySelector("p")!.textContent).toBe("{{item.missing}}");
  });

  it("honours the binding's limit", async () => {
    const { renderer, queryContent } = setup([binding({ limit: 2 })]);
    const doc = list();
    await renderer.expandCollectionLists(doc);
    expect(queryContent).toHaveBeenCalledWith(expect.objectContaining({ collectionId: "menu", limit: 2 }));
    expect(cards(doc)).toHaveLength(2);
  });

  it("no records: canvas keeps the template to edit; export renders nothing", async () => {
    const canvas = list();
    await setup([binding()], []).renderer.expandCollectionLists(canvas, { canvas: true });
    expect(cards(canvas)).toHaveLength(1);
    const out = list();
    await setup([binding()], []).renderer.expandCollectionLists(out);
    expect(cards(out)).toHaveLength(0);
  });

  it("leaves a document with no Collection list bindings untouched", async () => {
    const { renderer, queryContent } = setup([binding({ repeat: undefined })]);
    const doc = list();
    const before = doc.body.innerHTML;
    expect(await renderer.expandCollectionLists(doc)).toBe(false);
    expect(doc.body.innerHTML).toBe(before);
    expect(queryContent).not.toHaveBeenCalled();
  });
});
