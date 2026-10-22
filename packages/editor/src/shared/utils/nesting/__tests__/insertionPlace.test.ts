/**
 * insertionPlace — where click-to-add and paste land relative to the
 * selection (audit 2026-10-20 #15, Webflow behaviour): inside a selected
 * container as its LAST child; after a selected non-container as its sibling.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { ElementType } from "@/shared/types";
import { insertionPlace } from "../placement";

interface Node {
  id: string;
  getType: () => string;
  getParent: () => Node | null;
  getChildren: () => Node[];
}

function tree(type: string, id: string, kids: Node[] = []): Node {
  const node: Node = { id, getType: () => type, getParent: () => null, getChildren: () => kids };
  for (const k of kids) k.getParent = () => node;
  return node;
}

describe("insertionPlace", () => {
  it("an Image added with a Button selected goes AFTER the button, never inside it", () => {
    const button = tree("button", "btn");
    const box = tree("container", "box", [tree("heading", "h"), button, tree("paragraph", "p")]);
    const place = insertionPlace("image" as ElementType, button);
    expect(place?.parent.id).toBe(box.id);
    expect(place?.index).toBe(2);
  });

  it("a selected container takes the element as its LAST child", () => {
    const box = tree("container", "box", [tree("heading", "h"), tree("paragraph", "p")]);
    const place = insertionPlace("heading" as ElementType, box);
    expect(place?.parent.id).toBe("box");
    expect(place?.index).toBe(2);
  });

  it.each(["heading", "paragraph", "link", "image"])("goes after a selected %s", (type) => {
    const leaf = tree(type, "leaf");
    tree("container", "box", [leaf, tree("paragraph", "p")]);
    const place = insertionPlace("paragraph" as ElementType, leaf);
    expect(place?.parent.id).toBe("box");
    expect(place?.index).toBe(1);
  });

  it("climbs past ancestors that refuse the element, landing after the one on the path", () => {
    const link = tree("link", "a");
    const heading = tree("heading", "h", [link]);
    tree("container", "box", [tree("paragraph", "p"), heading, tree("paragraph", "p2")]);
    // A heading may not sit inside a heading: it lands after the one holding the link.
    const place = insertionPlace("heading" as ElementType, link);
    expect(place?.parent.id).toBe("box");
    expect(place?.index).toBe(2);
  });

  it("a selected Section's lone inner container is its content slot", () => {
    const slot = tree("container", "slot", [tree("heading", "h")]);
    const section = tree("section", "sec", [slot]);
    const place = insertionPlace("paragraph" as ElementType, section);
    expect(place?.parent.id).toBe("slot");
    expect(place?.index).toBe(1);
  });

  it("returns null when nothing up the chain accepts it", () => {
    const leaf = tree("heading", "h");
    expect(insertionPlace("section" as ElementType, leaf)).toBeNull();
  });
});
