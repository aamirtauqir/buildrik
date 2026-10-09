/**
 * L5-010: the AI was sent `tokens: 0` on a site that had never saved a token,
 * while Brand listed 42 — gatherTokens read the raw saved set instead of the
 * saved set merged over the seed (the set Brand, the canvas and every token
 * write start from).
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { Composer } from "@/engine";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { gatherTokens } from "../hooks/aiScopeContext";

const composerWith = (designTokens: unknown[] | undefined) =>
  ({ getProjectSettings: () => ({ designTokens }) }) as unknown as Composer;

describe("gatherTokens", () => {
  it("sends the seed tokens on a site that has saved none", () => {
    const tokens = gatherTokens(composerWith(undefined));
    expect(tokens.length).toBeGreaterThan(0);
    const seedColour = DEFAULT_TOKENS.find((t) => t.type === "color");
    expect(seedColour).toBeDefined();
    const sent = tokens.find((t) => t.id === seedColour?.id);
    expect(sent?.value).toMatch(/^#|rgb|hsl/);
  });

  it("is empty only without a composer", () => {
    expect(gatherTokens(null)).toEqual([]);
  });
});
