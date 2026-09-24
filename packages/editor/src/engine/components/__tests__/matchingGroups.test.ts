/**
 * matchingGroups — "matching" = identical apart from ids (board 4418:142143).
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, expect, it } from "vitest";
import { Composer } from "../../Composer";
import { findMatchingElements, structureSignature } from "../matchingGroups";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }), putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const card = (id: string, text: string) => ({
  id, type: "container" as const, styles: { padding: "8px" },
  children: [{ id: `${id}-h`, type: "heading" as const, content: text, children: [] }],
});

describe("matchingGroups", () => {
  it("ignores ids, sees content", () => {
    expect(structureSignature(card("a", "Hi") as never)).toBe(structureSignature(card("b", "Hi") as never));
    expect(structureSignature(card("a", "Hi") as never)).not.toBe(structureSignature(card("b", "Yo") as never));
  });

  it("finds identical copies on the active page, not the source or a different one", () => {
    const c = new Composer({} as never);
    c.importProject({
      pages: [{ id: "p", name: "Home", slug: "", root: { id: "root", type: "container", children: [card("a", "Hi"), card("b", "Hi"), card("c", "Other")] } }],
    } as never);
    expect(findMatchingElements(c, "a")).toEqual(["b"]);
  });
});
