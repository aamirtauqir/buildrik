/**
 * AI Content Writer
 * High-level content generation for text elements
 *
 * @module engine/ai/ContentWriter
 * @license BSD-3-Clause
 */

import {
  generateContent,
  generateContentVariations,
  improveContent,
  translateContent,
  summarizeContent,
  streamContent,
  type ContentType,
  type ToneType,
  type StreamCallbacks,
  CONTENT_TYPES,
  TONES,
} from "../../shared/utils/openai";
import type { Composer } from "../Composer";

// =============================================================================
// TYPES
// =============================================================================

export interface ContentWriterConfig {
  /** Default tone for content generation */
  defaultTone: ToneType;
  /** Default content type */
  defaultContentType: ContentType;
  /** Number of variations to generate */
  variationCount: number;
  /** Enable streaming responses */
  useStreaming: boolean;
}

export interface ContentGenerationRequest {
  /** The prompt/topic for content generation */
  prompt: string;
  /** Type of content to generate */
  contentType?: ContentType;
  /** Tone for the content */
  tone?: ToneType;
  /** Element ID to apply content to */
  elementId?: string;
  /** Generate multiple variations */
  generateVariations?: boolean;
  /** Use streaming for real-time updates */
  streaming?: boolean;
}

export interface ContentGenerationResult {
  /** Generated content (primary result) */
  content: string;
  /** Alternative variations */
  variations?: string[];
  /** Content type used */
  contentType: ContentType;
  /** Tone used */
  tone: ToneType;
  /** Time taken in ms */
  duration: number;
}

export interface ContentImprovement {
  /** Type of improvement to make */
  type: "shorten" | "expand" | "simplify" | "professional" | "casual" | "seo" | "custom";
  /** Custom instruction (for type: custom) */
  instruction?: string;
}

export interface ContentHistory {
  id: string;
  prompt: string;
  content: string;
  contentType: ContentType;
  tone: ToneType;
  timestamp: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: ContentWriterConfig = {
  defaultTone: "professional",
  defaultContentType: "paragraph",
  variationCount: 3,
  useStreaming: false,
};

const IMPROVEMENT_INSTRUCTIONS: Record<Exclude<ContentImprovement["type"], "custom">, string> = {
  shorten:
    "Make this content more concise while keeping the key message. Reduce length by at least 30%.",
  expand:
    "Expand this content with more details, examples, and supporting information. Double the length.",
  simplify: "Simplify this content for easier reading. Use shorter sentences and simpler words.",
  professional: "Rewrite this in a more professional, business-appropriate tone.",
  casual: "Rewrite this in a more casual, friendly, conversational tone.",
  seo: "Optimize this content for SEO. Include relevant keywords naturally and improve readability.",
};

// =============================================================================
// CONTENT WRITER CLASS
// =============================================================================

export class ContentWriter {
  private composer: Composer;
  private config: ContentWriterConfig;
  private history: ContentHistory[] = [];
  private maxHistorySize = 50;

  constructor(composer: Composer, config: Partial<ContentWriterConfig> = {}) {
    this.composer = composer;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate content from a prompt
   */
  async generate(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const startTime = performance.now();
    const contentType = request.contentType || this.config.defaultContentType;
    const tone = request.tone || this.config.defaultTone;

    let content: string;
    let variations: string[] | undefined;

    if (request.streaming && !request.generateVariations) {
      // Use streaming for single content generation
      content = await this.generateWithStreaming(request.prompt, contentType, tone);
    } else if (request.generateVariations) {
      // Generate multiple variations
      variations = await generateContentVariations(
        request.prompt,
        contentType,
        tone,
        this.config.variationCount
      );
      content = variations[0];
    } else {
      // Standard generation
      content = await generateContent(request.prompt, contentType, tone);
    }

    const result: ContentGenerationResult = {
      content,
      variations,
      contentType,
      tone,
      duration: performance.now() - startTime,
    };

    // Add to history
    this.addToHistory({
      id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt: request.prompt,
      content,
      contentType,
      tone,
      timestamp: Date.now(),
    });

    // Apply to element if specified
    if (request.elementId && content) {
      this.applyToElement(request.elementId, content);
    }

    // Emit event
    this.composer.emit("ai:content-generated", result);

    return result;
  }

  /**
   * Generate content with streaming (real-time updates)
   */
  private async generateWithStreaming(
    prompt: string,
    contentType: ContentType,
    tone: ToneType
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let fullContent = "";

      const callbacks: StreamCallbacks = {
        onChunk: (chunk) => {
          fullContent += chunk;
          this.composer.emit("ai:content-stream-chunk", { chunk, fullContent });
        },
        onComplete: (content) => {
          resolve(content);
        },
        onError: (error) => {
          reject(error);
        },
      };

      streamContent(prompt, contentType, tone, callbacks);
    });
  }

