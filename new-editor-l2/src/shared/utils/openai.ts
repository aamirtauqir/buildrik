/**
 * AI API Service Facade for Aquibra
 * Delegating to modular services under src/services/ai/
 *
 * @module utils/openai
 * @license BSD-3-Clause
 */

import { aiCache } from "../../services/ai/AICache";
import { AIError, AIErrorCode, createAIError } from "../../services/ai/AIErrors";
import {
  ContentType,
  ToneType,
  LayoutStyle,
  ImageSize,
  ImageStyle,
  ProgrammingLanguage,
  CodeStyle,
  isValidContentType,
  isValidTone,
  buildEnhancedPrompt,
  CONTENT_TYPES,
  TONES,
  TONE_INSTRUCTIONS,
  CONTENT_TYPE_PROMPTS,
} from "../../services/ai/AIPromptLibrary";
import { aiClient, AIRequestOptions, AIResponse } from "../../services/ai/AIServiceClient";

// Re-exports
export type {
  AIRequestOptions,
  AIResponse,
  ContentType,
  ToneType,
  LayoutStyle,
  ImageSize,
  ImageStyle,
  ProgrammingLanguage,
  CodeStyle,
  AIError,
  AIErrorCode,
};

export { CONTENT_TYPES, TONES, TONE_INSTRUCTIONS, CONTENT_TYPE_PROMPTS, createAIError };

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================

const API_BASE = "/api/ai";
const FALLBACK_IMAGE_BASE = "https://picsum.photos/800/600?random=";

// =============================================================================
// TYPES (Backwards compatibility)
// =============================================================================

export interface ContentRequest {
  prompt: string;
  contentType: ContentType;
  tone: ToneType;
}

export interface LayoutRequest {
  prompt: string;
  style?: LayoutStyle;
}

export interface ImageRequest {
  prompt: string;
  size?: ImageSize;
  style?: ImageStyle;
}

export interface CodeRequest {
  prompt: string;
  language: ProgrammingLanguage;
  style?: CodeStyle;
}

export interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: AIError) => void;
}

// -----------------------------------------------------------------------------
// PRIVATE HELPERS
// -----------------------------------------------------------------------------

async function apiRequest<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: AIRequestOptions = {}
): Promise<AIResponse<T>> {
  return aiClient.apiRequest<T>(endpoint, body, options);
}

// =============================================================================
// PUBLIC API - CONTENT GENERATION
// =============================================================================

/**
 * Generate content using AI with enhanced prompts
 */
export async function generateContent(
  prompt: string,
  contentType: ContentType | string,
  tone: ToneType | string,
  options?: AIRequestOptions & { useEnhancedPrompts?: boolean }
): Promise<string> {
  const useEnhanced = options?.useEnhancedPrompts !== false;
  const enhancedPrompt =
    useEnhanced && isValidContentType(contentType) && isValidTone(tone)
      ? buildEnhancedPrompt(prompt, contentType, tone)
      : prompt;

  const response = await apiRequest<{ content: string }>(
    "/content",
    {
      prompt: enhancedPrompt,
      contentType,
      tone,
      originalPrompt: prompt,
    },
    options
  );
  return response.data.content;
}

/**
 * Generate multiple content variations
 */
export async function generateContentVariations(
  prompt: string,
  contentType: ContentType | string,
  tone: ToneType | string,
  count: number = 3,
  options?: AIRequestOptions
): Promise<string[]> {
  const promises = Array.from({ length: count }, () =>
    generateContent(prompt, contentType, tone, { ...options, skipCache: true })
  );

  return Promise.all(promises);
}

/**
 * Generate layout HTML using AI
 */
export async function generateLayout(
  prompt: string,
  style?: LayoutStyle,
  options?: AIRequestOptions
): Promise<string> {
  const response = await apiRequest<{ content: string }>("/layout", { prompt, style }, options);
  return response.data.content;
}

/**
 * Generate or fetch an image based on description
 */
export async function generateImagePrompt(
  description: string,
  imageOptions?: { size?: ImageSize; style?: ImageStyle },
  options?: AIRequestOptions
): Promise<string> {
  try {
    const response = await apiRequest<{ url?: string }>(
      "/image",
      { prompt: description, ...imageOptions },
      options
    );
    return response.data.url || `${FALLBACK_IMAGE_BASE}${Date.now()}`;
  } catch {
    return `${FALLBACK_IMAGE_BASE}${Date.now()}`;
  }
}

/**
 * Generate code snippet using AI
 */
export async function generateCode(
  prompt: string,
  language: ProgrammingLanguage | string,
  style?: CodeStyle,
  options?: AIRequestOptions
): Promise<string> {
  const response = await apiRequest<{ content: string }>(
    "/code",
    { prompt, language, style },
    options
  );
  return response.data.content;
}

/**
 * Improve/refine existing content
 */
export async function improveContent(
  content: string,
  instruction: string,
  options?: AIRequestOptions
): Promise<string> {
  const response = await apiRequest<{ content: string }>(
    "/improve",
    { content, instruction },
    options
  );
  return response.data.content;
}

