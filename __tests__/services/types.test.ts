import { describe, it, expect } from "vitest";
import { modelSchema, isClaudeModel, isOpenAIModel, type AIModel } from "@server/services/types";

describe("AIModel schema", () => {
  it("accepts the three Claude models and the OpenAI default", () => {
    expect(modelSchema.parse("claude-opus-4-7")).toBe("claude-opus-4-7");
    expect(modelSchema.parse("claude-sonnet-4-6")).toBe("claude-sonnet-4-6");
    expect(modelSchema.parse("claude-haiku-4-5")).toBe("claude-haiku-4-5");
    expect(modelSchema.parse("gpt-4o-mini")).toBe("gpt-4o-mini");
  });

  it("rejects unknown models", () => {
    expect(() => modelSchema.parse("claude-3-opus")).toThrow();
    expect(() => modelSchema.parse("gpt-3.5")).toThrow();
  });

  it("isClaudeModel returns true only for claude-*", () => {
    expect(isClaudeModel("claude-opus-4-7" as AIModel)).toBe(true);
    expect(isClaudeModel("gpt-4o-mini" as AIModel)).toBe(false);
  });

  it("isOpenAIModel returns true only for gpt-*", () => {
    expect(isOpenAIModel("gpt-4o-mini" as AIModel)).toBe(true);
    expect(isOpenAIModel("claude-opus-4-7" as AIModel)).toBe(false);
  });
});
