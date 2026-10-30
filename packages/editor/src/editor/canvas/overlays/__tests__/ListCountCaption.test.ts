/**
 * D95 (195:28058) / D88 (193:25921): the caption under a selected Collection
 * list counts what the canvas renders.
 * @license BSD-3-Clause
 */
import { describe, expect, it } from "vitest";
import { listCountCaption } from "../ListCountCaption";

const recs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, data: { cat: i % 2 ? "design" : "news" } }));

function composer(binding: Record<string, unknown> | null, opts: { template?: string | null; preview?: { id: string; data: Record<string, unknown> } } = {}) {
  return {
    cms: {
      bindings: {
        getCollectionBinding: () => binding,
        templateCollectionOf: () => opts.template ?? null,
        getPreviewRecord: async () => opts.preview ?? null,
      },
      collections: {
        getCollection: () => ({ name: "Team" }),
        queryContent: async () => ({ items: recs(14) }),
      },
    },
    elements: { getActivePage: () => ({ id: "p" }) },
  } as never;
}

describe("listCountCaption", () => {
  it("a plain list: 'N of M {Collection} records'", async () => {
    expect(await listCountCaption(composer({ repeat: "children", collectionId: "team", limit: 6 }), "l")).toBe("6 of 14 Team records");
  });

  it("a related list on its collection page: matching, current record excluded", async () => {
    const c = composer(
      { repeat: "children", collectionId: "blog", limit: 6, excludeCurrent: true },
      { template: "blog", preview: { id: "r3", data: {} } },
    );
    expect(await listCountCaption(c, "l")).toBe("6 of 13 matching records · current record excluded");
  });

  it("not a bound list: nothing", async () => {
    expect(await listCountCaption(composer(null), "l")).toBeNull();
  });
});
