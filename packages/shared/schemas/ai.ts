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

/**
 * `ai.summarize` input bounds. The router's schema enforces them and the
 * editor trims a version comparison to them before sending — compareVersions
 * caps nothing, and an over-limit diff was refused outright.
 */
export const AI_SUMMARY_LIMITS = {
  versionName: 200,
  elementName: 200,
  changes: 200,
  property: 100,
  value: 2000,
} as const;

/**
 * Caps for the element snapshot an element-scoped AI prompt carries. The
 * editor trims to these before sending (`gatherElementContext`), and the
 * server's schema enforces them, so an oversized snapshot is refused rather
 * than stuffed into the prompt.
 */
export const AI_ELEMENT_CONTEXT_LIMITS = {
  text: 1000,
  styles: 30,
  styleValue: 200,
  attributes: 15,
  attributeValue: 300,
  children: 20,
  childText: 80,
} as const;

const L = AI_ELEMENT_CONTEXT_LIMITS;

const cappedRecord = (maxKeys: number, maxValue: number) =>
  z
    .record(z.string().max(60), z.string().max(maxValue))
    .refine((r) => Object.keys(r).length <= maxKeys, { message: `At most ${maxKeys} entries` });

/**
 * What the model is shown about the ONE element an element-scoped prompt
 * edits: its type and tag, its plain text, its inline styles and authoring
 * attributes, and a short outline of its direct children. Before this, the
 * element scope sent the id alone and the model edited blind (audit P1-6).
 */
export const aiElementContextSchema = z.object({
  type: z.string().min(1).max(40),
  tag: z.string().max(20).optional(),
  text: z.string().max(L.text).optional(),
  styles: cappedRecord(L.styles, L.styleValue).optional(),
  attributes: cappedRecord(L.attributes, L.attributeValue).optional(),
  children: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        type: z.string().min(1).max(40),
        text: z.string().max(L.childText).optional(),
      }),
    )
    .max(L.children)
    .optional(),
});
export type AiElementContext = z.infer<typeof aiElementContextSchema>;
