/**
 * AIServiceClient - High-performance AI service client with queueing and rate limiting
 * Communicates with Aquibra's server-side AI endpoints (/api/ai/*), NOT OpenAI directly.
 * @module services/ai/AIServiceClient
 * @license BSD-3-Clause
 */

import { aiCache } from "./AICache";
import { AIError, createAIError } from "./AIErrors";

const API_BASE = "/api/ai";
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

// -----------------------------------------------------------------------------
// RATE LIMITER
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// REQUEST QUEUE
// -----------------------------------------------------------------------------

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

      this.queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
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

// -----------------------------------------------------------------------------
// SIGNAL UTILS
// -----------------------------------------------------------------------------

function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

function createTimeoutSignal(timeout: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);
  return { signal: controller.signal, cleanup: () => clearTimeout(timeoutId) };
}

// -----------------------------------------------------------------------------
// CLIENT IMPLEMENTATION
// -----------------------------------------------------------------------------

class AIServiceClient {
  private rateLimiter = new RateLimiter();
  private requestQueue = new RequestQueue();

  async apiRequest<T>(
    endpoint: string,
    body: Record<string, unknown>,
    options: AIRequestOptions = {}
  ): Promise<AIResponse<T>> {
    const {
      timeout = DEFAULT_TIMEOUT,
      retries = MAX_RETRIES,
      signal,
      skipCache = false,
      cacheTTL,
      priority = 0,
    } = options;

    const startTime = performance.now();

    // Cache check
    if (!skipCache) {
      const cached = aiCache.get<T>(endpoint, body);
      if (cached) {
        return { data: cached, cached: true, duration: performance.now() - startTime };
      }
    }

    // Rate limit check
    if (!this.rateLimiter.canMakeRequest()) {
      throw createAIError("Rate limit exceeded", "RATE_LIMITED", {
        isRateLimited: true,
        retryAfter: this.rateLimiter.getRetryAfter(),
      });
    }

    return this.requestQueue.add(async () => {
      let lastError: AIError | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        const { signal: timeoutSignal, cleanup } = createTimeoutSignal(timeout);
        try {
          this.rateLimiter.recordRequest();
          const combinedSignal = combineSignals(signal, timeoutSignal);

          const response = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: combinedSignal,
          });

          cleanup();

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 429) {
              const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10) * 1000;
              throw createAIError("Rate limit exceeded", "RATE_LIMITED", {
                status: 429,
                isRateLimited: true,
                retryAfter,
              });
            }
            if (response.status === 451 || errorData.filtered) {
              throw createAIError("Content was filtered", "CONTENT_FILTERED", {
                status: response.status,
              });
            }
            throw createAIError(
              errorData.error || `Request failed (${response.status})`,
              "API_ERROR",
              { status: response.status }
            );
          }

          const data = await response.json();
          aiCache.set(endpoint, body, data, cacheTTL);

          return {
            data: data as T,
            cached: false,
            duration: performance.now() - startTime,
            tokensUsed: data.usage?.total_tokens,
          };
        } catch (err: unknown) {
          cleanup();
          if (err instanceof Error && err.name === "AbortError") {
            if (signal?.aborted) throw createAIError("Request cancelled", "CANCELLED");
            lastError = createAIError("Request timed out", "TIMEOUT", { isTimeout: true });
          } else if (err instanceof TypeError) {
            lastError = createAIError("Network error", "NETWORK_ERROR", { isNetworkError: true });
          } else if (err instanceof Error && (err as AIError).code) {
            lastError = err as AIError;
          } else {
            lastError = createAIError(
              err instanceof Error ? err.message : "Unknown error",
              "UNKNOWN_ERROR"
            );
          }

          if (lastError.code === "CANCELLED" || lastError.code === "CONTENT_FILTERED")
            throw lastError;
          if (lastError.status && lastError.status < 500 && lastError.status !== 429)
            throw lastError;

          if (attempt < retries) {
            const delay = lastError.retryAfter || RETRY_DELAY * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      throw lastError || createAIError("Request failed after retries", "MAX_RETRIES");
    }, priority);
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
}

export const aiClient = new AIServiceClient();
