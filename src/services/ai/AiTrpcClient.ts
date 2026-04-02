/**
 * AiTrpcClient - AI service client backed by tRPC mutations
 * Retains rate limiting, request queueing, and caching from AIServiceClient.
 * @module services/ai/AiTrpcClient
 * @license BSD-3-Clause
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/trpc/router";
import { aiCache } from "./AICache";
import { createAIError, type AIError } from "./AIErrors";

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

export interface AIRequestOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  skipCache?: boolean;
  cacheTTL?: number;
  priority?: number;
}

export interface AIResponse<T> {
  data: T;
  cached: boolean;
  duration: number;
  tokensUsed?: number;
}

// ---------------------------------------------------------------------------
// RATE LIMITER
// ---------------------------------------------------------------------------

class RateLimiter {
  private requests: number[] = [];
  private window = RATE_LIMIT_WINDOW;
  private maxRequests = RATE_LIMIT_MAX;

  canMakeRequest(): boolean {
    this.cleanup();
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRequestCount(): number {
    this.cleanup();
    return this.requests.length;
  }

  getRetryAfter(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return Math.max(0, this.window - (Date.now() - oldestRequest));
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.window;
    this.requests = this.requests.filter((t) => t > cutoff);
  }
}

// ---------------------------------------------------------------------------
// REQUEST QUEUE
// ---------------------------------------------------------------------------

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;
  private concurrency = 3;
  private activeRequests = 0;

  async add<T>(execute: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        timestamp: Date.now(),
      });

      this.queue.sort(
        (a, b) => b.priority - a.priority || a.timestamp - b.timestamp
      );
      this.process();
    });
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }

  private async process(): Promise<void> {
    if (this.processing || this.activeRequests >= this.concurrency) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      request
        .execute()
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.process();
        });
    }
    this.processing = false;
  }
}

// ---------------------------------------------------------------------------
// TRPC CLIENT
// ---------------------------------------------------------------------------

function getTrpcClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });
}

let _trpc: ReturnType<typeof getTrpcClient>;
function trpc() {
  if (!_trpc) _trpc = getTrpcClient();
  return _trpc;
}

// ---------------------------------------------------------------------------
// AI TRPC CLIENT
// ---------------------------------------------------------------------------

class AiTrpcClient {
  private rateLimiter = new RateLimiter();
  private requestQueue = new RequestQueue();

  async generateContent(
    input: {
      prompt: string;
      type: "content" | "layout" | "section";
      options?: { tone?: string; length?: string };
    },
    options: AIRequestOptions = {}
  ): Promise<AIResponse<{ content: string; tokensUsed: number }>> {
    return this.execute("ai.content", input, options, () =>
      trpc().ai.content.mutate(input)
    );
  }

  async generatePage(
    input: {
      pageType: "landing" | "portfolio" | "product" | "pricing" | "blog";
      description: string;
      style: "modern" | "minimal" | "bold";
    },
    options: AIRequestOptions = {}
  ): Promise<
    AIResponse<{
      sections: Array<{ type: string; html: string; css?: string }>;
    }>
  > {
    return this.execute("ai.page", input, options, () =>
      trpc().ai.page.mutate(input)
    );
  }

  async generateLayout(
    input: { prompt: string; sectionType?: string },
    options: AIRequestOptions = {}
  ): Promise<AIResponse<{ html: string; css?: string }>> {
    return this.execute("ai.layout", input, options, () =>
      trpc().ai.layout.mutate(input)
    );
  }

  getRateLimitCount(): number {
    return this.rateLimiter.getRequestCount();
  }

  getRetryAfter(): number {
    return this.rateLimiter.getRetryAfter();
  }

  getQueueLength(): number {
    return this.requestQueue.getQueueLength();
  }

  clearQueue(): void {
    this.requestQueue.clear();
  }

  private async execute<T>(
    cacheKey: string,
    input: Record<string, unknown>,
    options: AIRequestOptions,
    mutation: () => Promise<T>
  ): Promise<AIResponse<T>> {
    const {
      retries = MAX_RETRIES,
      skipCache = false,
      cacheTTL,
      priority = 0,
    } = options;

    const startTime = performance.now();

    if (!skipCache) {
      const cached = aiCache.get<T>(cacheKey, input);
      if (cached) {
        return {
          data: cached,
          cached: true,
          duration: performance.now() - startTime,
        };
      }
    }

    if (!this.rateLimiter.canMakeRequest()) {
      throw createAIError("Rate limit exceeded", "RATE_LIMITED", {
        isRateLimited: true,
        retryAfter: this.rateLimiter.getRetryAfter(),
      });
    }

    return this.requestQueue.add(async () => {
      let lastError: AIError | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          this.rateLimiter.recordRequest();
          const data = await mutation();

          aiCache.set(cacheKey, input, data, cacheTTL);

          return {
            data,
            cached: false,
            duration: performance.now() - startTime,
            tokensUsed: (data as Record<string, unknown>).tokensUsed as
              | number
              | undefined,
          };
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          const isTooManyRequests =
            errorMessage.includes("TOO_MANY_REQUESTS") ||
            errorMessage.includes("rate limit");

          if (isTooManyRequests) {
            lastError = createAIError("Rate limit exceeded", "RATE_LIMITED", {
              isRateLimited: true,
              retryAfter: 60000,
            });
          } else {
            lastError = createAIError(errorMessage, "API_ERROR");
          }

          if (attempt < retries) {
            const delay =
              lastError.retryAfter || RETRY_DELAY * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }

      throw (
        lastError || createAIError("Request failed after retries", "MAX_RETRIES")
      );
    }, priority);
  }
}

export const aiTrpcClient = new AiTrpcClient();
