import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";
import type { AIModel } from "../types";

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
 * an outage used to hold the panel on "Thinking…" indefinitely. Two attempts,
 * then the failure is surfaced.
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
  | { kind: "element"; id: string }
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
}

interface PromptResult {
  text: string;
  edit: ServerEdit | null;
  plan: PlanStep[] | null;
}

/**
 * Fire one streamPrompt subscription and resolve when it completes (`done`),
 * accumulating text and capturing the first edit / plan chunk. Rejects with an
 * `AiRunError` on stream error (quota, provider failure, auth) or once the
 * reconnect budget is spent. The caller is responsible for sequencing.
 */
export function runPromptOnce(args: PromptArgs): Promise<PromptResult> {
  return new Promise<PromptResult>((resolve, reject) => {
    let text = "";
    let edit: ServerEdit | null = null;
    let plan: PlanStep[] | null = null;
    let settled = false;
    let reconnects = 0;
    const sub = getAiSubscriptionClient().ai.streamPrompt.subscribe(
      { prompt: args.prompt, scope: args.scope, model: args.model, intent: args.intent },
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
            sub.unsubscribe();
            resolve({ text, edit, plan });
          }
        },
        onError: (err: { message?: string; data?: { code?: string } | null }) => {
          if (settled) return;
          settled = true;
          sub.unsubscribe();
          reject(new AiRunError(err.message || "Stream failed", aiErrorKind(err.data?.code)));
        },
        onConnectionStateChange: (state: { state: string; error?: { message?: string } | null }) => {
          if (settled || state.state !== "connecting" || !state.error) return;
          reconnects += 1;
          if (reconnects < AI_RECONNECT_BUDGET) return;
          settled = true;
          sub.unsubscribe();
          reject(new AiRunError(state.error.message || "The AI service didn't respond.", "other"));
        },
      },
    );
  });
}
