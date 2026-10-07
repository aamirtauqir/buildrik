/**
 * PD-1: a rich text field fills a bound element with its allow-listed markup
 * — every sink (canvas binding, list copy, export) shared writeBoundValue or
 * the binding manager; as text it showed its own tags.
 */
import { describe, it, expect } from "vitest";
import { richtextKeys, writeBoundValue } from "../RepeaterRenderer";

describe("writeBoundValue · rich text", () => {
  it("writes the allow-listed markup for a rich text field, text for anything else", () => {
    const el = document.createElement("div");
    writeBoundValue(el, "content", "<p>Hi <strong>you</strong><img src=x onerror=alert(1)></p>", true);
    expect(el.innerHTML).toBe("<p>Hi <strong>you</strong></p>");
    writeBoundValue(el, "content", "<p>Hi</p>", false);
    expect(el.textContent).toBe("<p>Hi</p>");
  });
  it("richtextKeys picks the rich text fields", () => {
    expect([...richtextKeys([{ slug: "a", type: "richtext" }, { slug: "b", type: "text" }])]).toEqual(["a"]);
  });
});
