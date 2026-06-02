import { describe, it, expect, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import { applySetStyle, applyAiEdit, setStyleArgsSchema } from "../applySetStyle";

function makeComposer(el: { setStyle?: unknown } | undefined) {
  return {
    elements: { getElement: vi.fn(() => el) },
  } as unknown as Composer;
}

function makeTxComposer(el: { setStyle?: unknown } | undefined) {
  const beginTransaction = vi.fn();
  const endTransaction = vi.fn();
  const setStyle = (el?.setStyle as ReturnType<typeof vi.fn>) ?? vi.fn();
  const composer = {
    elements: { getElement: vi.fn(() => (el ? { setStyle } : undefined)) },
    beginTransaction,
    endTransaction,
  } as unknown as Composer;
  return { composer, beginTransaction, endTransaction, setStyle };
}

function commitEdit(commands: unknown[]) {
  return { applyOps: { preview: {}, commit: { commands } } };
}

describe("setStyleArgsSchema", () => {
  it("accepts an allow-listed property with a safe value", () => {
    const r = setStyleArgsSchema.safeParse({
      elementId: "el-1",
      property: "color",
      value: "#000000",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a property outside the allow-list", () => {
    const r = setStyleArgsSchema.safeParse({
      elementId: "el-1",
      property: "color:hover", // pseudo-state — out of scope
      value: "#000",
    });
    expect(r.success).toBe(false);
  });

  it.each([
    "url(javascript:alert(1))",
    "expression(alert(1))",
    "url(data:text/html,...)",
    "-moz-binding: url(x)",
  ])("rejects unsafe value %s", (value) => {
    const r = setStyleArgsSchema.safeParse({
      elementId: "el-1",
      property: "background",
      value,
    });
    expect(r.success).toBe(false);
  });
});

describe("applySetStyle", () => {
  it("calls el.setStyle with the property and value", () => {
    const setStyle = vi.fn();
    const composer = makeComposer({ setStyle });
    applySetStyle(composer, {
      elementId: "el-1",
      property: "color",
      value: "#000000",
    });
    expect(setStyle).toHaveBeenCalledWith("color", "#000000");
  });

  it("throws when the element is not found", () => {
    const composer = makeComposer(undefined);
    expect(() =>
      applySetStyle(composer, {
        elementId: "missing",
        property: "color",
        value: "#000",
      }),
    ).toThrow(/element not found/i);
  });

  it("does not open a transaction (caller owns it)", () => {
    const setStyle = vi.fn();
    const composer = makeComposer({ setStyle });
    // applySetStyle touches only composer.elements.getElement + el.setStyle.
    applySetStyle(composer, {
      elementId: "el-1",
      property: "padding",
      value: "16px",
    });
    expect(setStyle).toHaveBeenCalledOnce();
  });
});

describe("applyAiEdit", () => {
  it("applies a batch inside exactly one transaction (one undo step)", () => {
    const { composer, beginTransaction, endTransaction, setStyle } =
      makeTxComposer({ setStyle: vi.fn() });
    const r = applyAiEdit(
      composer,
      commitEdit([
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#000" } },
        { commandId: "set-style", args: { elementId: "el-1", property: "padding", value: "8px" } },
      ]),
    );
    expect(r.applied).toBe(2);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
    expect(setStyle).toHaveBeenCalledTimes(2);
  });

  it("skips invalid / non-set-style entries but still wraps in a transaction", () => {
    const { composer, beginTransaction, endTransaction, setStyle } =
      makeTxComposer({ setStyle: vi.fn() });
    const r = applyAiEdit(
      composer,
      commitEdit([
        { commandId: "remove-element", args: { elementId: "el-1" } },
        { commandId: "set-style", args: { elementId: "el-1", property: "nope", value: "x" } },
        { commandId: "set-style", args: { elementId: "el-1", property: "color", value: "#fff" } },
      ]),
    );
    expect(r.applied).toBe(1);
    expect(setStyle).toHaveBeenCalledTimes(1);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("closes the transaction even when applying throws (endTransaction in finally)", () => {
    const { composer, endTransaction } = makeTxComposer(undefined); // getElement → undefined
    expect(() =>
      applyAiEdit(
        composer,
        commitEdit([
          { commandId: "set-style", args: { elementId: "gone", property: "color", value: "#000" } },
        ]),
      ),
    ).toThrow(/element not found/i);
    expect(endTransaction).toHaveBeenCalledOnce();
  });

  it("handles a missing commands payload as a no-op (still balanced transaction)", () => {
    const { composer, beginTransaction, endTransaction } = makeTxComposer({
      setStyle: vi.fn(),
    });
    const r = applyAiEdit(composer, { applyOps: { preview: {}, commit: {} } });
    expect(r.applied).toBe(0);
    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(endTransaction).toHaveBeenCalledOnce();
  });
});
