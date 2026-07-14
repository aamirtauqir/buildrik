import { describe, it, expect } from "vitest";
import {
  modelSchema,
  DEFAULT_MODEL,
  isOllamaModel,
  isOpenAIModel,
  type AIModel,
} from "@buildrik/shared/schemas/ai";

describe("AIModel schema", () => {
  it("accepts only the models we can actually call", () => {
    expect(modelSchema.parse("gpt-4o-mini")).toBe("gpt-4o-mini");
    expect(modelSchema.parse("ollama")).toBe("ollama");
  });

  it("rejects the retired Claude ids", () => {
    // These were plan defaults for months. No Anthropic key has ever existed on
    // this project, and they were not real Anthropic API ids either, so the
    // in-editor AI path threw on every request in production. They must never
    // parse again.
    expect(() => modelSchema.parse("claude-opus-4-7")).toThrow();
    expect(() => modelSchema.parse("claude-sonnet-4-6")).toThrow();
    expect(() => modelSchema.parse("claude-haiku-4-5")).toThrow();
  });

  it("rejects unknown models", () => {
    expect(() => modelSchema.parse("gpt-3.5")).toThrow();
    expect(() => modelSchema.parse("gpt-4o")).toThrow();
  });

  it("defaults to a model the schema knows", () => {
    expect(modelSchema.safeParse(DEFAULT_MODEL).success).toBe(true);
  });

  it("isOpenAIModel returns true only for gpt-*", () => {
    expect(isOpenAIModel("gpt-4o-mini" as AIModel)).toBe(true);
    expect(isOpenAIModel("ollama" as AIModel)).toBe(false);
  });

  it("isOllamaModel returns true only for the local placeholder", () => {
    expect(isOllamaModel("ollama" as AIModel)).toBe(true);
    expect(isOllamaModel("gpt-4o-mini" as AIModel)).toBe(false);
  });
});
