/**
 * P-1 / P-10 — the Inspector write gate (writableElements, writeElement) and
 * the one pasteStyles implementation, exercised directly: the null/empty
 * inputs, the single LOCKED_ELEMENTS_SKIPPED signal, and the transaction
 * that must close even when the write throws.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { writableElements, writeElement, pasteStyles } from "../commandOperations";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";
import type { Element } from "../../elements/Element";

function makeComposer(styleClipboard: Record<string, string> | null = null) {
  return {
    emit: vi.fn(),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    styleClipboard,
  };
}

function makeEl(locked = false, styles: Record<string, string> = {}) {
  return {
    isLocked: () => locked,
    setStyle: vi.fn((k: string, v: string) => {
      styles[k] = v;
    }),
    styles,
  };
}

const asComposer = (c: ReturnType<typeof makeComposer>) => c as unknown as Composer;
const asEl = (e: ReturnType<typeof makeEl>) => e as unknown as Element;
const skipped = (c: ReturnType<typeof makeComposer>) =>
  c.emit.mock.calls.filter(([name]) => name === EVENTS.LOCKED_ELEMENTS_SKIPPED).length;

describe("writableElements", () => {
  it("drops null/undefined without raising the locked signal", () => {
    const c = makeComposer();
    const a = makeEl();
    expect(writableElements(asComposer(c), [null, asEl(a), undefined])).toEqual([a]);
    expect(skipped(c)).toBe(0);
  });

  it("drops locked elements and raises LOCKED_ELEMENTS_SKIPPED exactly once", () => {
    const c = makeComposer();
    const a = makeEl();
    const out = writableElements(asComposer(c), [asEl(makeEl(true)), asEl(a), asEl(makeEl(true))]);
    expect(out).toEqual([a]);
    expect(skipped(c)).toBe(1);
  });

  it("treats a partial double without isLocked as writable", () => {
    const c = makeComposer();
    const partial = { setStyle: vi.fn() } as unknown as Element;
    expect(writableElements(asComposer(c), [partial])).toEqual([partial]);
    expect(skipped(c)).toBe(0);
  });
});

describe("writeElement", () => {
  it("refuses a locked element: no transaction, write not called, returns false", () => {
    const c = makeComposer();
    const write = vi.fn();
    expect(writeElement(asComposer(c), asEl(makeEl(true)), "x", write)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(c.beginTransaction).not.toHaveBeenCalled();
    expect(skipped(c)).toBe(1);
  });

  it("refuses a missing element silently", () => {
    const c = makeComposer();
    const write = vi.fn();
    expect(writeElement(asComposer(c), null, "x", write)).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(skipped(c)).toBe(0);
  });

  it("wraps the write in one labelled transaction", () => {
    const c = makeComposer();
    const el = makeEl();
    const write = vi.fn();
    expect(writeElement(asComposer(c), asEl(el), "edit-attr", write)).toBe(true);
    expect(c.beginTransaction).toHaveBeenCalledWith("edit-attr");
    expect(write).toHaveBeenCalledWith(el);
    expect(c.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("closes the transaction even when the write throws", () => {
    const c = makeComposer();
    expect(() =>
      writeElement(asComposer(c), asEl(makeEl()), "boom", () => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(c.endTransaction).toHaveBeenCalledTimes(1);
  });
});

describe("pasteStyles", () => {
  it("returns 0 and opens no transaction when the clipboard is null", () => {
    const c = makeComposer(null);
    expect(pasteStyles(asComposer(c), asEl(makeEl()))).toBe(0);
    expect(c.beginTransaction).not.toHaveBeenCalled();
  });

  it("returns 0 and opens no transaction when the clipboard is empty", () => {
    const c = makeComposer({});
    expect(pasteStyles(asComposer(c), asEl(makeEl()))).toBe(0);
    expect(c.beginTransaction).not.toHaveBeenCalled();
  });

  it("merges key by key: properties the source did not carry survive", () => {
    const c = makeComposer({ color: "red", padding: "4px" });
    const el = makeEl(false, { margin: "8px", color: "blue" });
    expect(pasteStyles(asComposer(c), asEl(el))).toBe(2);
    expect(el.styles).toEqual({ margin: "8px", color: "red", padding: "4px" });
    expect(c.beginTransaction).toHaveBeenCalledTimes(1);
  });

  it("refuses a locked target and reports 0 applied", () => {
    const c = makeComposer({ color: "red" });
    const el = makeEl(true, { color: "blue" });
    expect(pasteStyles(asComposer(c), asEl(el))).toBe(0);
    expect(el.setStyle).not.toHaveBeenCalled();
    expect(skipped(c)).toBe(1);
  });
});
