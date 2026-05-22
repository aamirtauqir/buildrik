/**
 * D14 error class hierarchy for AI-assist failures. Each maps to specific
 * UX (toast / modal / retry per spec §8). Phase C.0 ships the classes;
 * UI handlers attach when the AI prompt modal lands.
 */

export class DSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DSError";
  }
}

export class AITimeoutError extends DSError {
  constructor(promptId: string, durationMs: number) {
    super(`[ai-assist] timeout after ${durationMs}ms (prompt ${promptId})`);
    this.name = "AITimeoutError";
  }
}

export class AIRateLimitError extends DSError {
  constructor(retryAfterMs: number) {
    super(`[ai-assist] rate limit exceeded; retry after ${retryAfterMs}ms`);
    this.name = "AIRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
  readonly retryAfterMs: number;
}

export class AIInvalidSchemaError extends DSError {
  constructor(reason: string, raw: string) {
    super(`[ai-assist] AI returned invalid schema: ${reason}`);
    this.name = "AIInvalidSchemaError";
    this.raw = raw;
  }
  readonly raw: string;
}

export class AIPromptRejectedError extends DSError {
  constructor(reason: string) {
    super(`[ai-assist] prompt rejected: ${reason}`);
    this.name = "AIPromptRejectedError";
  }
}

export class AIPartialOutputError extends DSError {
  constructor(public readonly partial: unknown) {
    super(`[ai-assist] partial output — schema validation incomplete`);
    this.name = "AIPartialOutputError";
  }
}
