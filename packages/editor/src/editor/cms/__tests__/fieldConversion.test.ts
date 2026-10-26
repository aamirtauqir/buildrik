/**
 * What a stored value becomes under a field's new type (2L9 257:51318).
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { CMSField } from "@/shared/types/cms";
import { convertValue } from "../fieldConversion";

const f = (type: CMSField["type"], extra: Partial<CMSField> = {}) =>
  ({ id: "f", name: "F", slug: "f", type, order: 0, ...extra }) as CMSField;

describe("convertValue", () => {
  it("number ↔ text both ways when the text is a number", () => {
    expect(convertValue(f("number"), 5, "text")).toEqual({ ok: true, value: "5" });
    expect(convertValue(f("text"), " 8 ", "number")).toEqual({ ok: true, value: 8 });
    expect(convertValue(f("text"), "eight", "number")).toEqual({ ok: false });
  });

  it("yes/no reads the usual words, and an option must be offered", () => {
    expect(convertValue(f("text"), "Yes", "boolean")).toEqual({ ok: true, value: true });
    expect(convertValue(f("text"), "maybe", "boolean")).toEqual({ ok: false });
    expect(convertValue(f("text", { options: ["A", "B"] }), "B", "select")).toEqual({ ok: true, value: "B" });
    expect(convertValue(f("text", { options: ["A"] }), "C", "select")).toEqual({ ok: false });
  });

  it("a list joins into text and one text becomes a one-item list", () => {
    expect(convertValue(f("multiselect"), ["a", "b"], "text")).toEqual({ ok: true, value: "a, b" });
    expect(convertValue(f("text"), "a", "multiselect")).toEqual({ ok: true, value: ["a"] });
  });

  it("the field's other rules still apply; Required does not", () => {
    expect(convertValue(f("text", { validation: { required: true, maxLength: 2 } }), 123, "text")).toEqual({ ok: false });
    expect(convertValue(f("number", { validation: { required: true } }), 1, "text")).toEqual({ ok: true, value: "1" });
  });
});
