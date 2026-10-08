import { describe, it, expect } from "vitest";
import { validateTokens, type DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { rgbToOklch, parseColor } from "@/shared/utils/parsers";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { SCALE_STEPS, generateColorScale, applyScaleToRole, proposeMissingDarks } from "../scale";

const L = (hex: string) => rgbToOklch(parseColor(hex)!).l;
const semantic = (id: string, value: string, extra: Partial<DesignToken> = {}): DesignToken => ({
  id, name: id, kind: "color", layer: "semantic", modes: { light: { value } },
  category: "colors", cssVar: `--buildrick-design-${id}`, type: "color", ...extra,
});

describe("generateColorScale (spec §7, test 12)", () => {
  it("gives a fixed 11-step scale for a fixed input, keeping the picked colour exactly", () => {
    const s = generateColorScale("#1A56DB")!;
    expect(s.hexes).toEqual([
      "#EDF6FF", "#DAE9FF", "#C0D9FF", "#9CC0FF", "#699DFF", "#3C7CFF",
      "#1D60F4", "#1A56DB", "#0F41B1", "#0F3894", "#032166",
    ]);
    expect(s.pickedStep).toBe(700);
    expect(s.darkStep).toBe(300);
    expect(generateColorScale("#1a56db")).toEqual(s);
  });

  it("is monotonic in lightness, 50 lightest", () => {
    for (const input of ["#1A56DB", "#C2410C", "#0E7490", "#64748B"]) {
      const ls = generateColorScale(input)!.hexes.map(L);
      for (let i = 1; i < ls.length; i++) expect(ls[i]).toBeLessThan(ls[i - 1]);
    }
  });

  it("clamps the dark step to 300…500 and mirrors without the clamp", () => {
    const light = generateColorScale("#F0F9FF")!; // picked 50
    expect(light.pickedStep).toBe(50);
    expect(light.darkStep).toBe(500);
    expect(light.mirrorStep).toBe(950);
    expect(generateColorScale("#C2410C")!.darkStep).toBe(400); // picked 600
  });

  it("refuses what is not an opaque colour", () => {
    expect(generateColorScale("transparent")).toBeNull();
    expect(generateColorScale("rgba(26,86,219,0.5)")).toBeNull();
    expect(generateColorScale("var(--x)")).toBeNull();
  });
});

describe("applyScaleToRole", () => {
  it("adds 11 role-named primitives and points the role's light and dark at them", () => {
    const out = applyScaleToRole(DEFAULT_TOKENS, "color-primary", generateColorScale("#C2410C")!);
    if (!out.ok) throw new Error(out.reason);
    expect(out.prefix).toBe("primary");
    expect(SCALE_STEPS.every((s) => out.tokens.some((t) => t.id === `primary-${s}` && t.layer === "primitive"))).toBe(true);
    const role = out.tokens.find((t) => t.id === "color-primary")!;
    expect(role.modes).toEqual({ light: { alias: "primary-600" }, dark: { alias: "primary-400" } });
    expect(resolveTokenLiteral(out.tokens, "color-primary", "light")).toBe("#C2410C");
    expect(validateTokens(out.tokens).ok).toBe(true);
  });

  it("regenerating overwrites its own scale instead of adding a second one", () => {
    const first = applyScaleToRole(DEFAULT_TOKENS, "color-primary", generateColorScale("#C2410C")!);
    if (!first.ok) throw new Error(first.reason);
    const second = applyScaleToRole(first.tokens, "color-primary", generateColorScale("#0E7490")!);
    if (!second.ok) throw new Error(second.reason);
    expect(second.prefix).toBe("primary");
    expect(second.tokens.filter((t) => t.group === "scale-color-primary")).toHaveLength(11);
    expect(resolveTokenLiteral(second.tokens, "color-primary", "light")).toBe("#0E7490");
  });

  it("never overwrites a token it does not own — the whole scale moves to a free prefix", () => {
    const mine = semantic("primary-500", "#000000", { layer: "primitive" });
    const out = applyScaleToRole([...DEFAULT_TOKENS, mine], "color-primary", generateColorScale("#1A56DB")!);
    if (!out.ok) throw new Error(out.reason);
    expect(out.prefix).toBe("primary-2");
    expect(out.tokens.find((t) => t.id === "primary-500")).toEqual(mine);
  });

  it("refuses a primitive or a non-colour role", () => {
    expect(applyScaleToRole(DEFAULT_TOKENS, "color-brand-500", generateColorScale("#1A56DB")!).ok).toBe(false);
    expect(applyScaleToRole(DEFAULT_TOKENS, "space-4", generateColorScale("#1A56DB")!).ok).toBe(false);
  });
});

describe("proposeMissingDarks (spec D11, test 18)", () => {
  it("fills only semantic colours without a dark value; accents clamped, surfaces/text mirrored", () => {
    const tokens = [
      semantic("color-brand-x", "#C2410C"),
      semantic("color-card", "#F8FAFC", { semanticKind: "surface" }),
      semantic("color-ink", "#334155", { semanticKind: "text" }),
      semantic("color-has-dark", "#1A56DB", { modes: { light: { value: "#1A56DB" }, dark: { value: "#9CC0FF" } } }),
      semantic("color-clear", "transparent"),
    ];
    const out = proposeMissingDarks(tokens);
    expect(out.filled).toEqual(["color-brand-x", "color-card", "color-ink"]);
    expect(resolveTokenLiteral(out.tokens, "color-brand-x", "dark")).toBe("#F17953"); // step 400
    expect(resolveTokenLiteral(out.tokens, "color-card", "dark")).toBe("#232A31"); // mirror 950
    expect(resolveTokenLiteral(out.tokens, "color-ink", "dark")).toBe("#E3E9F2"); // mirror 100
    expect(resolveTokenLiteral(out.tokens, "color-has-dark", "dark")).toBe("#9CC0FF");
    expect(validateTokens(out.tokens).ok).toBe(true);
  });

  it("returns the input unchanged when nothing is missing", () => {
    const out = proposeMissingDarks(proposeMissingDarks(DEFAULT_TOKENS).tokens);
    expect(out.filled).toEqual([]);
  });
});
