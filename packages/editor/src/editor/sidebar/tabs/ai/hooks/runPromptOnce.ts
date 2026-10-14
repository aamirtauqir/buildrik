import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";
import type { AIModel } from "../types";
import type { AiElementContext } from "@buildrik/shared/schemas/ai";

/**
 * Promise wrapper around the streamPrompt subscription for DISCRETE
 * request/response calls. The agent runner (P4) makes a sequence of these (one
 * plan call, then one per step), where async/await sequencing is far clearer
 * than threading a streaming hook's state through effects.
 * Since decision #23 (plan/run only) every AI-panel prompt goes through here.
 * (`useStreamPrompt` was a second, unused streaming path — nothing imported
 * it outside its own tests — deleted v3 FC-10, 2026-09-25.)
 */

/**
 * Boards 171:136 / 171:105 draw "not configured" and "out of credit" as states
 * of their own; the server tells them apart by code (PRECONDITION_FAILED from
 * assertProviderConfigured, TOO_MANY_REQUESTS from the quota gate). Everything
 * else is a provider or transport failure.
 */
export type AiErrorKind = "not-configured" | "quota" | "other";

/* Not exported — useStreamPrompt.ts was its only outside consumer, deleted
   v3 FC-10 (2026-09-25, dead code — nothing else imported that hook). */
function aiErrorKind(code: string | undefined): AiErrorKind {
  if (code === "PRECONDITION_FAILED") return "not-configured";
  if (code === "TOO_MANY_REQUESTS") return "quota";
  return "other";
}

/**
 * tRPC's SSE link treats INTERNAL_SERVER_ERROR as retryable and reconnects
 * instead of calling `onError` — every provider failure arrives that way, so
 * an outage used to hold the panel on "Thinking…" indefinitely. A reconnect
 * RE-RUNS the procedure (another provider call, another quota reserve), so a
 * state carrying a server error (`error.data.code` — the procedure ran and
 * answered) fails at once. Only transport blips with no server answer get a
 * second attempt.
 */
const AI_RECONNECT_BUDGET = 2;

/** A failed prompt, with the kind the panel renders its state from. */
export class AiRunError extends Error {
  constructor(message: string, readonly kind: AiErrorKind) {
    super(message);
    this.name = "AiRunError";
  }
}

export interface PlanStep {
  title: string;
  scope: { kind: "element"; id: string } | { kind: "page" };
  instruction: string;
}

export interface PageElementRef {
  id: string;
  type: string;
  text?: string;
}

/** Token registry entry sent for set-token recall (W4): the model picks a real
 * id + sees the current value, and the server validates membership + value/type. */
export interface TokenRef {
  id: string;
  name: string;
  value: string;
  type: string;
}

/** Media asset sent for set-image recall (W5): the model picks a REAL library
 * asset url, and the server validates the chosen src ∈ the sent list. */
export interface MediaAssetRef {
  id: string;
  url: string;
  name: string;
}

export type RunScope =
  | {
      kind: "element";
      id: string;
      /** What the model is shown about the element (gatherElementContext). */
      context?: AiElementContext;
      tokens?: TokenRef[];
      assets?: MediaAssetRef[];
    }
  | {
      kind: "page";
      elements?: PageElementRef[];
      tokens?: TokenRef[];
      assets?: MediaAssetRef[];
    };

export interface ServerEdit {
  target: string;
  summary: string;
  rows: Array<{ field: string; from: string; to: string }>;
  applyOps: { preview: Record<string, unknown>; commit: Record<string, unknown> };
}

interface PromptArgs {
  prompt: string;
  scope: RunScope;
  model: AIModel;
  intent: "plan" | "style-command";
  /** Aborting unsubscribes, so the server sees its request signal abort and
   *  stops (Stop in the agent and in Generate-a-block). */
  signal?: AbortSignal;
}

interface PromptResult {
  text: string;
  edit: ServerEdit | null;
  plan: PlanStep[] | null;
}

/**
 * The most the encoded input may take (L2-037). The subscription is an SSE
 * GET, so the input rides in the URL; Node refuses a request line past 16 KB
 * (431) and proxies sit lower. A site with a full token set sent ~17 KB, and
 * the panel could only say "The AI service didn't respond".
 */
