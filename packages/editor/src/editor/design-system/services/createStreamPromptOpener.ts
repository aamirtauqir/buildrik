import type { StreamOpener } from "./StreamPromptAIClient";

type ServerChunk =
  | { type: "text"; text: string }
  | { type: "edit"; edit: unknown }
  | { type: "done" };

interface SubscribeCallbacks {
  onData: (chunk: ServerChunk) => void;
  onError: (err: { message?: string }) => void;
}

interface SubscribeArgs {
  prompt: string;
  scope: { kind: "page" };
  model: string;
}

interface Subscription {
  unsubscribe: () => void;
}

export type StreamPromptSubscribe = (
  args: SubscribeArgs,
  callbacks: SubscribeCallbacks,
) => Subscription;

export interface CreateStreamPromptOpenerDeps {
  subscribe: StreamPromptSubscribe;
  model?: string;
}

/**
 * Adapts the tRPC `ai.streamPrompt` subscription into a StreamOpener so the
 * Design System AIAssistService can consume it via StreamPromptAIClient.
 *
 * Filters server chunks to `type === "text"` only — `edit` chunks are AI-tab
 * scope and irrelevant to component-schema generation. Stream terminates on
 * `done`, error chunk, or AbortSignal.
 */
export function createStreamPromptOpener(
  deps: CreateStreamPromptOpenerDeps,
): StreamOpener {
  const model = deps.model ?? "claude-sonnet-4-6";
  return {
    async *open({ prompt, signal }) {
      const queue: string[] = [];
      let finished = false;
      let error: Error | null = null;
      let resolveNext: (() => void) | null = null;

      const wake = () => {
        if (resolveNext) {
          const r = resolveNext;
          resolveNext = null;
          r();
        }
      };

      const sub = deps.subscribe(
        { prompt, scope: { kind: "page" }, model },
        {
          onData: (chunk) => {
            if (chunk.type === "text" && chunk.text) {
              queue.push(chunk.text);
            } else if (chunk.type === "done") {
              finished = true;
            }
            wake();
          },
          onError: (err) => {
            error = new Error(err.message ?? "streamPrompt error");
            finished = true;
            wake();
          },
        },
      );

      const onAbort = () => {
        finished = true;
        wake();
      };
      signal?.addEventListener("abort", onAbort);

      try {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
            continue;
          }
          if (error) throw error;
          if (finished) break;
          await new Promise<void>((r) => {
            resolveNext = r;
          });
        }
      } finally {
        sub.unsubscribe();
        signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}
