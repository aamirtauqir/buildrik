import { describe, it, expect } from "vitest";
import { STARTER_DS_REGISTRY, getStarterById } from "../index";
import { DSLinter } from "@/engine/designSystem/linter";

describe("STARTER_DS_REGISTRY · structure", () => {
  it("ships 6 starter DSes (D6 spec target: 6-8)", () => {
    expect(STARTER_DS_REGISTRY.length).toBeGreaterThanOrEqual(6);
    expect(STARTER_DS_REGISTRY.length).toBeLessThanOrEqual(8);
  });

  it("every starter has unique id, non-empty name, non-empty description", () => {
    const ids = new Set<string>();
    for (const s of STARTER_DS_REGISTRY) {
      expect(s.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it("every starter has the 9 default color token ids (full palette)", () => {
    const REQUIRED = [
      "color-primary", "color-secondary", "color-accent",
      "color-background", "color-text", "color-muted", "color-border",
      "color-success", "color-error",
    ];
    for (const s of STARTER_DS_REGISTRY) {
      const ids = new Set(s.tokens.map((t) => t.id));
      for (const required of REQUIRED) {
        expect(ids.has(required)).toBe(true);
      }
    }
  });

  it("every starter ships darkValue on every color token (no missing-dark)", () => {
    for (const s of STARTER_DS_REGISTRY) {
      for (const t of s.tokens) {
        if (t.category === "colors") {
          expect(t.modes.dark).toBeDefined();
        }
      }
    }
  });
});

describe("STARTER_DS_REGISTRY · DSLinter compliance (DD2)", () => {
  const linter = new DSLinter();

  for (const s of STARTER_DS_REGISTRY) {
    it(`"${s.name}" passes DSLinter (no errors)`, () => {
      const errors = linter.errors(s.tokens);
      // Each error message includes the offending tokenId — gives a
      // useful failure if a starter ever drifts a banned hue or pure
      // black into a value.
      expect(errors).toEqual([]);
    });
  }
});

describe("getStarterById", () => {
  it("returns the starter when id matches", () => {
    expect(getStarterById("cobalt-default")?.id).toBe("cobalt-default");
  });

  it("returns undefined when id unknown", () => {
    expect(getStarterById("ghost")).toBeUndefined();
  });
});

describe("STARTER_DS_REGISTRY · neutral names (L4-028)", () => {
  // Owner 2026-10-10: starters are named for their palette, never after a
  // real company. The palettes themselves are customer-site data and stay.
  const BRANDS = /stripe|linear|notion|apple|vercel/i;

  it("no starter id, name or description names a real company", () => {
    for (const s of STARTER_DS_REGISTRY) {
      expect(s.id).not.toMatch(BRANDS);
      expect(s.name).not.toMatch(BRANDS);
      expect(s.description).not.toMatch(BRANDS);
    }
  });

  it("ships the owner's neutral names", () => {
    const names = STARTER_DS_REGISTRY.map((s) => s.name);
    for (const n of ["Ocean", "Slate", "Paper", "Mono"]) expect(names).toContain(n);
  });
});
