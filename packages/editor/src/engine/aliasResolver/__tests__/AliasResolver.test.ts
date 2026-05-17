import { describe, it, expect, beforeEach, vi } from "vitest";
import { AliasResolver } from "../AliasResolver";
import { AliasCycleError, AliasDepthError } from "../errors";
import type { DesignToken } from "../../../editor/design-system";
import type { EventEmitter } from "../../EventEmitter";
import validFixture from "../__fixtures__/valid-alias.json";
import cycle2Fixture from "../__fixtures__/cycle-2-node.json";
import cycle3Fixture from "../__fixtures__/cycle-3-node.json";
import depth2Fixture from "../__fixtures__/depth-2.json";
import depth3Fixture from "../__fixtures__/depth-3.json";
import depth4Fixture from "../__fixtures__/depth-4.json";

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

  // B2 upgrade (2026-05-16): depth-1 → depth-3. Chains up to depth-3 accepted,
  // depth-4+ rejected. Old "depth-2 throws" test flipped because semantics changed.

  it("accepts a depth-2 chain (a → b → c) per B2 upgrade", () => {
    expect(() => resolver.validate(depth2Fixture.tokens as DesignToken[])).not.toThrow();
  });

  it("accepts a depth-3 chain (a → b → c → d) per B2 upgrade", () => {
    expect(() => resolver.validate(depth3Fixture.tokens as DesignToken[])).not.toThrow();
  });

  it("throws AliasDepthError on a depth-4 chain (a → b → c → d → e)", () => {
    let thrown: unknown;
    try { resolver.validate(depth4Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasDepthError);
    expect((thrown as AliasDepthError).chain).toEqual(["a", "b", "c", "d", "e"]);
    expect((thrown as AliasDepthError).sourceId).toBe("a");
    expect((thrown as AliasDepthError).targetId).toBe("e");
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

describe("AliasResolver.resolve — replacedBy rename bridge (B1 lock 2026-05-16)", () => {
  let resolver: AliasResolver;
  beforeEach(() => { resolver = new AliasResolver(makeEvents()); });

  it("follows replacedBy single hop (renamed: a → b, returns b)", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A (old)", value: "", category: "colors", cssVar: "--bd-a", type: "color", replacedBy: "b" },
      { id: "b", name: "B", value: "#2D6DFF", category: "colors", cssVar: "--bd-b", type: "color" },
    ];
    expect(resolver.resolve("a", tokens)?.id).toBe("b");
    expect(resolver.resolve("a", tokens)?.value).toBe("#2D6DFF");
  });

  it("follows replacedBy then aliasOf chain (a.replacedBy=b, b.aliasOf=c, returns c)", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", replacedBy: "b" },
      { id: "b", name: "B", value: "", category: "colors", cssVar: "--bd-b", type: "color", aliasOf: "c" },
      { id: "c", name: "C", value: "#2D6DFF", category: "colors", cssVar: "--bd-c", type: "color" },
    ];
    expect(resolver.resolve("a", tokens)?.id).toBe("c");
  });

  it("returns undefined on replacedBy cycle (a.replacedBy=b, b.replacedBy=a)", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", replacedBy: "b" },
      { id: "b", name: "B", value: "", category: "colors", cssVar: "--bd-b", type: "color", replacedBy: "a" },
    ];
    expect(resolver.resolve("a", tokens)).toBeUndefined();
  });

  it("returns undefined when replacedBy target is unknown", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", replacedBy: "ghost" },
    ];
    expect(resolver.resolve("a", tokens)).toBeUndefined();
  });

  it("does not follow replacedBy when token has no replacedBy field (back-compat)", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#2D6DFF", category: "colors", cssVar: "--bd-a", type: "color" },
    ];
    expect(resolver.resolve("a", tokens)?.id).toBe("a");
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

