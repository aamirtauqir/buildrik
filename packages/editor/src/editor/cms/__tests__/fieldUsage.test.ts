/**
 * fieldUsage — a Collection-bound repeater/list never registers a
 * field-level binding (that map is `cms.bindings.export()`), so a field
 * referenced only via a `{{item.<field>}}` template placeholder read as
 * unused: the Fields table's USED BY column stayed blank and
 * DeleteFieldDialog took the unguarded "Delete this field?" path instead of
 * "Cannot delete — field is bound" (4418:165439), silently breaking every
 * record's render once the field was gone. Flow-check finding, 2026-09-25.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { CMSCollection } from "@/shared/types/cms";
import { fieldUsage } from "../fieldUsage";
import { makeEngine } from "./fakeCmsEngine";

const MENU = {
  id: "col-1",
  name: "Menu items",
  slug: "menu-items",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text", order: 0 },
    { id: "f2", name: "Price", slug: "price", type: "text", order: 1 },
  ],
} as unknown as CMSCollection;

describe("fieldUsage — Collection-bound repeaters", () => {
  it("finds a field used only as an {{item.<field>}} placeholder on the repeater itself (repeat: self)", () => {
    const e = makeEngine({
      collections: [MENU],
      collectionBindings: [{ elementId: "el-repeater", collectionId: "col-1", repeat: "self" }],
    });
    e.elements.push({
      getId: () => "el-repeater",
      getType: () => "card",
      getContent: () => "{{item.price}}",
      getCustomData: () => undefined,
      getDataBindings: () => ({}),
      removeDataBinding: () => {},
    });
    const uses = fieldUsage(e.composer as never, MENU);
    expect(uses.get("price")).toEqual([{ label: "Card", elementId: "el-repeater" }]);
    expect(uses.get("name") ?? []).toHaveLength(0);
  });

  it("finds a field used inside a Collection list's children (repeat: children)", () => {
    const e = makeEngine({
      collections: [MENU],
      collectionBindings: [{ elementId: "el-list", collectionId: "col-1", repeat: "children" }],
    });
    e.elements.push({
      getId: () => "el-list",
      getType: () => "list",
      getContent: () => "",
      getCustomData: () => undefined,
      getDataBindings: () => ({}),
      removeDataBinding: () => {},
      getDescendants: () => [
        {
          getId: () => "el-name",
          getType: () => "heading",
          getContent: () => "{{item.name}}",
          getDataBindings: () => ({}),
          removeDataBinding: () => {},
        },
        {
          getId: () => "el-price",
          getType: () => "text",
          getContent: () => "Price: {{item.price}}",
          getDataBindings: () => ({}),
          removeDataBinding: () => {},
        },
      ],
    });
    const uses = fieldUsage(e.composer as never, MENU);
    expect(uses.get("name")).toEqual([{ label: "List", elementId: "el-list" }]);
    expect(uses.get("price")).toEqual([{ label: "List", elementId: "el-list" }]);
  });

  it("ignores a placeholder for a field that isn't on this collection", () => {
    const e = makeEngine({
      collections: [MENU],
      collectionBindings: [{ elementId: "el-repeater", collectionId: "col-1", repeat: "self" }],
    });
    e.elements.push({
      getId: () => "el-repeater",
      getType: () => "card",
      getContent: () => "{{item.notAField}}",
      getDataBindings: () => ({}),
      removeDataBinding: () => {},
    });
    const uses = fieldUsage(e.composer as never, MENU);
    expect(uses.size).toBe(0);
  });

  it("ignores a collection binding for a different collection", () => {
    const e = makeEngine({
      collections: [MENU],
      collectionBindings: [{ elementId: "el-repeater", collectionId: "col-9", repeat: "self" }],
    });
    e.elements.push({
      getId: () => "el-repeater",
      getType: () => "card",
      getContent: () => "{{item.price}}",
      getDataBindings: () => ({}),
      removeDataBinding: () => {},
    });
    const uses = fieldUsage(e.composer as never, MENU);
    expect(uses.size).toBe(0);
  });
});
