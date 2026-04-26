// packages/editor/scripts/__tests__/vibcoder-codemod.test.mjs
import { describe, it, expect } from "vitest";
import { transform as cm1 } from "../vibcoder-codemod-1.mjs";
import { transform as cm2 } from "../vibcoder-codemod-2.mjs";

describe("vibcoder-codemod-1: class + animation rename", () => {
  it("rewrites simple class selector", () => {
    expect(cm1(".bdr-button { color: red; }")).toBe(".bd-button { color: red; }");
  });
  it("rewrites BEM element", () => {
    expect(cm1(".bdr-card__header {}")).toBe(".bd-card__header {}");
  });
  it("rewrites BEM modifier", () => {
    expect(cm1(".bdr-btn--primary {}")).toBe(".bd-btn--primary {}");
  });
  it("rewrites attribute selector", () => {
    expect(cm1('[class*="bdr-icon"] {}')).toBe('[class*="bd-icon"] {}');
  });
  it("rewrites @keyframes name", () => {
    expect(cm1("@keyframes bdr-fade-in {}")).toBe("@keyframes bd-fade-in {}");
  });
  it("rewrites animation-name longhand", () => {
    expect(cm1(".x { animation-name: bdr-spin; }")).toBe(".x { animation-name: bd-spin; }");
  });
  it("rewrites animation shorthand", () => {
    expect(cm1(".x { animation: bdr-spin 1s linear; }")).toBe(".x { animation: bd-spin 1s linear; }");
  });
  it("rewrites all names in multi-animation shorthand (regression for bdc5f13)", () => {
    expect(cm1(".x { animation: bdr-foo, bdr-bar; }")).toBe(".x { animation: bd-foo, bd-bar; }");
  });
  it("is idempotent", () => {
    const once = cm1(".bdr-foo {}");
    expect(cm1(once)).toBe(once);
  });
  it("leaves non-bdr classes untouched", () => {
    expect(cm1(".bd-existing {} .other-thing {}")).toBe(".bd-existing {} .other-thing {}");
  });
});

describe("vibcoder-codemod-2: token fold", () => {
  it("folds bg-panel token", () => {
    expect(cm2("color: var(--buildrick-color-bg-panel);"))
      .toBe("color: var(--buildrick-bg-panel);");
  });
  it("does not fold canonical name (no double-fold)", () => {
    expect(cm2("color: var(--buildrick-bg-panel);"))
      .toBe("color: var(--buildrick-bg-panel);");
  });
  it("folds multiple tokens in one declaration", () => {
    expect(cm2("border: 1px solid var(--buildrick-color-border); color: var(--buildrick-color-fg-primary);"))
      .toBe("border: 1px solid var(--buildrick-border); color: var(--buildrick-fg-primary);");
  });
});
