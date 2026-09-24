/**
 * elementLocation — "Home › Hero › Content" (boards 4418:166733 / 169389 /
 * 6887:78306).
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { elementLocation } from "../elementInfo";

type N = { getParent(): N | null; getType(): string; getCustomData?(k: string): unknown };
const node = (type: string, parent: N | null, layerName?: string): N => ({
  getParent: () => parent,
  getType: () => type,
  getCustomData: (k) => (k === "layerName" ? layerName : undefined),
});

describe("elementLocation", () => {
  const root = node("container", null);
  const hero = node("section", root, "Hero");
  const content = node("container", hero, "Content");
  const heading = node("heading", content);
  const byId: Record<string, N> = { root, hero, content, heading };
  const composer = { elements: { getElement: (id: string) => byId[id], getActivePage: () => ({ name: "Home" }) } };

  it("names the page and the ancestors under the root, by layer name", () => {
    expect(elementLocation(composer, "heading")).toBe("Home › Hero › Content");
  });
  it("includeSelf adds the element (its type label when unnamed)", () => {
    expect(elementLocation(composer, "heading", true)).toBe("Home › Hero › Content › Heading");
  });
  it("a top-level section's location is the page", () => {
    expect(elementLocation(composer, "hero")).toBe("Home");
  });
});
