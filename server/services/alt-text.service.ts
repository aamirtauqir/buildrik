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
 *   - AltTextError — NOT_CONFIGURED / QUOTA_EXCEEDED / PROVIDER_FAILED. Each
 *     carries a fixed, client-safe message; the raw provider error is logged
 *     here and never attached (it held the masked key suffix and request ids).
 *
 * Every provider call costs one AI unit from the same daily quota as the ai.*
 * procedures (reserved before the call, refunded if the provider fails). The
 * free paths — kept user text, refused asset — never reserve.
 *
 * L4-007 (owner, 2026-10-10): the upload hook's AUTOMATIC call is an opt-in —
 * the workspace's `auto_alt_text` flag, off by default. With it off an
 * automatic request is a free no-op; the on-demand Generate is unaffected.
 * Automatic generation runs once per asset (an asset the model already
 * described is never re-billed), and concurrent requests for one asset share
 * one provider call.
 *
 * @license BSD-3-Clause
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { DEFAULT_MODEL } from "@buildrik/shared/schemas/ai";
import { getOpenAI } from "./openai.client";
import { assertProviderConfigured } from "./ai.service";
import { assertMediaWrite } from "./media.service";
import { releaseQuota, reserveQuota } from "./quota.service";
import { isFeatureEnabled } from "./feature-flag.service";

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

export type AltTextErrorCode = "NOT_CONFIGURED" | "QUOTA_EXCEEDED" | "PROVIDER_FAILED";

export class AltTextError extends Error {
  constructor(
    public readonly code: AltTextErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AltTextError";
  }
}

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
  /** True when nothing was generated: user text kept, or an automatic request declined. */
  skipped: boolean;
  /** Why an automatic request generated nothing (L4-007). */
  reason?: "AUTO_OFF" | "ALREADY_GENERATED";
  model?: string;
}

export interface ApplyAltTextOptions {
  /** Regenerate: replace existing alt text (the asset library's "Regenerate").
   *  Without it an existing alt text is kept, as before. */
  force?: boolean;
  /** `auto` = the upload hook. Runs only when the workspace opted in, once per asset. */
  trigger?: "auto" | "manual";
}

/** One provider call per asset at a time — a second request joins the first. */
const inflight = new Map<string, Promise<ApplyAltTextResult>>();

function hasGeneratedAlt(meta: unknown): boolean {
  return typeof meta === "object" && meta !== null && "altText" in meta && Boolean((meta as { altText?: unknown }).altText);
}

async function autoAltTextEnabled(siteId: string | null): Promise<boolean> {
  if (!siteId) return false;
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  return site ? isFeatureEnabled(site.workspaceId, "auto_alt_text") : false;
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
  opts: ApplyAltTextOptions = {},
): Promise<ApplyAltTextResult> {
  const running = inflight.get(assetId);
  if (running) return running;
  const run = generateForAsset(userId, assetId, opts).finally(() => inflight.delete(assetId));
  inflight.set(assetId, run);
  return run;
}

async function generateForAsset(userId: string, assetId: string, opts: ApplyAltTextOptions): Promise<ApplyAltTextResult> {
  const auto = opts.trigger === "auto";
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { userId: true, url: true, type: true, altText: true, siteId: true, generatedMetadata: true },
  });
  if (!asset || asset.userId !== userId) {
    throw new Error("ASSET_NOT_FOUND");
  }
  await assertMediaWrite(userId, asset.siteId);
  if (asset.type !== "image") {
    throw new Error("NOT_IMAGE");
  }

  // Pre-call skip-guard: user already typed something — return existing,
  // unless this is an explicit Regenerate (never from the automatic hook).
  if ((auto || !opts.force) && isPopulatedAltText(asset.altText)) {
    return { altText: asset.altText as string, skipped: true };
  }

  if (auto) {
    if (!(await autoAltTextEnabled(asset.siteId))) return { altText: "", skipped: true, reason: "AUTO_OFF" };
    if (hasGeneratedAlt(asset.generatedMetadata)) return { altText: "", skipped: true, reason: "ALREADY_GENERATED" };
  }

  try {
    assertProviderConfigured(MODEL);
  } catch {
    throw new AltTextError("NOT_CONFIGURED", "AI alt text isn't configured on this server.");
  }
  const quota = await reserveQuota(userId, MODEL);
  if (!quota.ok) {
    throw new AltTextError(
      "QUOTA_EXCEEDED",
      `Daily AI limit reached (${quota.limit}). Resets at ${quota.resetsAt.toISOString()}.`,
    );
  }

  let result: AltTextResult;
  try {
    result = await generateAltText({ imageUrl: asset.url });
  } catch (e) {
    console.error("[alt-text] provider call failed", e);
    try {
      await releaseQuota(userId);
    } catch (releaseErr) {
      console.error("[alt-text] releaseQuota failed", releaseErr);
    }
    throw new AltTextError("PROVIDER_FAILED", "Alt text generation failed. Try again.");
  }

  // TOCTOU re-check: user may have typed alt-text while we were waiting on
  // the provider. Re-read with ownership scope; if non-empty now, discard.
  const fresh = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { userId: true, altText: true },
  });
  if (!fresh || fresh.userId !== userId) {
    throw new Error("ASSET_NOT_FOUND");
  }
  /* Without force: anything typed now wins. With force: the text being
     replaced is the one the user asked to regenerate — but if it CHANGED while
     we waited, they typed something new, and that still wins. */
  const typedMeanwhile = opts.force && !auto
    ? (fresh.altText ?? "") !== (asset.altText ?? "") && isPopulatedAltText(fresh.altText)
    : isPopulatedAltText(fresh.altText);
  if (typedMeanwhile) {
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
