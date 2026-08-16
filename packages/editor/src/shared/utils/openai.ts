/**
 * AI API Service Facade for Aquibra
 * Delegating to tRPC-backed AI client under src/services/ai/
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
import { aiTrpcClient, type AIRequestOptions, type AIResponse } from "../../services/ai/AiTrpcClient";

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

  const response = await aiTrpcClient.generateContent(
    {
      prompt: enhancedPrompt,
      type: "content",
      options: { tone: tone as string },
    },
    options
  );
  return response.data.content;
}

/**
 * Generate layout HTML using AI
 */
async function generateLayout(
  prompt: string,
  style?: LayoutStyle,
  options?: AIRequestOptions
): Promise<string> {
  const response = await aiTrpcClient.generateLayout(
    { prompt, sectionType: style },
    options
  );
  return response.data.html;
}

/**
 * Generate code snippet using AI
 */
async function generateCode(
  prompt: string,
  language: ProgrammingLanguage | string,
  _style?: CodeStyle,
  options?: AIRequestOptions
): Promise<string> {
  const response = await aiTrpcClient.generateContent(
    {
      prompt: `Generate ${language} code: ${prompt}`,
      type: "content",
    },
    options
  );
  return response.data.content;
}

/**
 * Improve/refine existing content
 */
async function improveContent(
  content: string,
  instruction: string,
  options?: AIRequestOptions
): Promise<string> {
  const response = await aiTrpcClient.generateContent(
    {
      prompt: `Improve the following content. Instruction: ${instruction}\n\nContent:\n${content}`,
      type: "content",
    },
    options
  );
  return response.data.content;
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
    remaining: 30 - aiTrpcClient.getRateLimitCount(),
    retryAfter: aiTrpcClient.getRetryAfter(),
  };
}

/**
 * Clear pending requests
 */
export function clearQueue(): void {
  aiTrpcClient.clearQueue();
}
