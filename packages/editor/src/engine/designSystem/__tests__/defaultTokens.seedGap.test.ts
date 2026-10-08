/**
 * Brand Part 1b, Task 6 (owner OQ-1, 2026-10-08): the six semantic colour
 * tokens inserted blocks bind to. Each resolves to its light and dark value and
 * sits in the emitter's backstop, so a site that never saved them still paints.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_TOKENS } from "../defaultTokens";
import { LEGACY_SEED, emitTokenCss, resolveTokenLiteral } from "@buildrik/shared/tokens";

const GAP: Array<[string, string, string]> = [
  ["color-on-primary", "#FFFFFF", "#FFFFFF"],
  ["color-surface-raised", "#FFFFFF", "#1E293B"],
  ["color-surface-muted", "#F3F4F6", "#1E293B"],
  ["color-border-subtle", "#E5E7EB", "#334155"],
  ["color-text-strong", "#111827", "#F8FAFC"],
  ["color-text-subtle", "#6B7280", "#94A3B8"],
];

describe("seed gap tokens (OQ-1)", () => {
  it.each(GAP)("%s resolves to its light and dark values", (id, light, dark) => {
    expect(resolveTokenLiteral(DEFAULT_TOKENS, id, "light")).toBe(light);
    expect(resolveTokenLiteral(DEFAULT_TOKENS, id, "dark")).toBe(dark);
    expect(DEFAULT_TOKENS.find((t) => t.id === id)?.layer).toBe("semantic");
  });

  it.each(GAP)("%s is in the emitter backstop", (id, light) => {
    expect(LEGACY_SEED.find((s) => s.cssVar === `--buildrick-design-${id}`)?.value).toBe(light);
    expect(emitTokenCss([], { darkMode: "off" })).toContain(`--buildrick-design-${id}:${light}`);
  });
});
