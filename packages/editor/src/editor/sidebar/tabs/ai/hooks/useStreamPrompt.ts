import * as React from "react";
import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";
import type { AIModel, AIScope, DiffEdit } from "../types";

interface StartArgs {
  prompt: string;
  scope: ServerScope;
  model: AIModel;
  /** "text" = chat stream; "style-command" = in-canvas set-style batch. */
  intent?: "text" | "style-command";
}

interface PageElementRef {
  id: string;
  type: string;
  text?: string;
}
interface ScopeTokenRef { id: string; name: string; value: string; type: string }
interface ScopeAssetRef { id: string; url: string; name: string }
type ServerScope =
  | { kind: "element"; id: string }
  // tokens/assets let the model recall real token ids + library URLs for
  // set-token / set-image edits in chat page mode (was dropped → no-op).
  | { kind: "page"; elements?: PageElementRef[]; tokens?: ScopeTokenRef[]; assets?: ScopeAssetRef[] };

interface ServerEdit {
  target: string;
  summary: string;
  rows: Array<{ field: string; from: string; to: string }>;
  applyOps: { preview: Record<string, unknown>; commit: Record<string, unknown> };
}

interface UseStreamPromptResult {
  text: string;
  edit: DiffEdit | null;
  streaming: boolean;
  stopped: boolean;
  error: string | null;
  /** Board 171:136 draws "not configured" as its own state, not as an error
   *  line — the server already distinguishes it (PRECONDITION_FAILED from
   *  assertProviderConfigured), and the panel used to flatten every failure
   *  into one grey sentence. */
  errorKind: "not-configured" | "quota" | "other" | null;
  start: (args: StartArgs) => void;
  stop: () => void;
  reset: () => void;
}

export function toServerScope(scope: AIScope): ServerScope | null {
  if (scope.kind === "element") return { kind: "element", id: scope.id };
  if (scope.kind === "page") return { kind: "page" };
  return null;
}

function toDiffEdit(serverEdit: ServerEdit): DiffEdit {
  return { ...serverEdit, state: "pending" };
}

export function useStreamPrompt(): UseStreamPromptResult {
  const [text, setText] = React.useState("");
  const [edit, setEdit] = React.useState<DiffEdit | null>(null);
  const [streaming, setStreaming] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errorKind, setErrorKind] = React.useState<
    "not-configured" | "quota" | "other" | null
  >(null);
  const subRef = React.useRef<{ unsubscribe: () => void } | null>(null);
  /**
   * Reconnect budget for one prompt.
   *
   * tRPC's SSE client treats INTERNAL_SERVER_ERROR as RETRYABLE
   * (`retryableRpcCodes` in @trpc/server) and silently reconnects instead of
   * calling `onError`. Every provider failure reaches us as that code — the
   * generator rethrows whatever OpenAI/Ollama threw — so a provider outage
   * left this panel on "Thinking…" forever while the browser reopened the
   * stream every ~440ms. Measured against a real dev server: one EventSource,
   * five opens, five errors, zero data, sixteen seconds, no error on screen.
   *
   * A genuine network blip deserves a retry; a provider that is down does not
   * deserve an unbounded loop. Two attempts, then the error is surfaced.
   */
  const RECONNECT_BUDGET = 2;
  const retriesRef = React.useRef(0);

  const stop = React.useCallback(() => {
    if (subRef.current) {
      subRef.current.unsubscribe();
      subRef.current = null;
    }
    setStreaming(false);
    setStopped(true);
  }, []);

  const reset = React.useCallback(() => {
    setText("");
    setEdit(null);
    setStreaming(false);
    setStopped(false);
    setError(null);
    setErrorKind(null);
  }, []);

  const start = React.useCallback((args: StartArgs) => {
    setText("");
    setEdit(null);
    setStopped(false);
    setError(null);
    setErrorKind(null);
    setStreaming(true);
    retriesRef.current = 0;

    const client = getAiSubscriptionClient();
    subRef.current = client.ai.streamPrompt.subscribe(
      {
        prompt: args.prompt,
        scope: args.scope,
        model: args.model,
        intent: args.intent ?? "text",
      },
      {
        onData: (chunk: { type: string; text?: string; edit?: ServerEdit }) => {
          if (chunk.type === "text" && chunk.text) {
            setText((prev) => prev + chunk.text);
          } else if (chunk.type === "edit" && chunk.edit) {
            setEdit(toDiffEdit(chunk.edit));
          } else if (chunk.type === "done") {
            setStreaming(false);
            subRef.current = null;
          }
        },
        /* tRPC types `data` as Maybe<…> (it can be null), so the parameter is
           typed the way the client actually hands it over. */
        onError: (err: { message?: string; data?: { code?: string } | null }) => {
          const code = err.data?.code;
          setErrorKind(
            code === "PRECONDITION_FAILED"
              ? "not-configured"
              : code === "TOO_MANY_REQUESTS"
                ? "quota"
                : "other",
          );
          setError(err.message ?? "Stream failed");
          setStreaming(false);
          subRef.current = null;
        },
        /* The link reports a retryable failure as a move BACK to "connecting"
           with the error attached — it never reaches `onError`. This is the
           only place a provider outage is visible to us. */
        onConnectionStateChange: (state: { state: string; error?: { message?: string } | null }) => {
          if (state.state !== "connecting" || !state.error) return;
          retriesRef.current += 1;
          if (retriesRef.current < RECONNECT_BUDGET) return;
          subRef.current?.unsubscribe();
          subRef.current = null;
          setErrorKind("other");
          setError(state.error.message ?? "The AI service didn't respond.");
          setStreaming(false);
        },
      },
    );
  }, []);

  React.useEffect(() => {
    return () => { subRef.current?.unsubscribe(); };
  }, []);

  return { text, edit, streaming, stopped, error, errorKind, start, stop, reset };
}
