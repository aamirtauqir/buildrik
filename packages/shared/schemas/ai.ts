import { z } from "zod";

/**
 * Every model the product can actually call.
 *
 * This list used to carry `claude-opus-4-7`, `claude-sonnet-4-6` and
 * `claude-haiku-4-5`, and every plan defaulted to one of them. No Anthropic key
 * has ever existed — not in production, not in any `.env.local` — so that path
 * never ran anywhere, and nobody noticed because dev short-circuits to Ollama
 * (see `resolveModelForUser`). The IDs were not real Anthropic API model IDs
 * either, so a key alone would not have saved it. Unrunnable code, removed.
 *
 * The server owns model choice; a client-supplied model is only a hint, gated by
 * the caller's plan (`PLAN_MODELS`).
 */
export const modelSchema = z.enum([
  "gpt-4o-mini",
  // The locally-hosted model. The real model name comes from OLLAMA_MODEL; the
  // server forces this whenever OLLAMA_BASE_URL is set, so local dev needs no
  // paid key. It is NOT reachable in production.
  "ollama",
]);

export type AIModel = z.infer<typeof modelSchema>;

export const DEFAULT_MODEL: AIModel = "gpt-4o-mini";

export function isOpenAIModel(model: AIModel): boolean {
  return model.startsWith("gpt-");
}

export function isOllamaModel(model: AIModel): boolean {
  return model === "ollama";
}

/**
 * `ai.quota` — the AI panel counter ("N of M today · resets …", G2-129). The
 * SAME numbers the daily-limit check enforces (quota.service reserveQuota /
 * checkQuota over AIUsage, per user per UTC day); there is no second counter.
 * `limit` is -1 on an unlimited plan (then `used` is informational only).
 * `resetsAt` is the next UTC midnight.
 */
export const aiQuotaSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().min(-1),
  resetsAt: z.date(),
});
export type AiQuota = z.infer<typeof aiQuotaSchema>;
