/**
 * dropValidation — baseline test coverage (E-020)
 * Uses real nesting helpers (canNestElement, isVoidType, isInteractiveType,
 * canHaveChildren) so this suite doubles as regression coverage on the
 * nesting type-classification map.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { THRESHOLDS } from "../../../constants";
import type { ElementType } from "../../../types";
import type { Element } from "../../../../engine/elements/Element";
import {
  validateDrop,
  validateElementDrop,
  getDropReasonMessage,
  type InvalidDropReason,
} from "../dropValidation";

describe("validateDrop", () => {
  describe("identity / structural rejection", () => {
    it("SELF_DROP when source.id === target.id", () => {
      const r = validateDrop("container", "x", "container", "x", "inside");
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("SELF_DROP");
    });

    it("ANCESTOR_DROP when target is in descendantIds", () => {
      const r = validateDrop("container", "src", "container", "child", "inside", {
        descendantIds: new Set(["child"]),
      });
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("ANCESTOR_DROP");
    });

    it("MAX_DEPTH at depth >= THRESHOLDS.MAX_NESTING_DEPTH", () => {
      const r = validateDrop("container", "s", "container", "t", "inside", {
        depth: THRESHOLDS.MAX_NESTING_DEPTH,
      });
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("MAX_DEPTH");
    });

    it("MAX_DEPTH not triggered at depth = MAX_NESTING_DEPTH - 1", () => {
      const r = validateDrop("container", "s", "container", "t", "inside", {
        depth: THRESHOLDS.MAX_NESTING_DEPTH - 1,
      });
      expect(r.reason).not.toBe("MAX_DEPTH");
    });
  });

  describe("inside-drop nesting rules", () => {
    it("VOID_ELEMENT when dropping inside img", () => {
      const r = validateDrop("container", "s", "image", "t", "inside");
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("VOID_ELEMENT");
    });

    it("VOID_ELEMENT when dropping inside input", () => {
      const r = validateDrop("container", "s", "input", "t", "inside");
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("VOID_ELEMENT");
    });

    it("INTERACTIVE_NESTING when dropping button inside button (inside)", () => {
      const r = validateDrop("button", "s", "button", "t", "inside");
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("INTERACTIVE_NESTING");
    });

    it("INTERACTIVE_NESTING when dropping button inside link", () => {
      const r = validateDrop("button", "s", "link", "t", "inside");
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("INTERACTIVE_NESTING");
    });
  });

  describe("interactive ancestry (any drop position)", () => {
    it("INTERACTIVE_NESTING when source button has interactive ancestor (before)", () => {
      const r = validateDrop("button", "s", "container", "t", "before", {
        ancestorTypes: ["link"] as ElementType[],
      });
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("INTERACTIVE_NESTING");
    });

    it("button without interactive ancestor is allowed", () => {
      const r = validateDrop("button", "s", "container", "t", "before", {
        ancestorTypes: ["container", "section"] as ElementType[],
      });
      expect(r.reason).not.toBe("INTERACTIVE_NESTING");
    });
  });

  describe("same-position no-op", () => {
    it("SAME_POSITION when parent + index identical (inside drop)", () => {
      const r = validateDrop("container", "s", "container", "parent", "inside", {
        currentParentId: "parent",
        currentIndex: 2,
        targetIndex: 2,
      });
      expect(r.isValid).toBe(false);
      expect(r.reason).toBe("SAME_POSITION");
    });

    it("not SAME_POSITION when index differs", () => {
      const r = validateDrop("container", "s", "container", "parent", "inside", {
        currentParentId: "parent",
        currentIndex: 2,
        targetIndex: 3,
      });
      expect(r.reason).not.toBe("SAME_POSITION");
    });
  });

  describe("valid drops", () => {
    it("div inside div is valid", () => {
      const r = validateDrop("container", "s", "container", "t", "inside");
      expect(r.isValid).toBe(true);
      expect(r.reason).toBeNull();
      expect(r.message).toBeNull();
    });

    it("before/after on a void element is allowed (target is sibling, not parent)", () => {
      const r = validateDrop("container", "s", "image", "t", "before");
      expect(r.isValid).toBe(true);
    });
  });
});

describe("validateElementDrop", () => {
  function makeMockElement(opts: {
    id: string;
    type: ElementType;
    parent?: MockEl | null;
    children?: MockEl[];
    descendants?: MockEl[];
  }): MockEl {
    const m = new MockEl(opts.id, opts.type);
    m.setParent(opts.parent ?? null);
    m.setChildren(opts.children ?? []);
    m.setDescendants(opts.descendants ?? []);
    return m;
  }

  class MockEl {
    private parent: MockEl | null = null;
    private children: MockEl[] = [];
    private descendants: MockEl[] = [];
    constructor(public id: string, public type: ElementType) {}
    setParent(p: MockEl | null): void { this.parent = p; }
    setChildren(c: MockEl[]): void { this.children = c; }
    setDescendants(d: MockEl[]): void { this.descendants = d; }
    getId(): string { return this.id; }
    getType(): ElementType { return this.type; }
    getParent(): MockEl | null { return this.parent; }
    getChildren(): MockEl[] { return this.children; }
    getDescendants(): MockEl[] { return this.descendants; }
  }
  const asEl = (m: MockEl): Element => m as unknown as Element;

  it("propagates SELF_DROP when source === target", () => {
    const a = makeMockElement({ id: "link", type: "container" });
    const r = validateElementDrop(asEl(a), asEl(a), "inside");
    expect(r.reason).toBe("SELF_DROP");
  });

  it("computes descendantIds and rejects ANCESTOR_DROP", () => {
    const child = makeMockElement({ id: "child", type: "container" });
    const source = makeMockElement({
      id: "src",
      type: "container",
      descendants: [child],
    });
    const r = validateElementDrop(asEl(source), asEl(child), "inside");
    expect(r.reason).toBe("ANCESTOR_DROP");
  });

  it("walks ancestry chain to detect interactive nesting (before drop)", () => {
    const link = makeMockElement({ id: "link", type: "link" });
    const inner = makeMockElement({ id: "inner", type: "container", parent: link });
    const target = makeMockElement({ id: "t", type: "container", parent: inner });
    const button = makeMockElement({ id: "btn", type: "button" });
    const r = validateElementDrop(asEl(button), asEl(target), "before", asEl(inner));
    expect(r.reason).toBe("INTERACTIVE_NESTING");
  });

  it("inside drop on void target rejects with VOID_ELEMENT", () => {
    const img = makeMockElement({ id: "image", type: "image" });
    const div = makeMockElement({ id: "d", type: "container" });
    const r = validateElementDrop(asEl(div), asEl(img), "inside");
    expect(r.reason).toBe("VOID_ELEMENT");
  });

  it("happy path: div inside div is valid", () => {
    const src = makeMockElement({ id: "s", type: "container" });
    const tgt = makeMockElement({ id: "t", type: "container" });
    const r = validateElementDrop(asEl(src), asEl(tgt), "inside");
    expect(r.isValid).toBe(true);
  });
});

describe("getDropReasonMessage", () => {
  it("returns null for null reason", () => {
    expect(getDropReasonMessage(null)).toBeNull();
  });

  const reasons: NonNullable<InvalidDropReason>[] = [
    "VOID_ELEMENT",
    "TEXT_ELEMENT",
    "SELF_DROP",
    "ANCESTOR_DROP",
    "MAX_DEPTH",
    "SAME_POSITION",
    "NESTING_FORBIDDEN",
    "INTERACTIVE_NESTING",
    "CANNOT_NEST_IN_TARGET",
  ];

  for (const r of reasons) {
    it(`returns a non-empty message for ${r}`, () => {
      const msg = getDropReasonMessage(r);
      expect(msg).toBeTruthy();
      expect(typeof msg).toBe("string");
    });
  }
});
