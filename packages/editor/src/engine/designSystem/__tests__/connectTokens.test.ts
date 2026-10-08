/**
 * Brand Part 1b, Task 8 (spec §3, test 6): Connect to tokens suggestions.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "../defaultTokens";
import { findConnectSuggestions, normalizeTokenValue } from "../connectTokens";

const node = (id: string, styles: Record<string, string>, children: unknown[] = []) => ({ id, styles, children });

/* The seed ships #1A56DB under two semantic ids — color-primary and the B5
   Beginner alias color-action — so on a real site #1A56DB is a tie the user
   resolves. The "unique match" case drops color-action to test the
   single-candidate path. */
const withoutAction = DEFAULT_TOKENS.filter((t) => t.id !== "color-action");

describe("findConnectSuggestions (spec §3, test 6)", () => {
  it("matches exact values of the same kind, semantic first, counted by element", () => {
    const roots = [node("r", {}, [node("a", { color: "#1A56DB" }), node("b", { "background-color": "#1a56db", color: "#1A56DB" })])];
    const [s] = findConnectSuggestions(roots, withoutAction);
    expect(s).toMatchObject({ kind: "color", value: "#1A56DB", elementCount: 2, target: "color-primary" });
    expect(s.refs).toHaveLength(3);
    expect(s.candidates).toEqual(["color-primary"]);
  });

  it("leaves the seed's #1A56DB to the user: Primary and Action tie", () => {
    const [s] = findConnectSuggestions([node("a", { color: "#1A56DB" })], DEFAULT_TOKENS);
    expect(s.candidates).toEqual(["color-action", "color-primary"]);
    expect(s.target).toBeNull();
  });

  it("never near-matches", () => {
    expect(findConnectSuggestions([node("a", { color: "#1A56DC" })], DEFAULT_TOKENS)).toEqual([]);
  });

  it("never crosses kinds: 16px padding is spacing, not a font size", () => {
    const [s] = findConnectSuggestions([node("a", { padding: "16px" })], DEFAULT_TOKENS);
    expect(s.kind).toBe("spacing");
    expect(s.candidates.every((id) => DEFAULT_TOKENS.find((t) => t.id === id)?.kind === "spacing")).toBe(true);
  });

  it("leaves the pick to the user when several semantic tokens tie", () => {
    const [s] = findConnectSuggestions([node("a", { color: "#71717A" })], DEFAULT_TOKENS);
    expect(s.candidates.length).toBeGreaterThan(1);
    expect(s.target).toBeNull();
  });

  it("ignores values already bound, unknown properties and skipped elements", () => {
    const roots = [node("a", { color: "var(--buildrick-design-color-primary)", width: "16px" }), node("b", { color: "#1A56DB" })];
    expect(findConnectSuggestions(roots, DEFAULT_TOKENS, { skip: (id) => id === "b" })).toEqual([]);
  });

  it("never matches the colour part of a shorthand (whole values only, OQ-6)", () => {
    expect(findConnectSuggestions([node("a", { border: "1px solid #1A56DB" })], DEFAULT_TOKENS)).toEqual([]);
  });

  it("includes breakpoint overrides, each ref naming its breakpoint (OQ-6)", () => {
    const roots = [{ id: "a", styles: { padding: "16px" }, breakpointStyles: { mobile: { padding: "16px" }, tablet: { color: "#123456" } } }];
    const [s] = findConnectSuggestions(roots, DEFAULT_TOKENS);
    expect(s.refs).toEqual([{ elementId: "a", prop: "padding" }, { elementId: "a", prop: "padding", breakpoint: "mobile" }]);
    expect(s.elementCount).toBe(1);
  });

  it("never suggests a soft-deleted token", () => {
    const tokens = DEFAULT_TOKENS.map((t) => (t.id === "color-secondary" ? { ...t, replacedBy: "color-primary" } : t));
    const out = findConnectSuggestions([node("a", { color: "#64748B" })], tokens);
    expect(out.flatMap((s) => s.candidates)).not.toContain("color-secondary");
  });
});

describe("normalizeTokenValue", () => {
  it("treats hex case, short hex, opaque 8-digit hex and rgb() as the same colour", () => {
    for (const v of ["#1A56DB", "#1a56db", "#1A56DBFF", "rgb(26, 86, 219)", "rgba(26,86,219,1)"]) {
      expect(normalizeTokenValue("color", v)).toBe("#1a56db");
    }
    expect(normalizeTokenValue("color", "#fff")).toBe("#ffffff");
    expect(normalizeTokenValue("color", "#1A56DB80")).toBe("#1a56db80");
    expect(normalizeTokenValue("spacing", " 16px ")).toBe("16px");
  });
});
