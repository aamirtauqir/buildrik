import { describe, it, expect } from "vitest";
import { isSafeCssSelector } from "@buildrik/shared/schemas/element-markup";
import { classSelector, selectorLayer } from "../classSelector";
import { elementSelector } from "../elementSelector";

describe("classSelector — the one class/tag selector builder", () => {
  it.each([
    [["card"], undefined, ".card"],
    [["card", "is-dark"], undefined, ".card.is-dark"],
    [["a", "b", "c"], undefined, ".a.b.c"],
    [[], "h1", "h1"],
    [[], "body", "body"],
    [["card"], "div", "div.card"],
  ] as const)("%j %j → %s", (chain, tag, out) => {
    expect(classSelector(chain, tag)).toBe(out);
  });

  it.each([
    [[], undefined],
    [["a", "b", "c", "d"], undefined],
    [["Card"], undefined],
    [["2col"], undefined],
    [["a b"], undefined],
    [["buildrick-el1"], undefined],
    [["card"], "H1"],
    [[], "h1{}"],
  ] as const)("refuses %j %j", (chain, tag) => {
    expect(classSelector(chain, tag)).toBeNull();
  });

  it("every output passes the shared selector grammar", () => {
    const outs = [
      classSelector(["card"]), classSelector(["card", "is-dark", "x_1"]), classSelector([], "h6"),
      classSelector(["a".repeat(64)]), classSelector(["nav"], "a"),
    ];
    for (const s of outs) {
      expect(s).not.toBeNull();
      expect(isSafeCssSelector(s)).toBe(true);
      expect(isSafeCssSelector(`${s}:hover`)).toBe(true);
    }
  });
});

describe("selectorLayer — a stored selector back to its cascade layer", () => {
  it("reads tags, class chains, element-local rules and their state", () => {
    expect(selectorLayer("h1")).toEqual({ kind: "tag", tag: "h1", pseudo: "" });
    expect(selectorLayer("a:hover")).toEqual({ kind: "tag", tag: "a", pseudo: ":hover" });
    expect(selectorLayer(".card")).toEqual({ kind: "class", chain: ["card"], pseudo: "" });
    expect(selectorLayer(".card.is-dark:focus-visible")).toEqual({ kind: "class", chain: ["card", "is-dark"], pseudo: ":focus-visible" });
    expect(selectorLayer(".Card")).toEqual({ kind: "class", chain: ["Card"], pseudo: "" });
    const local = elementSelector("el-1");
    expect(selectorLayer(local)).toEqual({ kind: "local", identity: local, pseudo: "" });
    expect(selectorLayer(`${local}:hover`)).toEqual({ kind: "local", identity: local, pseudo: ":hover" });
  });

  it("leaves everything else as other", () => {
    for (const s of [".card p", "#hero", "h1, h2", `${elementSelector("x")} > p`, "*", ".a::before", "div.card"]) {
      expect(selectorLayer(s)).toEqual({ kind: "other" });
    }
  });

  it("round-trips classSelector", () => {
    expect(selectorLayer(classSelector(["card", "is-dark"])!)).toEqual({ kind: "class", chain: ["card", "is-dark"], pseudo: "" });
    expect(selectorLayer(classSelector([], "h2")!)).toEqual({ kind: "tag", tag: "h2", pseudo: "" });
  });
});