/**
 * Translate content to another language
 */
export async function translateContent(
  content: string,
  targetLanguage: string,
  options?: AIRequestOptions
): Promise<string> {
  const response = await apiRequest<{ content: string }>(
    "/translate",
    { content, targetLanguage },
    options
  );
  return response.data.content;
}

/**
 * Summarize content
 */
export async function summarizeContent(
  content: string,
  maxLength?: number,
  options?: AIRequestOptions
): Promise<string> {
  const response = await apiRequest<{ content: string }>(
    "/summarize",
    { content, maxLength },
    options
  );
  return response.data.content;
}

/**
 * Generate SEO metadata
 */
export async function generateSEO(
  pageContent: string,
  options?: AIRequestOptions
): Promise<{ title: string; description: string; keywords: string[] }> {
  const response = await apiRequest<{
    title: string;
    description: string;
    keywords: string[];
  }>("/seo", { content: pageContent }, options);
  return response.data;
}

/**
 * Stream content generation (for real-time updates)
 */
export async function streamContent(
  prompt: string,
  contentType: ContentType | string,
  tone: ToneType | string,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/content/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, contentType, tone }),
    });

    if (!response.ok) {
      const error = createAIError("Stream request failed", "API_ERROR", {
        status: response.status,
      });
      callbacks.onError?.(error);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError?.(createAIError("No response body", "API_ERROR"));
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullContent += chunk;
      callbacks.onChunk?.(chunk);
    }

    callbacks.onComplete?.(fullContent);
  } catch (err) {
    const error =
      err instanceof Error && (err as AIError).code
        ? (err as AIError)
        : createAIError(err instanceof Error ? err.message : "Stream error", "UNKNOWN_ERROR");
    callbacks.onError?.(error);
  }
}

export interface BatchRequest {
  type: "content" | "layout" | "code" | "improve";
  params: Record<string, unknown>;
}

export interface BatchResult<T = string> {
  success: boolean;
  data?: T;
  error?: AIError;
}

/**
 * Execute multiple AI requests in batch
 */
export async function batchRequests(
  requests: BatchRequest[],
  options?: AIRequestOptions
): Promise<BatchResult[]> {
  const endpoints: Record<string, string> = {
    content: "/content",
    layout: "/layout",
    code: "/code",
    improve: "/improve",
  };

  const promises = requests.map(async (req) => {
    try {
      const response = await apiRequest<{ content: string }>(
        endpoints[req.type],
        req.params,
        options
      );
      return { success: true, data: response.data.content };
    } catch (err) {
      return {
        success: false,
        error: err as AIError,
      };
    }
  });

  return Promise.all(promises);
}

export const PROMPT_TEMPLATES = {
  headline: (product: string, benefit: string) =>
    `Create a compelling headline for ${product} that highlights ${benefit}`,

  cta: (action: string, urgency: string) =>
    `Create a call-to-action button text for ${action} with ${urgency} urgency`,

  description: (product: string, audience: string) =>
    `Write a product description for ${product} targeting ${audience}`,

  testimonial: (product: string, rating: number) =>
    `Generate a realistic ${rating}-star customer testimonial for ${product}`,

  faq: (topic: string) => `Generate a frequently asked question and answer about ${topic}`,

  seoMeta: (page: string, keywords: string[]) =>
    `Write an SEO meta description for a ${page} page focusing on: ${keywords.join(", ")}`,

  featureList: (product: string, count: number) =>
    `List ${count} key features of ${product} with their benefits`,

  pricingDescription: (planName: string, features: string[], price: string) =>
    `Write a compelling description for the "${planName}" pricing plan at ${price} ` +
    `that includes: ${features.join(", ")}`,

  teamBio: (name: string, role: string, expertise: string) =>
    `Write a brief team bio for ${name}, ${role}, with expertise in ${expertise}`,

  bulletPoints: (topic: string, count: number) =>
    `Create ${count} compelling bullet points about ${topic}`,

  tagline: (brand: string, value: string) =>
    `Create a memorable tagline for ${brand} that communicates ${value}`,
} as const;

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

export function getCacheStats() {
  return aiCache.getStats();
}
export function clearCache(pattern?: string) {
  aiCache.invalidate(pattern);
}
export function isAIError(error: unknown): error is AIError {
  return error instanceof Error && "code" in error && typeof (error as AIError).code === "string";
}
export function getErrorMessage(error: AIError): string {
  return `${error.message}. ${error.suggestion || ""}`.trim();
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(): { remaining: number; retryAfter: number } {
  return {
    remaining: 30 - aiClient.getRateLimitCount(),
    retryAfter: aiClient.getRetryAfter(),
  };
}

/**
 * Get request queue length
 */
export function getQueueLength(): number {
  return aiClient.getQueueLength();
}

/**
 * Clear pending requests
 */
export function clearQueue(): void {
  aiClient.clearQueue();
}
