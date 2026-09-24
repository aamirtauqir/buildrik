/**
 * Load-time repair: saved trees the HTML parser would break up are lifted the
 * way the browser renders them, so the model matches the canvas DOM.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementData } from "../../../../shared/types";
import { liftParserHoisted } from "../liftParserHoisted";

const el = (id: string, type: string, children: ElementData[] = [], tagName?: string): ElementData =>
  ({ id, type, tagName, children }) as ElementData;

describe("liftParserHoisted", () => {
  it("lifts headings nested in headings to siblings after the parent, in order (the scratch-ver shape)", () => {
    const root = el("root", "container", [
      el("a", "heading", [el("b", "heading", [el("c", "heading")]), el("d", "heading")]),
      el("p", "paragraph", [el("link", "link"), el("box", "container")]),
      el("z", "heading"),
    ]);
    const lifted = liftParserHoisted(root);
    expect(lifted).toBe(4);
    expect(root.children!.map((c) => c.id)).toEqual(["a", "b", "c", "d", "p", "box", "z"]);
    expect(root.children![4].children!.map((c) => c.id)).toEqual(["link"]);
    expect(root.children![0].children).toEqual([]);
  });

  it("uses the saved tag when there is one", () => {
    const root = el("root", "container", [el("t", "text", [el("h", "heading")], "p")]);
    expect(liftParserHoisted(root)).toBe(1);
    expect(root.children!.map((c) => c.id)).toEqual(["t", "h"]);
  });

  it("is idempotent and leaves a legal tree alone", () => {
    const root = el("root", "container", [el("a", "heading", [el("b", "heading")])]);
    liftParserHoisted(root);
    const snapshot = JSON.stringify(root);
    expect(liftParserHoisted(root)).toBe(0);
    expect(JSON.stringify(root)).toBe(snapshot);
  });
});
