/**
 * Unit tests for jsx-query helpers.
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import jscodeshift, { type JSXElement } from "jscodeshift";
import { hasStringLiteralAttr } from "../jsx-query";

const j = jscodeshift.withParser("tsx");

function firstJsx(source: string): JSXElement {
  const root = j(source);
  const els = root.find(j.JSXElement);
  if (els.size() === 0) throw new Error("no JSX element in source");
  return els.nodes()[0] as JSXElement;
}

describe("hasStringLiteralAttr", () => {
  it("returns true when attribute matches as a string literal", () => {
    const el = firstJsx(`const x = <input type="checkbox" />;`);
    expect(hasStringLiteralAttr(el, "type", "checkbox")).toBe(true);
  });

  it("returns false when attribute value differs", () => {
    const el = firstJsx(`const x = <input type="text" />;`);
    expect(hasStringLiteralAttr(el, "type", "checkbox")).toBe(false);
  });

  it("returns false when the attribute is a JSX expression (not a literal)", () => {
    const el = firstJsx(`const t = "checkbox"; const x = <input type={t} />;`);
    expect(hasStringLiteralAttr(el, "type", "checkbox")).toBe(false);
  });

  it("returns false when the attribute is missing entirely", () => {
    const el = firstJsx(`const x = <input />;`);
    expect(hasStringLiteralAttr(el, "type", "checkbox")).toBe(false);
  });
});
