/**
 * L5-043: after "Restore to draft" a deleted element stayed selected — the
 * canvas drew its box and the Inspector edited a detached element.
 * importProject replaces every element, so a selection made before it points
 * at objects no longer in the tree. It is re-pointed at the element with the
 * same id when there is one, and cleared when there is not.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect } from "vitest";
import { Composer } from "../Composer";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

const project = (children: unknown[]) =>
  ({
    pages: [{ id: "p", name: "Home", slug: "", isHome: true, root: { id: "root", type: "container", tagName: "div", children } }],
  }) as never;

const heading = { id: "h", type: "heading", tagName: "h2", content: "Hi", children: [] };
const text = { id: "t", type: "text", tagName: "p", content: "Lorem", children: [] };

describe("importProject — selection", () => {
  it("clears a selection whose element the imported project does not have", () => {
    const composer = new Composer({} as never);
    composer.importProject(project([heading, text]));
    composer.selection.select(composer.elements.getElement("t"));
    composer.importProject(project([heading]));
    expect(composer.selection.getSelected()).toBeNull();
    expect(composer.selection.getSelectedIds()).toEqual([]);
  });

  it("re-points a selection at the imported element with the same id", () => {
    const composer = new Composer({} as never);
    composer.importProject(project([heading, text]));
    composer.selection.select(composer.elements.getElement("h"));
    composer.importProject(project([heading]));
    expect(composer.selection.getSelected()).toBe(composer.elements.getElement("h"));
  });
});
