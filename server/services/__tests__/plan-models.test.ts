/**
 * The guard that would have caught this.
 *
 * Every plan defaulted to a Claude model (`claude-sonnet-4-6`, `claude-opus-4-7`)
 * that was not a real Anthropic API id, for a provider we have never held a key
 * for. Nothing failed in CI, and nothing failed in dev — `resolveModelForUser`
 * short-circuits to Ollama whenever OLLAMA_BASE_URL is set, so the paid path was
 * never taken on a developer's machine. The break only existed in production,
 * where every in-editor AI request threw.
 *
 * These tests bind PLAN_MODELS to the model enum and to the provider guard, so a
 * model nobody can call cannot be a plan default again.
 */
import { describe, it, expect } from "vitest";
import { modelSchema, type AIModel } from "@buildrik/shared/schemas/ai";
import { PLAN_MODELS } from "@/lib/constants/plan-limits";
import { assertProviderConfigured } from "../ai.service";

const PLANS = Object.keys(PLAN_MODELS) as Array<keyof typeof PLAN_MODELS>;

describe("PLAN_MODELS", () => {
  it("names only models the schema knows", () => {
    for (const plan of PLANS) {
      const { default: def, allowed } = PLAN_MODELS[plan];
      expect(modelSchema.safeParse(def).success, `${plan}.default = ${def}`).toBe(true);
      for (const m of allowed) {
        expect(modelSchema.safeParse(m).success, `${plan}.allowed includes ${m}`).toBe(true);
      }
    }
  });

  it("keeps every default inside its own allowed list", () => {
    for (const plan of PLANS) {
      const { default: def, allowed } = PLAN_MODELS[plan];
      expect(allowed, `${plan}.allowed must contain its default`).toContain(def);
    }
  });

  it("defaults to a model whose provider can be configured on the server", () => {
    // With the key present, the guard must pass. A default naming a provider we
    // have no integration for (the Anthropic case) fails here instead of in prod.
    const saved = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test";
    try {
      for (const plan of PLANS) {
        const def = PLAN_MODELS[plan].default as AIModel;
        expect(() => assertProviderConfigured(def), `${plan}.default = ${def}`).not.toThrow();
      }
    } finally {
      if (saved === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = saved;
    }
  });
});