export const AI_URL_BUDGET = 7000;

const encodedLength = (input: unknown) => encodeURIComponent(JSON.stringify(input)).length;

/** Halve the largest recall list (tokens, assets, page elements) until the
 *  input fits. Lists keep their order, so the site's own tokens (sorted first
 *  by gatherTokens) are the last to go, and a short list is left alone while a
 *  longer one can still give way. */
function fitToUrl<T extends { scope: RunScope }>(input: T): T {
  if (encodedLength(input) <= AI_URL_BUDGET) return input;
  const scope: RunScope = { ...input.scope };
  const fitted = { ...input, scope };
  const half = <V,>(list: V[]): V[] => list.slice(0, Math.floor(list.length / 2));
  while (encodedLength(fitted) > AI_URL_BUDGET) {
    const lists = [
      { list: scope.tokens, halve: () => (scope.tokens = half(scope.tokens ?? [])) },
      { list: scope.assets, halve: () => (scope.assets = half(scope.assets ?? [])) },
      ...(scope.kind === "page"
        ? [{ list: scope.elements, halve: () => (scope.elements = half(scope.elements ?? [])) }]
        : []),
    ].filter((l) => (l.list?.length ?? 0) > 0);
    if (lists.length === 0) break;
    lists.reduce((a, b) => (encodedLength(b.list) > encodedLength(a.list) ? b : a)).halve();
  }
  return fitted;
}

/**
 * Fire one streamPrompt subscription and resolve when it completes (`done`),
 * accumulating text and capturing the first edit / plan chunk. Rejects with an
 * `AiRunError` on stream error (quota, provider failure, auth), once the
 * reconnect budget is spent, or when `args.signal` aborts. The caller is
 * responsible for sequencing.
 */
export function runPromptOnce(args: PromptArgs): Promise<PromptResult> {
  return new Promise<PromptResult>((resolve, reject) => {
    const stopped = () => new AiRunError("Stopped", "other");
    if (args.signal?.aborted) {
      reject(stopped());
      return;
    }
    let text = "";
    let edit: ServerEdit | null = null;
    let plan: PlanStep[] | null = null;
    let settled = false;
    let reconnects = 0;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      sub.unsubscribe();
      reject(stopped());
    };
    const sub = getAiSubscriptionClient().ai.streamPrompt.subscribe(
      fitToUrl({ prompt: args.prompt, scope: args.scope, model: args.model, intent: args.intent }),
      {
        onData: (chunk: {
          type: string;
          text?: string;
          edit?: ServerEdit;
          plan?: { steps: PlanStep[] };
        }) => {
          if (chunk.type === "text" && chunk.text) text += chunk.text;
          else if (chunk.type === "edit" && chunk.edit) edit = chunk.edit;
          else if (chunk.type === "plan" && chunk.plan) plan = chunk.plan.steps;
          else if (chunk.type === "done") {
            if (settled) return;
            settled = true;
            args.signal?.removeEventListener("abort", onAbort);
            sub.unsubscribe();
            resolve({ text, edit, plan });
          }
        },
        onError: (err: { message?: string; data?: { code?: string } | null }) => {
          if (settled) return;
          settled = true;
          args.signal?.removeEventListener("abort", onAbort);
          sub.unsubscribe();
          reject(new AiRunError(err.message || "Stream failed", aiErrorKind(err.data?.code)));
        },
        onConnectionStateChange: (state: {
          state: string;
          error?: { message?: string; data?: { code?: string } | null } | null;
        }) => {
          if (settled || state.state !== "connecting" || !state.error) return;
          const serverCode = state.error.data?.code;
          reconnects += 1;
          if (!serverCode && reconnects < AI_RECONNECT_BUDGET) return;
          settled = true;
          args.signal?.removeEventListener("abort", onAbort);
          sub.unsubscribe();
          reject(new AiRunError(state.error.message || "The AI service didn't respond.", aiErrorKind(serverCode)));
        },
      },
    );
    args.signal?.addEventListener("abort", onAbort, { once: true });
  });
}
