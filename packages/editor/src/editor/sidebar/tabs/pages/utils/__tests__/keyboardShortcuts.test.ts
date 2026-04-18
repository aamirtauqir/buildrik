import { describe, it, expect } from "vitest";
import { shouldFocusSearch } from "../keyboardShortcuts";

describe("shouldFocusSearch", () => {
  it("triggers on `/` when target is the body", () => {
    const e = new KeyboardEvent("keydown", { key: "/" });
    Object.defineProperty(e, "target", { value: document.body });
    expect(shouldFocusSearch(e)).toBe(true);
  });
  it("does NOT trigger when target is an input (user is already typing)", () => {
    const input = document.createElement("input");
    const e = new KeyboardEvent("keydown", { key: "/" });
    Object.defineProperty(e, "target", { value: input });
    expect(shouldFocusSearch(e)).toBe(false);
  });
  it("does NOT trigger when target is a textarea", () => {
    const ta = document.createElement("textarea");
    const e = new KeyboardEvent("keydown", { key: "/" });
    Object.defineProperty(e, "target", { value: ta });
    expect(shouldFocusSearch(e)).toBe(false);
  });
  it("does NOT trigger for other keys", () => {
    const e = new KeyboardEvent("keydown", { key: "k" });
    Object.defineProperty(e, "target", { value: document.body });
    expect(shouldFocusSearch(e)).toBe(false);
  });
  it("does NOT trigger with modifier keys held", () => {
    const e = new KeyboardEvent("keydown", { key: "/", metaKey: true });
    Object.defineProperty(e, "target", { value: document.body });
    expect(shouldFocusSearch(e)).toBe(false);
  });
  it("does NOT trigger when target is contentEditable", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    const e = new KeyboardEvent("keydown", { key: "/" });
    Object.defineProperty(e, "target", { value: div });
    expect(shouldFocusSearch(e)).toBe(false);
  });
});
