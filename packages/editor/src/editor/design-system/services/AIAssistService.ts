import type { EventEmitter } from "../../../engine/EventEmitter";
import {
  AITimeoutError,
  AIRateLimitError,
  AIInvalidSchemaError,
  AIPromptRejectedError,
} from "./aiErrors";

/**
 * Pluggable AI client interface. Production wires into the existing
 * provider abstraction (memory `project_ai_tab_phase_1_2_20260426.md`).
 * Tests inject stub clients per spec D20.
 */
export interface AIClient {
  /**
   * Issue a prompt and return the raw model output. Implementations may
   * throw network/timeout/rate-limit errors which the service translates
   * into the D14 hierarchy.
   */
  generate(input: { prompt: string; signal?: AbortSignal }): Promise<string>;
}

/**
 * Loose component-schema shape AI is asked to produce. Strict Zod
 * validation lives at the consumer (catalog importer); here we only
 * defend against obviously-broken AI output (non-JSON, missing required
 * top-level fields).
 */
export interface ComponentSchema {
  componentTypeId: string;
  variants: ReadonlyArray<{ name: string; bindings: Record<string, string> }>;
  bindings: Record<string, string>;
}

export interface GenerateOptions {
  /** Hard cap on response time in ms. Defaults to 30s. */
  timeoutMs?: number;
  /** AbortSignal forwarded to the AI client. */
  signal?: AbortSignal;
}

/**
 * D3: AIAssistService — schema-generation surface for the design system.
 *
 * Phase C.0 ships:
 *   - AIClient interface (stub-able per D20)
 *   - generateComponentSchema(prompt, options): Promise<ComponentSchema>
 *   - D14 error translation (timeout, rate-limit, invalid schema,
 *     prompt-rejected, partial output)
 *   - Event emission (`ai:generate:started`, `ai:generate:complete`,
 *     `ai:generate:failed`) so consumers can surface progress / quota.
 *
 * Out-of-scope for C.0:
 *   - Live provider wire (consumers inject AIClient — production wires
 *     to existing AI provider abstraction)
 *   - UI surface (Design tab AI modal lands later)
 *   - AIUsage quota integration (consumer's responsibility — service
 *     emits events; quota gate sits in front)
 */
export class AIAssistService {
  constructor(
    private readonly events: EventEmitter,
    private readonly client: AIClient | null = null
  ) {}

  async generateComponentSchema(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<ComponentSchema> {
    if (!this.client) {
      throw new AIPromptRejectedError("no AIClient configured (stub the service in tests; wire a real provider in production)");
    }
    if (!prompt || prompt.trim().length === 0) {
      throw new AIPromptRejectedError("empty prompt");
    }

    const timeoutMs = options.timeoutMs ?? 30_000;
    const promptId = `gen-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    this.events.emit("ai:generate:started", { promptId, prompt });

    let raw: string;
    try {
      raw = await this.runWithTimeout(
        () => this.client!.generate({ prompt, signal: options.signal }),
        timeoutMs,
        promptId
      );
    } catch (err) {
      this.events.emit("ai:generate:failed", { promptId, error: errorName(err) });
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const failure = new AIInvalidSchemaError("AI output is not valid JSON", raw);
      this.events.emit("ai:generate:failed", { promptId, error: failure.name });
      throw failure;
    }

    if (!isValidSchemaShape(parsed)) {
      const failure = new AIInvalidSchemaError("AI output missing required fields (componentTypeId, variants, bindings)", raw);
      this.events.emit("ai:generate:failed", { promptId, error: failure.name });
      throw failure;
    }

    this.events.emit("ai:generate:complete", { promptId, componentTypeId: parsed.componentTypeId });
    return parsed;
  }

  private async runWithTimeout<T>(
    work: () => Promise<T>,
    timeoutMs: number,
    promptId: string
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race<T>([
        work(),
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new AITimeoutError(promptId, timeoutMs)), timeoutMs);
        }),
      ]);
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }
}

function isValidSchemaShape(p: unknown): p is ComponentSchema {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.componentTypeId === "string" &&
    Array.isArray(o.variants) &&
    o.bindings !== null &&
    typeof o.bindings === "object"
  );
}

function errorName(err: unknown): string {
  return err instanceof Error ? err.name : String(err);
}

export { AIRateLimitError };
