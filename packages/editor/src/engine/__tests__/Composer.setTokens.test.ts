/**
 * Brand Part 1a, Task 10 (spec §4): every token write is one Composer
 * transaction, so Brand and the canvas share ONE undo stack — and nothing
 * writes while the site's tokens are read-only (Task 9's failed migration).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { Composer } from "../Composer";
import { EVENTS } from "@/shared/constants/events";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { setTokenLiteral, resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/engine/designSystem/types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function withTokens(): Composer {
  const c = new Composer({} as never);
  c.importProject({ pages: [{ id: "p", name: "P", slug: "", root: { id: "root", type: "container", tagName: "div", children: [] } }] } as never);
  c.setProjectSettings({ ...c.getProjectSettings(), designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 });
  c.history.flushPending();
  return c;
}

const primary = (c: Composer) => resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-primary", "light");
const secondary = (c: Composer) => resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-secondary", "light");

describe("composer.designSystem.setTokens", () => {
  it("is one undo step for a multi-token write, shared with canvas history", () => {
    const c = withTokens();
    const before = { primary: primary(c), secondary: secondary(c) };
    let next = setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C");
    next = setTokenLiteral(next, "color-secondary", "light", "#111111");

    expect(c.designSystem.setTokens(next, "Brand edit")).toBe(true);
    c.history.flushPending();
    expect(primary(c)).toBe("#C2410C");
    expect(secondary(c)).toBe("#111111");

    c.history.undo();
    expect(primary(c)).toBe(before.primary);
    expect(secondary(c)).toBe(before.secondary);

    c.history.redo();
    expect(primary(c)).toBe("#C2410C");
    expect(secondary(c)).toBe("#111111");
  });

  it("writes the v6 schema version and announces the settings change", () => {
    const c = withTokens();
    const onSettings = vi.fn();
    c.on(EVENTS.SETTINGS_CHANGE, onSettings);
    c.setProjectSettings({ ...c.getProjectSettings(), designTokensSchemaVersion: 5 });
    onSettings.mockClear();

    expect(c.designSystem.setTokens(setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C"), "x")).toBe(true);
    expect(c.getProjectSettings().designTokensSchemaVersion).toBe(6);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("announces brand:applied only for a write that landed (onboarding's Set your brand)", () => {
    const c = withTokens();
    const applied = vi.fn();
    c.on(EVENTS.BRAND_APPLIED, applied);
    c.designSystem.setTokens(setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C"), "x");
    expect(applied).toHaveBeenCalledTimes(1);
    c.designSystem.readOnly = true;
    c.designSystem.setTokens(DEFAULT_TOKENS, "x");
    expect(applied).toHaveBeenCalledTimes(1);
  });

  it("refuses an invalid token set and writes nothing", () => {
    const c = withTokens();
    const before = c.getProjectSettings().designTokens;
    const bad = [{ ...DEFAULT_TOKENS[0], layer: "semantic" as const, modes: { light: { alias: "missing" } } }];
    expect(c.designSystem.setTokens(bad, "x")).toBe(false);
    expect(c.getProjectSettings().designTokens).toBe(before);
  });

  it("refuses writes while read-only", () => {
    const c = withTokens();
    const before = c.getProjectSettings().designTokens;
    c.designSystem.readOnly = true;
    expect(c.designSystem.setTokens(setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C"), "x")).toBe(false);
    expect(c.getProjectSettings().designTokens).toBe(before);
  });
});

describe("token write paths route through setTokens (read-only refuses them all)", () => {
  it("setDesignToken writes one step and refuses while read-only", () => {
    const c = withTokens();
    expect(c.designSystem.setDesignToken("color-primary", "#C2410C")).toBe("#C2410C");
    expect(primary(c)).toBe("#C2410C");

    c.designSystem.readOnly = true;
    expect(c.designSystem.setDesignToken("color-primary", "#111111")).toBeNull();
    expect(primary(c)).toBe("#C2410C");
  });

  it("setDesignToken edits a fresh site (no saved tokens) over the seed", () => {
    const c = new Composer({} as never);
    expect(c.designSystem.setDesignToken("color-primary", "#C2410C")).toBe("#C2410C");
    expect(primary(c)).toBe("#C2410C");
  });

  it("applyAutoFix refuses while read-only", () => {
    const c = withTokens();
    const before = c.getProjectSettings().designTokens;
    c.designSystem.readOnly = true;
    expect(c.designSystem.applyAutoFix("color-primary", "darken-22")).toBeNull();
    expect(c.getProjectSettings().designTokens).toBe(before);
  });
});

const custom = (id: string, kind: DesignToken["kind"], value: string): DesignToken => ({
  id, name: id, kind, layer: "semantic", modes: { light: { value } },
  category: kind === "spacing" ? "spacing" : "colors", cssVar: `--buildrick-design-${id}`, type: kind === "spacing" ? "length" : "color",
});

function bindRoot(c: Composer, prop: string, value: string) {
  c.elements.getElement("root")!.setStyle(prop, value);
  c.history.flushPending();
}

/* This file's indexedDB stub never opens, so saved components never finish
   loading and usage would read "unknown" for every token. The guard cases
   that need a known count say components have loaded. */
function withLoadedTokens(): Composer {
  const c = withTokens();
  vi.spyOn(c.components, "isLoaded").mockReturnValue(true);
  return c;
}

describe("setTokens · removal guard (spec §6, test 11)", () => {
  it("refuses removing a token an element uses, keeps it, and allows it once unused", () => {
    const c = withLoadedTokens();
    const brand = custom("color-brand-x", "color", "#0E7490");
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, brand], "Add")).toBe(true);
    bindRoot(c, "color", "var(--buildrick-design-color-brand-x)");
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Delete token")).toBe(false);
    expect(c.getProjectSettings().designTokens?.some((t) => t.id === "color-brand-x")).toBe(true);
    bindRoot(c, "color", "#000000");
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Delete token")).toBe(true);
  });

  it("refuses a spacing reset that drops a bound custom spacing token", () => {
    const c = withLoadedTokens();
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, custom("space-7", "spacing", "28px")], "Add")).toBe(true);
    bindRoot(c, "padding", "var(--buildrick-design-space-7)");
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Reset spacing")).toBe(false);
  });

  it("refuses removal while usage is unknown", () => {
    const c = withLoadedTokens();
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, custom("color-brand-y", "color", "#123456")], "Add")).toBe(true);
    vi.spyOn(c.components, "isLoaded").mockReturnValue(false);
    expect(c.designSystem.setTokens(DEFAULT_TOKENS, "Delete token")).toBe(false);
  });

  it("allows a soft delete of an in-use token, and the element resolves to the replacement", () => {
    const c = withLoadedTokens();
    expect(c.designSystem.setTokens([...DEFAULT_TOKENS, custom("color-brand-x", "color", "#0E7490")], "Add")).toBe(true);
    bindRoot(c, "color", "var(--buildrick-design-color-brand-x)");
    const all = c.getProjectSettings().designTokens ?? [];
    const soft = all.map((t) => (t.id === "color-brand-x" ? { ...t, replacedBy: "color-primary" } : t));
    expect(c.designSystem.setTokens(soft, "Delete token")).toBe(true);
    expect(resolveTokenLiteral(c.getProjectSettings().designTokens ?? [], "color-brand-x", "light")).toBe(
      resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "light"),
    );
  });

  it("deleting a seed token is not a removal (the seed merges it back)", () => {
    const c = withLoadedTokens();
    expect(c.designSystem.setTokens(DEFAULT_TOKENS.filter((t) => t.id !== "space-12"), "Delete token")).toBe(true);
  });
});
