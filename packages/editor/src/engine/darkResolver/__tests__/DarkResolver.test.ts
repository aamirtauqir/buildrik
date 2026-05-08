import { describe, it, expect, vi } from "vitest";
import { DarkResolver } from "../DarkResolver";
import type { DesignToken } from "../../../editor/design-system";
import type { EventEmitter } from "../../EventEmitter";

function makeEvents(): EventEmitter & { emit: ReturnType<typeof vi.fn> } {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as EventEmitter & { emit: ReturnType<typeof vi.fn> };
}

describe("DarkResolver.resolve", () => {
  it("returns token.value for resolved='light'", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color", darkValue: "#000",
    };
    expect(resolver.resolve(token, "light")).toBe("#fff");
  });

  it("returns token.darkValue for resolved='dark' when present", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color", darkValue: "#000",
    };
    expect(resolver.resolve(token, "dark")).toBe("#000");
  });

  it("falls back to token.value for resolved='dark' when darkValue absent (D16) and emits tokens:dark-missing", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color",
    };
    expect(resolver.resolve(token, "dark")).toBe("#fff");
    expect(events.emit).toHaveBeenCalledWith("tokens:dark-missing", { tokenId: "color-primary" });
  });

  it("does NOT emit tokens:dark-missing for light mode even when darkValue absent", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color",
    };
    resolver.resolve(token, "light");
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("does NOT emit tokens:dark-missing when darkValue is empty string (treated as explicit empty, not missing)", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const token: DesignToken = {
      id: "color-primary", name: "Primary", value: "#fff", category: "colors",
      cssVar: "--bd-color-primary", type: "color", darkValue: "",
    };
    expect(resolver.resolve(token, "dark")).toBe("");
    expect(events.emit).not.toHaveBeenCalled();
  });
});

describe("DarkResolver.resolveAll", () => {
  it("returns map of tokenId → resolved value across all input tokens", () => {
    const events = makeEvents();
    const resolver = new DarkResolver(events);
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#fff", category: "colors", cssVar: "--bd-a", type: "color", darkValue: "#000" },
      { id: "b", name: "B", value: "#eee", category: "colors", cssVar: "--bd-b", type: "color" },
    ];
    const map = resolver.resolveAll(tokens, "dark");
    expect(map.get("a")).toBe("#000");
    expect(map.get("b")).toBe("#eee");
    expect(events.emit).toHaveBeenCalledWith("tokens:dark-missing", { tokenId: "b" });
  });
});
