// @vitest-environment jsdom
/**
 * useElementBinding — the header chip's label (boards 24/25): "Menu.name"
 * while the collection exists; once it is deleted, the name the binding
 * stored at bind time ("Specials.title · missing"), or the field alone for an
 * old binding that stored none.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useElementBinding } from "../useElementBinding";

function composer(binding: Record<string, unknown>, collections: { id: string; name: string }[]) {
  return {
    on: vi.fn(),
    off: vi.fn(),
    cms: {
      bindings: { getBindings: () => [binding] },
      collections: { on: vi.fn(), off: vi.fn(), getCollection: (id: string) => collections.find((c) => c.id === id) ?? null },
    },
  } as never;
}

describe("useElementBinding", () => {
  it("a live collection is named by its current name", () => {
    const c = composer({ collectionId: "m", fieldSlug: "name", collectionName: "Old name" }, [{ id: "m", name: "Menu" }]);
    expect(renderHook(() => useElementBinding(c, "e1")).result.current).toEqual({ label: "Menu.name", missing: false, collectionId: "m" });
  });

  it("a deleted collection is named by the name stored on the binding", () => {
    const c = composer({ collectionId: "s", fieldSlug: "title", collectionName: "Specials" }, []);
    expect(renderHook(() => useElementBinding(c, "e1")).result.current).toEqual({ label: "Specials.title", missing: true, collectionId: "s" });
  });

  it("an old binding with no stored name falls back to the field", () => {
    const c = composer({ collectionId: "s", fieldSlug: "title" }, []);
    expect(renderHook(() => useElementBinding(c, "e1")).result.current?.label).toBe("title");
  });
});
