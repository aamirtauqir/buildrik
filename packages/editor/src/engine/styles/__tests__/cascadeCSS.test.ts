import { describe, it, expect } from "vitest";
import { elementBaseCSS, hideRulesFor, type BaseRuleCache, type StyleNode } from "../cascadeCSS";
import { elementSelector } from "@/shared/utils/elementSelector";

const tree = (color: string): StyleNode => ({
  id: "root",
  children: [
    { id: "el-a", styles: { color, "--hide-mobile": "true" } },
    { id: "el-b", styles: { padding: "8px" } },
  ],
});

describe("elementBaseCSS", () => {
  it("writes the published shape: base rules, then hide rules in viewport queries", () => {
    const css = elementBaseCSS([tree("red")], (id) => `.buildrick-${id}`, "media", true);
    expect(css).toBe(
      ".buildrick-el-a{color: red;--hide-mobile: true;}.buildrick-el-b{padding: 8px;}" +
        "@media (max-width:767px){.buildrick-el-a{display:none!important}}",
    );
  });

  it("on the canvas, hides only on the previewed breakpoint and without a query", () => {
    expect(elementBaseCSS([tree("red")], elementSelector, "desktop", true)).not.toContain("display:none");
    expect(elementBaseCSS([tree("red")], elementSelector, "mobile", true)).toContain(
      '[data-buildrick-id="el-a"]{display:none!important}',
    );
  });

  it("drops a declaration that could leave its rule", () => {
    const css = elementBaseCSS([{ id: "el-x", styles: { color: "red}body{display:none" } }], elementSelector, "media", true);
    expect(css).not.toContain("body{");
  });

  it("gives the same output with and without the cache, and rebuilds an element whose styles changed", () => {
    const cache: BaseRuleCache = new Map();
    const first = elementBaseCSS([tree("red")], elementSelector, "tablet", false, cache);
    expect(first).toBe(elementBaseCSS([tree("red")], elementSelector, "tablet", false));
    const sizeAfterFirst = cache.size;

    const again = elementBaseCSS([tree("red")], elementSelector, "tablet", false, cache);
    expect(again).toBe(first);
    expect(cache.size).toBe(sizeAfterFirst);

    const changed = elementBaseCSS([tree("blue")], elementSelector, "tablet", false, cache);
    expect(changed).toContain("color: blue;");
    expect(changed).not.toContain("color: red;");
  });
});

describe("hideRulesFor", () => {
  it("emits one query per hidden breakpoint on the published page", () => {
    expect(hideRulesFor(".x", { "--hide-tablet": "true", "--hide-desktop": "true" })).toEqual([
      "@media (min-width:768px) and (max-width:1023px){.x{display:none!important}}",
      "@media (min-width:1024px){.x{display:none!important}}",
    ]);
  });
});
