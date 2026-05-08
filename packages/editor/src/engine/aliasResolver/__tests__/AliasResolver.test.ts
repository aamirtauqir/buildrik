import { describe, it, expect, beforeEach } from "vitest";
import { AliasResolver } from "../AliasResolver";
import { AliasCycleError, AliasDepthError } from "../errors";
import type { DesignToken } from "../../../editor/design-system";
import type { EventEmitter } from "../../EventEmitter";
import validFixture from "../__fixtures__/valid-alias.json";
import cycle2Fixture from "../__fixtures__/cycle-2-node.json";
import cycle3Fixture from "../__fixtures__/cycle-3-node.json";
import depth2Fixture from "../__fixtures__/depth-2.json";

function makeEvents(): EventEmitter {
  return { emit: () => {}, on: () => {}, off: () => {} } as unknown as EventEmitter;
}

describe("AliasResolver.validate", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("accepts an empty token list", () => {
    expect(() => resolver.validate([])).not.toThrow();
  });

  it("accepts tokens without any aliasOf", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#000", category: "colors", cssVar: "--bd-a", type: "color" },
      { id: "b", name: "B", value: "#fff", category: "colors", cssVar: "--bd-b", type: "color" },
    ];
    expect(() => resolver.validate(tokens)).not.toThrow();
  });

  it("accepts a valid depth-1 alias", () => {
    expect(() => resolver.validate(validFixture.tokens as DesignToken[])).not.toThrow();
  });

  it("throws AliasCycleError on a 2-node cycle (a → b → a)", () => {
    let thrown: unknown;
    try { resolver.validate(cycle2Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasCycleError);
    expect((thrown as AliasCycleError).chain).toEqual(["a", "b", "a"]);
  });

  it("throws AliasCycleError on a 3-node cycle (a → b → c → a)", () => {
    let thrown: unknown;
    try { resolver.validate(cycle3Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasCycleError);
    const chain = (thrown as AliasCycleError).chain;
    expect(chain[0]).toBe(chain[chain.length - 1]);
    expect(chain.length).toBeGreaterThanOrEqual(3);
  });

  it("throws AliasDepthError on a depth-2 chain (a → b → c)", () => {
    let thrown: unknown;
    try { resolver.validate(depth2Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasDepthError);
    expect((thrown as AliasDepthError).sourceId).toBe("a");
    expect((thrown as AliasDepthError).targetId).toBe("b");
  });

  it("does NOT throw when alias points to a non-existent id (treated as leaf, validated by registry separately)", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "ghost" },
    ];
    expect(() => resolver.validate(tokens)).not.toThrow();
  });
});

describe("AliasResolver.resolve", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("returns undefined for unknown id", () => {
    expect(resolver.resolve("ghost", [])).toBeUndefined();
  });

  it("returns the same token when no aliasOf", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#000", category: "colors", cssVar: "--bd-a", type: "color" },
    ];
    expect(resolver.resolve("a", tokens)?.id).toBe("a");
  });

  it("walks aliasOf to canonical leaf", () => {
    const tokens = validFixture.tokens as DesignToken[];
    const result = resolver.resolve("color-primary", tokens);
    expect(result?.id).toBe("color-blue-500");
    expect(result?.value).toBe("#2D6DFF");
  });

  it("safely short-circuits on cycle (returns undefined)", () => {
    const tokens = cycle2Fixture.tokens as DesignToken[];
    expect(resolver.resolve("a", tokens)).toBeUndefined();
  });

  it("returns undefined when alias target is unknown", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "ghost" },
    ];
    expect(resolver.resolve("a", tokens)).toBeUndefined();
  });
});

describe("AliasResolver.getChain", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("returns [] for unknown id", () => {
    expect(resolver.getChain("ghost", [])).toEqual([]);
  });

  it("returns [tokenId] when no aliasOf", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color" },
    ];
    expect(resolver.getChain("a", tokens)).toEqual(["a"]);
  });

  it("returns full chain for valid alias", () => {
    const tokens = validFixture.tokens as DesignToken[];
    expect(resolver.getChain("color-primary", tokens)).toEqual(["color-primary", "color-blue-500"]);
  });

  it("returns chain ending at the cycle node for a cyclic input", () => {
    const tokens = cycle2Fixture.tokens as DesignToken[];
    const chain = resolver.getChain("a", tokens);
    expect(chain[0]).toBe("a");
    expect(chain[chain.length - 1]).toBe("a");
  });
});
