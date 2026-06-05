import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";
import type { AIModel } from "../types";

/**
 * Promise wrapper around the streamPrompt subscription for DISCRETE
 * request/response calls. The agent runner (P4) makes a sequence of these (one
 * plan call, then one per step), where async/await sequencing is far clearer
 * than threading the streaming `useStreamPrompt` hook's state through effects.
 * `useStreamPrompt` stays the right tool for the live chat-streaming UI; this is
 * the right tool for the loop.
 */

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
 * accumulating text and capturing the first edit / plan chunk. Rejects on
 * stream error (quota, provider failure, auth). The caller is responsible for
 * sequencing; this never retries.
 */
export function runPromptOnce(args: PromptArgs): Promise<PromptResult> {
  return new Promise<PromptResult>((resolve, reject) => {
    let text = "";
    let edit: ServerEdit | null = null;
    let plan: PlanStep[] | null = null;
    let settled = false;
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
        onError: (err: { message?: string }) => {
          if (settled) return;
          settled = true;
          sub.unsubscribe();
          reject(new Error(err.message ?? "Stream failed"));
        },
      },
    );
  });
}
