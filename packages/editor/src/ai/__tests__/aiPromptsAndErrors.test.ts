/**
 * AIPromptLibrary (content types / tones / prompt builder) + AIErrors
 * (error creator + suggestion map) + ai/quickPrompts option derivation.
 *
 * The openai facade is mocked for quickPrompts so this file never touches the
 * tRPC-backed client — CONTENT_TYPES/TONES come from the real (pure)
 * AIPromptLibrary module.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import {
  CONTENT_TYPES,
  TONES,
  TONE_INSTRUCTIONS,
  CONTENT_TYPE_PROMPTS,
  buildEnhancedPrompt,
  isValidContentType,
  isValidTone,
  type ContentType,
} from "../../services/ai/AIPromptLibrary";
import { createAIError, ERROR_SUGGESTIONS, type AIErrorCode } from "../../services/ai/AIErrors";

vi.mock("@/shared/utils/openai", async () => {
  const lib = await import("@/services/ai/AIPromptLibrary");
  return {
    CONTENT_TYPES: lib.CONTENT_TYPES,
    TONES: lib.TONES,
    generateContent: vi.fn(),
    generateLayout: vi.fn(),
    generateImagePrompt: vi.fn(),
  };
});

import { QUICK_PROMPTS, getQuickPrompts, contentTypeOptions, toneOptions } from "../quickPrompts";

// ---------------------------------------------------------------------------
// AIPromptLibrary
// ---------------------------------------------------------------------------

describe("AIPromptLibrary — CONTENT_TYPES / TONES integrity", () => {
  it("declares 16 content types, each with label + description", () => {
    const keys = Object.keys(CONTENT_TYPES);
    expect(keys).toHaveLength(16);
    for (const key of keys) {
      const spec = CONTENT_TYPES[key as ContentType];
      expect(spec.label.length, key).toBeGreaterThan(0);
      expect(spec.description.length, key).toBeGreaterThan(0);
    }
  });

  it("declares 12 tones, each with label + emoji", () => {
    const entries = Object.entries(TONES);
    expect(entries).toHaveLength(12);
    for (const [key, spec] of entries) {
      expect(spec.label.length, key).toBeGreaterThan(0);
      expect(spec.emoji.length, key).toBeGreaterThan(0);
    }
  });

  it("TONE_INSTRUCTIONS covers every tone; CONTENT_TYPE_PROMPTS covers every content type", () => {
    expect(Object.keys(TONE_INSTRUCTIONS).sort()).toEqual(Object.keys(TONES).sort());
    expect(Object.keys(CONTENT_TYPE_PROMPTS).sort()).toEqual(Object.keys(CONTENT_TYPES).sort());
  });

  it("every content-type prompt embeds the topic", () => {
    for (const [key, fn] of Object.entries(CONTENT_TYPE_PROMPTS)) {
      expect(fn("XYZZY-topic"), key).toContain("XYZZY-topic");
    }
  });
});

describe("AIPromptLibrary — buildEnhancedPrompt", () => {
  it("combines the content-type prompt with the tone instruction", () => {
    const prompt = buildEnhancedPrompt("a coffee brand", "headline", "playful");
    expect(prompt).toContain("a coffee brand");
    expect(prompt).toContain("headline"); // from the headline template
    expect(prompt).toContain(`Tone: ${TONE_INSTRUCTIONS.playful}`);
  });

  it("falls back to the bare topic for an unknown content type", () => {
    const prompt = buildEnhancedPrompt(
      "just this",
      "not-a-type" as ContentType,
      "professional"
    );
    expect(prompt.startsWith("just this")).toBe(true);
    expect(prompt).toContain(`Tone: ${TONE_INSTRUCTIONS.professional}`);
  });

  it("type guards accept known values and reject unknowns", () => {
    expect(isValidContentType("headline")).toBe(true);
    expect(isValidContentType("sonnet")).toBe(false);
    expect(isValidTone("witty")).toBe(true);
    expect(isValidTone("sarcastic")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AIErrors
// ---------------------------------------------------------------------------

describe("AIErrors", () => {
  const ALL_CODES: AIErrorCode[] = [
    "API_ERROR",
    "TIMEOUT",
    "NETWORK_ERROR",
    "RATE_LIMITED",
    "INVALID_REQUEST",
    "CONTENT_FILTERED",
    "MAX_RETRIES",
    "CANCELLED",
    "UNKNOWN_ERROR",
  ];

  it("ERROR_SUGGESTIONS has a non-empty suggestion for all 9 codes", () => {
    expect(Object.keys(ERROR_SUGGESTIONS).sort()).toEqual([...ALL_CODES].sort());
    for (const code of ALL_CODES) {
      expect(ERROR_SUGGESTIONS[code].length, code).toBeGreaterThan(0);
    }
  });

  it("createAIError builds a real Error carrying code + matching suggestion", () => {
    const err = createAIError("boom", "RATE_LIMITED", {
      status: 429,
      isRateLimited: true,
      retryAfter: 60000,
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AIError");
    expect(err.message).toBe("boom");
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.status).toBe(429);
    expect(err.isRateLimited).toBe(true);
    expect(err.retryAfter).toBe(60000);
    expect(err.suggestion).toBe(ERROR_SUGGESTIONS.RATE_LIMITED);
  });

  it("createAIError defaults optional flags to undefined", () => {
    const err = createAIError("x", "TIMEOUT");
    expect(err.status).toBeUndefined();
    expect(err.isTimeout).toBeUndefined();
    expect(err.suggestion).toBe(ERROR_SUGGESTIONS.TIMEOUT);
  });
});

// ---------------------------------------------------------------------------
// quickPrompts
// ---------------------------------------------------------------------------

describe("ai/quickPrompts", () => {
  it("provides prompt lists per generation tab (7 content / 4 layout / 4 image)", () => {
    expect(QUICK_PROMPTS.content).toHaveLength(7);
    expect(QUICK_PROMPTS.layout).toHaveLength(4);
    expect(QUICK_PROMPTS.image).toHaveLength(4);
  });

  it("getQuickPrompts returns the tab's list, and [] for unknown tabs", () => {
    expect(getQuickPrompts("layout")).toBe(QUICK_PROMPTS.layout);
    expect(getQuickPrompts("analyze")).toEqual([]);
    expect(getQuickPrompts("")).toEqual([]);
  });

  it("contentTypeOptions mirrors CONTENT_TYPES with 'Label - description' labels", () => {
    expect(contentTypeOptions).toHaveLength(Object.keys(CONTENT_TYPES).length);
    const headline = contentTypeOptions.find((o) => o.value === "headline")!;
    expect(headline.label).toBe(
      `${CONTENT_TYPES.headline.label} - ${CONTENT_TYPES.headline.description}`
    );
  });

  it("toneOptions mirrors TONES with 'emoji Label' labels", () => {
    expect(toneOptions).toHaveLength(Object.keys(TONES).length);
    const witty = toneOptions.find((o) => o.value === "witty")!;
    expect(witty.label).toBe(`${TONES.witty.emoji} ${TONES.witty.label}`);
  });
});
