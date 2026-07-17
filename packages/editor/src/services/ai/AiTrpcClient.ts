/**
 * AiTrpcClient - AI service client backed by tRPC mutations
 * Retains rate limiting, request queueing, and caching from AIServiceClient.
 * @module services/ai/AiTrpcClient
 * @license BSD-3-Clause
 */

import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../../../server/trpc/router";
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

function isRetryable(err: unknown, isTooManyRequests: boolean): boolean {
  if (isTooManyRequests) return true; // rate-limit: retry after backoff
  // Decide on the STRUCTURED tRPC error, not the message string — the message
  // is the server's human text (a Zod BAD_REQUEST has no "BAD_REQUEST"
  // substring), so substring matching only ever caught bare UNAUTHORIZED.
  if (err instanceof TRPCClientError) {
    const status = err.data?.httpStatus as number | undefined;
    if (typeof status === "number") {
      // 4xx is a client error (validation/auth/forbidden) — re-firing a
      // non-idempotent, credit-consuming AI mutation just re-spends and
      // re-fails. Retry only 408 (timeout) and 429 (rate limit).
      if (status >= 400 && status < 500) return status === 408 || status === 429;
      return true; // 5xx / transient server fault — retry
    }
  }
  // No structured status (network/abort) — treat as transient, retry.
  return true;
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

// Relative "/api/trpc" is intentional: the editor is served same-origin with
// the dashboard (unification spec §572 / trpc-same-origin.test.ts), so an
// absolute URL would force CORS the unification arc deletes.
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

  /**
   * Race a single mutation attempt against a client-side timeout so a hung
   * request rejects (and frees its concurrency slot) instead of blocking one
   * forever. The underlying mutation promise gets a no-op catch so a late
   * rejection after the timeout wins doesn't surface as an unhandled rejection.
   */
  private async withTimeout<T>(
    mutation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            createAIError(`Request timed out after ${timeoutMs}ms`, "TIMEOUT", {
              isTimeout: true,
            })
          ),
        timeoutMs
      );
    });
    const pending = mutation();
    pending.catch(() => {});
    try {
      return await Promise.race([pending, timeout]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
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
      timeout = DEFAULT_TIMEOUT,
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

    // Record at ADMISSION (check + record are synchronous here, so atomic): a
    // synchronous burst can't slip past the 30/60s cap the way it did when
    // recordRequest() only fired inside the queued task. One logical request =
    // one slot — recording here (not per attempt) also stops retries from
    // double-counting against the client-side cap.
    if (!this.rateLimiter.canMakeRequest()) {
      throw createAIError("Rate limit exceeded", "RATE_LIMITED", {
        isRateLimited: true,
        retryAfter: this.rateLimiter.getRetryAfter(),
      });
    }
    this.rateLimiter.recordRequest();

    return this.requestQueue.add(async () => {
      let lastError: AIError | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await this.withTimeout(mutation, timeout);

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
          // A client-side timeout means we stopped waiting, but the mutation
          // may already have reached the server and spent credits — retrying a
          // non-idempotent AI call would double-spend, so surface it and stop.
          if (err instanceof Error && (err as AIError).code === "TIMEOUT") {
            lastError = err as AIError;
            break;
          }

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

          // Only retry transient failures. AI mutations consume credits and
          // are non-idempotent — retrying a 4xx (validation, UNAUTHORIZED,
          // FORBIDDEN, BAD_REQUEST) just re-spends and re-fails. Bail unless
          // the error is a rate-limit or a clearly transient server/network
          // fault.
          if (!isRetryable(err, isTooManyRequests)) break;

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