  /**
   * Improve existing content
   */
  async improve(
    content: string,
    improvement: ContentImprovement,
    elementId?: string
  ): Promise<string> {
    const instruction =
      improvement.type === "custom"
        ? improvement.instruction || "Improve this content"
        : IMPROVEMENT_INSTRUCTIONS[improvement.type];

    const improved = await improveContent(content, instruction);

    if (elementId && improved) {
      this.applyToElement(elementId, improved);
    }

    this.composer.emit("ai:content-improved", { original: content, improved, improvement });

    return improved;
  }

  /**
   * Translate content to another language
   */
  async translate(content: string, targetLanguage: string, elementId?: string): Promise<string> {
    const translated = await translateContent(content, targetLanguage);

    if (elementId && translated) {
      this.applyToElement(elementId, translated);
    }

    this.composer.emit("ai:content-translated", { original: content, translated, targetLanguage });

    return translated;
  }

  /**
   * Summarize content
   */
  async summarize(content: string, maxLength?: number, elementId?: string): Promise<string> {
    const summary = await summarizeContent(content, maxLength);

    if (elementId && summary) {
      this.applyToElement(elementId, summary);
    }

    this.composer.emit("ai:content-summarized", { original: content, summary });

    return summary;
  }

  /**
   * Generate content for selected element based on its type
   */
  async generateForSelectedElement(): Promise<ContentGenerationResult | null> {
    const selection = this.composer.selection;
    if (!selection) return null;

    const selectedIds = selection.getSelectedIds();
    if (selectedIds.length !== 1) return null;

    const elementId = selectedIds[0];
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const elementType = element.getType();

    // Map element types to content types
    const contentTypeMap: Record<string, ContentType> = {
      heading: "headline",
      text: "paragraph",
      paragraph: "paragraph",
      button: "cta",
      link: "cta",
    };

    const contentType = contentTypeMap[elementType] || "paragraph";

    // Get existing text content as context
    const existingText = element.getContent() || "";
    const prompt = existingText
      ? `Rewrite and improve this content: ${existingText}`
      : `Generate ${CONTENT_TYPES[contentType].label.toLowerCase()} content`;

    return this.generate({
      prompt,
      contentType,
      elementId,
    });
  }

  /**
   * Apply content to an element
   */
  private applyToElement(elementId: string, content: string): void {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return;

    element.setContent(content);
    this.composer.emit("element:updated");
  }

  /**
   * Get content generation history
   */
  getHistory(): ContentHistory[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Add to history
   */
  private addToHistory(entry: ContentHistory): void {
    this.history.unshift(entry);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
  }

  /**
   * Get available content types
   */
  getContentTypes(): typeof CONTENT_TYPES {
    return CONTENT_TYPES;
  }

  /**
   * Get available tones
   */
  getTones(): typeof TONES {
    return TONES;
  }

  /**
   * Update config
   */
  setConfig(config: Partial<ContentWriterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current config
   */
  getConfig(): ContentWriterConfig {
    return { ...this.config };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { CONTENT_TYPES, TONES };