describe("AliasResolver.findAliasesOf", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("returns [] when token list is empty", () => {
    expect(resolver.findAliasesOf("nonexistent", [])).toEqual([]);
  });

  it("returns [] when target has no aliases pointing at it", () => {
    const tokens: DesignToken[] = [
      { id: "primary", name: "Primary", value: "#000", category: "colors", cssVar: "--bd-primary", type: "color" },
    ];
    expect(resolver.findAliasesOf("primary", tokens)).toEqual([]);
  });

  it("returns the single alias pointing at target", () => {
    const tokens: DesignToken[] = [
      { id: "primary", name: "Primary", value: "#000", category: "colors", cssVar: "--bd-primary", type: "color" },
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "primary" },
    ];
    const result = resolver.findAliasesOf("primary", tokens);
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("returns all aliases pointing at target (multi)", () => {
    const tokens: DesignToken[] = [
      { id: "primary", name: "Primary", value: "#000", category: "colors", cssVar: "--bd-primary", type: "color" },
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "primary" },
      { id: "b", name: "B", value: "", category: "colors", cssVar: "--bd-b", type: "color", aliasOf: "primary" },
    ];
    const result = resolver.findAliasesOf("primary", tokens);
    expect(result.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("does not include tokens that alias OTHER targets", () => {
    const tokens: DesignToken[] = [
      { id: "primary", name: "Primary", value: "#000", category: "colors", cssVar: "--bd-primary", type: "color" },
      { id: "secondary", name: "Secondary", value: "#fff", category: "colors", cssVar: "--bd-secondary", type: "color" },
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "primary" },
      { id: "b", name: "B", value: "", category: "colors", cssVar: "--bd-b", type: "color", aliasOf: "secondary" },
    ];
    expect(resolver.findAliasesOf("primary", tokens).map((t) => t.id)).toEqual(["a"]);
    expect(resolver.findAliasesOf("secondary", tokens).map((t) => t.id)).toEqual(["b"]);
  });

  it("returns aliases even when graph contains a cycle (read path, not validate)", () => {
    // Cycle: a → b → a. Both are aliases of each other. findAliasesOf("a") must
    // surface "b" without throwing — UI shows aliases even on a broken graph.
    const tokens = cycle2Fixture.tokens as DesignToken[];
    const aliasesOfA = resolver.findAliasesOf("a", tokens);
    const aliasesOfB = resolver.findAliasesOf("b", tokens);
    expect(aliasesOfA.map((t) => t.id)).toContain("b");
    expect(aliasesOfB.map((t) => t.id)).toContain("a");
  });
});

// B1 follow-up (2026-05-17): map-index for replacedBy bridge.
// findReplacedBy mirrors findAliasesOf — given a canonical target id, return
// the (zero or one) token whose replacedBy points at it. Bridge writes are
// 1:1 by construction (one rename source per target); resolver must surface
// the source even when the graph contains cycles.
describe("AliasResolver.findReplacedBy", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("returns undefined when token list is empty", () => {
    expect(resolver.findReplacedBy("nonexistent", [])).toBeUndefined();
  });

  it("returns undefined when no token has replacedBy pointing at target", () => {
    const tokens: DesignToken[] = [
      { id: "new-id", name: "New", value: "#000", category: "colors", cssVar: "--bd-new", type: "color" },
    ];
    expect(resolver.findReplacedBy("new-id", tokens)).toBeUndefined();
  });

  it("returns the source token whose replacedBy points at target", () => {
    const tokens: DesignToken[] = [
      { id: "new-id", name: "New", value: "#000", category: "colors", cssVar: "--bd-new", type: "color" },
      { id: "old-id", name: "Old", value: "#000", category: "colors", cssVar: "--bd-old", type: "color", replacedBy: "new-id" },
    ];
    const result = resolver.findReplacedBy("new-id", tokens);
    expect(result?.id).toBe("old-id");
  });

  it("does not return tokens whose replacedBy points at OTHER targets", () => {
    const tokens: DesignToken[] = [
      { id: "new-a", name: "NewA", value: "#000", category: "colors", cssVar: "--bd-new-a", type: "color" },
      { id: "new-b", name: "NewB", value: "#000", category: "colors", cssVar: "--bd-new-b", type: "color" },
      { id: "old-a", name: "OldA", value: "#000", category: "colors", cssVar: "--bd-old-a", type: "color", replacedBy: "new-a" },
      { id: "old-b", name: "OldB", value: "#000", category: "colors", cssVar: "--bd-old-b", type: "color", replacedBy: "new-b" },
    ];
    expect(resolver.findReplacedBy("new-a", tokens)?.id).toBe("old-a");
    expect(resolver.findReplacedBy("new-b", tokens)?.id).toBe("old-b");
  });
});

describe("AliasResolver.validateAndEmit", () => {
  it("emits tokens:alias-changed on success", () => {
    const emit = vi.fn();
    const events = { emit, on: () => {}, off: () => {} } as unknown as EventEmitter;
    const resolver = new AliasResolver(events);
    const tokens = validFixture.tokens as DesignToken[];
    resolver.validateAndEmit(tokens);
    expect(emit).toHaveBeenCalledWith("tokens:alias-changed", { count: 1 });
  });

  it("does NOT emit on validation failure", () => {
    const emit = vi.fn();
    const events = { emit, on: () => {}, off: () => {} } as unknown as EventEmitter;
    const resolver = new AliasResolver(events);
    const tokens = cycle2Fixture.tokens as DesignToken[];
    expect(() => resolver.validateAndEmit(tokens)).toThrow(AliasCycleError);
    expect(emit).not.toHaveBeenCalled();
  });
});
