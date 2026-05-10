import { describe, it, expect, vi } from "vitest";
import { applyInterpretedTree } from "../applyInterpretedTree";
import type { Composer } from "@/engine";
import type { InterpretedNode } from "../schemaInterpreter";

interface Created {
  id: string;
  type: string;
  content: string;
  attributes: Record<string, string>;
  children: Created[];
}

function makeComposer(opts: { hasParent: boolean; failOnAddChild?: boolean }) {
  let counter = 0;
  const createdElements = new Map<string, Created>();
  const parent: Created | null = opts.hasParent
    ? { id: "parent-1", type: "container", content: "", attributes: {}, children: [] }
    : null;

  const makeElement = (type: string, options: { content?: string; attributes?: Record<string, string> }): Created & {
    getId: () => string;
    addChild: (c: Created & { getId: () => string }, i?: number) => void;
  } => {
    counter += 1;
    const id = `el-${counter}`;
    const el: Created = {
      id,
      type,
      content: options.content ?? "",
      attributes: options.attributes ?? {},
      children: [],
    };
    createdElements.set(id, el);
    return {
      ...el,
      getId: () => id,
      addChild: (child) => {
        if (opts.failOnAddChild) throw new Error("addChild fail");
        el.children.push(createdElements.get(child.getId())!);
      },
    };
  };

  return {
    composer: {
      elements: {
        getElement: vi.fn((id: string) => {
          if (id === "parent-1" && parent) {
            return {
              ...parent,
              getId: () => parent.id,
              addChild: (child: { getId: () => string }, _i?: number) => {
                if (opts.failOnAddChild) throw new Error("addChild fail");
                parent.children.push(createdElements.get(child.getId())!);
              },
            };
          }
          // Returning a fresh wrapper for newly-created element ids (recursive
          // applyNode calls getElement for the new node when adding children).
          const stored = createdElements.get(id);
          if (!stored) return undefined;
          return {
            ...stored,
            getId: () => stored.id,
            addChild: (child: { getId: () => string }, _i?: number) => {
              if (opts.failOnAddChild) throw new Error("addChild fail");
              stored.children.push(createdElements.get(child.getId())!);
            },
          };
        }),
        createElement: vi.fn(makeElement),
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      rollbackTransaction: vi.fn(),
    } as unknown as Composer,
    rootChildren: () => parent?.children ?? [],
    createdElements,
  };
}

describe("applyInterpretedTree", () => {
  it("inserts a flat element under parent", () => {
    const { composer, rootChildren } = makeComposer({ hasParent: true });
    const tree: InterpretedNode = {
      kind: "element",
      tag: "button",
      attrs: { "data-variant": "primary" },
      content: "Click me",
      children: [],
    };
    const result = applyInterpretedTree(composer, "parent-1", tree);
    expect(result.rootElementId).toBeTruthy();
    expect(rootChildren()).toHaveLength(1);
    expect(rootChildren()[0].type).toBe("button");
    expect(rootChildren()[0].content).toBe("Click me");
    expect(rootChildren()[0].attributes["data-variant"]).toBe("primary");
  });

  it("recurses into nested children (h3 + slot)", () => {
    const { composer, rootChildren, createdElements } = makeComposer({ hasParent: true });
    const tree: InterpretedNode = {
      kind: "element",
      tag: "div",
      attrs: {},
      children: [
        { kind: "element", tag: "h3", attrs: {}, content: "Title", children: [] },
        { kind: "slot", name: "body" },
      ],
    };
    applyInterpretedTree(composer, "parent-1", tree);
    expect(rootChildren()).toHaveLength(1);
    const root = rootChildren()[0];
    expect(root.type).toBe("container");
    expect(root.children).toHaveLength(2);
    expect(root.children[0].type).toBe("heading");
    expect(root.children[0].content).toBe("Title");
    // Slot becomes a container with data-slot attr.
    expect(root.children[1].type).toBe("container");
    expect(root.children[1].attributes["data-slot"]).toBe("body");
    // Total elements created = root div + h3 + slot div = 3.
    expect(createdElements.size).toBe(3);
  });

  it("rolls back when parent missing", () => {
    const { composer } = makeComposer({ hasParent: false });
    const tree: InterpretedNode = { kind: "element", tag: "div", attrs: {}, children: [] };
    const result = applyInterpretedTree(composer, "no-such-parent", tree);
    expect(result.rootElementId).toBeUndefined();
    expect(composer.rollbackTransaction).toHaveBeenCalled();
  });

  it("rolls back when addChild throws", () => {
    const { composer } = makeComposer({ hasParent: true, failOnAddChild: true });
    const tree: InterpretedNode = { kind: "element", tag: "div", attrs: {}, children: [] };
    const result = applyInterpretedTree(composer, "parent-1", tree);
    expect(result.rootElementId).toBeUndefined();
    expect(composer.rollbackTransaction).toHaveBeenCalled();
  });
});
