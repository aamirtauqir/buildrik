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
  const subRef = React.useRef<{ unsubscribe: () => void } | null>(null);

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
  }, []);

  const start = React.useCallback((args: StartArgs) => {
    setText("");
    setEdit(null);
    setStopped(false);
    setError(null);
    setStreaming(true);

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
        onError: (err: { message?: string }) => {
          setError(err.message ?? "Stream failed");
          setStreaming(false);
          subRef.current = null;
        },
      },
    );
  }, []);

  React.useEffect(() => {
    return () => { subRef.current?.unsubscribe(); };
  }, []);

  return { text, edit, streaming, stopped, error, start, stop, reset };
}
