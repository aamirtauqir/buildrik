import { describe, it, expect } from "vitest";
import { scanInlineElements } from "../jsx-inline-element-scanner";

describe("scanInlineElements — multi-line JSX detection", () => {
  it("catches single-line <button>", () => {
    const source = `export const X = () => <button>x</button>;`;
    expect(scanInlineElements(source, "X.tsx")).toEqual([
      { file: "X.tsx", tag: "button", line: 1 },
    ]);
  });

  it("catches multi-line <select>", () => {
    const source = `export const X = () => (
  <select
    ref={ref}
    className="foo"
  >
    <option>a</option>
  </select>
);`;
    expect(scanInlineElements(source, "X.tsx")).toEqual([
      { file: "X.tsx", tag: "select", line: 2 },
    ]);
  });

  it("catches multiple inline elements", () => {
    const source = `<input /><textarea /><select><option/></select>`;
    const result = scanInlineElements(source, "X.tsx").map((r) => r.tag);
    expect(result).toEqual(["input", "textarea", "select"]);
  });

  it("ignores PascalCase JSX (vibcoder shims)", () => {
    const source = `<Button /><Input /><Select />`;
    expect(scanInlineElements(source, "X.tsx")).toEqual([]);
  });

  it("returns hits regardless of file path (caller filters)", () => {
    // Scanner is path-agnostic; gate script handles exclusion.
    const source = `<button>x</button>`;
    expect(scanInlineElements(source, "Foo.test.tsx")).toEqual([
      { file: "Foo.test.tsx", tag: "button", line: 1 },
    ]);
  });
});
