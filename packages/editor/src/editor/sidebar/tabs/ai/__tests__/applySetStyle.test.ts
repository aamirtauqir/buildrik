import { describe, it, expect, vi } from "vitest";
import type { Composer } from "@/engine/Composer";
import { applySetStyle, setStyleArgsSchema } from "../applySetStyle";

function makeComposer(el: { setStyle?: unknown } | undefined) {
  return {
    elements: { getElement: vi.fn(() => el) },
  } as unknown as Composer;
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
