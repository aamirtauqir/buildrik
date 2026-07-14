/**
 * P7 — AI alt-text generation via vision.
 *
 * This called Anthropic directly (`new Anthropic({ apiKey: ANTHROPIC_API_KEY })`)
 * against `claude-haiku-4-5`. No Anthropic key has ever existed on this project,
 * so the feature threw on every call in production and nobody saw it: dev routes
 * in-editor AI to Ollama, and alt-text is auto-triggered in the background where
 * a failure is silent. It now runs on the same OpenAI client as every other AI
 * call in the product.
 *
 * Critical contract (prototype-v3 §25 #3): "AI alt-text never overwrites
 * user-typed alt-text." Enforced in two layers:
 *   1. Pre-call skip-guard: if asset.altText is already set, return it
 *      without calling the provider (fast path, free).
 *   2. Post-call TOCTOU re-check: between the API call starting and
 *      finishing, a user might type alt-text in the editor. Re-read
 *      asset.altText after the AI returns; if non-empty now, discard
 *      the generated text.
 *
 * Domain errors:
 *   - "ASSET_NOT_FOUND" — asset id is not owned by userId or doesn't exist
 *   - "NOT_IMAGE" — asset.type !== "image" (gate to vision-eligible assets)
 *
 * @license BSD-3-Clause
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { DEFAULT_MODEL } from "@buildrik/shared/schemas/ai";
import { getOpenAI } from "./openai.client";
import { assertProviderConfigured } from "./ai.service";

const ALT_TEXT_PROMPT = [
  "Generate concise alt text for this image suitable for screen readers.",
  "Rules:",
  "- Under 125 characters.",
  "- Describe the subject, action, and meaningful context.",
  "- Skip 'image of' / 'photo of' filler.",
  "- Plain text. No markdown. No quotes.",
  "Return ONLY the alt text, nothing else.",
].join("\n");

const MODEL = DEFAULT_MODEL;

export interface GenerateAltTextOptions {
  /** Public image URL — must be reachable from the provider. */
  imageUrl: string;
  /** Optional override (test-only). */
  signal?: AbortSignal;
}

export interface AltTextResult {
  altText: string;
  /** Provider model used; surfaced for telemetry. */
  model: string;
  /** Number of input + output tokens (when surfaced by SDK). */
  usage?: { inputTokens: number; outputTokens: number };
}

/**
 * Bare AI call. Sends the image + alt-text prompt to the vision model and
 * returns the trimmed output. Does NOT persist or check ownership; see
 * `applyAltTextToAsset` for the orchestrator.
 *
 * Throws on:
 *   - No configured provider (clear message, before any network call)
 *   - Empty response
 *   - Provider API errors (re-raised as-is for tRPC translation)
 */
export async function generateAltText(
  options: GenerateAltTextOptions,
): Promise<AltTextResult> {
  assertProviderConfigured(MODEL);

  const response = await getOpenAI().chat.completions.create(
    {
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: ALT_TEXT_PROMPT },
            { type: "image_url", image_url: { url: options.imageUrl } },
          ],
        },
      ],
    },
    { signal: options.signal },
  );

  const altText = (response.choices[0]?.message?.content ?? "").trim();
  if (!altText) {
    throw new Error("AI returned empty alt text");
  }

  return {
    altText,
    model: MODEL,
    usage: response.usage
      ? {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
        }
      : undefined,
  };
}

export interface ApplyAltTextResult {
  altText: string;
  /** True when an existing user-typed alt text was preserved instead of overwritten. */
  skipped: boolean;
  model?: string;
}

function isPopulatedAltText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Orchestrator: ownership-scoped find → skip-guard → AI → TOCTOU re-check
 * → persist. Persists generatedMetadata alongside altText so the editor
 * can surface "AI-generated" provenance.
 */
export async function applyAltTextToAsset(
  userId: string,
  assetId: string,
): Promise<ApplyAltTextResult> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { userId: true, url: true, type: true, altText: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("ASSET_NOT_FOUND");
  }
  if (asset.type !== "image") {
    throw new Error("NOT_IMAGE");
  }

  // Pre-call skip-guard: user already typed something — return existing.
  if (isPopulatedAltText(asset.altText)) {
    return { altText: asset.altText as string, skipped: true };
  }

  const result = await generateAltText({ imageUrl: asset.url });

  // TOCTOU re-check: user may have typed alt-text while we were waiting on
  // Anthropic. Re-read with ownership scope; if non-empty now, discard.
  const fresh = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { userId: true, altText: true },
  });
  if (!fresh || fresh.userId !== userId) {
    throw new Error("ASSET_NOT_FOUND");
  }
  if (isPopulatedAltText(fresh.altText)) {
    return { altText: fresh.altText as string, skipped: true };
  }

  const generatedMetadata: Prisma.InputJsonValue = {
    altText: {
      generatedAt: new Date().toISOString(),
      model: result.model,
      ...(result.usage ? { usage: result.usage } : {}),
    },
  };

  await prisma.mediaAsset.update({
    where: { id: assetId },
    data: {
      altText: result.altText,
      generatedMetadata,
    },
  });

  return { altText: result.altText, skipped: false, model: result.model };
}
