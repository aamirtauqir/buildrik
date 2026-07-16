/**
 * dragDrop dragData — DataTransfer parse/set/type-check helpers.
 * Uses a lightweight in-memory DataTransfer stand-in (jsdom's is incomplete).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { MIME_TYPES } from "../../../constants";
import {
  generateDragSessionId,
  parseDragData,
  setElementDragData,
  setBlockDragData,
  setMultiDragData,
  hasDragDataType,
  getDragEffect,
} from "../dragData";
import type { DragData } from "../types";

// Minimal DataTransfer stand-in — jsdom's implementation doesn't persist setData.
class FakeDataTransfer {
  private store = new Map<string, string>();
  effectAllowed: DataTransfer["effectAllowed"] = "uninitialized";
  files: File[] = [];
  get types(): string[] {
    return [...this.store.keys(), ...(this.files.length ? [] : [])];
  }
  setData(format: string, data: string): void {
    this.store.set(format, data);
  }
  getData(format: string): string {
    return this.store.get(format) ?? "";
  }
}
const dt = () => new FakeDataTransfer() as unknown as DataTransfer;

describe("generateDragSessionId", () => {
  it("produces unique drag-prefixed ids", () => {
    const a = generateDragSessionId();
    const b = generateDragSessionId();
    expect(a).toMatch(/^drag/);
    expect(a).not.toBe(b);
  });
});

describe("parseDragData", () => {
  it("returns unknown for a null DataTransfer", () => {
    expect(parseDragData(null)).toEqual({ type: "unknown" });
  });

  it("returns unknown for an empty DataTransfer", () => {
    expect(parseDragData(dt())).toEqual({ type: "unknown" });
  });

  it("round-trips element drag data set via setElementDragData", () => {
    const t = dt();
    setElementDragData(t, "el-1", "container" as never, {
      originalParentId: "p1",
      originalIndex: 2,
    });
    const parsed = parseDragData(t) as Extract<DragData, { type: "element" }>;
    expect(parsed.type).toBe("element");
    expect(parsed.elementId).toBe("el-1");
    expect(parsed.originalParentId).toBe("p1");
    expect(parsed.originalIndex).toBe(2);
  });

  it("parses multi-element JSON first (highest precedence)", () => {
    const t = dt();
    setMultiDragData(t, [{ elementId: "a", elementType: "container" as never }]);
    const parsed = parseDragData(t) as Extract<DragData, { type: "multi" }>;
    expect(parsed.type).toBe("multi");
    expect(parsed.elements).toHaveLength(1);
  });

  it("falls through invalid multi JSON to element data", () => {
    const t = dt();
    t.setData(MIME_TYPES.MULTI, "{not-json");
    setElementDragData(t, "el-9", "text" as never);
    const parsed = parseDragData(t) as Extract<DragData, { type: "element" }>;
    expect(parsed.type).toBe("element");
    expect(parsed.elementId).toBe("el-9");
  });

  it("fills defaults for element data missing session/start fields", () => {
    const t = dt();
    t.setData(MIME_TYPES.ELEMENT, JSON.stringify({ elementId: "bare" }));
    const parsed = parseDragData(t) as Extract<DragData, { type: "element" }>;
    expect(parsed.elementId).toBe("bare");
    expect(parsed.elementType).toBe("container"); // default
    expect(parsed.startPosition).toEqual({ x: 0, y: 0 });
    expect(typeof parsed.sessionId).toBe("string");
  });

  it("ignores element JSON without an elementId and continues to block", () => {
    const t = dt();
    t.setData(MIME_TYPES.ELEMENT, JSON.stringify({ notAnId: true }));
    setBlockDragData(t, { type: "button" } as never);
    const parsed = parseDragData(t) as Extract<DragData, { type: "block" }>;
    expect(parsed.type).toBe("block");
  });

  it("round-trips block drag data", () => {
    const t = dt();
    setBlockDragData(t, { type: "button" } as never, { x: 5, y: 6 });
    const parsed = parseDragData(t) as Extract<DragData, { type: "block" }>;
    expect(parsed.type).toBe("block");
    expect(parsed.startPosition).toEqual({ x: 5, y: 6 });
    expect((parsed.block as { type: string }).type).toBe("button");
  });

  it("wraps a bare block payload (no envelope) under block.block", () => {
    const t = dt();
    // A raw block object without a nested { block } envelope.
    t.setData(MIME_TYPES.BLOCK, JSON.stringify({ type: "image", label: "img" }));
    const parsed = parseDragData(t) as Extract<DragData, { type: "block" }>;
    expect(parsed.type).toBe("block");
    expect((parsed.block as { type: string }).type).toBe("image");
  });

  it("detects external file drags", () => {
    const t = dt();
    (t as unknown as FakeDataTransfer).files = [
      new File(["x"], "a.png", { type: "image/png" }),
    ];
    const parsed = parseDragData(t) as Extract<DragData, { type: "external" }>;
    expect(parsed.type).toBe("external");
    expect(parsed.files).toHaveLength(1);
  });

  it("detects external text/html/url drags", () => {
    const t = dt();
    t.setData("text/plain", "hello");
    t.setData("text/html", "<b>hi</b>");
    t.setData("text/uri-list", "https://x.test");
    const parsed = parseDragData(t) as Extract<DragData, { type: "external" }>;
    expect(parsed.type).toBe("external");
    expect(parsed.text).toBe("hello");
    expect(parsed.html).toBe("<b>hi</b>");
    expect(parsed.url).toBe("https://x.test");
  });
});

describe("set*DragData return values + effectAllowed", () => {
  it("setElementDragData sets move effect + legacy key + returns session id", () => {
    const t = dt();
    const id = setElementDragData(t, "e", "container" as never);
    expect(id).toMatch(/^drag/);
    expect(t.effectAllowed).toBe("move");
    expect(t.getData("element")).not.toBe(""); // legacy key populated
  });

  it("setBlockDragData sets copy effect", () => {
    const t = dt();
    setBlockDragData(t, { type: "button" } as never);
    expect(t.effectAllowed).toBe("copy");
    expect(t.getData("block")).not.toBe("");
  });

  it("setMultiDragData sets move effect", () => {
    const t = dt();
    setMultiDragData(t, [{ elementId: "a", elementType: "container" as never }]);
    expect(t.effectAllowed).toBe("move");
  });
});

describe("hasDragDataType", () => {
  it("returns false for null", () => {
    expect(hasDragDataType(null, "element")).toBe(false);
  });

  it("detects element via canonical or legacy mime", () => {
    const t = dt();
    setElementDragData(t, "e", "container" as never);
    expect(hasDragDataType(t, "element")).toBe(true);
    expect(hasDragDataType(t, "block")).toBe(false);
  });

  it("detects block", () => {
    const t = dt();
    setBlockDragData(t, { type: "button" } as never);
    expect(hasDragDataType(t, "block")).toBe(true);
  });

  it("detects multi", () => {
    const t = dt();
    setMultiDragData(t, [{ elementId: "a", elementType: "container" as never }]);
    expect(hasDragDataType(t, "multi")).toBe(true);
  });

  it("detects external via files", () => {
    const t = dt();
    (t as unknown as FakeDataTransfer).files = [new File(["x"], "a.txt")];
    expect(hasDragDataType(t, "external")).toBe(true);
  });

  it("detects external via text mime", () => {
    const t = dt();
    t.setData("text/plain", "x");
    expect(hasDragDataType(t, "external")).toBe(true);
  });

  it("returns false for an unrecognised type key", () => {
    const t = dt();
    expect(hasDragDataType(t, "nope" as never)).toBe(false);
  });
});

describe("getDragEffect", () => {
  it("element / multi → move", () => {
    expect(getDragEffect({ type: "element" } as DragData)).toBe("move");
    expect(getDragEffect({ type: "multi" } as DragData)).toBe("move");
  });
  it("block / external → copy", () => {
    expect(getDragEffect({ type: "block" } as DragData)).toBe("copy");
    expect(getDragEffect({ type: "external" } as DragData)).toBe("copy");
  });
  it("unknown → none", () => {
    expect(getDragEffect({ type: "unknown" } as DragData)).toBe("none");
  });
});
